// src/views/AboutUs.js
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/AboutUs.css';

function AboutUs() {
  const navigate = useNavigate();
  const isAuthenticated = localStorage.getItem('token') !== null;

  return (
    <div className="about-us-container">
      <nav className="navbar">
        <div className="logo">
          <span className="logo-icon">🏋️‍♀️</span>
          <span className="logo-text">Fitness Andrea</span>
        </div>
        
        <div className="nav-links">
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/programs" className="nav-link">Programs</Link>
          <Link to="/about" className="nav-link active">About Us</Link>
          
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

      <main className="about-content">
        <section className="about-hero">
          <h1>About Fitness Andrea</h1>
          <p>Your journey to better health starts here</p>
        </section>

        <section className="mission-section">
          <h2>Our Mission</h2>
          <p>
            At Fitness Andrea, we believe that everyone deserves to feel strong, healthy, 
            and confident in their own skin. Our mission is to provide accessible, 
            personalized fitness solutions that empower individuals to achieve their 
            health and wellness goals.
          </p>
        </section>

        <section className="story-section">
          <h2>Our Story</h2>
          <p>
            Founded in 2024 by fitness enthusiast Andrea, our center started as a small 
            local gym with a big vision. What began as a passion project has grown into 
            a comprehensive fitness community serving hundreds of members.
          </p>
          <p>
            We've expanded our services to include personal training, group classes, 
            nutritional guidance, and now a digital platform that brings fitness 
            directly to you, wherever you are.
          </p>
        </section>

        <section className="team-section">
          <h2>What We Offer</h2>
          <div className="services-grid">
            <div className="service-card">
              <div className="service-icon">🏋️‍♂️</div>
              <h3>Personal Training</h3>
              <p>One-on-one sessions with certified trainers</p>
            </div>
            
            <div className="service-card">
              <div className="service-icon">👥</div>
              <h3>Group Classes</h3>
              <p>Yoga, Pilates, HIIT, and strength training</p>
            </div>
            
            <div className="service-card">
              <div className="service-icon">🥗</div>
              <h3>Nutrition Planning</h3>
              <p>Custom meal plans and dietary guidance</p>
            </div>
            
            <div className="service-card">
              <div className="service-icon">📱</div>
              <h3>Digital Platform</h3>
              <p>Track progress and access workouts online</p>
            </div>
          </div>
        </section>

        <section className="values-section">
          <h2>Our Values</h2>
          <div className="values-list">
            <div className="value-item">
              <span className="value-icon">🎯</span>
              <div>
                <h3>Personalization</h3>
                <p>Every fitness journey is unique - we tailor programs to individual needs</p>
              </div>
            </div>
            
            <div className="value-item">
              <span className="value-icon">🤝</span>
              <div>
                <h3>Community</h3>
                <p>We believe in the power of support and shared success</p>
              </div>
            </div>
            
            <div className="value-item">
              <span className="value-icon">📚</span>
              <div>
                <h3>Education</h3>
                <p>We teach sustainable habits for lifelong health</p>
              </div>
            </div>
          </div>
        </section>

        <section className="cta-section">
          <h2>Ready to Start Your Journey?</h2>
          <p>Join our community and take the first step toward a healthier you.</p>
          <button 
            onClick={() => navigate(isAuthenticated ? '/dashboard' : '/register')}
            className="btn-primary"
          >
            {isAuthenticated ? 'Go to Dashboard' : 'Start for Free'}
          </button>
        </section>
      </main>

      <footer className="footer">
        <p>© 2024 Fitness Andrea</p>
      </footer>
    </div>
  );
}

export default AboutUs;