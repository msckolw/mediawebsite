const MEASUREMENT_ID = 'G-YB38R4X9EK';
const CONSENT_KEY = 'cookieConsentV2';

// V1 choices cannot be trusted: the old banner auto-accepted on a timer.
export const getConsent = () => localStorage.getItem(CONSENT_KEY);
export const setConsent = choice => {
  localStorage.setItem(CONSENT_KEY, choice);
  localStorage.setItem('cookieConsent', choice);
  localStorage.setItem('cookieConsentDate', new Date().toISOString());
  applyAnalyticsConsent(choice === 'accepted');
};

export const applyAnalyticsConsent = accepted => {
  window[`ga-disable-${MEASUREMENT_ID}`] = !accepted;
  if (!accepted) {
    if (window.gtag) window.gtag('consent', 'update', { analytics_storage: 'denied', ad_storage: 'denied' });
    document.getElementById('optional-google-analytics')?.remove();
    // Clear analytics cookies, including those set on parent domains.
    const host = window.location.hostname.split('.');
    document.cookie.split(';').forEach(cookie => {
      const name = cookie.trim().split('=')[0];
      if (!/^_ga(?:_|$)|^_gid$|^_gat/.test(name)) return;
      document.cookie = `${name}=; Max-Age=0; path=/`;
      for (let i = 0; i < host.length - 1; i++) {
        document.cookie = `${name}=; Max-Age=0; path=/; domain=${host.slice(i).join('.')}`;
      }
    });
    return;
  }
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  window.gtag('consent', 'update', { analytics_storage: 'granted', ad_storage: 'denied' });
  if (!document.getElementById('optional-google-analytics')) {
    const script = document.createElement('script');
    script.id = 'optional-google-analytics';
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
    window.gtag('js', new Date());
    window.gtag('config', MEASUREMENT_ID);
    document.head.appendChild(script);
  }
};
