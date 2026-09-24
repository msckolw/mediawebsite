import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DonateStatus from './DonateStatus';
import { getPaymentStatus, verifyPayment } from '../services/api';

jest.mock('../services/api', () => ({
  getPaymentStatus: jest.fn(),
  verifyPayment: jest.fn()
}));

test('does not trust a success URL status when both server checks fail', async () => {
  verifyPayment.mockRejectedValue(new Error('verification unavailable'));
  getPaymentStatus.mockRejectedValue(new Error('status unavailable'));

  render(
    <MemoryRouter initialEntries={['/donate/status?txnid=txn-123&status=success']}>
      <DonateStatus />
    </MemoryRouter>
  );

  expect(await screen.findByRole('heading', { name: 'Unable to Verify Payment' })).not.toBeNull();
  expect(screen.queryByText(/donation was successful/i)).toBeNull();
  expect(screen.queryByRole('link', { name: /donate again|try again|make another donation/i })).toBeNull();
});

test('pending payment offers only a home link and warns against another payment', async () => {
  verifyPayment.mockResolvedValue({ status: 'pending' });

  render(
    <MemoryRouter initialEntries={['/donate/status?txnid=txn-123']}>
      <DonateStatus />
    </MemoryRouter>
  );

  expect(await screen.findByRole('heading', { name: 'Payment Pending' })).not.toBeNull();
  expect(screen.getByText(/please do not make another payment/i)).not.toBeNull();
  expect(screen.getByRole('link', { name: 'Go Home' }).getAttribute('href')).toBe('/');
  expect(screen.queryByRole('link', { name: /make another donation|try again/i })).toBeNull();
});
