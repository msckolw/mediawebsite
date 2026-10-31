import { useSession } from '../context/SessionContext';
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import '../styles/Login.css';
import Swal from 'sweetalert2'
import {login} from '../services/api'

const Login = () => {
  const navigate = useNavigate();
  const { user, loading: sessionLoading, refreshSession } = useSession();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  let [param] = useSearchParams();

  useEffect(() => {
    if (!sessionLoading && user) navigate(user.role === 'admin' ? '/admin' : '/');
    window.scrollTo({
      top: 0,
      behavior: "smooth", // Adds a nice scroll animation
    });
  }, [navigate, user, sessionLoading]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await login(formData);
      if (!await refreshSession()) throw new Error("Could not establish your session. Please allow sign-in cookies.");
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Login Success!",
        showConfirmButton: false,
        timer: 4000,
      });
      localStorage.setItem('token', response.token);
      localStorage.setItem('user_role', response.user.role);
      localStorage.setItem('user_name', response.user.name);
      let redirectURL = param.get('ru');
      if(redirectURL && redirectURL.startsWith('/') && !redirectURL.startsWith('//')) {
        //window.location.href=redirectURL;
        navigate(redirectURL)
      }
      else {
        navigate('/admin'); // Redirect to admin panel after successful login
      }
    } catch (error) {
      setError(error.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <h2>Admin</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-groupL">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-groupL">
            <label htmlFor="password">Password</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading} className='login-button'>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login; 
