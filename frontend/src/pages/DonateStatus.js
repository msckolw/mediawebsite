import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { getPaymentStatus, verifyPayment } from '../services/api';
import '../styles/Donate.css';

const STATUS_CONFIG = {
  success: {
    icon: '✅',
    title: 'Thank You!',
    message: "Your donation was successful. We truly appreciate your support in keeping journalism free and unbiased. A confirmation will be sent to your email."
  },
  pending: {
    icon: '⏳',
    title: 'Payment Pending',
    message: 'Your payment is being processed. This usually takes a few minutes. Please do not make another payment. We will update you once confirmed.'
  },
  failed: {
    icon: '❌',
    title: 'Payment Failed',
    message: 'Your payment could not be processed. Please check your bank or payment account before trying again if you may have been charged.'
  }
};

const UNVERIFIED_CONFIG = {
  icon: 'ℹ️',
  title: 'Unable to Verify Payment',
  message: 'We could not confirm your payment status. Please contact us for assistance before making another payment.'
};

const DonateStatus = () => {
  const [searchParams] = useSearchParams();
  const txnid = searchParams.get('txnid');
  const [payment, setPayment] = useState(null);
  const [status, setStatus] = useState(null);
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    if (!txnid) {
      setVerifying(false);
      return;
    }

    // First try to verify with PayU directly (most accurate)
    verifyPayment(txnid)
      .then(data => {
        setPayment(data);
        setStatus(data.status);
      })
      .catch(() => {
        // Fallback to just reading our DB record
        return getPaymentStatus(txnid)
          .then(data => {
            setPayment(data);
            setStatus(data.status);
          })
          .catch(() => undefined);
      })
      .finally(() => setVerifying(false));
  }, [txnid]);

  const config = STATUS_CONFIG[status] || UNVERIFIED_CONFIG;

  if (verifying) {
    return (
      <div className="donate-status-page">
        <div className="donate-status-card">
          <div className="status-verifying">
            <div className="verify-spinner"></div>
            <p>Verifying your payment with PayU...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="donate-status-page">
      <div className="donate-status-card">

        <span className="status-icon">{config.icon}</span>

        <h1 className={status}>{config.title}</h1>

        <p className="status-message">{config.message}</p>

        {/* Transaction Details */}
        {(txnid || payment) && (
          <div className="status-details">
            {txnid && (
              <div className="status-detail-row">
                <span>Transaction ID</span>
                <span style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>{txnid}</span>
              </div>
            )}
            {payment?.amount && (
              <div className="status-detail-row">
                <span>Amount</span>
                <span>₹{Number(payment.amount).toLocaleString('en-IN')}</span>
              </div>
            )}
            {payment?.mode && (
              <div className="status-detail-row">
                <span>Payment Mode</span>
                <span>{payment.mode.toUpperCase()}</span>
              </div>
            )}
            {payment?.productinfo && (
              <div className="status-detail-row">
                <span>Description</span>
                <span>{payment.productinfo}</span>
              </div>
            )}
            {status && (
              <div className="status-detail-row">
                <span>Status</span>
                <span className={`status-badge ${status}`}>{status}</span>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="status-actions">
          {!status || status === 'pending' ? (
            <Link to="/" className="status-btn-secondary">
              Go Home
            </Link>
          ) : status === 'failed' ? (
            <>
              <Link to="/donate" className="status-btn-primary">
                Try Again
              </Link>
              <Link to="/" className="status-btn-secondary">
                Go Home
              </Link>
            </>
          ) : (
            <>
              <Link to="/" className="status-btn-primary">
                Read Our News
              </Link>
              <Link to="/donate" className="status-btn-secondary">
                Donate Again
              </Link>
            </>
          )}
        </div>

        {/* Support note */}
        <p style={{ marginTop: '1.5rem', fontSize: '0.8rem', color: '#999' }}>
          Questions? Email us at{' '}
          <a href="mailto:contact@thenobiasmedia.com" style={{ color: '#1e3c72' }}>
            contact@thenobiasmedia.com
          </a>
        </p>

      </div>
    </div>
  );
};

export default DonateStatus;
