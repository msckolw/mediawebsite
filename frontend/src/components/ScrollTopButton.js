import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import './ScrollTopButton.css';
export default function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => { const update = () => setVisible(window.scrollY > 600); update(); window.addEventListener('scroll', update, { passive: true }); return () => window.removeEventListener('scroll', update); }, []);
  if (!visible || ['/login', '/admin'].includes(pathname)) return null;
  return <button className="nb-back-top" aria-label="Back to top" onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })}>↑</button>;
}
