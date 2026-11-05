import React, { useState } from 'react';
import '../styles/FAQ.css';

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: "What is The NoBias Media?",
      answer: "The NoBias Media is an independent news platform committed to delivering unbiased, fact-based journalism. We cover Politics, Business, World News, Legal affairs, and Miscellaneous topics with comprehensive source verification and transparent reporting."
    },
    {
      question: "How does The NoBias Media ensure unbiased reporting?",
      answer: "We employ multiple verification methods: cross-referencing multiple reputable sources, clearly citing all sources with direct links, separating facts from opinions, and maintaining editorial independence from political or corporate influence. Each article includes transparent source attribution."
    },
    {
      question: "What categories of news do you cover?",
      answer: "We cover five main categories: Politics (government, elections, policy), Business (economy, markets, corporate news), World News (international affairs, global events), Legal (court cases, law changes, justice), and Miscellaneous (culture, technology, society, environment)."
    },
    {
      question: "How can I support The NoBias Media?",
      answer: "You can support us through our Support page by making a donation. Your contributions help us maintain editorial independence, invest in quality journalism, and keep our content freely accessible to everyone. We also accept sponsorships that align with our editorial values."
    },
    {
      question: "How often is content updated?",
      answer: "We publish breaking news as it happens and update our homepage regularly throughout the day. Major stories are updated with new developments as they emerge. You can check our homepage or subscribe to notifications for real-time updates."
    },
    {
      question: "Can I submit a news tip or story idea?",
      answer: "Yes! We welcome news tips and story suggestions from our readers. Please use our Contact Us page to submit tips, providing as much detail and supporting information as possible. We review all submissions and follow up on credible leads."
    },
    {
      question: "How do you verify your sources?",
      answer: "Every article includes clearly cited sources with direct links. We verify information through: multiple independent sources, official documents and statements, expert interviews and fact-checking, and cross-referencing with established news organizations. We never publish unverified claims."
    },
    {
      question: "Do you have a mobile app?",
      answer: "Yes, we have a mobile app available for both Android and iOS devices. The app provides the same unbiased news coverage with a mobile-optimized experience, push notifications for breaking news, and offline reading capability."
    },
    {
      question: "How can I contact the editorial team?",
      answer: "You can reach our editorial team through the Contact Us page. For general inquiries, use the contact form. For urgent news tips or press inquiries, our contact information is provided on the contact page. We aim to respond within 24-48 hours."
    },
    {
      question: "What is your privacy policy?",
      answer: "We respect your privacy and are committed to protecting your personal data. We collect minimal information necessary for site functionality, never sell your data to third parties, use cookies only for essential site features, and comply with data protection regulations. Visit our Privacy Policy page for full details."
    },
    {
      question: "How do I report a factual error?",
      answer: "We take accuracy seriously. If you spot a factual error, please contact us immediately through our Contact Us page with: the article URL, specific error description, and supporting evidence/sources. We review all error reports promptly and issue corrections when necessary."
    },
    {
      question: "Can I republish or share your content?",
      answer: "You're welcome to share links to our articles on social media or your website. For content republication, syndication, or commercial use, please contact us through the Contact Us page to discuss licensing terms. Attribution is always required."
    }
  ];

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="faq-container">
      <div className="faq-header">
        <h1>Frequently Asked Questions</h1>
        <p>Find answers to common questions about The NoBias Media</p>
      </div>

      <div className="faq-list">
        {faqs.map((faq, index) => (
          <div 
            key={index} 
            className={`faq-item ${openIndex === index ? 'active' : ''}`}
          >
            <button 
              className="faq-question"
              onClick={() => toggleFAQ(index)}
              aria-expanded={openIndex === index}
            >
              <span>{faq.question}</span>
              <svg 
                className="faq-icon" 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            <div className="faq-answer">
              <p>{faq.answer}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="faq-footer">
        <h3>Still have questions?</h3>
        <p>Can't find the answer you're looking for? Please contact our support team.</p>
        <a href="/contact" className="contact-btn">Contact Us</a>
      </div>
    </div>
  );
};

export default FAQ;
