import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createDonation, startDonationCheckout } from '../services/api';
import '../styles/Donate.css';

const PRESET_AMOUNTS = [50, 100, 200, 500, 1000];

function requestId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return Array.from(window.crypto.getRandomValues(new Uint8Array(24)), value => value.toString(16).padStart(2, '0')).join('');
}

function loadPhonePeCheckout() {
  if (window.PhonePeCheckout) return Promise.resolve(window.PhonePeCheckout);
  return new Promise((resolve, reject) => {
    const existing = document.getElementById('phonepe-checkout-sdk');
    const script = existing || document.createElement('script');
    script.id = 'phonepe-checkout-sdk';
    script.src = 'https://mercury.phonepe.com/web/bundle/checkout.js';
    script.onload = () => window.PhonePeCheckout ? resolve(window.PhonePeCheckout) : reject(new Error('PhonePe checkout could not load.'));
    script.onerror = () => reject(new Error('PhonePe checkout could not load.'));
    if (!existing) document.body.appendChild(script);
  });
}

const Donate = () => {
  const navigate = useNavigate();
  const idempotencyKey = useRef(requestId());
  const [form, setForm] = useState({
    firstname: '',
    email: '',
    phone: '',
    amount: '',
    method: 'upi'
  });
  const [customAmount, setCustomAmount] = useState('');
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [qrCheckout, setQrCheckout] = useState(null);

  function handlePreset(amt) {
    idempotencyKey.current = requestId();
    setSelectedPreset(amt);
    setCustomAmount('');
    setForm(prev => ({ ...prev, amount: String(amt) }));
  }

  function handleCustomAmount(e) {
    idempotencyKey.current = requestId();
    const val = e.target.value;
    setCustomAmount(val);
    setSelectedPreset(null);
    setForm(prev => ({ ...prev, amount: val }));
  }

  function handleChange(e) {
    idempotencyKey.current = requestId();
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const amount = Number(form.amount);
    if (!form.amount || isNaN(amount) || amount < 10) {
      setError('Please enter a minimum donation amount of ₹10.');
      return;
    }
    if (amount > 100000) {
      setError('Maximum donation amount is ₹1,00,000.');
      return;
    }
    if (!form.firstname.trim() || form.firstname.trim().length < 2) {
      setError('Please enter your name (at least 2 characters).');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!/^[6-9]\d{9}$/.test(form.phone.replace(/\s+/g, ''))) {
      setError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    setLoading(true);
    let donation;
    try {
      donation = await createDonation({
        firstname: form.firstname.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.replace(/\s+/g, ''),
        amount: form.amount,
        method: form.method,
        platform: 'web',
        idempotencyKey: idempotencyKey.current
      });
      const data = await startDonationCheckout(donation.id);
      const checkout = data.checkout;
      if (checkout?.type === 'payu_qr') {
        setQrCheckout({ ...checkout, donationId: donation.id, amount: form.amount });
        setLoading(false);
      } else if (checkout?.type === 'phonepe') {
        try {
          const sdk = await loadPhonePeCheckout();
          sdk.transact({
            tokenUrl: checkout.url,
            type: 'IFRAME',
            callback: () => navigate(`/donate/status?donationId=${donation.id}`)
          });
          setLoading(false);
        } catch (sdkError) {
          // If the iframe cannot run in this browser, preserve the payment attempt.
          window.location.assign(checkout.url);
        }
      } else {
        throw new Error('The payment provider did not return a checkout session.');
      }
    } catch (err) {
      if (donation?.id) {
        navigate(`/donate/status?donationId=${donation.id}`);
        return;
      }
      setError(err.message || 'Something went wrong. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="donate-page">
      <div className="donate-hero">
        <h1>Support Unbiased Journalism</h1>
        <p>Your donation helps us deliver fearless, fact-based reporting — free from bias and free for everyone.</p>
      </div>

      <div className="donate-container">
        <div className="donate-left">
          <h2>Why Donate?</h2>
          <ul className="donate-reasons">
            <li>
              <span className="reason-icon">📰</span>
              <div>
                <strong>Keep News Free</strong>
                <p>Help us maintain free access to unbiased news for all readers.</p>
              </div>
            </li>
            <li>
              <span className="reason-icon">🔍</span>
              <div>
                <strong>Fund Deep Reporting</strong>
                <p>Support in-depth investigative journalism that others won't do.</p>
              </div>
            </li>
            <li>
              <span className="reason-icon">🚫</span>
              <div>
                <strong>No Ads, No Bias</strong>
                <p>Your support keeps us independent from advertisers and political influence.</p>
              </div>
            </li>
            <li>
              <span className="reason-icon">🤝</span>
              <div>
                <strong>Community Driven</strong>
                <p>Join thousands of readers who believe in honest journalism.</p>
              </div>
            </li>
          </ul>

          <div className="donate-trust">
            <p>🔒 Payments are processed securely by PayU or PhonePe.</p>
            <p>✅ UPI, cards and net banking accepted</p>
          </div>
        </div>

        <div className="donate-right">
          <div className="donate-form-card">
            <h2>Make a Donation</h2>
            <p className="donate-subtitle">Every rupee counts towards better journalism.</p>

            {qrCheckout && (
              <div className="donate-qr" role="region" aria-label="UPI payment QR">
                <h3>Scan to pay ₹{Number(qrCheckout.amount).toLocaleString('en-IN')}</h3>
                <img src={qrCheckout.qrImage} alt="Scan this QR with your UPI app" />
                <p>Approve the payment in your UPI app, then check its status here.</p>
                <a className="donate-submit-btn" href={qrCheckout.uri}>Open UPI app</a>
                <button type="button" className="donate-submit-btn" onClick={() => navigate(`/donate/status?donationId=${qrCheckout.donationId}`)}>
                  Check payment status
                </button>
              </div>
            )}

            {error && (
              <div className="donate-error">
                <span>⚠️ {error}</span>
              </div>
            )}

            {!qrCheckout && <form onSubmit={handleSubmit} noValidate>

              {/* Amount Selection */}
              <div className="form-group">
                <label>Select Amount (₹)</label>
                <div className="preset-amounts">
                  {PRESET_AMOUNTS.map(amt => (
                    <button
                      key={amt}
                      type="button"
                      className={`preset-btn ${selectedPreset === amt ? 'active' : ''}`}
                      onClick={() => handlePreset(amt)}
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  className="form-input"
                  placeholder="Or enter custom amount (min ₹10)"
                  value={customAmount}
                  onChange={handleCustomAmount}
                  min="10"
                  max="100000"
                />
              </div>

              {/* Payment Method */}
              <div className="form-group">
                <label>Payment Method</label>
                <div className="method-options">
                  <label className={`method-option ${form.method === 'upi' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="method"
                      value="upi"
                      checked={form.method === 'upi'}
                      onChange={handleChange}
                    />
                    <span>📱 UPI</span>
                  </label>
                  <label className={`method-option ${form.method === 'card' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="method"
                      value="card"
                      checked={form.method === 'card'}
                      onChange={handleChange}
                    />
                    <span>💳 Card</span>
                  </label>
                  <label className={`method-option ${form.method === 'netbanking' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="method"
                      value="netbanking"
                      checked={form.method === 'netbanking'}
                      onChange={handleChange}
                    />
                    <span>🏦 Net Banking</span>
                  </label>
                </div>
              </div>

              {/* Personal Details */}
              <div className="form-group">
                <label htmlFor="firstname">Full Name *</label>
                <input
                  id="firstname"
                  type="text"
                  name="firstname"
                  className="form-input"
                  placeholder="Your full name"
                  value={form.firstname}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address *</label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  className="form-input"
                  placeholder="your@email.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">Mobile Number *</label>
                <div className="phone-input-wrapper">
                  <span className="phone-prefix">+91</span>
                  <input
                    id="phone"
                    type="tel"
                    name="phone"
                    className="form-input phone-input"
                    placeholder="10-digit mobile number"
                    value={form.phone}
                    onChange={handleChange}
                    maxLength={10}
                    required
                  />
                </div>
              </div>

              <div className="donate-summary">
                {form.amount && Number(form.amount) >= 10 && (
                  <p>You are donating <strong>₹{Number(form.amount).toLocaleString('en-IN')}</strong> via {
                    form.method === 'upi' ? 'UPI' :
                    form.method === 'card' ? 'Card' : 'Net Banking'
                  }</p>
                )}
              </div>

              <button
                type="submit"
                className="donate-submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <span className="btn-loading">
                    <span className="btn-spinner"></span>
                    Opening secure checkout...
                  </span>
                ) : (
                  `Donate ${form.amount && Number(form.amount) >= 10 ? '₹' + Number(form.amount).toLocaleString('en-IN') : 'Now'} →`
                )}
              </button>

              <p className="donate-disclaimer">
                By donating, you agree to our{' '}
                <a href="/terms-conditions" target="_blank" rel="noopener noreferrer">Terms & Conditions</a>
                {' '}and{' '}
                <a href="/refund-policy" target="_blank" rel="noopener noreferrer">Refund Policy</a>.
                Your payment is securely processed by PayU or PhonePe. Some methods open your bank or UPI app for approval.
              </p>
            </form>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Donate;
