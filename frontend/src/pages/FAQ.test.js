import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import FAQ from './FAQ';

describe('FAQ Component', () => {
  const renderFAQ = () => {
    return render(
      <BrowserRouter>
        <FAQ />
      </BrowserRouter>
    );
  };

  test('renders FAQ header', () => {
    renderFAQ();
    expect(screen.getByText('Frequently Asked Questions')).toBeInTheDocument();
    expect(screen.getByText(/Find answers to common questions/i)).toBeInTheDocument();
  });

  test('renders all FAQ items', () => {
    renderFAQ();
    expect(screen.getByText('What is The NoBias Media?')).toBeInTheDocument();
    expect(screen.getByText(/How does The NoBias Media ensure unbiased reporting/i)).toBeInTheDocument();
    expect(screen.getByText('What categories of news do you cover?')).toBeInTheDocument();
  });

  test('FAQ items are collapsed by default', () => {
    renderFAQ();
    const answers = screen.queryAllByText(/independent news platform/i);
    expect(answers.length).toBe(0);
  });

  test('clicking FAQ question expands the answer', () => {
    renderFAQ();
    const question = screen.getByText('What is The NoBias Media?');
    fireEvent.click(question);
    
    expect(screen.getByText(/independent news platform committed to delivering unbiased/i)).toBeInTheDocument();
  });

  test('clicking expanded FAQ question collapses it', () => {
    renderFAQ();
    const question = screen.getByText('What is The NoBias Media?');
    
    // Expand
    fireEvent.click(question);
    expect(screen.getByText(/independent news platform committed to delivering unbiased/i)).toBeInTheDocument();
    
    // Collapse
    fireEvent.click(question);
    const answers = screen.queryAllByText(/independent news platform committed to delivering unbiased/i);
    expect(answers.length).toBe(0);
  });

  test('only one FAQ can be open at a time', () => {
    renderFAQ();
    
    // Open first FAQ
    const firstQuestion = screen.getByText('What is The NoBias Media?');
    fireEvent.click(firstQuestion);
    expect(screen.getByText(/independent news platform/i)).toBeInTheDocument();
    
    // Open second FAQ
    const secondQuestion = screen.getByText(/How does The NoBias Media ensure unbiased reporting/i);
    fireEvent.click(secondQuestion);
    expect(screen.getByText(/multiple verification methods/i)).toBeInTheDocument();
    
    // First FAQ should now be closed
    const firstAnswers = screen.queryAllByText(/independent news platform/i);
    expect(firstAnswers.length).toBe(0);
  });

  test('renders contact section at bottom', () => {
    renderFAQ();
    expect(screen.getByText('Still have questions?')).toBeInTheDocument();
    expect(screen.getByText(/Can't find the answer/i)).toBeInTheDocument();
  });

  test('contact button links to contact page', () => {
    renderFAQ();
    const contactButton = screen.getByText('Contact Us');
    expect(contactButton).toHaveAttribute('href', '/contact');
  });

  test('FAQ items have proper ARIA attributes', () => {
    renderFAQ();
    const firstQuestion = screen.getByText('What is The NoBias Media?').closest('button');
    expect(firstQuestion).toHaveAttribute('aria-expanded', 'false');
    
    fireEvent.click(firstQuestion);
    expect(firstQuestion).toHaveAttribute('aria-expanded', 'true');
  });
});
