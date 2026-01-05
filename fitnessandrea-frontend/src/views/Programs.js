// src/components/Programs.js
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/Programs.css';

function Programs() {
  const navigate = useNavigate();
  
  const programs = [
    {
      id: 1,
      title: "Yoga & Mindfulness",
      description: "Improve flexibility, strength and mental focus through traditional and modern yoga techniques.",
      image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      features: [
        "Improves flexibility",
        "Reduces stress",
        "Improves posture",
        "For all levels"
      ],
      duration: "60 minutes",
      level: "All levels",
      color: "#4CAF50"
    },
    {
      id: 2,
      title: "CrossFit & HIIT",
      description: "Intense workouts for fat burning, increased strength and endurance.",
      image: "https://images.unsplash.com/photo-1536922246289-88c42f957773?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
      features: [
        "Fat burning",
        "Strength increase",
        "Improved fitness",
        "Group training"
      ],
      duration: "45 minutes",
      level: "Intermediate to advanced",
      color: "#FF5722"
    },
    {
      id: 3,
      title: "Pilates & Core",
      description: "Strengthening core muscles, improving stability and correcting body posture.",
      image: "https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      features: [
        "Strengthens core muscles",
        "Improves posture",
        "Low impact",
        "Rehabilitation"
      ],
      duration: "50 minutes",
      level: "Beginner to advanced",
      color: "#2196F3"
    }
  ];

  const comingSoon = [
    {
      id: 4,
      title: "TRX & Functional",
      description: "Bodyweight workouts for functional strength.",
      coming: true
    },
    {
      id: 5,
      title: "Dance Fitness",
      description: "Fun workouts with music for calorie burning.",
      coming: true
    }
  ];

  // Function for signing up for a program
  const handleSignUp = (programTitle) => {
    // You can add additional logic here if you want
    // For example, saving selected program in localStorage
    localStorage.setItem('selectedProgram', programTitle);
    
    // Redirect to login page
    navigate('/login');
  };

  return (
    <div className="programs-container">
      {/* Navigation */}
      <nav className="navbar">
        <div className="logo">
          <span className="logo-icon">🏋️‍♀️</span>
          <span className="logo-text">Fitness Andrea</span>
        </div>
        
        <div className="nav-links">
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/programs" className="nav-link active">Programs</Link>
          <Link to="/about" className="nav-link">About Us</Link>
          <Link to="/login" className="btn-login">Login</Link>
        </div>
      </nav>

      {/* Hero section */}
      <section className="programs-hero">
        <div className="hero-content">
          <h1 className="hero-title">Our Programs</h1>
          <p className="hero-subtitle">
            Choose a program that matches your goals. All programs are led by certified trainers.
          </p>
        </div>
      </section>

      {/* Main programs */}
      <section className="main-programs">
        <div className="section-header">
          <h2>Popular Programs</h2>
          <p>Choose one of our leading programs</p>
        </div>

        <div className="programs-grid">
          {programs.map((program) => (
            <div 
              key={program.id} 
              className="program-card"
              style={{ borderTop: `4px solid ${program.color}` }}
            >
              <div className="program-image">
                <img src={program.image} alt={program.title} />
                <div className="program-badge" style={{ backgroundColor: program.color }}>
                  {program.level}
                </div>
              </div>
              
              <div className="program-content">
                <h3>{program.title}</h3>
                <p className="program-description">{program.description}</p>
                
                <div className="program-details">
                  <span className="detail-item">
                    <span className="detail-icon">⏱️</span>
                    {program.duration}
                  </span>
                </div>
                
                <ul className="program-features">
                  {program.features.map((feature, index) => (
                    <li key={index}>
                      <span className="feature-icon">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                
                <button 
                  className="program-button"
                  style={{ backgroundColor: program.color }}
                  onClick={() => handleSignUp(program.title)}
                >
                  Sign Up
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Coming Soon */}
      <section className="coming-soon">
        <div className="section-header">
          <h2>Coming Soon</h2>
          <p>New programs in preparation</p>
        </div>
        
        <div className="coming-soon-grid">
          {comingSoon.map((program) => (
            <div key={program.id} className="coming-soon-card">
              <div className="coming-soon-content">
                <h3>{program.title}</h3>
                <p>{program.description}</p>
                <div className="coming-soon-badge">COMING SOON</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA section */}
      <section className="programs-cta">
        <div className="cta-content">
          <h2>Ready for Changes?</h2>
          <p>Schedule a free trial session and try the program you're interested in.</p>
          <div className="cta-buttons">
            <Link to="/login" className="btn-primary">
              Sign up for a trial session
            </Link>
            <Link to="/" className="btn-secondary">
              Back to Home
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <p>© 2024 Fitness Andrea</p>
      </footer>
    </div>
  );
}

export default Programs;