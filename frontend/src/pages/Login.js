import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Login.css';
import Swal from 'sweetalert2'
import {login} from '../services/api'

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    //setIsAdmin(localStorage.getItem('user_role')=='admin' ? true : false);
    const admin = localStorage.getItem('user_role')=='admin' ? true : false;
    if (token) {
      if(admin)
        navigate('/admin');
      else 
        navigate('/');
    }
    window.scrollTo({
      top: 0,
      behavior: "smooth", // Adds a nice scroll animation
    });
  }, []);

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
      navigate('/admin'); // Redirect to admin panel after successful login
    } catch (error) {
      setError(error.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <h2>Admin Login</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
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
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
            />
          </div>
          <button type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login; 
