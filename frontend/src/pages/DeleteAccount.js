import React from 'react';
import '../styles/LegalPages.css';

const DeleteAccount = () => {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <h1>Account Deletion</h1>
        <p className="last-updated">Last Updated: January 2026</p>

        <section>
          <h2>Your Right to Delete Your Account</h2>
          <p>
            At The NoBias Media, we respect your privacy and your right to control your personal data.
            You have the right to request deletion of your account and associated personal data at any time.
            This page explains how to request account deletion and what happens to your data when you do.
          </p>
        </section>

        <section>
          <h2>What Data Will Be Deleted</h2>
          <p>When you request account deletion, the following information will be permanently removed from our systems:</p>
          <ul>
            <li><strong>Account Information:</strong> Your username, email address, and login credentials</li>
            <li><strong>Profile Data:</strong> Any profile information you have provided</li>
            <li><strong>User Preferences:</strong> Saved settings, bookmarks, and personalized content preferences</li>
            <li><strong>Activity History:</strong> Your reading history, article interactions, and usage patterns</li>
            <li><strong>Authentication Data:</strong> OAuth tokens and session information</li>
            <li><strong>Communication Records:</strong> Email correspondence related to your account (subject to legal retention requirements)</li>
          </ul>
        </section>

        <section>
          <h2>What Data May Be Retained</h2>
          <p>In certain limited circumstances, some data may be retained as required by law or for legitimate business purposes:</p>
          <ul>
            <li><strong>Transaction Records:</strong> Payment and donation records (required for tax and accounting purposes for 7 years)</li>
            <li><strong>Legal Compliance:</strong> Information required to comply with legal obligations, resolve disputes, or enforce agreements</li>
            <li><strong>Security Logs:</strong> Anonymous system logs retained for security and fraud prevention (30-90 days)</li>
            <li><strong>Aggregated Analytics:</strong> De-identified, aggregated data that cannot be linked back to you personally</li>
          </ul>
          <p>
            Any retained data will be stored securely and in compliance with applicable data protection laws.
            Retained data cannot be used to identify you personally or reconstruct your account.
          </p>
        </section>

        <section>
          <h2>How to Request Account Deletion</h2>
          
          <h3>Option 1: Email Request (Recommended)</h3>
          <p>Send an email to our support team with your deletion request:</p>
          <div style={{ 
            backgroundColor: '#f0f8ff', 
            padding: '20px', 
            borderRadius: '8px', 
            border: '2px solid #007bff',
            marginBottom: '20px'
          }}>
            <p style={{ margin: 0, fontSize: '1.1rem' }}>
              <strong>Email To:</strong> <a href="mailto:contact@thenobiasmedia.com?subject=Account Deletion Request">contact@thenobiasmedia.com</a><br />
              <strong>Subject:</strong> Account Deletion Request<br />
            </p>
          </div>

          <h3>Required Information</h3>
          <p>To process your account deletion request, please include the following in your email:</p>
          <ol>
            <li><strong>Email Address:</strong> The email address associated with your account</li>
            <li><strong>Account Username:</strong> Your username (if applicable)</li>
            <li><strong>Confirmation Statement:</strong> A clear statement that you want to delete your account</li>
            <li><strong>Identity Verification:</strong> For security purposes, we may ask you to verify your identity by:
              <ul>
                <li>Logging into your account and sending the request from the registered email</li>
                <li>Providing answers to security questions (if set up)</li>
                <li>Confirming recent account activity</li>
              </ul>
            </li>
          </ol>

          <h3>Option 2: Mobile App (If Applicable)</h3>
          <p>
            If you are using The NoBias Media mobile app:
          </p>
          <ol>
            <li>Open the app and log in to your account</li>
            <li>Go to <strong>Settings</strong> → <strong>Account</strong></li>
            <li>Scroll down and tap <strong>"Delete Account"</strong></li>
            <li>Confirm your decision when prompted</li>
            <li>Follow the in-app instructions</li>
          </ol>
          <p><em>Note: The mobile app deletion feature may redirect you to email for final confirmation.</em></p>
        </section>

        <section>
          <h2>Account Deletion Timeline</h2>
          
          <h3>Immediate Actions (Within 24 Hours)</h3>
          <ul>
            <li>Your account will be deactivated immediately upon request approval</li>
            <li>You will no longer be able to log in</li>
            <li>Your profile will be hidden from public view</li>
            <li>You will receive a confirmation email acknowledging your request</li>
          </ul>

          <h3>Deletion Process (30 Days)</h3>
          <p>
            To protect against accidental deletions and allow for recovery, we implement a 30-day grace period:
          </p>
          <ul>
            <li><strong>Days 1-30:</strong> Your account is deactivated but data is retained
              <ul>
                <li>You cannot log in or access your account</li>
                <li>You can request account recovery by contacting us within this period</li>
              </ul>
            </li>
            <li><strong>After 30 Days:</strong> Permanent deletion begins
              <ul>
                <li>All personal data is permanently deleted from our active systems</li>
                <li>Backups are purged within 90 days from backup systems</li>
                <li>Recovery is no longer possible</li>
              </ul>
            </li>
          </ul>

          <h3>Final Confirmation</h3>
          <p>
            After the deletion process is complete, you will receive a final confirmation email
            confirming that your data has been permanently deleted. This email serves as proof of
            deletion for your records.
          </p>
        </section>

        <section>
          <h2>Requesting Data Before Deletion</h2>
          <p>
            Before deleting your account, you may request a copy of your data. We will provide you
            with an export of your personal information in a machine-readable format (typically JSON or CSV).
          </p>
          <p>To request your data:</p>
          <ol>
            <li>Email us at <a href="mailto:contact@thenobiasmedia.com?subject=Data Export Request">contact@thenobiasmedia.com</a></li>
            <li>Subject line: "Data Export Request"</li>
            <li>Include your account email address</li>
            <li>We will provide your data within 30 days</li>
          </ol>
          <p>
            You can then proceed with account deletion after receiving your data export.
          </p>
        </section>

        <section>
          <h2>Special Considerations for Mobile App Users</h2>
          
          <h3>Google Play Store Users (Android)</h3>
          <p>
            As per Google Play Store requirements, account deletion must be easily accessible.
            Android app users can delete their accounts by:
          </p>
          <ul>
            <li>Using the in-app deletion option (Settings → Account → Delete Account)</li>
            <li>Visiting this webpage: https://thenobiasmedia.com/delete-account</li>
            <li>Emailing contact@thenobiasmedia.com</li>
          </ul>

          <h3>Apple App Store Users (iOS)</h3>
          <p>
            As per Apple App Store requirements, account deletion must be available within the app.
            iOS app users can delete their accounts by:
          </p>
          <ul>
            <li>Using the in-app deletion option (Settings → Account → Delete Account)</li>
            <li>Visiting this webpage: https://thenobiasmedia.com/delete-account</li>
            <li>Emailing contact@thenobiasmedia.com</li>
          </ul>
        </section>

        <section>
          <h2>What Happens After Deletion</h2>
          
          <h3>Immediate Effects</h3>
          <ul>
            <li>You will be logged out of all devices and sessions</li>
            <li>Your bookmarks and saved articles will be removed</li>
            <li>You will stop receiving emails from us (except the deletion confirmation)</li>
            <li>Your comments or contributions (if any) may be anonymized or removed</li>
          </ul>

          <h3>Third-Party Services</h3>
          <p>
            If you logged in using Google OAuth or other third-party authentication:
          </p>
          <ul>
            <li>The connection between your account and the third-party service will be severed</li>
            <li>Your data with the third-party provider (Google, etc.) remains under their control</li>
            <li>You may need to revoke permissions separately through Google Account Settings</li>
          </ul>

          <h3>Creating a New Account</h3>
          <p>
            After deletion is complete, you are free to create a new account using the same email
            address. However, this will be treated as a completely new account with no connection
            to your previous data.
          </p>
        </section>

        <section>
          <h2>Canceling a Deletion Request</h2>
          <p>
            If you change your mind within the 30-day grace period, you can cancel the deletion:
          </p>
          <ol>
            <li>Email us at <a href="mailto:contact@thenobiasmedia.com?subject=Cancel Account Deletion">contact@thenobiasmedia.com</a></li>
            <li>Subject: "Cancel Account Deletion"</li>
            <li>Include your account email address</li>
            <li>Verify your identity when requested</li>
            <li>Your account will be reactivated within 24-48 hours</li>
          </ol>
          <p>
            <strong>Important:</strong> Once the 30-day period has passed and permanent deletion has begun,
            recovery is not possible.
          </p>
        </section>

        <section>
          <h2>Children's Accounts</h2>
          <p>
            Our service is not intended for children under 13 years of age. If you believe a child's
            account exists on our platform, please contact us immediately at contact@thenobiasmedia.com,
            and we will delete it promptly without the 30-day waiting period.
          </p>
        </section>

        <section>
          <h2>Questions About Account Deletion</h2>
          <p>
            If you have questions about the account deletion process, data retention, or any other
            privacy-related concerns, please contact us:
          </p>
          <p>
            <strong>The NoBias Media</strong><br />
            75-76, West Guru Angad Nagar<br />
            Near Nirman Vihar Metro Station<br />
            Delhi - 110092, India<br />
            <br />
            Email: <a href="mailto:contact@thenobiasmedia.com">contact@thenobiasmedia.com</a><br />
            Subject Line: Account Deletion Inquiry<br />
            Website: https://thenobiasmedia.com
          </p>
          <p>
            We typically respond to all inquiries within 24-48 hours during business days.
          </p>
        </section>

        <section>
          <h2>Legal Rights</h2>
          <p>
            Your right to delete your account and personal data is protected under various data
            protection regulations, including:
          </p>
          <ul>
            <li><strong>GDPR (General Data Protection Regulation):</strong> Right to erasure ("right to be forgotten")</li>
            <li><strong>CCPA (California Consumer Privacy Act):</strong> Right to delete personal information</li>
            <li><strong>India's Digital Personal Data Protection Act:</strong> Right to data erasure</li>
          </ul>
          <p>
            We are committed to honoring these rights regardless of your location.
          </p>
        </section>

        <section>
          <h2>Updates to This Policy</h2>
          <p>
            We may update this Account Deletion policy from time to time to reflect changes in our
            practices or legal requirements. Any changes will be posted on this page with an updated
            "Last Updated" date. We encourage you to review this page periodically.
          </p>
        </section>

        <div style={{
          backgroundColor: '#fff3cd',
          border: '2px solid #ffc107',
          borderRadius: '8px',
          padding: '20px',
          marginTop: '40px'
        }}>
          <h3 style={{ marginTop: 0, color: '#856404' }}>⚠️ Important Notice</h3>
          <p style={{ marginBottom: 0 }}>
            Account deletion is permanent and cannot be undone after the 30-day grace period.
            Please ensure you have exported any data you wish to keep before requesting deletion.
            If you're experiencing issues with your account, consider contacting our support team
            first to see if we can help resolve your concerns without deleting your account.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DeleteAccount;
