import React from 'react';
import '../styles/LegalPages.css';

const RefundPolicy = () => {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <h1>Refund Policy</h1>
        <p className="last-updated">Last Updated: January 2026</p>

        <section>
          <h2>1. Overview</h2>
          <p>
            This Refund Policy outlines the terms and conditions for refunds related to donations and
            payments made through The NoBias Media website at thenobiasmedia.com. We process all
            payments securely through PhonePe Payment Gateway.
          </p>
        </section>

        <section>
          <h2>2. Donations</h2>
          
          <h3>2.1 General Policy</h3>
          <p>
            Donations made to The NoBias Media are generally non-refundable as they are voluntary
            contributions to support our content and operations. By making a donation, you acknowledge
            that it is a voluntary gesture of support.
          </p>

          <h3>2.2 Exceptions</h3>
          <p>Refunds for donations may be considered only in the following circumstances:</p>
          <ul>
            <li><strong>Technical Errors:</strong> If you were charged multiple times due to a technical error</li>
            <li><strong>Unauthorized Transactions:</strong> If the transaction was made without your authorization</li>
            <li><strong>Processing Errors:</strong> If there was an error in the payment processing that resulted in an incorrect amount being charged</li>
          </ul>
        </section>

        <section>
          <h2>3. Future Subscription Services</h2>
          <p>
            When we launch subscription-based services in the future, we will update this policy
            to include specific refund terms for subscriptions. Subscription refund policies will
            be clearly communicated at the time of purchase.
          </p>
        </section>

        <section>
          <h2>4. Refund Request Process</h2>
          
          <h3>4.1 How to Request a Refund</h3>
          <p>To request a refund, please follow these steps:</p>
          <ol>
            <li>Contact us at contact@thenobiasmedia.com within 7 days of the transaction</li>
            <li>Include the following information in your email:
              <ul>
                <li>Transaction ID or reference number</li>
                <li>Date and amount of the transaction</li>
                <li>Reason for the refund request</li>
                <li>Any supporting documentation (if applicable)</li>
              </ul>
            </li>
            <li>We will review your request and respond within 5-7 business days</li>
          </ol>

          <h3>4.2 Evaluation Process</h3>
          <p>
            All refund requests will be evaluated on a case-by-case basis. We reserve the right to
            request additional information or documentation to verify your claim.
          </p>
        </section>

        <section>
          <h2>5. Refund Timeline</h2>
          <p>
            If your refund request is approved:
          </p>
          <ul>
            <li>We will initiate the refund within 5-7 business days of approval</li>
            <li>The refund will be processed through PhonePe Payment Gateway to your original payment method</li>
            <li>It may take 7-10 business days for the refund to reflect in your account, depending on your bank or payment provider</li>
            <li>You will receive an email confirmation once the refund has been processed</li>
          </ul>
        </section>

        <section>
          <h2>6. Payment Gateway Policies</h2>
          <p>
            Refunds are subject to PhonePe Payment Gateway's terms and policies. Some payment methods
            may have specific refund procedures or timelines that are beyond our control.
          </p>
        </section>

        <section>
          <h2>7. Chargebacks</h2>
          <p>
            If you file a chargeback or dispute with your bank or credit card company instead of
            contacting us directly, we may be unable to assist with resolving the issue. We encourage
            you to contact us first before initiating a chargeback.
          </p>
          <p>
            Fraudulent or unjustified chargebacks may result in the suspension of your account and
            may be reported to appropriate authorities.
          </p>
        </section>

        <section>
          <h2>8. Non-Refundable Items</h2>
          <p>The following are generally non-refundable:</p>
          <ul>
            <li>Voluntary donations that were successfully processed</li>
            <li>Payments made after receiving full access to services</li>
            <li>Transaction fees charged by payment processors</li>
          </ul>
        </section>

        <section>
          <h2>9. Partial Refunds</h2>
          <p>
            In certain circumstances, we may offer partial refunds at our discretion. This decision
            will be made on a case-by-case basis considering the specific circumstances of the request.
          </p>
        </section>

        <section>
          <h2>10. Currency and Exchange Rates</h2>
          <p>
            All transactions are processed in Indian Rupees (INR). If you made a payment in a different
            currency, refunds will be processed in the same currency. Exchange rate fluctuations between
            the time of payment and refund are not our responsibility.
          </p>
        </section>

        <section>
          <h2>11. Contact for Refund Queries</h2>
          <p>
            For any questions or concerns regarding refunds, please contact us:
          </p>
          <p>
            <strong>The NoBias Media</strong><br />
            75-76, West Guru Angad Nagar<br />
            Near Nirman Vihar Metro Station<br />
            Delhi - 110092, India<br />
            <br />
            Email: contact@thenobiasmedia.com<br />
            Subject Line: Refund Request - [Transaction ID]<br />
            Website: https://thenobiasmedia.com
          </p>
          <p>
            Our customer support team is available during business hours and will respond to your
            inquiry within 24-48 hours.
          </p>
        </section>

        <section>
          <h2>12. Changes to This Policy</h2>
          <p>
            We reserve the right to modify this Refund Policy at any time. Changes will be effective
            immediately upon posting on this page with an updated "Last Updated" date. Your continued
            use of our services after changes constitutes acceptance of the updated policy.
          </p>
        </section>

        <section>
          <h2>13. Governing Law</h2>
          <p>
            This Refund Policy is governed by the laws of India. Any disputes arising from refund
            requests shall be subject to the exclusive jurisdiction of the courts in India.
          </p>
        </section>
      </div>
    </div>
  );
};

export default RefundPolicy;
