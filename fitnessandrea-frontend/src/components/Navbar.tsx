// src/components/Navbar.tsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import '../styles/Navbar.css';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  return (
    <nav className="navbar">
      <div className="logo">
        <span className="logo-icon">🏋️‍♀️</span>
        <span className="logo-text">Fitness Andrea</span>
      </div>
      
      <div className="nav-links">
        <Link to="/" className="nav-link">Početna</Link>
        <Link to="/programs" className="nav-link">Programi</Link>
        <Link to="/about" className="nav-link">O nama</Link>
        <Link to="/contact" className="nav-link">Kontakt</Link>
        
        {isAuthenticated ? (
          <button 
            onClick={() => navigate('/dashboard')}
            className="btn-dashboard"
          >
            Moj Dashboard
          </button>
        ) : (
          <button 
            onClick={() => navigate('/login')}
            className="btn-login"
          >
            Prijava
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;