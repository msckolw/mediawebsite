import React, { useState, useEffect } from 'react';
import './CookieConsent.css';

const CookieConsent = () => {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if user has already accepted cookies
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    localStorage.setItem('cookieConsentDate', new Date().toISOString());
    setShowBanner(false);
  };

  const declineCookies = () => {
    localStorage.setItem('cookieConsent', 'declined');
    localStorage.setItem('cookieConsentDate', new Date().toISOString());
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="cookie-consent-banner">
      <div className="cookie-consent-content">
        <div className="cookie-consent-text">
          <span className="cookie-icon">🍪</span>
          <p>
            We use cookies to enhance your experience. 
            <a href="/privacy-policy" className="cookie-link">Learn more</a>
          </p>
        </div>
        <div className="cookie-consent-buttons">
          <button className="cookie-btn cookie-accept" onClick={acceptCookies}>
            Accept
          </button>
          <button className="cookie-btn cookie-decline" onClick={declineCookies}>
            Decline
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;