import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <h3>The NoBias Media</h3>
          <p>Delivering unbiased news and analysis from around the world.</p>
        </div>
        
        <div className="footer-section">
          <h3>Quick Links</h3>
          <ul>
            <li><Link to="/about">About Us</Link></li>
            <li><Link to="/contact">Contact Us</Link></li>
          </ul>
        </div>
        
        <div className="footer-section">
          <h3>Contact Info</h3>
          <address>
            <p>Rajib Gandhi Infotech Park,Hinjewadi Phase 1,Pune, Maharashtra, India, PIN: 411057</p>
            <p>Email: manisankar@thenobiasmedia.com</p>
          </address>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} The NoBiasMedia. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer; 
