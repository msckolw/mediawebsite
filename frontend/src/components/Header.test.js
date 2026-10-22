import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Header from './Header';
jest.mock('../context/SessionContext', () => ({ useSession: () => ({ user: null, loading: false }) }));
jest.mock('../hooks/gHook', () => ({ useGoogleHook: () => jest.fn() }));
beforeEach(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
});
test('navigation closes on route selection and restores scrolling and trigger focus', async () => {
  render(<MemoryRouter><Header /></MemoryRouter>);
  const trigger = screen.getByRole('button', { name: 'Open navigation' });
  fireEvent.click(trigger);
  expect(trigger.getAttribute('aria-expanded')).toBe('true');
  expect(document.body.style.overflow).toBe('hidden');
  const dialog = screen.getByRole('dialog');
  fireEvent.click(dialog.querySelector('a[href="/category/business"]'));
  await waitFor(() => expect(trigger.getAttribute('aria-expanded')).toBe('false'));
  expect(document.body.style.overflow).toBe('');
  expect(document.activeElement).toBe(trigger);
});
test('canceling navigation restores page scrolling', () => {
  render(<MemoryRouter><Header /></MemoryRouter>);
  fireEvent.click(screen.getByRole('button', { name: 'Open navigation' }));
  fireEvent(screen.getByRole('dialog'), new Event('cancel', { bubbles: false }));
  expect(document.body.style.overflow).toBe('');
  expect(screen.getByRole('button', { name: 'Open navigation' }).getAttribute('aria-expanded')).toBe('false');
});
