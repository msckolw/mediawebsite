import React from 'react';
import faqs from '../data/faqs';
import '../styles/FAQ.css';

export default function FAQ() {
  return <div className="faq-container">
    <header className="faq-header"><h1>Frequently Asked Questions</h1><p>Find answers to common questions about our coverage, mission, sources, and ways to get in touch.</p></header>
    <div className="faq-list">{faqs.map(faq => <details className="faq-item" key={faq.question}>
      <summary className="faq-question">{faq.question}</summary>
      <div className="faq-answer"><p>{faq.answer}</p></div>
    </details>)}</div>
    <nav className="faq-resources" aria-label="Help and documentation"><h2>Help and documentation</h2>
      <a href="/about">About the publication</a><a href="/media-bias-details">Media bias and source guide</a><a href="/privacy-policy">Privacy Policy</a><a href="/terms-conditions">Terms and Conditions</a>
    </nav>
    <section className="faq-footer"><h2>Still have questions?</h2><p>Can't find the answer you're looking for? Contact our team.</p><a href="/contact" className="contact-btn">Contact Us</a></section>
  </div>;
}
