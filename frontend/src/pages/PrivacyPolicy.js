import React from 'react';

const PrivacyPolicy = () => {
  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', lineHeight: '1.6' }}>
      <h1>Privacy Policy</h1>
      <p><strong>Last updated:</strong> {new Date().toLocaleDateString()}</p>
      
      <h2>1. Information We Collect</h2>
      <p>We collect information you provide directly to us, such as when you create an account, subscribe to our newsletter, or contact us.</p>
      
      <h2>2. How We Use Your Information</h2>
      <p>We use the information we collect to:</p>
      <ul>
        <li>Provide, maintain, and improve our services</li>
        <li>Send you news updates and newsletters</li>
        <li>Respond to your comments and questions</li>
        <li>Analyze usage patterns to improve user experience</li>
      </ul>
      
      <h2>3. Information Sharing</h2>
      <p>We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy.</p>
      
      <h2>4. Data Security</h2>
      <p>We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>
      
      <h2>5. Cookies</h2>
      <p>We use cookies to enhance your experience on our website. You can choose to disable cookies through your browser settings.</p>
      
      <h2>6. Contact Us</h2>
      <p>If you have any questions about this Privacy Policy, please contact us at manisankar@thenobiasmedia.com</p>
    </div>
  );
};

export default PrivacyPolicy;