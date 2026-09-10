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
            our website thenobiasmedia.com, use our mobile applications, and use our services.
          </p>
          <p>
            <strong>Acceptance of This Policy:</strong> By using our services, including logging in through
            Google OAuth, you agree to the collection and use of information in accordance with this Privacy
            Policy. We do not require explicit checkbox acceptance during login; your continued use of our
            services constitutes acceptance of this policy.
          </p>
          <p>
            This Privacy Policy is always accessible at https://thenobiasmedia.com/privacy-policy and should
            be read in conjunction with our Terms and Conditions.
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
            We use Google OAuth as our sole authentication method. When you log in using Google OAuth,
            we collect your name, email address, and profile information as provided by Google.
          </p>
          <p>
            <strong>Important:</strong> We only request the minimum permissions necessary for authentication:
          </p>
          <ul>
            <li>Email address (required for account identification)</li>
            <li>Basic profile information (name and profile picture)</li>
          </ul>
          <p>
            We do not have access to your Google password or any other Google account data. By logging in
            with Google, you authorize us to access only the information mentioned above. You can revoke
            this access at any time through your Google Account settings at
            https://myaccount.google.com/permissions.
          </p>
          <p>
            <strong>No Separate Signup Process:</strong> We do not have a traditional signup form or
            require explicit acceptance checkboxes. Your act of logging in through Google OAuth constitutes
            your agreement to our Terms and Conditions and this Privacy Policy, which are always accessible
            on our website.
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
            <strong>Payment Gateway Provider:</strong> PhonePe Private Limited<br />
            <strong>Authorized by:</strong> Reserve Bank of India (RBI)
          </p>
          <p>
            We use PhonePe Payment Gateway to process donations and payments securely. When you make a payment:
          </p>
          <ul>
            <li><strong>What PhonePe Collects:</strong> Payment details (card number, CVV, UPI ID, net banking credentials)</li>
            <li><strong>What We Receive:</strong> Only transaction confirmation (success/failure) and transaction ID</li>
            <li><strong>What We Do NOT Store:</strong> Your card numbers, CVV, PIN, or banking credentials</li>
            <li><strong>Redirect Process:</strong> You are redirected to PhonePe's secure payment page</li>
            <li><strong>Data Security:</strong> PhonePe maintains PCI DSS compliance and RBI-mandated security standards</li>
          </ul>
          
          <h4>Data Shared with PhonePe:</h4>
          <ul>
            <li>Transaction amount</li>
            <li>Your name and email address (for receipts and confirmations)</li>
            <li>Unique transaction reference ID</li>
            <li>Device and browser information (for fraud prevention)</li>
          </ul>
          
          <h4>PhonePe's Privacy Policy:</h4>
          <p>
            PhonePe's collection and use of payment data is governed by their privacy policy, available at:
            <a href="https://www.phonepe.com/privacy-policy/" target="_blank" rel="noopener noreferrer" style={{ marginLeft: '5px' }}>
              https://www.phonepe.com/privacy-policy/
            </a>
          </p>
          
          <h4>Payment Security and Compliance:</h4>
          <p>
            All payment transactions are processed in compliance with:
          </p>
          <ul>
            <li><strong>PCI DSS:</strong> Payment Card Industry Data Security Standard</li>
            <li><strong>RBI Guidelines:</strong> Reserve Bank of India's Payment Aggregator regulations</li>
            <li><strong>Encryption:</strong> Industry-standard SSL/TLS encryption for all transactions</li>
            <li><strong>Two-Factor Authentication:</strong> As mandated by RBI for card transactions</li>
          </ul>
          
          <h4>Transaction Records:</h4>
          <p>
            We maintain transaction records including transaction ID, amount, date, and status for:
          </p>
          <ul>
            <li>Accounting and tax compliance purposes (7 years)</li>
            <li>Dispute resolution and refund processing</li>
            <li>Regulatory compliance with RBI and income tax requirements</li>
          </ul>


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
          
          <h3>9.1 Account Deletion</h3>
          <p>
            You have the right to request permanent deletion of your account and associated personal data at any time.
            For detailed information about the account deletion process, timeline, and what data is deleted, please visit our
            <a href="/delete-account" style={{ marginLeft: '5px' }}>Account Deletion page</a>.
          </p>
          <p>To request account deletion:</p>
          <ul>
            <li>Visit: <a href="https://thenobiasmedia.com/delete-account">https://thenobiasmedia.com/delete-account</a></li>
            <li>Email: <a href="mailto:contact@thenobiasmedia.com?subject=Account Deletion Request">contact@thenobiasmedia.com</a> with subject "Account Deletion Request"</li>
            <li>Mobile App: Go to Settings → Account → Delete Account (if using our mobile app)</li>
          </ul>
          <p>
            Your account will be deactivated immediately and permanently deleted after a 30-day grace period.
            During the grace period, you can cancel the deletion request if you change your mind.
          </p>

          <h3>9.2 Data Export</h3>
          <p>
            Before deleting your account, you can request an export of your personal data in a machine-readable
            format (JSON or CSV). Email contact@thenobiasmedia.com with subject "Data Export Request" and
            we will provide your data within 30 days.
          </p>

          <h3>9.3 Exercising Your Rights</h3>
          <p>To exercise any of these rights, please contact us at contact@thenobiasmedia.com</p>
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
            <strong>The NoBias Media</strong><br />
            75-76, West Guru Angad Nagar<br />
            Near Nirman Vihar Metro Station<br />
            Delhi - 110092, India<br />
            <br />
            Email: contact@thenobiasmedia.com<br />
            Website: https://thenobiasmedia.com
          </p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
