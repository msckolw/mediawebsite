import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import AdminPanel from './pages/AdminPanel';
import Login from './pages/Login';
import './App.css';
import ArticleDetail from './pages/ArticleDetail';
import ABC from './pages/ArticleByCategory';
import SourcePage from './pages/SourcePage';


function App() {
  return (
    <div className="app">
      <Header />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/article/:id" element={<ArticleDetail />} />
          {/* <Route path="/category" element={<ABC />} /> */}
          <Route path="/category/:cat" element={<ABC />} />
          <Route path="*" element={<Navigate to="/" />} />
          <Route path="/source/:id" element={<SourcePage />} />



        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App; 