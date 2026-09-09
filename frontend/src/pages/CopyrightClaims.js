import React from 'react';
import '../styles/LegalPages.css';

const CopyrightClaims = () => {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <h1>Copyright Claims & DMCA Notice</h1>
        <p className="last-updated">Last Updated: January 2026</p>

        <section>
          <h2>Respecting Intellectual Property Rights</h2>
          <p>
            The NoBias Media respects the intellectual property rights of others and expects our users
            to do the same. As a news aggregation and content platform, we use images, text, and other
            materials from various sources to provide comprehensive news coverage. We are committed to
            addressing any copyright concerns promptly and in good faith.
          </p>
        </section>

        <section>
          <h2>Our Commitment to Rights Holders</h2>
          <p>We are committed to:</p>
          <ul>
            <li>Responding to all valid copyright claims within 48 hours</li>
            <li>Removing or properly attributing disputed content within 5 business days</li>
            <li>Working collaboratively with rights holders to resolve issues amicably</li>
            <li>Preventing future incidents through improved attribution and sourcing practices</li>
            <li>Respecting fair use principles while honoring creators' rights</li>
          </ul>
        </section>

        <section>
          <h2>How to Submit a Copyright Claim</h2>
          
          <div style={{
            backgroundColor: '#f0f8ff',
            padding: '25px',
            borderRadius: '8px',
            border: '2px solid #007bff',
            marginBottom: '30px'
          }}>
            <h3 style={{ marginTop: 0, color: '#007bff' }}>Quick Contact for Copyright Claims</h3>
            <p style={{ fontSize: '1.1rem', marginBottom: '10px' }}>
              <strong>Email:</strong> <a href="mailto:contact@thenobiasmedia.com?subject=Copyright Claim">contact@thenobiasmedia.com</a><br />
              <strong>Subject Line:</strong> "Copyright Claim" or "DMCA Notice"<br />
              <strong>Response Time:</strong> Within 48 hours
            </p>
          </div>

          <p>
            If you believe that content on our platform infringes your copyright or other intellectual
            property rights, please contact us using the email above. We encourage resolving disputes
            through direct communication before pursuing formal legal action.
          </p>
        </section>

        <section>
          <h2>Information to Include in Your Claim</h2>
          
          <h3>For Faster Resolution (Informal Notice)</h3>
          <p>For quickest resolution, please provide:</p>
          <ol>
            <li><strong>Your name and contact information</strong></li>
            <li><strong>Specific URL(s)</strong> where the content appears on our website</li>
            <li><strong>Description</strong> of the copyrighted work (e.g., "Photograph of sunset at Times Square taken on May 15, 2024")</li>
            <li><strong>Proof of ownership</strong> (optional but helpful - link to original source, copyright registration, etc.)</li>
            <li><strong>Preferred resolution:</strong>
              <ul>
                <li>Complete removal of content</li>
                <li>Proper attribution with credit line</li>
                <li>Licensing discussion</li>
                <li>Other resolution</li>
              </ul>
            </li>
          </ol>

          <h3>For Formal DMCA Notice</h3>
          <p>
            If you prefer to submit a formal DMCA takedown notice under the Digital Millennium
            Copyright Act (17 U.S.C. § 512), your notice must include all of the following:
          </p>
          <ol>
            <li><strong>Identification of the copyrighted work:</strong> A detailed description of the
                copyrighted work you claim has been infringed. If multiple works are covered, provide
                a representative list.</li>
            <li><strong>Identification of the infringing material:</strong> Specific URL(s) or location(s)
                on our website where the allegedly infringing material appears, with sufficient detail
                to allow us to locate it.</li>
            <li><strong>Your contact information:</strong> Your full name, mailing address, telephone
                number, and email address.</li>
            <li><strong>Good faith statement:</strong> A statement that you have a good faith belief
                that the use of the material is not authorized by the copyright owner, its agent, or
                the law.</li>
            <li><strong>Accuracy statement:</strong> A statement, made under penalty of perjury, that
                the information in your notice is accurate and that you are the copyright owner or
                authorized to act on behalf of the copyright owner.</li>
            <li><strong>Signature:</strong> Your physical or electronic signature.</li>
          </ol>
        </section>

        <section>
          <h2>Special Note for Image Rights Holders</h2>
          <p>
            As a news aggregation platform, we frequently use images from news articles and public sources.
            We understand that photographers, artists, and image creators invest significant time and
            effort in their work.
          </p>

          <h3>Our Image Use Policy</h3>
          <ul>
            <li>We source images primarily from original news articles and public sources</li>
            <li>We provide attribution and link back to original sources where possible</li>
            <li>We operate under fair use principles for news reporting and commentary</li>
            <li>We respect requests for removal or proper attribution</li>
          </ul>

          <h3>If Your Image Is Being Used</h3>
          <p>We offer several resolution options:</p>
          <ul>
            <li><strong>Immediate Removal:</strong> We can remove your image within 24-48 hours</li>
            <li><strong>Proper Attribution:</strong> We can add or update credit lines to properly
                attribute your work</li>
            <li><strong>Licensing Agreement:</strong> We can discuss licensing your images for ongoing use</li>
            <li><strong>Source Change:</strong> We can replace the image with an alternative</li>
          </ul>
        </section>

        <section>
          <h2>Our Response Process</h2>
          
          <h3>Upon Receiving Your Claim</h3>
          <ol>
            <li><strong>Acknowledgment (Within 48 hours):</strong> We will acknowledge receipt of your
                claim and confirm we have received all necessary information.</li>
            <li><strong>Review (1-3 business days):</strong> We will review the claim, verify the
                content location, and assess the validity.</li>
            <li><strong>Action (Within 5 business days):</strong> We will take appropriate action:
              <ul>
                <li>Remove the disputed content</li>
                <li>Add or update attribution</li>
                <li>Replace with alternative content</li>
                <li>Discuss licensing or other arrangements</li>
              </ul>
            </li>
            <li><strong>Confirmation:</strong> We will notify you once the matter is resolved.</li>
          </ol>

          <h3>Emergency Requests</h3>
          <p>
            If you need urgent removal (e.g., privacy concerns, sensitive material), please mark your
            email subject as "URGENT COPYRIGHT CLAIM" and we will prioritize your request.
          </p>
        </section>

        <section>
          <h2>Fair Use Considerations</h2>
          <p>
            As a news and commentary platform, some of our use of copyrighted material may qualify as
            "fair use" under U.S. Copyright Law (17 U.S.C. § 107) and similar provisions in other
            jurisdictions. Fair use factors include:
          </p>
          <ul>
            <li>Purpose and character of use (news reporting, commentary)</li>
            <li>Nature of the copyrighted work</li>
            <li>Amount and substantiality of portion used</li>
            <li>Effect on the market value of the original work</li>
          </ul>
          <p>
            However, we recognize that fair use determinations are complex and fact-specific. We are
            committed to working with rights holders to resolve disputes regardless of fair use arguments.
          </p>
        </section>

        <section>
          <h2>Counter-Notification</h2>
          <p>
            If you believe that content you posted or licensed to us was removed or disabled by mistake
            or misidentification, you may submit a counter-notification.
          </p>

          <h3>Counter-Notice Requirements</h3>
          <p>Your counter-notification must include:</p>
          <ol>
            <li>Your physical or electronic signature</li>
            <li>Identification of the material that was removed and its location before removal</li>
            <li>A statement under penalty of perjury that you have a good faith belief that the
                material was removed or disabled as a result of mistake or misidentification</li>
            <li>Your name, address, telephone number, and email address</li>
            <li>A statement that you consent to the jurisdiction of the federal court in your district
                (or if outside the U.S., any judicial district in which we may be found)</li>
            <li>A statement that you will accept service of process from the complaining party</li>
          </ol>

          <p>
            Send counter-notifications to: <a href="mailto:contact@thenobiasmedia.com">contact@thenobiasmedia.com</a>
            with subject "Counter-Notification - DMCA"
          </p>
        </section>

        <section>
          <h2>Repeat Infringer Policy</h2>
          <p>
            In accordance with the DMCA and other applicable laws, we have adopted a policy of
            terminating, in appropriate circumstances, the accounts or access of users who are
            deemed to be repeat infringers. We may also, at our sole discretion, limit access to
            our website and services for any users who infringe intellectual property rights,
            whether or not there is repeat infringement.
          </p>
        </section>

        <section>
          <h2>Good Faith Resolution</h2>
          <p>
            We believe in resolving disputes amicably. Our experience shows that most copyright
            issues can be resolved through direct communication without formal legal proceedings.
          </p>

          <h3>Benefits of Direct Resolution</h3>
          <ul>
            <li><strong>Faster:</strong> Issues resolved in days, not weeks or months</li>
            <li><strong>Cost-effective:</strong> No legal fees or court costs</li>
            <li><strong>Flexible:</strong> Multiple resolution options available</li>
            <li><strong>Relationship-focused:</strong> Opportunity for ongoing collaboration</li>
            <li><strong>Practical:</strong> Solutions that work for both parties</li>
          </ul>

          <p>
            We have successfully resolved copyright concerns with many rights holders and welcome
            the opportunity to work with you.
          </p>
        </section>

        <section>
          <h2>Licensing and Partnership Opportunities</h2>
          <p>
            If you are a photographer, artist, or content creator interested in licensing your work
            to us on an ongoing basis, we welcome partnership discussions. Please contact us at
            <a href="mailto:contact@thenobiasmedia.com"> contact@thenobiasmedia.com</a> with subject
            "Licensing Inquiry".
          </p>
        </section>

        <section>
          <h2>Designated Copyright Agent</h2>
          <p>
            Our designated agent for notice of claims of copyright infringement can be reached at:
          </p>
          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid #dee2e6',
            marginTop: '15px'
          }}>
            <p style={{ marginBottom: '10px' }}>
              <strong>Copyright Agent</strong><br />
              The NoBias Media<br />
              75-76, West Guru Angad Nagar<br />
              Near Nirman Vihar Metro Station<br />
              Delhi - 110092, India<br />
              <br />
              Email: <a href="mailto:contact@thenobiasmedia.com">contact@thenobiasmedia.com</a><br />
              Subject: Copyright Claim / DMCA Notice
            </p>
          </div>
        </section>

        <section>
          <h2>False Claims Warning</h2>
          <p>
            Please note that under Section 512(f) of the DMCA, any person who knowingly materially
            misrepresents that material or activity is infringing, or that material or activity was
            removed or disabled by mistake or misidentification, may be subject to liability.
          </p>
          <p>
            Please ensure your claim is accurate and made in good faith. We take false claims seriously
            and may pursue legal remedies if warranted.
          </p>
        </section>

        <section>
          <h2>International Copyright Claims</h2>
          <p>
            While The NoBias Media operates under Indian law, we respect copyright laws worldwide.
            If you are a rights holder from outside India, we will work with you to resolve claims
            in accordance with applicable international treaties and your local copyright laws.
          </p>
        </section>

        <section>
          <h2>Questions and Additional Information</h2>
          <p>
            If you have questions about our copyright policies, need clarification on the claims
            process, or want to discuss content usage before filing a claim, please contact us:
          </p>
          <p>
            <strong>The NoBias Media</strong><br />
            Email: <a href="mailto:contact@thenobiasmedia.com">contact@thenobiasmedia.com</a><br />
            Website: <a href="https://thenobiasmedia.com">https://thenobiasmedia.com</a><br />
            Response Time: Within 48 hours
          </p>
        </section>

        <div style={{
          backgroundColor: '#d1ecf1',
          border: '2px solid #0c5460',
          borderRadius: '8px',
          padding: '20px',
          marginTop: '40px'
        }}>
          <h3 style={{ marginTop: 0, color: '#0c5460' }}>💡 Quick Action Guide</h3>
          <p style={{ marginBottom: '10px' }}>
            <strong>If you found your content on our site:</strong>
          </p>
          <ol style={{ marginBottom: 0 }}>
            <li>Email us at contact@thenobiasmedia.com</li>
            <li>Include the URL and description of your content</li>
            <li>Tell us your preferred resolution</li>
            <li>We'll respond within 48 hours and resolve within 5 days</li>
          </ol>
          <p style={{ marginTop: '15px', marginBottom: 0 }}>
            <strong>We're committed to doing the right thing. Let's work together! 🤝</strong>
          </p>
        </div>
      </div>
    </div>
  );
};

export default CopyrightClaims;
