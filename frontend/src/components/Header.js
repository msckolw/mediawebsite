import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { useGoogleHook } from '../hooks/gHook';
import './Header.css';

const sections = [['Politics', 'politics'], ['Business', 'business'], ['World News', 'world news'], ['Legal', 'legal'], ['Miscellaneous', 'miscellaneous']];
export default function Header() {
  const { user, loading, logout } = useSession();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const login = useGoogleHook(pathname, true);
  const dialog = useRef(null);
  const trigger = useRef(null);
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    const element = dialog.current;
    if (!open) { if (element.open) element.close(); return; }
    const previousOverflow = document.body.style.overflow;
    const triggerElement = trigger.current;
    element.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      element.close();
      document.body.style.overflow = previousOverflow;
      triggerElement?.focus();
    };
  }, [open]);
  const signOut = async () => {
    try { await logout(); close(); navigate('/'); }
    catch { const { default: Swal } = await import('sweetalert2'); Swal.fire({ icon: 'error', title: 'Could not sign out', text: 'Please check your connection and try again.' }); }
  };
  return <header className="nb-header">
    <a className="nb-skip" href="#main-content">Skip to content</a>
    <div className="nb-masthead">
      <button ref={trigger} className="nb-menu-button" aria-label="Open navigation" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)}><span aria-hidden="true">☰</span><span className="nb-menu-word">Menu</span></button>
      <Link to="/" className="nb-brand" aria-label="The NoBias Media home"><img className="nb-original-logo" src="/NBM Transparent logo.png" alt="The NoBias Media" /></Link>
      <div className="nb-account">{!loading && (user ? <button onClick={signOut}>Sign Out</button> : <button onClick={login}>Sign in <span aria-hidden="true">↗</span></button>)}</div>
    </div>
    <nav className="nb-sections" aria-label="News sections"><NavLink to="/" end>All stories</NavLink>{sections.map(([name, slug]) => <NavLink key={slug} to={`/category/${slug}`}>{name}</NavLink>)}<NavLink className="nb-support-link" to="/donate">Support</NavLink></nav>
    <dialog ref={dialog} className="nb-menu" aria-labelledby="nb-menu-title" onCancel={close} onClose={close} onClick={event => { if (event.target === dialog.current) { const rect = dialog.current.getBoundingClientRect(); if (event.clientX > rect.right || event.clientX < rect.left || event.clientY < rect.top || event.clientY > rect.bottom) close(); } }}>
      <div className="nb-menu-top"><span id="nb-menu-title">Categories</span><button aria-label="Close navigation" onClick={close}>×</button></div>
      <nav aria-label="Main navigation"><Link to="/" onClick={close}>All stories</Link>{sections.map(([name, slug]) => <Link key={slug} to={`/category/${slug}`} onClick={close}>{name}</Link>)}{user && <Link to="/bookmarks" onClick={close}>Bookmarks</Link>}{user?.role === 'admin' && <Link to="/admin" onClick={close}>Profile</Link>}</nav>
      <div className="nb-menu-secondary"><Link to="/media-bias-details" onClick={close}>How we compare sources ↗</Link><Link to="/about" onClick={close}>About NoBias</Link><Link to="/donate" onClick={close}>Support our work</Link><Link to="/contact" onClick={close}>Contact</Link></div>

    </dialog>
  </header>;
}
