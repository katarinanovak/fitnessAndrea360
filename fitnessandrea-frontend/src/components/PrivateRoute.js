// src/components/PrivateRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';

function PrivateRoute({ children, requiredRole }) {
  const isAuthenticated = localStorage.getItem('token') !== null;
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  // Optional: Check for specific role
  if (requiredRole) {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.role !== requiredRole) {
          // Redirect to appropriate dashboard based on actual role
          switch(user.role) {
            case 'ADMIN':
              return <Navigate to="/admin-dashboard" />;
            case 'EMPLOYEE':
              return <Navigate to="/employee-dashboard" />;
            case 'MEMBER':
              return <Navigate to="/member-dashboard" />;
            default:
              return <Navigate to="/" />;
          }
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }
  
  return children;
}

export default PrivateRoute;