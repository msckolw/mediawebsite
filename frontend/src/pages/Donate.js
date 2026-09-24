import React, { useState } from 'react';
import { createPayment } from '../services/api';
import '../styles/Donate.css';

const PRESET_AMOUNTS = [50, 100, 200, 500, 1000];

const Donate = () => {
  const [form, setForm] = useState({
    firstname: '',
    email: '',
    phone: '',
    amount: '',
    method: 'all'
  });
  const [customAmount, setCustomAmount] = useState('');
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handlePreset(amt) {
    setSelectedPreset(amt);
    setCustomAmount('');
    setForm(prev => ({ ...prev, amount: String(amt) }));
  }

  function handleCustomAmount(e) {
    const val = e.target.value;
    setCustomAmount(val);
    setSelectedPreset(null);
    setForm(prev => ({ ...prev, amount: val }));
  }

  function handleChange(e) {
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
    try {
      const data = await createPayment({
        firstname: form.firstname.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.replace(/\s+/g, ''),
        amount: form.amount,
        method: form.method
      });

      // PayU requires a real HTML form POST — not axios
      const payuForm = document.createElement('form');
      payuForm.method = 'POST';
      payuForm.action = data.action;

      Object.entries(data.fields).forEach(([key, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = value;
        payuForm.appendChild(input);
      });

      document.body.appendChild(payuForm);
      payuForm.submit();
    } catch (err) {
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
            <p>🔒 All payments are secured by <strong>PayU</strong> — India's leading payment gateway.</p>
            <p>✅ UPI, Debit/Credit Cards accepted</p>
            <p>🏦 Compliant with RBI guidelines</p>
          </div>
        </div>

        <div className="donate-right">
          <div className="donate-form-card">
            <h2>Make a Donation</h2>
            <p className="donate-subtitle">Every rupee counts towards better journalism.</p>

            {error && (
              <div className="donate-error">
                <span>⚠️ {error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>

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
                  <label className={`method-option ${form.method === 'all' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="method"
                      value="all"
                      checked={form.method === 'all'}
                      onChange={handleChange}
                    />
                    <span>💳 All Methods</span>
                  </label>
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
                    form.method === 'card' ? 'Card' : 'UPI / Card'
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
                    Redirecting to PayU...
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
                You will be redirected to PayU's secure payment page.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Donate;
