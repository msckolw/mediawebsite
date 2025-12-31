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

        <div className="footer-section">
          <h3>Follow Us</h3>
          <div className="social-icons" style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <a href="https://www.linkedin.com/company/110920348/admin/dashboard/" target="_blank" rel="noopener noreferrer" 
               style={{ color: '#fff', fontSize: '1.5rem', opacity: '0.9' }}>
              <i className="fab fa-linkedin"></i>
            </a>
            <a href="https://x.com/TheNoBiasMedia" target="_blank" rel="noopener noreferrer" 
               style={{ color: '#fff', fontSize: '1.5rem', opacity: '0.9', fontWeight: 'bold', textDecoration: 'none' }}>
              𝕏
            </a>
            <a href="https://www.facebook.com/people/The-NoBias-Media/61585968146610/" target="_blank" rel="noopener noreferrer" 
               style={{ color: '#fff', fontSize: '1.5rem', opacity: '0.9' }}>
              <i className="fab fa-facebook"></i>
            </a>
            <a href="https://www.instagram.com/nobias_media/" target="_blank" rel="noopener noreferrer" 
               style={{ color: '#fff', fontSize: '1.5rem', opacity: '0.9' }}>
              <i className="fab fa-instagram"></i>
            </a>
          </div>
          
          <h4 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Download App</h4>
          <div className="app-icons" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <span style={{ color: '#34a853', fontSize: '1.5rem', cursor: 'not-allowed', opacity: '0.6' }} title="Coming Soon">
              <i className="fab fa-google-play"></i>
            </span>
            <span style={{ color: '#007aff', fontSize: '1.5rem', cursor: 'not-allowed', opacity: '0.6' }} title="Coming Soon">
              <i className="fab fa-apple"></i>
            </span>
          </div>
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
