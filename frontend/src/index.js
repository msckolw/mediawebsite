import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import { GoogleOAuthProvider } from '@react-oauth/google';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <GoogleOAuthProvider
      clientId={process.env.REACT_APP_OAUTH_CLIENT_ID} >
            <App />
      </GoogleOAuthProvider>
    </BrowserRouter>
  </React.StrictMode>
); 