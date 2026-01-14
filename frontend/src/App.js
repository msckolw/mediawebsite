import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import './App.css';
import './styles/Login.css';
import './styles/Home.css';
import './styles/ArticleDetail.css';
import './components/ScrollTopButton.css';

import Header from './components/Header';
import Footer from './components/Footer';
import ScrollToTopButton from './components/ScrollTopButton';
import CookieConsent from './components/CookieConsent';
import Home from './pages/Home';
import { routes } from './routes';

// import Login from './pages/Login';
// import AdminPanel from './pages/AdminPanel';
// import ArticleDetail from './pages/ArticleDetail';
// import ABC from './pages/ArticleByCategory';
// import SourcePage from './pages/SourcePage';

function App() {


  return (
    <div className="app">
      <Header />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          {/* <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/article/:id" element={<ArticleDetail />} />
          <Route path="/category/:cat" element={<ABC />} />
          <Route path="/source/:id" element={<SourcePage />} /> */}
          {routes.map((route,i) => 
            <Route path={route.path} 
            element={
            <Suspense fallback={
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading...</p>
              </div>
              }>{route.element}
            </Suspense>}
            key={i} />
          )} 
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
      <Footer />
      <ScrollToTopButton />
      <CookieConsent />
    </div>
  );
}


export default App; 