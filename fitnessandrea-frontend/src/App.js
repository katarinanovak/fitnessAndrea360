// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './views/Home';
import Login from './views/Login';
import AdminDashboard from './views/dashboard/AdminDashboard';
import EmployeeDashboard from './views/dashboard/EmployeeDashboard';
import MemberDashboard from './views/dashboard/MemberDashboard';
import PrivateRoute from './components/PrivateRoute';
import EmployeeManagement from './views/dashboard/EmployeeManagement';
import Programs from './views/Programs';
import AboutUs from './views/AboutUs'; 
import PaymentSuccess from './views/payment/PaymentSuccess';
import './App.css'; 

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/programs" element={<Programs />} />
          <Route path="/about" element={<AboutUs />} /> 
          <Route path="/about" element={<div>About Page</div>} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          
          {/* Protected dashboard routes */}
          <Route 
            path="/admin-dashboard" 
            element={
              <PrivateRoute>
                <AdminDashboard />
              </PrivateRoute>
            } 
          />
          
          <Route 
            path="/employee-dashboard" 
            element={
              <PrivateRoute>
                <EmployeeDashboard />
              </PrivateRoute>
            } 
          />
          
          <Route 
            path="/member-dashboard" 
            element={
              <PrivateRoute>
                <MemberDashboard />
              </PrivateRoute>
            } 
          />
          <Route 
          path="/employee-management" 
          element={
            <PrivateRoute>
              <EmployeeManagement />
            </PrivateRoute>
          } 
          />
        </Routes>
        
      </div>
    </Router>
  );
}

export default App;