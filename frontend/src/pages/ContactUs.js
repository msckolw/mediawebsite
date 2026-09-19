import React from 'react';

const ContactUs = () => {
  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', lineHeight: '1.6' }}>
      <h1>Contact Us</h1>
      
      <h2>Get in Touch</h2>
      <p>We'd love to hear from you! Whether you have questions, feedback, or news tips, don't hesitate to reach out.</p>
      
      <div style={{ backgroundColor: '#f8f9fa', padding: '2rem', borderRadius: '8px', margin: '2rem 0' }}>
        <h3>Contact Information</h3>
        
        <div style={{ marginBottom: '1.5rem' }}>
          <h4>Company Details</h4>
          <p>
            <strong>The NoBias Media (7001414991)</strong>
          </p>
        </div>
        
        <div style={{ marginBottom: '1.5rem' }}>
          <h4>Registered Office</h4>
          <p>
            T-263, Duria, West Midnapore,<br />
            West Bengal, Pin- 721467
          </p>
        </div>
        
        <div style={{ marginBottom: '1.5rem' }}>
          <h4>Office Address</h4>
          <p>
            75-76, West Guru Angad Nagar, Laxmi Nagar,<br />
            Near Nirman Vihar Metro Station,<br />
            Delhi - 110092, India
          </p>
        </div>
        
        <div style={{ marginBottom: '1.5rem' }}>
          <h4>Phone</h4>
          <p>
            <a href="tel:+917001414991" style={{ color: '#1e3c72', textDecoration: 'none' }}>
              +91-7001414991
            </a>
          </p>
        </div>
        
        <div style={{ marginBottom: '1.5rem' }}>
          <h4>Email</h4>
          <p>
            <a href="mailto:contact@thenobiasmedia.com" style={{ color: '#1e3c72', textDecoration: 'none' }}>
              contact@thenobiasmedia.com
            </a>
          </p>
        </div>
      </div>
      
      <h2>What You Can Contact Us About</h2>
      <ul>
        <li><strong>News Tips:</strong> Have a story idea or breaking news tip?</li>
        <li><strong>Feedback:</strong> Share your thoughts on our coverage</li>
        <li><strong>Corrections:</strong> Notice an error in our reporting?</li>
        <li><strong>General Inquiries:</strong> Any questions about our services</li>
        <li><strong>Partnership Opportunities:</strong> Interested in collaborating?</li>
        <li><strong>Technical Issues:</strong> Experiencing problems with our website?</li>
      </ul>
      
      <h2>Response Time</h2>
      <p>We strive to respond to all inquiries within 24-48 hours during business days. For urgent news tips or time-sensitive matters, please indicate this in your subject line.</p>
      
      <h2>Media Inquiries</h2>
      <p>For press inquiries or interview requests, please use the email address above and include "Media Inquiry" in the subject line.</p>
    </div>
  );
};

export default ContactUs;