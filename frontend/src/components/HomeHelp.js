import React from 'react';
import faqs from '../data/faqs';
import '../styles/FAQ.css';

export default function HomeHelp() {
  return <section className="nb-home-help" aria-labelledby="home-faq-title">
    <h2 id="home-faq-title">Frequently Asked Questions</h2>
    {faqs.filter((_, index) => [0, 5, 8].includes(index)).map(faq => <div key={faq.question}><h3>{faq.question}</h3><p>{faq.answer}</p></div>)}
    <a href="/faq">Read all frequently asked questions →</a>
    <nav className="faq-resources" aria-label="Help and documentation"><h2>Help and documentation</h2>
      <a href="/faq">FAQ and reader help</a><a href="/media-bias-details">Media bias and source guide</a><a href="/about">How The NoBias Media works</a><a href="/contact">Contact support or report an error</a>
    </nav>
  </section>;
}
