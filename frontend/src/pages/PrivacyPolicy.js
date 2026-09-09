import React from 'react';
import '../styles/LegalPages.css';

const PrivacyPolicy = () => {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <h1>Privacy Policy</h1>
        <p className="last-updated">Last Updated: January 2026</p>

        <section>
          <h2>1. Introduction</h2>
          <p>
            The NoBias Media ("we," "our," or "us") is committed to protecting your privacy. This Privacy
            Policy explains how we collect, use, disclose, and safeguard your information when you visit
            our website thenobiasmedia.com and use our services.
          </p>
        </section>

        <section>
          <h2>2. Information We Collect</h2>
          
          <h3>2.1 Personal Information</h3>
          <p>We may collect personal information that you voluntarily provide to us, including:</p>
          <ul>
            <li>Name and email address (when you create an account or contact us)</li>
            <li>Payment information (processed securely through PhonePe Payment Gateway)</li>
            <li>Login credentials for admin panel access</li>
            <li>Communication preferences</li>
          </ul>

          <h3>2.2 Automatically Collected Information</h3>
          <p>When you visit our website, we automatically collect certain information, including:</p>
          <ul>
            <li>IP address and browser type</li>
            <li>Device information and operating system</li>
            <li>Pages visited and time spent on our site</li>
            <li>Referring website addresses</li>
            <li>Cookies and similar tracking technologies</li>
          </ul>

          <h3>2.3 Google OAuth Information</h3>
          <p>
            If you log in using Google OAuth, we collect your name, email address, and profile information
            as provided by Google. We only request the minimum permissions necessary for authentication.
          </p>
        </section>

        <section>
          <h2>3. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul>
            <li>Provide, operate, and maintain our services</li>
            <li>Process donations and payments through PhonePe</li>
            <li>Authenticate users and manage admin panel access</li>
            <li>Improve and personalize user experience</li>
            <li>Analyze usage patterns and optimize our content</li>
            <li>Send administrative information and updates</li>
            <li>Respond to inquiries and provide customer support</li>
            <li>Detect, prevent, and address technical issues and security threats</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section>
          <h2>4. Cookies and Tracking Technologies</h2>
          <p>
            We use cookies and similar tracking technologies to enhance your experience. Cookies are small
            data files stored on your device that help us remember your preferences and understand how you
            use our service.
          </p>
          <p>You can control cookies through your browser settings. However, disabling cookies may limit your ability to use certain features of our service.</p>
        </section>

        <section>
          <h2>5. Third-Party Services</h2>
          
          <h3>5.1 PhonePe Payment Gateway</h3>
          <p>
            We use PhonePe Payment Gateway to process donations and payments. PhonePe's privacy policy
            governs the collection and use of payment information. We do not store your full payment
            card details on our servers.
          </p>

          <h3>5.2 Google OAuth</h3>
          <p>
            When you use Google OAuth to log in, Google's privacy policy applies to the information
            collected during the authentication process.
          </p>

          <h3>5.3 MongoDB and Cloud Services</h3>
          <p>
            We use MongoDB for database services and Google Cloud for hosting. These services may have
            access to your data as necessary to provide their services to us.
          </p>
        </section>

        <section>
          <h2>6. Data Sharing and Disclosure</h2>
          <p>We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:</p>
          <ul>
            <li><strong>With your consent:</strong> When you explicitly agree to share information</li>
            <li><strong>Service providers:</strong> With trusted third parties who assist in operating our service (e.g., payment processors, hosting providers)</li>
            <li><strong>Legal requirements:</strong> When required by law or to protect our rights</li>
            <li><strong>Business transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
          </ul>
        </section>

        <section>
          <h2>7. Data Security</h2>
          <p>
            We implement appropriate technical and organizational security measures to protect your
            personal information against unauthorized access, alteration, disclosure, or destruction.
            However, no method of transmission over the internet or electronic storage is 100% secure.
          </p>
        </section>

        <section>
          <h2>8. Data Retention</h2>
          <p>
            We retain your personal information only for as long as necessary to fulfill the purposes
            outlined in this Privacy Policy, unless a longer retention period is required by law.
          </p>
        </section>

        <section>
          <h2>9. Your Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li>Access the personal information we hold about you</li>
            <li>Request correction of inaccurate or incomplete information</li>
            <li>Request deletion of your personal information</li>
            <li>Object to or restrict certain processing of your information</li>
            <li>Withdraw consent where processing is based on consent</li>
            <li>Data portability (receive your data in a structured format)</li>
          </ul>
          <p>To exercise these rights, please contact us at contact@thenobiasmedia.com</p>
        </section>

        <section>
          <h2>10. Children's Privacy</h2>
          <p>
            Our service is not intended for children under 13 years of age. We do not knowingly collect
            personal information from children under 13. If you are a parent or guardian and believe
            your child has provided us with personal information, please contact us.
          </p>
        </section>

        <section>
          <h2>11. International Data Transfers</h2>
          <p>
            Your information may be transferred to and maintained on servers located outside your country
            of residence, where data protection laws may differ. By using our service, you consent to
            such transfers.
          </p>
        </section>

        <section>
          <h2>12. Changes to This Privacy Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any material
            changes by posting the new Privacy Policy on this page with an updated "Last Updated" date.
            We encourage you to review this Privacy Policy periodically.
          </p>
        </section>

        <section>
          <h2>13. Contact Us</h2>
          <p>
            If you have any questions or concerns about this Privacy Policy or our data practices,
            please contact us at:
          </p>
          <p>
            Email: contact@thenobiasmedia.com<br />
            Website: https://thenobiasmedia.com
          </p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
