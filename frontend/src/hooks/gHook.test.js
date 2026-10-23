import { renderHook, act } from '@testing-library/react';
import { useGoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { loginOAuth } from '../services/api';
import { useGoogleHook } from './gHook';
jest.mock('@react-oauth/google', () => ({ useGoogleLogin: jest.fn() }));
jest.mock('react-router-dom', () => ({ useNavigate: jest.fn() }));
jest.mock('../context/SessionContext', () => ({ useSession: jest.fn() }));
jest.mock('../services/api', () => ({ loginOAuth: jest.fn() }));
jest.mock('sweetalert2', () => ({ __esModule: true, default: { fire: jest.fn() } }));

let callbacks;
let navigate;
let refreshSession;
beforeEach(() => {
  localStorage.clear();
  navigate = jest.fn();
  refreshSession = jest.fn().mockResolvedValue({ name: 'Reader' });
  useNavigate.mockReturnValue(navigate);
  useSession.mockReturnValue({ refreshSession });
  useGoogleLogin.mockImplementation(options => { callbacks = options; return jest.fn(); });
  loginOAuth.mockReset().mockResolvedValue({ token: 'Active', user: { name: 'Reader', role: 'user' } });
});

test('sign-in verifies once through the backend and navigates without a page reload', async () => {
  renderHook(() => useGoogleHook('/'));
  await act(async () => callbacks.onSuccess({ access_token: 'fake-google-token' }));
  expect(loginOAuth).toHaveBeenCalledWith({ accessToken: 'fake-google-token' });
  expect(loginOAuth).toHaveBeenCalledTimes(1);
  expect(refreshSession).toHaveBeenCalledTimes(1);
  expect(navigate).toHaveBeenCalledWith('/', { replace: true });
  expect(localStorage.getItem('user_name')).toBe('Reader');
});

test('does not claim sign-in when the session cookie could not be established', async () => {
  refreshSession.mockResolvedValue(null);
  renderHook(() => useGoogleHook('/'));
  await act(async () => callbacks.onSuccess({ access_token: 'fake-google-token' }));
  expect(navigate).not.toHaveBeenCalled();
  expect(localStorage.getItem('token')).toBeNull();
});
