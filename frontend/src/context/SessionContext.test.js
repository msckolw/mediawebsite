import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { SessionProvider, useSession } from './SessionContext';
import { getSession, logoutSession } from '../services/api';
jest.mock('../services/api', () => ({ getSession: jest.fn(), logoutSession: jest.fn() }));
const wrapper = ({ children }) => <SessionProvider>{children}</SessionProvider>;
beforeEach(() => { jest.clearAllMocks(); localStorage.clear(); });

test('local storage cannot confer an administrator session', async () => {
  localStorage.setItem('user_role', 'admin');
  localStorage.setItem('token', 'Active');
  getSession.mockRejectedValue(new Error('Unauthorized'));
  const { result } = renderHook(() => useSession(), { wrapper });
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.user).toBeNull();
});

test('logout clears UI state only after the server successfully clears the cookie', async () => {
  getSession.mockResolvedValue({ user: { role: 'user', email: 'reader@test.com' } });
  const { result } = renderHook(() => useSession(), { wrapper });
  await waitFor(() => expect(result.current.user).not.toBeNull());
  logoutSession.mockRejectedValueOnce(new Error('Offline'));
  await act(async () => { await expect(result.current.logout()).rejects.toThrow('Offline'); });
  expect(result.current.user).not.toBeNull();
  logoutSession.mockResolvedValueOnce({});
  await act(async () => result.current.logout());
  expect(result.current.user).toBeNull();
});
