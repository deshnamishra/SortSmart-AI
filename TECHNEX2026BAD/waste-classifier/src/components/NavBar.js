import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import './NavBar.css';

const Logo = () => (
  <div className="nav-logo">
    <div className="nav-logo-icon">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="#00FF87" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M2 17l10 5 10-5" stroke="#00FF87" strokeWidth="1.5" strokeLinejoin="round" opacity="0.5" />
        <path d="M2 12l10 5 10-5" stroke="#00FF87" strokeWidth="1.5" strokeLinejoin="round" opacity="0.75" />
      </svg>
    </div>
    <span className="nav-logo-text">Verdant AI</span>
  </div>
);

export default function NavBar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20 || document.querySelector('.page-content')?.scrollTop > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    document.querySelectorAll('.page-content').forEach(el => el.addEventListener('scroll', onScroll, { passive: true }));
    return () => {
      window.removeEventListener('scroll', onScroll);
      document.querySelectorAll('.page-content').forEach(el => el.removeEventListener('scroll', onScroll));
    };
  }, []);

  return (
    <header className={`navbar${scrolled ? ' scrolled' : ''}`}>
      <div className="navbar-inner">
        <NavLink to="/" className="nav-logo-link"><Logo /></NavLink>

        <nav className="nav-links">
          <NavLink to="/" end className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>Scan</NavLink>
          <NavLink to="/dashboard" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>Analytics</NavLink>
          <NavLink to="/leaderboard" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>Leaderboard</NavLink>
        </nav>

        <NavLink to="/" className="nav-cta">
          <span>Scan Waste</span>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 6h8M6 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </NavLink>

        {/* Mobile hamburger */}
        <button className="nav-hamburger" onClick={() => setMobileOpen(o => !o)} aria-label="Menu">
          <span className={mobileOpen ? 'open' : ''} />
          <span className={mobileOpen ? 'open' : ''} />
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="nav-mobile-menu" onClick={() => setMobileOpen(false)}>
          <NavLink to="/" end className="nav-mobile-link">Scan</NavLink>
          <NavLink to="/dashboard" className="nav-mobile-link">Analytics</NavLink>
          <NavLink to="/leaderboard" className="nav-mobile-link">Leaderboard</NavLink>
        </div>
      )}
    </header>
  );
}
