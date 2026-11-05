import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import FAQ from './FAQ';
import faqs from '../data/faqs.json';

test('all supplied FAQ topics and answers are available without JavaScript interaction', () => {
  const { container } = render(<FAQ />);
  expect(screen.getByRole('heading', { name: 'Frequently Asked Questions' })).toBeInTheDocument();
  expect(container.querySelectorAll('details')).toHaveLength(15);
  faqs.forEach(faq => {
    expect(screen.getByText(faq.question).tagName).toBe('SUMMARY');
    expect(screen.getByText(faq.answer)).toBeInTheDocument();
  });
  expect(screen.getByRole('link', {name:'Contact Us'})).toHaveAttribute('href', '/contact');
  expect(screen.getByRole('navigation', {name:'Help and documentation'})).toBeInTheDocument();
});
