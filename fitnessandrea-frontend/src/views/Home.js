import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/Home.css';

function Home() {
  const navigate = useNavigate();
  const isAuthenticated = localStorage.getItem('token') !== null;

  return (
    <div className="home-container">
      <nav className="navbar">
        <div className="logo">
          <span className="logo-icon">🏋️‍♀️</span>
          <span className="logo-text">Fitness Andrea</span>
        </div>
        
        <div className="nav-links">
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/programs" className="nav-link">Programs</Link>
          <Link to="/about" className="nav-link">About Us</Link>
          
          {isAuthenticated ? (
            <button 
              onClick={() => navigate('/dashboard')}
              className="btn-dashboard"
            >
              My Dashboard
            </button>
          ) : (
            <button 
              onClick={() => navigate('/login')}
              className="btn-login"
            >
              Login
            </button>
          )}
        </div>
      </nav>

      <header className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Transform your body,<br />
            <span className="hero-highlight">transform your life</span>
          </h1>
          <p className="hero-subtitle">
            Personalized fitness programs, nutrition plans and support from a certified trainer.
          </p>
          
          <div className="hero-buttons">
            {isAuthenticated ? (
              <button 
                onClick={() => navigate('/dashboard')}
                className="btn-primary"
              >
                Continue training →
              </button>
            ) : (
              <>
                <button 
                  onClick={() => navigate('/register')}
                  className="btn-primary"
                >
                  Start for free
                </button>
                <button 
                  onClick={() => navigate('/programs')}
                  className="btn-secondary"
                >
                  View programs
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <footer className="footer">
        <p>© 2024 Fitness Andrea</p>
      </footer>
    </div>
  );
}

export default Home;