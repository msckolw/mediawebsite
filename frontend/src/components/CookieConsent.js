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
          <h3>🍪 We use cookies</h3>
          <p>
            We use cookies and similar technologies to enhance your browsing experience, 
            analyze site traffic, and provide personalized content. By clicking "Accept All", 
            you consent to our use of cookies.
          </p>
        </div>
        <div className="cookie-consent-buttons">
          <button className="cookie-btn cookie-accept" onClick={acceptCookies}>
            Accept All
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