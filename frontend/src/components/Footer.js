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
          <h3>Legal</h3>
          <ul>
            <li><Link to="/privacy-policy">Privacy Policy</Link></li>
            <li><Link to="/terms-conditions">Terms and Conditions</Link></li>
          </ul>
        </div>
        
        <div className="footer-section">
          <h3>Quick Links</h3>
          <ul>
            <li><Link to="/about">About Us</Link></li>
            <li><Link to="/contact">Contact Us</Link></li>
            <li><Link to="/media-bias-details">Media Bias Details</Link></li>
          </ul>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>
          &copy; {new Date().getFullYear()} The NoBiasMedia. All rights reserved. 
          Developed by{' '}
          <a 
            href="https://www.teroment.com" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ color: '#ffffff', textDecoration: 'underline', fontWeight: 'bold' }}
          >
            Teroment Solutions
          </a>
        </p>
      </div>
    </footer>
  );
};

export default Footer; 
