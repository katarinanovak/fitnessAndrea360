// src/views/Login.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Login.css';
import { login, testBackendConnection } from '../services/authService';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    testBackendConnection();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Use mock login for testing if needed
      if (email === 'test@example.com' && password === 'password123') {
        // Mock login for testing (choose a role)
        localStorage.setItem('token', 'mock-token-' + Date.now());
        localStorage.setItem('user', JSON.stringify({
          id: '1',
          email: email,
          role: 'MEMBER' // Change to ADMIN or EMPLOYEE for testing
        }));
        redirectBasedOnRole('MEMBER'); // Change role here for testing
        return;
      }

      // Real API call to Spring Boot
      const response = await login(email, password);
      console.log('Login response:', response);
      redirectBasedOnRole(response.role);
      
    } catch (err) {
      console.error('Login error:', err);
      
      let errorMessage = 'Login error occurred';
      
      if (err.message.includes('Unauthorized') || err.message.includes('Invalid')) {
        errorMessage = 'Invalid email or password';
      } else if (err.message.includes('NetworkError') || err.message.includes('Failed to fetch')) {
        errorMessage = 'Connection problem. Check if backend is running.';
      } else {
        errorMessage = err.message || 'Login failed';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const redirectBasedOnRole = (role) => {
    console.log('Redirecting based on role:', role);
    
    switch(role.toUpperCase()) {
      case 'ADMIN':
        navigate('/admin-dashboard');
        break;
      case 'EMPLOYEE':
        navigate('/employee-dashboard');
        break;
      case 'MEMBER':
        navigate('/member-dashboard');
        break;
      default:
        console.warn('Unknown role, redirecting to home');
        navigate('/');
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form">
        <h2 className="login-title">🔐 Login</h2>
        
        {error && <div className="login-error">{error}</div>}
        
        <div className="input-group">
          <label className="input-label">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            className="login-input"
            disabled={loading}
          />
        </div>
        
        <div className="input-group">
          <label className="input-label">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            className="login-input"
            disabled={loading}
          />
        </div>
        
        <button 
          type="submit" 
          disabled={loading}
          className={`login-button ${loading ? 'loading' : ''}`}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
        
        <div className="test-info">
          <p><strong>Test credentials:</strong> test@example.com / password123</p>
          <p><small>Change mock role in code for testing different dashboards</small></p>
        </div>
      </form>
    </div>
  );
}

export default Login;