import React from 'react';
import '../styles/LegalPages.css';

const TermsAndConditions = () => {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <h1>Terms and Conditions</h1>
        <p className="last-updated">Last Updated: January 2026</p>

        <section>
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing and using The NoBias Media ("we," "our," or "us") website at thenobiasmedia.com
            and our mobile applications, you accept and agree to be bound by the terms and provisions of
            this agreement.
          </p>
          <p>
            <strong>How You Accept These Terms:</strong> By logging in through Google OAuth or by continuing
            to use our services, you acknowledge that you have read, understood, and agree to be bound by
            these Terms and Conditions and our Privacy Policy. If you do not agree to these terms, please
            do not use our services.
          </p>
          <p>
            These Terms and Conditions are available at all times at https://thenobiasmedia.com/terms-conditions
            and are incorporated by reference into your use of our services.
          </p>
        </section>

        <section>
          <h2>2. About Our Service</h2>
          <p>
            The NoBias Media is a news aggregation and content platform that provides unbiased news coverage
            from multiple sources. We strive to present news objectively without editorial bias, allowing
            readers to form their own informed opinions.
          </p>
        </section>

        <section>
          <h2>3. Use of Service</h2>
          <p>You agree to use our service only for lawful purposes and in accordance with these Terms. You agree not to:</p>
          <ul>
            <li>Use the service in any way that violates any applicable national or international law or regulation</li>
            <li>Transmit any material that is defamatory, offensive, or otherwise objectionable</li>
            <li>Attempt to gain unauthorized access to any portion of the service</li>
            <li>Interfere with or disrupt the service or servers or networks connected to the service</li>
            <li>Use any automated means to access the service for any purpose without our express written permission</li>
          </ul>
        </section>

        <section>
          <h2>4. Intellectual Property Rights</h2>
          <p>
            The content provided on The NoBias Media, including but not limited to text, graphics, logos,
            images, and software, is the property of The NoBias Media or its content suppliers and is
            protected by copyright and other intellectual property laws.
          </p>
          <p>
            News articles and content aggregated from external sources remain the property of their
            respective owners. We provide proper attribution and links to original sources.
          </p>
        </section>

        <section>
          <h2>5. User Accounts and Admin Panel</h2>
          <p>
            Certain features of our service, including the admin panel and personalized content, require
            account registration through Google OAuth.
          </p>
          
          <h3>5.1 Account Creation</h3>
          <p>
            We use Google OAuth for authentication. When you sign in with Google:
          </p>
          <ul>
            <li>You authorize us to access your Google account email and basic profile information</li>
            <li>By logging in, you automatically accept these Terms and Conditions and our Privacy Policy</li>
            <li>We do not store your Google password or have access to it</li>
            <li>You can revoke our access at any time through your Google Account settings</li>
          </ul>

          <h3>5.2 No Separate Registration</h3>
          <p>
            We do not have a separate signup process or require explicit acceptance checkboxes. Your use
            of Google OAuth to log in constitutes your acceptance of our terms and policies, which are
            always accessible at:
          </p>
          <ul>
            <li>Terms and Conditions: https://thenobiasmedia.com/terms-conditions</li>
            <li>Privacy Policy: https://thenobiasmedia.com/privacy-policy</li>
          </ul>

          <h3>5.3 Account Responsibilities</h3>
          <p>
            You are responsible for maintaining the security of your Google account and for all activities
            that occur through your account on our service.
          </p>
        </section>

        <section>
          <h2>6. Donations and Payments</h2>
          <p>
            We accept voluntary donations to support our content and operations. All donations are
            processed securely through PhonePe Payment Gateway. By making a donation, you agree to
            the following:
          </p>
          <ul>
            <li>Donations are voluntary and non-refundable unless required by law</li>
            <li>You authorize us to charge the specified amount through PhonePe</li>
            <li>Payment information is processed securely by PhonePe and not stored on our servers</li>
            <li>Donations do not grant any special access, privileges, or subscription benefits at this time</li>
          </ul>
        </section>

        <section>
          <h2>7. Third-Party Services</h2>
          <p>
            Our service may contain links to third-party websites or services that are not owned or
            controlled by The NoBias Media. We have no control over and assume no responsibility for
            the content, privacy policies, or practices of any third-party websites or services.
          </p>
        </section>

        <section>
          <h2>8. Disclaimer of Warranties</h2>
          <p>
            The service is provided on an "AS IS" and "AS AVAILABLE" basis. We make no representations
            or warranties of any kind, express or implied, regarding the operation of the service or
            the information, content, or materials included on the service.
          </p>
          <p>
            While we strive for accuracy, we do not warrant that the content is accurate, complete,
            reliable, current, or error-free.
          </p>
        </section>

        <section>
          <h2>9. Limitation of Liability</h2>
          <p>
            To the fullest extent permitted by applicable law, The NoBias Media shall not be liable
            for any indirect, incidental, special, consequential, or punitive damages resulting from
            your use of or inability to use the service.
          </p>
        </section>

        <section>
          <h2>10. Indemnification</h2>
          <p>
            You agree to indemnify, defend, and hold harmless The NoBias Media and its officers,
            directors, employees, and agents from any claims, liabilities, damages, losses, and
            expenses arising out of your use of the service or violation of these Terms.
          </p>
        </section>

        <section>
          <h2>11. Changes to Terms</h2>
          <p>
            We reserve the right to modify these Terms at any time. We will notify users of any
            material changes by posting the new Terms on this page with an updated "Last Updated" date.
            Your continued use of the service after such changes constitutes acceptance of the new Terms.
          </p>
        </section>

        <section>
          <h2>12. Governing Law</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of India,
            without regard to its conflict of law provisions.
          </p>
        </section>

        <section>
          <h2>13. Contact Information</h2>
          <p>
            If you have any questions about these Terms and Conditions, please contact us at:
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

export default TermsAndConditions;
