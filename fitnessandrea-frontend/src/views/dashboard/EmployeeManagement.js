// src/views/dashboard/EmployeeManagement.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, logout } from '../../services/authService';
import { getAllLocations } from '../../services/locationService';
import { 
  getAllEmployees, 
  createEmployee, 
  deleteEmployee,
  assignEmployeeToLocation 
} from '../../services/employeeService';
import '../../styles/dashboard/EmployeeManagement.css';

// Komponenta za kreiranje zaposlenog
const CreateEmployeeModal = ({ locations, onClose, onSuccess, setParentSuccessMessage }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    locationId: '',
    phone: '',
    position: '',
    salaryEur: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validacija
    const requiredFields = ['firstName', 'lastName', 'email', 'password', 'locationId', 'position'];
    for (const field of requiredFields) {
      if (!formData[field].trim()) {
        setError(`${field} is required`);
        return;
      }
    }

    // Email validacija
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      
      // Konvertuj salary u number
      const employeeData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        locationId: parseInt(formData.locationId),
        phone: formData.phone.trim() || null,
        position: formData.position.trim(),
        salaryEur: formData.salaryEur ? parseFloat(formData.salaryEur) : 0
      };
      
      console.log('📤 Sending employee data:', employeeData);
      await createEmployee(employeeData);
      
      // Pozovi parent funkciju za success message
      if (setParentSuccessMessage) {
        setParentSuccessMessage(`Employee "${employeeData.firstName} ${employeeData.lastName}" created successfully!`);
      }
      
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err) {
      console.error('Create employee error:', err);
      setError(err.message || 'Failed to create employee');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>👥 Create New Employee</h2>
          <button onClick={onClose} className="modal-close">&times;</button>
        </div>
        
        <div className="modal-body">
          {error && <div className="error-message">❌ {error}</div>}
          
          <form onSubmit={handleSubmit} className="employee-form">
            <div className="form-row">
              <div className="form-group">
                <label>First Name *</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="John"
                  required
                  disabled={loading}
                />
              </div>
              
              <div className="form-group">
                <label>Last Name *</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder="Doe"
                  required
                  disabled={loading}
                />
              </div>
            </div>
            
            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="john.doe@example.com"
                required
                disabled={loading}
              />
            </div>
            
            <div className="form-group">
              <label>Password *</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter password"
                required
                disabled={loading}
                minLength="6"
              />
              <small className="form-hint">Minimum 6 characters</small>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+1234567890"
                  disabled={loading}
                />
              </div>
              
              <div className="form-group">
                <label>Position *</label>
                <input
                  type="text"
                  name="position"
                  value={formData.position}
                  onChange={handleInputChange}
                  placeholder="e.g., Trainer, Manager"
                  required
                  disabled={loading}
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Location *</label>
                <select
                  name="locationId"
                  value={formData.locationId}
                  onChange={handleInputChange}
                  required
                  disabled={loading || locations.length === 0}
                >
                  <option value="">Select Location</option>
                  {locations.map(location => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
                {locations.length === 0 && (
                  <small className="form-hint text-warning">
                    No locations available. Please create a location first.
                  </small>
                )}
              </div>
              
              <div className="form-group">
                <label>Salary (EUR)</label>
                <input
                  type="number"
                  name="salaryEur"
                  value={formData.salaryEur}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  disabled={loading}
                />
              </div>
            </div>
            
            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={loading || locations.length === 0}>
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Creating...
                  </>
                ) : 'Create Employee'}
              </button>
              <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Modal za dodeljivanje lokacije
const AssignLocationModal = ({ employee, locations, onClose, onAssign }) => {
  const [selectedLocationId, setSelectedLocationId] = useState(employee?.locationId || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const currentLocation = locations.find(loc => loc.id === employee?.locationId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!selectedLocationId) {
      setError('Please select a location');
      return;
    }

    try {
      setLoading(true);
      await onAssign(employee.id, parseInt(selectedLocationId));
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to assign employee to location');
    } finally {
      setLoading(false);
    }
  };

  if (!employee) return null;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📍 Assign Employee to Location</h2>
          <button onClick={onClose} className="modal-close">&times;</button>
        </div>
        
        <div className="modal-body">
          <div className="employee-info-card">
            <h4>Employee Information</h4>
            <p><strong>Name:</strong> {employee.firstName} {employee.lastName}</p>
            <p><strong>Current Position:</strong> {employee.position}</p>
            <p><strong>Current Location:</strong> {currentLocation ? currentLocation.name : 'Not assigned'}</p>
          </div>

          {error && <div className="error-message">❌ {error}</div>}

          <form onSubmit={handleSubmit} className="assign-form">
            <div className="form-group">
              <label>Select New Location *</label>
              <select
                value={selectedLocationId}
                onChange={(e) => setSelectedLocationId(e.target.value)}
                className="location-select"
                disabled={loading}
                required
              >
                <option value="">-- Choose Location --</option>
                {locations.map(location => (
                  <option key={location.id} value={location.id}>
                    {location.name} {location.id === employee.locationId ? '(Current)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Assigning...
                  </>
                ) : 'Assign to Location'}
              </button>
              <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Glavna EmployeeManagement komponenta
const EmployeeManagement = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [assignModal, setAssignModal] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    if (currentUser.role !== 'ADMIN') {
      navigate('/admin-dashboard');
      return;
    }
    
    setUser(currentUser);
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [locationsData, employeesData] = await Promise.all([
        getAllLocations(),
        getAllEmployees()
      ]);
      
      setLocations(locationsData);
      setEmployees(employeesData);
      console.log('✅ Data fetched:', {
        locations: locationsData.length,
        employees: employeesData.length
      });
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(`Failed to load data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleCreateEmployee = () => {
    if (locations.length === 0) {
      setError('Please create at least one location before adding employees.');
      return;
    }
    setShowCreateModal(true);
  };

  const handleDeleteEmployee = async (employee) => {
    if (!employee) return;
    
    if (!window.confirm(`Are you sure you want to delete employee "${employee.firstName} ${employee.lastName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      await deleteEmployee(employee.id);
      
      setSuccessMessage(`Employee "${employee.firstName} ${employee.lastName}" deleted successfully!`);
      fetchData(); // Refresh list
    } catch (err) {
      console.error('Delete error:', err);
      setError(`Failed to delete employee: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignToLocation = (employee) => {
    if (locations.length === 0) {
      setError('No locations available. Please create locations first.');
      return;
    }
    setAssignModal(employee);
  };

  const handleActualAssign = async (employeeId, locationId) => {
    try {
      setLoading(true);
      setError('');
      
      await assignEmployeeToLocation(employeeId, locationId);
      
      const location = locations.find(loc => loc.id === locationId);
      const employee = employees.find(emp => emp.id === employeeId);
      
      setSuccessMessage(
        `Employee "${employee.firstName} ${employee.lastName}" assigned to "${location.name}" successfully!`
      );
      
      fetchData(); // Refresh list
      setAssignModal(null);
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = selectedLocation === 'all' 
    ? employees 
    : employees.filter(emp => emp.locationId === parseInt(selectedLocation));

  if (!user) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading Employee Management...</p>
      </div>
    );
  }

  return (
    <div className="employee-management">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>👥 Employee Management</h1>
          <button onClick={() => navigate('/admin-dashboard')} className="back-button">
            ← Back to Admin Dashboard
          </button>
        </div>
        
        <div className="user-info">
          <span className="welcome-text">Welcome, {user.email}</span>
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </div>
      </header>

      <div className="dashboard-content">
        <div className="header-actions">
          <h2>Employee Management</h2>
          <button onClick={handleCreateEmployee} className="create-button" disabled={loading}>
            + Add New Employee
          </button>
        </div>
        
        {/* Success/Error Messages */}
        {successMessage && (
          <div className="success-message">
            ✅ {successMessage}
            <button onClick={() => setSuccessMessage('')} className="close-message">&times;</button>
          </div>
        )}
        
        {error && (
          <div className="error-message">
            ❌ {error}
            <button onClick={() => setError('')} className="close-message">&times;</button>
          </div>
        )}
        
        {/* Filter by Location */}
        <div className="filter-section">
          <div className="filter-controls">
            <div className="filter-group">
              <label>Filter by Location:</label>
              <select 
                value={selectedLocation} 
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="location-filter"
                disabled={loading}
              >
                <option value="all">All Locations</option>
                {locations.map(location => (
                  <option key={location.id} value={location.id}>
                    {location.name} ({employees.filter(emp => emp.locationId === location.id).length})
                  </option>
                ))}
              </select>
            </div>
            
            <div className="stats">
              <span className="stat-badge">
                Total Employees: <strong>{employees.length}</strong>
              </span>
              {selectedLocation !== 'all' && (
                <span className="stat-badge">
                  In Selected Location: <strong>{filteredEmployees.length}</strong>
                </span>
              )}
              <span className="stat-badge">
                Total Locations: <strong>{locations.length}</strong>
              </span>
            </div>
          </div>
        </div>
        
        {/* Employees Table */}
        <div className="employees-section">
          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
              <span>Loading employees...</span>
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="no-data">
              <p>No employees found{selectedLocation !== 'all' ? ' in selected location' : ''}.</p>
              {selectedLocation !== 'all' ? (
                <button onClick={() => setSelectedLocation('all')} className="view-all-button">
                  View All Employees
                </button>
              ) : (
                <button onClick={handleCreateEmployee} className="create-button">
                  Create Your First Employee
                </button>
              )}
            </div>
          ) : (
            <div className="employees-table-container">
              <div className="table-header">
                <span className="table-count">
                  Showing {filteredEmployees.length} of {employees.length} employees
                </span>
              </div>
              <div className="employees-table">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Position</th>
                      <th>Location</th>
                      <th>Phone</th>
                      <th>Salary (EUR)</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmployees.map((employee) => {
                      const location = locations.find(loc => loc.id === employee.locationId);
                      return (
                        <tr key={employee.id}>
                          <td><code>{employee.id}</code></td>
                          <td>
                            <div className="employee-name">
                              <strong>{employee.firstName} {employee.lastName}</strong>
                            </div>
                          </td>
                          <td>
                            <a href={`mailto:${employee.email}`} className="email-link">
                              {employee.email}
                            </a>
                          </td>
                          <td>
                            <span className="position-badge">{employee.position}</span>
                          </td>
                          <td>
                            {location ? (
                              <div className="location-info">
                                <span className="location-name">{location.name}</span>
                                <small className="location-id">ID: {location.id}</small>
                              </div>
                            ) : 'N/A'}
                          </td>
                          <td>
                            {employee.phone ? (
                              <a href={`tel:${employee.phone}`} className="phone-link">
                                {employee.phone}
                              </a>
                            ) : 'N/A'}
                          </td>
                          <td>
                            {employee.salaryEur ? (
                              <span className="salary">
                                €{employee.salaryEur.toFixed(2)}
                              </span>
                            ) : 'N/A'}
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button 
                                className="assign-button"
                                onClick={() => handleAssignToLocation(employee)}
                                disabled={loading}
                                title={`Assign ${employee.firstName} to different location`}
                              >
                                📍 Assign
                              </button>
                              {/* <button 
                                className="delete-button"
                                onClick={() => handleDeleteEmployee(employee)}
                                disabled={loading}
                                title={`Delete ${employee.firstName} ${employee.lastName}`}
                              >
                                🗑️ Delete
                              </button> */}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Employee Modal - SADA PROSLEĐUJEMO setSuccessMessage */}
      {showCreateModal && (
        <CreateEmployeeModal
          locations={locations}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            fetchData();
          }}
          setParentSuccessMessage={setSuccessMessage}
        />
      )}

      {/* Assign Location Modal */}
      {assignModal && (
        <AssignLocationModal
          employee={assignModal}
          locations={locations}
          onClose={() => setAssignModal(null)}
          onAssign={handleActualAssign}
        />
      )}

      {/* Global Loading Overlay */}
      {loading && (
        <div className="global-loading-overlay">
          <div className="global-loading">
            <div className="spinner large"></div>
            <span>Processing...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeManagement;