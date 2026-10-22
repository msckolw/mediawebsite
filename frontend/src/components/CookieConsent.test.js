import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import CookieConsent from './CookieConsent';

beforeEach(() => {
  localStorage.clear();
  document.getElementById('optional-google-analytics')?.remove();
  delete window.gtag;
  delete window.dataLayer;
});

test('legacy auto-acceptance does not enable analytics or dismiss the new banner', () => {
  jest.useFakeTimers();
  localStorage.setItem('cookieConsent', 'accepted');
  render(<CookieConsent />);
  act(() => jest.advanceTimersByTime(5000));
  expect(screen.getByRole('button', { name: 'Accept' })).toBeTruthy();
  expect(document.getElementById('optional-google-analytics')).toBeNull();
  expect(localStorage.getItem('cookieConsentV2')).toBeNull();
  jest.useRealTimers();
});

test('only explicit acceptance loads analytics; preferences allow withdrawal', () => {
  render(<CookieConsent />);
  expect(document.getElementById('optional-google-analytics')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Accept' }));
  expect(document.getElementById('optional-google-analytics')).not.toBeNull();
  expect(localStorage.getItem('cookieConsentV2')).toBe('accepted');
  fireEvent.click(screen.getByRole('button', { name: 'Cookie settings' }));
  fireEvent.click(screen.getByRole('button', { name: 'Decline' }));
  expect(document.getElementById('optional-google-analytics')).toBeNull();
  expect(window['ga-disable-G-YB38R4X9EK']).toBe(true);
  expect(localStorage.getItem('cookieConsentV2')).toBe('declined');
});

test('declined consent persists without loading analytics on the next visit', () => {
  localStorage.setItem('cookieConsentV2', 'declined');
  render(<CookieConsent />);
  expect(screen.queryByRole('button', { name: 'Accept' })).toBeNull();
  expect(document.getElementById('optional-google-analytics')).toBeNull();
});
