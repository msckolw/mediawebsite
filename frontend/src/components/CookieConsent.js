import React, { useState, useEffect } from 'react';
import './CookieConsent.css';
import { getConsent, setConsent, applyAnalyticsConsent } from '../services/analytics';

const CookieConsent = () => {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = getConsent();
    setShowBanner(!['accepted', 'declined'].includes(consent));
    applyAnalyticsConsent(consent === 'accepted');
    const sync = event => {
      if (event.key === 'cookieConsentV2') {
        applyAnalyticsConsent(event.newValue === 'accepted');
        setShowBanner(!['accepted', 'declined'].includes(event.newValue));
      }
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  const choose = choice => { setConsent(choice); setShowBanner(false); };
  if (!showBanner) return <button type="button" className="cookie-settings" onClick={() => setShowBanner(true)}>Cookie settings</button>;

  return (
    <div className="cookie-consent-banner" role="region" aria-label="Cookie preferences">
      <div className="cookie-consent-content">
        <div className="cookie-consent-text">
          <span className="cookie-icon">🍪</span>
          <p>
            Optional analytics help us understand how the site is used. Sign-in cookies are necessary.
            <a href="/privacy-policy" className="cookie-link">Learn more</a>
          </p>
        </div>
        <div className="cookie-consent-buttons">
          <button className="cookie-btn cookie-accept" onClick={() => choose('accepted')}>
            Accept
          </button>
          <button className="cookie-btn cookie-decline" onClick={() => choose('declined')}>
            Decline
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;