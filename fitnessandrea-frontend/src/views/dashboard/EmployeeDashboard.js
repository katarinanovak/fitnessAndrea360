// src/views/dashboard/EmployeeDashboard.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, logout, hasPermission } from '../../services/authService';
import { getAllMembers, createMember } from '../../services/memberService';
import '../../styles/dashboard/EmployeeDashboard.css';
import { getAllServices, createService } from '../../services/serviceService';
import { 
  createAppointment, 
  getMembersForMyLocation, 
  getServicesForMyLocation,
  getTodayAppointments,
  cancelAppointment,
  confirmAppointment,
  completeAppointment
} from '../../services/appointmentService';
import { 
  getReservationsByLocation, 
  getTodayReservationsByLocation,
  updateReservationStatus,
  deleteReservation,
  getLocationAppointmentsCapacity
} from '../../services/reservationService';

// Create Member Modal komponenta
const CreateMemberModal = ({ onClose, onSuccess, employeeLocationId }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: 'MALE',
    address: '',
    locationId: employeeLocationId || '',
    emergencyContact: '',
    emergencyPhone: '',
    membershipStartDate: new Date().toISOString().split('T')[0],
    membershipEndDate: '',
    medicalNotes: '',
    notes: '',
    username: '',
    password: ''
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

  const handleTextAreaChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const renderLocationField = () => {
    if (employeeLocationId) {
      return (
        <div className="form-group">
          <label>Location *</label>
          <input
            type="text"
            value={`Location #${employeeLocationId}`}
            disabled
            className="location-display"
          />
          <small className="form-hint">
            Your assigned location. Members will be registered at this location.
          </small>
          <input
            type="hidden"
            name="locationId"
            value={employeeLocationId}
          />
        </div>
      );
    } else {
      return (
        <div className="form-group">
          <label>Location ID *</label>
          <input
            type="number"
            name="locationId"
            value={formData.locationId}
            onChange={handleInputChange}
            placeholder="1"
            required
            min="1"
            disabled={loading}
          />
          <small className="form-hint">Enter the location ID where the member will train</small>
        </div>
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    const requiredFields = [
      'firstName', 'lastName', 'email', 
      'phone', 'dateOfBirth', 'gender', 
      'address', 'locationId'
    ];
    
    for (const field of requiredFields) {
      if (!formData[field] || !formData[field].toString().trim()) {
        setError(`${field} is required`);
        return;
      }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    const phoneRegex = /^[0-9+\-\s()]+$/;
    if (!phoneRegex.test(formData.phone)) {
      setError('Please enter a valid phone number');
      return;
    }

    if (formData.emergencyPhone && !phoneRegex.test(formData.emergencyPhone)) {
      setError('Please enter a valid emergency phone number');
      return;
    }

    try {
      setLoading(true);
      
      const locationId = employeeLocationId || parseInt(formData.locationId);
      
      const memberData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        address: formData.address.trim(),
        locationId: locationId,
        emergencyContact: formData.emergencyContact.trim() || null,
        emergencyPhone: formData.emergencyPhone.trim() || null,
        membershipStartDate: formData.membershipStartDate,
        membershipEndDate: formData.membershipEndDate || null,
        medicalNotes: formData.medicalNotes.trim() || null,
        notes: formData.notes.trim() || null,
        username: formData.username.trim() || formData.email.trim().split('@')[0],
        password: formData.password || 'defaultPassword123'
      };
      
      await createMember(memberData);
      
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Create member error:', err);
      setError(err.message || 'Failed to create member');
    } finally {
      setLoading(false);
    }
  };

  const handleMembershipStartDateChange = (e) => {
    const startDate = e.target.value;
    setFormData(prev => {
      let endDate = '';
      if (startDate) {
        const date = new Date(startDate);
        date.setMonth(date.getMonth() + 1);
        endDate = date.toISOString().split('T')[0];
      }
      return {
        ...prev,
        membershipStartDate: startDate,
        membershipEndDate: endDate
      };
    });
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal wide-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>👤 Create New Member</h2>
          <button onClick={onClose} className="modal-close">&times;</button>
        </div>
        
        <div className="modal-body">
          {error && <div className="error-message">❌ {error}</div>}
          
          {employeeLocationId && (
            <div className="location-info-banner">
              <span>📍 Creating member for <strong>Location #{employeeLocationId}</strong></span>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="member-form">
            <div className="form-section">
              <h3 className="section-title">Basic Information</h3>
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
              
              <div className="form-row">
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
                  <label>Phone *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="089536569810"
                    required
                    disabled={loading}
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Date of Birth *</label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    required
                    disabled={loading}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
                
                <div className="form-group">
                  <label>Gender *</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    required
                    disabled={loading}
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3 className="section-title">Address & Location</h3>
              <div className="form-group">
                <label>Address *</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleTextAreaChange}
                  placeholder="Street, City, Postal Code"
                  rows="2"
                  required
                  disabled={loading}
                />
              </div>
              
              {renderLocationField()}
            </div>

            <div className="form-section">
              <h3 className="section-title">Emergency Contact</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Emergency Contact Name</label>
                  <input
                    type="text"
                    name="emergencyContact"
                    value={formData.emergencyContact}
                    onChange={handleInputChange}
                    placeholder="Contact person name"
                    disabled={loading}
                  />
                </div>
                
                <div className="form-group">
                  <label>Emergency Phone</label>
                  <input
                    type="tel"
                    name="emergencyPhone"
                    value={formData.emergencyPhone}
                    onChange={handleInputChange}
                    placeholder="Emergency phone number"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3 className="section-title">Membership Details</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Membership Start Date *</label>
                  <input
                    type="date"
                    name="membershipStartDate"
                    value={formData.membershipStartDate}
                    onChange={handleMembershipStartDateChange}
                    required
                    disabled={loading}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                
                <div className="form-group">
                  <label>Membership End Date</label>
                  <input
                    type="date"
                    name="membershipEndDate"
                    value={formData.membershipEndDate}
                    onChange={handleInputChange}
                    disabled={loading}
                    min={formData.membershipStartDate}
                  />
                  <small className="form-hint">Auto-calculated 1 month from start date</small>
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3 className="section-title">Account & Additional Information</h3>
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="johndoe"
                  disabled={loading}
                />
                <small className="form-hint">Leave empty to use email as username</small>
              </div>
              
              <div className="form-group">
                <label>Medical Notes</label>
                <textarea
                  name="medicalNotes"
                  value={formData.medicalNotes}
                  onChange={handleTextAreaChange}
                  placeholder="Any medical conditions, allergies, etc."
                  rows="2"
                  disabled={loading}
                />
              </div>
              
              <div className="form-group">
                <label>Additional Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleTextAreaChange}
                  placeholder="Any additional notes about the member"
                  rows="2"
                  disabled={loading}
                />
              </div>
              
              <div className="form-group">
                <label>Initial Password</label>
                <input
                  type="text"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="defaultPassword123"
                  disabled={loading}
                />
                <small className="form-hint">Default password for the member's account</small>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Creating Member...
                  </>
                ) : 'Create Member'}
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

// Create Service Modal komponenta
const CreateServiceModal = ({ onClose, onSuccess, employeeLocationId }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    priceEur: '',
    durationMinutes: '',
    maxCapacity: '',
    isActive: true,
    locationIds: employeeLocationId ? [employeeLocationId] : []
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const requiredFields = ['name', 'priceEur', 'durationMinutes', 'maxCapacity'];
    for (const field of requiredFields) {
      if (!formData[field] || !formData[field].toString().trim()) {
        setError(`${field.replace(/([A-Z])/g, ' $1')} is required`);
        return;
      }
    }

    try {
      setLoading(true);
      
      const serviceData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        priceEur: parseFloat(formData.priceEur),
        durationMinutes: parseInt(formData.durationMinutes),
        maxCapacity: parseInt(formData.maxCapacity),
        locationIds: formData.locationIds
      };

      await createService(serviceData);
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Create service error:', err);
      setError(err.message || 'Failed to create service');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🏋️ Create New Service</h2>
          <button onClick={onClose} className="modal-close">&times;</button>
        </div>
        
        <div className="modal-body">
          {error && <div className="error-message">❌ {error}</div>}
          
          {employeeLocationId && (
            <div className="location-info-banner">
              <span>📍 Creating service for <strong>Location #{employeeLocationId}</strong></span>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="service-form">
            <div className="form-group">
              <label>Service Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Yoga Class"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe the service..."
                rows="3"
                disabled={loading}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Price (EUR) *</label>
                <input
                  type="number"
                  name="priceEur"
                  value={formData.priceEur}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label>Duration (minutes) *</label>
                <input
                  type="number"
                  name="durationMinutes"
                  value={formData.durationMinutes}
                  onChange={handleInputChange}
                  required
                  min="1"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Max Capacity *</label>
              <input
                type="number"
                name="maxCapacity"
                value={formData.maxCapacity}
                onChange={handleInputChange}
                required
                min="1"
                disabled={loading}
              />
            </div>

            <div className="form-group form-check">
              <input
                type="checkbox"
                className="form-check-input"
                name="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
                id="isActive"
              />
              <label className="form-check-label" htmlFor="isActive">
                Active Service
              </label>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Creating Service...
                  </>
                ) : 'Create Service'}
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

// Create Appointment Modal komponenta
const CreateAppointmentModal = ({ onClose, onSuccess, employeeLocationId }) => {
  const [formData, setFormData] = useState({
    serviceId: '',
    memberId: '',
    startTime: '',
    notes: ''
  });
  
  const [services, setServices] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, [employeeLocationId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const servicesData = await getServicesForMyLocation();
      setServices(servicesData);
      
      const membersData = await getMembersForMyLocation();
      setMembers(membersData);
      
      console.log('Services for location:', servicesData.length);
      console.log('Members for location:', membersData.length);
      
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.serviceId || !formData.memberId || !formData.startTime) {
      setError('Please fill all required fields.');
      return;
    }

    try {
      setLoading(true);
      
      const appointmentData = {
        serviceId: formData.serviceId,
        memberId: formData.memberId,
        startTime: new Date(formData.startTime).toISOString(),
        notes: formData.notes || ''
      };

      console.log('Sending appointment data:', appointmentData);
      
      await createAppointment(appointmentData);
      
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Create appointment error:', err);
      setError(err.message || 'Failed to create appointment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📅 Schedule Appointment</h2>
          <button onClick={onClose} className="modal-close">&times;</button>
        </div>
        
        <div className="modal-body">
          {employeeLocationId && (
            <div className="location-info-banner">
              <span>📍 Scheduling for <strong>Location #{employeeLocationId}</strong> members only</span>
            </div>
          )}
          
          {error && <div className="error-message">❌ {error}</div>}
          
          {loading ? (
            <div className="loading">Loading data...</div>
          ) : members.length === 0 ? (
            <div className="no-data">
              <p>No members found at your location.</p>
              <p>Please create members first.</p>
            </div>
          ) : services.length === 0 ? (
            <div className="no-data">
              <p>No services available at your location.</p>
              <p>Please create services first.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="appointment-form">
              <div className="form-group">
                <label>Member *</label>
                <select
                  name="memberId"
                  value={formData.memberId}
                  onChange={(e) => setFormData({...formData, memberId: e.target.value})}
                  required
                  disabled={loading}
                >
                  <option value="">Select a member</option>
                  {members.map(member => (
                    <option key={member.id} value={member.id}>
                      {member.firstName} {member.lastName} (ID: {member.id})
                    </option>
                  ))}
                </select>
                <small className="form-hint">
                  Showing only members from your location
                </small>
              </div>

              <div className="form-group">
                <label>Service *</label>
                <select
                  name="serviceId"
                  value={formData.serviceId}
                  onChange={(e) => setFormData({...formData, serviceId: e.target.value})}
                  required
                  disabled={loading}
                >
                  <option value="">Select a service</option>
                  {services.map(service => (
                    <option key={service.id} value={service.id}>
                      {service.name} - €{service.priceEur} ({service.durationMinutes} min)
                    </option>
                  ))}
                </select>
                <small className="form-hint">
                  Showing only services available at your location
                </small>
              </div>

              <div className="form-group">
                <label>Date & Time *</label>
                <input
                  type="datetime-local"
                  name="startTime"
                  value={formData.startTime}
                  onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                  required
                  disabled={loading}
                  min={new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString().slice(0, 16)}
                />
                <small className="form-hint">
                  Must be at least 2 hours from now (08:00 - 22:00 only)
                </small>
              </div>

              <div className="form-group">
                <label>Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Any special notes..."
                  rows="3"
                  disabled={loading}
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="spinner"></span>
                      Scheduling...
                    </>
                  ) : 'Schedule Appointment'}
                </button>
                <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

// Glavna EmployeeDashboard komponenta
const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [members, setMembers] = useState([]);
  const [services, setServices] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [reservations, setReservations] = useState([]); // Za rezervacije tab
  const [capacityData, setCapacityData] = useState([]); // Za kapacitet tab
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateServiceModal, setShowCreateServiceModal] = useState(false);
  const [showCreateAppointmentModal, setShowCreateAppointmentModal] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      navigate('/login');
      return;
    }
    setUser(currentUser);
    
    if (activeTab === 'members') {
      fetchMembers();
    }
    
    if (activeTab === 'services') {
      fetchServices();
    }
    
    if (activeTab === 'reservations') {
      fetchReservations();
    }
    
    if (activeTab === 'capacity') {
      fetchCapacityData();
    }
  }, [navigate, activeTab]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const data = await getAllMembers();
      setMembers(data);
    } catch (err) {
      console.error('Error fetching members:', err);
      setError('Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    try {
      setLoading(true);
      const data = await getAllServices();
      setServices(data);
    } catch (err) {
      console.error('Error fetching services:', err);
      setError('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const data = await getReservationsByLocation();
      console.log('Fetched reservations:', data);
      setReservations(data);
    } catch (err) {
      console.error('Error fetching reservations:', err);
      setError('Failed to load reservations');
    } finally {
      setLoading(false);
    }
  };

  const fetchCapacityData = async () => {
    try {
      setLoading(true);
      if (user?.locationId) {
        const data = await getLocationAppointmentsCapacity(user.locationId);
        console.log('Fetched capacity data:', data);
        setCapacityData(data);
      }
    } catch (err) {
      console.error('Error fetching capacity data:', err);
      setError('Failed to load capacity data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  const handleCreateMember = () => {
    if (!hasPermission('CREATE_MEMBER')) {
      setError('You do not have permission to create members. Please contact an administrator.');
      return;
    }
    
    if (user.role === 'EMPLOYEE' && !user.locationId) {
      setError('Your account is not assigned to any location. Please contact administrator.');
      return;
    }
    
    setShowCreateModal(true);
  };

  const handleCreateService = () => {
    if (user.role === 'EMPLOYEE' && !user.locationId) {
      setError('Your account is not assigned to any location. Please contact administrator.');
      return;
    }
    
    setShowCreateServiceModal(true);
  };

  const handleCreateAppointment = () => {
    if (user.role === 'EMPLOYEE' && !user.locationId) {
      setError('Your account is not assigned to any location. Please contact administrator.');
      return;
    }
    
    setShowCreateAppointmentModal(true);
  };

  const handleConfirmReservation = async (reservationId) => {
    try {
      await updateReservationStatus(reservationId, 'CONFIRMED');
      setSuccessMessage('Reservation confirmed successfully!');
      fetchReservations();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to confirm reservation');
    }
  };

  const handleCancelReservation = async (reservationId) => {
    if (window.confirm('Are you sure you want to cancel this reservation?')) {
      try {
        await updateReservationStatus(reservationId, 'CANCELLED');
        setSuccessMessage('Reservation cancelled successfully!');
        fetchReservations();
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (err) {
        setError(err.message || 'Failed to cancel reservation');
      }
    }
  };

  const handleDeleteReservation = async (reservationId) => {
    if (window.confirm('Are you sure you want to delete this reservation? This action cannot be undone.')) {
      try {
        await deleteReservation(reservationId);
        setSuccessMessage('Reservation deleted successfully!');
        fetchReservations();
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (err) {
        setError(err.message || 'Failed to delete reservation');
      }
    }
  };

  const handleViewMember = (memberId) => {
    console.log('View member:', memberId);
  };

  const handleEditMember = (memberId) => {
    console.log('Edit member:', memberId);
  };

  const handleViewService = (serviceId) => {
    console.log('View service:', serviceId);
  };

  const handleEditService = (serviceId) => {
    console.log('Edit service:', serviceId);
  };

  // Helper funkcije za formatiranje
  // Helper funkcije za formatiranje - ISPRAVLJENA VERZIJA
const formatTime = (dateTime) => {
  if (!dateTime) return 'N/A';
  
  try {
    let date;
    
    // Provera 1: Ako je array - konvertuj u Date
    if (Array.isArray(dateTime)) {
      const [year, month, day, hour, minute, second] = dateTime;
      date = new Date(year, month - 1, day, hour, minute, second);
    } 
    // Provera 2: Ako je string
    else if (typeof dateTime === 'string') {
      date = new Date(dateTime);
    } 
    // Provera 3: Ako je već Date objekat
    else if (dateTime instanceof Date) {
      date = dateTime;
    } 
    else {
      return 'N/A';
    }
    
    // Provera da li je validan datum
    if (isNaN(date.getTime())) {
      return 'N/A';
    }
    
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  } catch (err) {
    console.warn('Time formatting error:', err);
    return 'N/A';
  }
};

const formatDate = (dateTime) => {
  if (!dateTime) return 'N/A';
  
  try {
    let date;
    
    // Provera 1: Ako je array - konvertuj u Date
    if (Array.isArray(dateTime)) {
      const [year, month, day, hour, minute, second] = dateTime;
      date = new Date(year, month - 1, day, hour, minute, second);
    } 
    // Provera 2: Ako je string
    else if (typeof dateTime === 'string') {
      date = new Date(dateTime);
    } 
    // Provera 3: Ako je već Date objekat
    else if (dateTime instanceof Date) {
      date = dateTime;
    } 
    else {
      return 'N/A';
    }
    
    // Provera da li je validan datum
    if (isNaN(date.getTime())) {
      return 'N/A';
    }
    
    return date.toLocaleDateString([], {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } catch (err) {
    console.warn('Date formatting error:', err);
    return 'N/A';
  }
};

  const getReservationStatusColor = (status) => {
    switch(status?.toUpperCase()) {
      case 'CONFIRMED': return 'status-confirmed';
      case 'CANCELLED': return 'status-cancelled';
      case 'ATTENDED': return 'status-attended';
      case 'NO_SHOW': return 'status-no-show';
      default: return 'status-pending';
    }
  };

  const renderDashboardTab = () => (
    <>
      <h2>Today's Schedule</h2>
      
      <div className="schedule-grid">
        <div className="schedule-card">
          <h3>Morning Session</h3>
          <p>Time: 9:00 AM - 11:00 AM</p>
          <p>Members: 8</p>
          <button className="schedule-button">
            View Details
          </button>
        </div>
        
        <div className="schedule-card">
          <h3>Afternoon Session</h3>
          <p>Time: 2:00 PM - 4:00 PM</p>
          <p>Members: 6</p>
          <button className="schedule-button">
            View Details
          </button>
        </div>
        
        <div className="schedule-card">
          <h3>Evening Session</h3>
          <p>Time: 6:00 PM - 8:00 PM</p>
          <p>Members: 10</p>
          <button className="schedule-button">
            View Details
          </button>
        </div>
      </div>

      <div className="actions-section">
        <h3>Quick Actions</h3>
        <div className="actions-grid">
          <button className="action-button" onClick={() => setActiveTab('members')}>
            👥 Manage Members
          </button>
          <button className="action-button" onClick={() => setActiveTab('services')}>
            🏋️ Manage Services
          </button>
          <button className="action-button" onClick={() => setActiveTab('appointments')}>
            📅 Manage Appointments
          </button>
          <button className="action-button" onClick={() => setActiveTab('reservations')}>
            📋 Manage Reservations
          </button>
          <button className="action-button" onClick={() => setActiveTab('capacity')}>
            📊 View Capacity
          </button>
        </div>
      </div>

      <div className="tasks-section">
        <h3>Pending Tasks</h3>
        <div className="tasks-list">
          <div className="task-item">
            <input type="checkbox" />
            <span>Follow up with John Doe</span>
          </div>
          <div className="task-item">
            <input type="checkbox" />
            <span>Review progress for 5 members</span>
          </div>
          <div className="task-item">
            <input type="checkbox" />
            <span>Update workout plans</span>
          </div>
        </div>
      </div>
    </>
  );

  const renderMembersTab = () => {
    const canCreateMember = hasPermission('CREATE_MEMBER');
    
    return (
      <>
        <div className="tab-header">
          <h2>Member Management</h2>
          {canCreateMember ? (
            <button 
              className="create-button"
              onClick={handleCreateMember}
              disabled={loading}
            >
              + Add New Member
            </button>
          ) : (
            <div className="permission-alert">
              <span>⛔ You don't have permission to create members</span>
              <button 
                className="contact-admin-btn"
                onClick={() => {
                  alert('Please contact your administrator to request CREATE_MEMBER permission.');
                }}
              >
                Request Permission
              </button>
            </div>
          )}
        </div>
        
        {error && (
          <div className="error-message">
            ❌ {error}
          </div>
        )}
        
        {successMessage && (
          <div className="success-message">
            ✅ {successMessage}
          </div>
        )}
        
        {loading ? (
          <div className="loading">Loading members...</div>
        ) : members.length === 0 ? (
          <div className="no-data">
            <p>No members found.</p>
            {canCreateMember && (
              <button 
                className="create-button"
                onClick={handleCreateMember}
              >
                Create Your First Member
              </button>
            )}
          </div>
        ) : (
          <div className="members-table">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Membership</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.id}>
                    <td>{member.id}</td>
                    <td>
                      <strong>{member.firstName} {member.lastName}</strong>
                    </td>
                    <td>{member.email}</td>
                    <td>{member.phone || 'N/A'}</td>
                    <td>
                      <span className="membership-badge">{member.membershipType || 'BASIC'}</span>
                    </td>
                    <td>
                      <span className={`status-badge ${member.status?.toLowerCase() || 'active'}`}>
                        {member.status || 'ACTIVE'}
                      </span>
                    </td>
                    <td>
                      <div className="member-actions">
                        <button 
                          className="view-button"
                          onClick={() => handleViewMember(member.id)}
                        >
                          View
                        </button>
                        <button 
                          className="edit-button"
                          onClick={() => handleEditMember(member.id)}
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </>
    );
  };

  const renderServicesTab = () => {
    const canCreateService = hasPermission('CREATE_SERVICE') || user?.role === 'EMPLOYEE';
    
    return (
      <>
        <div className="tab-header">
          <h2>Service Management</h2>
          {canCreateService ? (
            <button 
              className="create-button"
              onClick={handleCreateService}
              disabled={loading}
            >
              + Add New Service
            </button>
          ) : (
            <div className="permission-alert">
              <span>⛔ You don't have permission to create services</span>
            </div>
          )}
        </div>
        
        {error && (
          <div className="error-message">
            ❌ {error}
          </div>
        )}
        
        {successMessage && (
          <div className="success-message">
            ✅ {successMessage}
          </div>
        )}
        
        {loading ? (
          <div className="loading">Loading services...</div>
        ) : services.length === 0 ? (
          <div className="no-data">
            <p>No services found.</p>
            {canCreateService && (
              <button 
                className="create-button"
                onClick={handleCreateService}
              >
                Create Your First Service
              </button>
            )}
          </div>
        ) : (
          <div className="services-table">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Price (EUR)</th>
                  <th>Duration</th>
                  <th>Capacity</th>
                  <th>Status</th>
                  <th>Locations</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {services.map((service) => (
                  <tr key={service.id}>
                    <td>{service.id}</td>
                    <td>
                      <strong>{service.name}</strong>
                    </td>
                    <td>{service.description || 'N/A'}</td>
                    <td>€{service.priceEur?.toFixed(2) || '0.00'}</td>
                    <td>{service.durationMinutes} min</td>
                    <td>{service.maxCapacity} people</td>
                    <td>
                      <span className={`status-badge ${service.isActive ? 'active' : 'inactive'}`}>
                        {service.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td>
                      {service.locationNames?.join(', ') || `Location ${service.locationIds?.join(', ')}`}
                    </td>
                    <td>
                      <div className="service-actions">
                        <button className="view-button" onClick={() => handleViewService(service.id)}>
                          View
                        </button>
                        <button className="edit-button" onClick={() => handleEditService(service.id)}>
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </>
    );
  };

  const renderReservationsTab = () => {
    return (
      <>
        <div className="tab-header">
          <h2>📋 Reservation Management</h2>
          <div className="tab-header-actions">
            <button 
              className="refresh-button"
              onClick={fetchReservations}
              disabled={loading}
            >
              🔄 Refresh
            </button>
          </div>
        </div>
        
        {error && (
          <div className="error-message">
            ❌ {error}
          </div>
        )}
        
        {successMessage && (
          <div className="success-message">
            ✅ {successMessage}
          </div>
        )}
        
        <div className="reservations-info">
          <div className="location-info-banner" style={{marginBottom: '20px'}}>
            <span>📍 Showing reservations for <strong>Location #{user?.locationId}</strong></span>
          </div>
        </div>
        
        <div className="reservations-section">
          <div className="section-header">
            <h3>All Reservations</h3>
            <div className="reservations-summary">
              <div className="summary-item">
                <span className="summary-label">Total:</span>
                <span className="summary-value">{reservations.length}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Confirmed:</span>
                <span className="summary-value">
                  {reservations.filter(r => r.status === 'CONFIRMED').length}
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Attended:</span>
                <span className="summary-value">
                  {reservations.filter(r => r.status === 'ATTENDED').length}
                </span>
              </div>
            </div>
          </div>
          
          {loading ? (
            <div className="loading">Loading reservations...</div>
          ) : reservations.length === 0 ? (
            <div className="no-data">
              <p>No reservations found.</p>
              <p>Reservations will appear here when members book appointments.</p>
            </div>
          ) : (
            <div className="reservations-table">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Appointment</th>
                    <th>Member</th>
                    <th>Service</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reservations.map((reservation) => (
                    <tr key={reservation.id} className="reservation-row">
                      <td>{reservation.id}</td>
                      <td>
                        <div className="appointment-info">
                          <div className="appointment-time">
                            <strong>{formatTime(reservation.appointmentStartTime)}</strong>
                            <div className="appointment-date">{formatDate(reservation.appointmentStartTime)}</div>
                          </div>
                          <div className="appointment-duration">
                            {reservation.serviceName}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="member-info">
                          <strong>{reservation.memberName || `Member #${reservation.memberId}`}</strong>
                          <div className="member-id">ID: {reservation.memberId}</div>
                        </div>
                      </td>
                      <td>{reservation.serviceName}</td>
                      <td>
                        <span className={`status-badge ${getReservationStatusColor(reservation.status)}`}>
                          {reservation.status || 'PENDING'}
                        </span>
                      </td>
                      <td>
                        <div className="created-info">
                          {formatDate(reservation.createdAt)}
                        </div>
                      </td>
                      <td>
                        <div className="reservation-actions">
                          {reservation.status === 'CONFIRMED' && (
                            <>
                              <button
                                onClick={() => updateReservationStatus(reservation.id, 'ATTENDED')}
                                className="action-btn attended-btn"
                                title="Mark as Attended"
                              >
                                👤
                              </button>
                              <button
                                onClick={() => updateReservationStatus(reservation.id, 'NO_SHOW')}
                                className="action-btn noshow-btn"
                                title="Mark as No Show"
                              >
                                🚫
                              </button>
                            </>
                          )}
                          
                          {reservation.status !== 'CANCELLED' && (
                            <button
                              onClick={() => handleCancelReservation(reservation.id)}
                              className="action-btn cancel-btn"
                              title="Cancel Reservation"
                            >
                              ✗
                            </button>
                          )}
                          
                          <button
                            onClick={() => handleDeleteReservation(reservation.id)}
                            className="action-btn delete-btn"
                            title="Delete Reservation"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </>
    );
  };

  const renderCapacityTab = () => {
    return (
      <>
        <div className="tab-header">
          <h2>📊 Capacity Management</h2>
          <div className="tab-header-actions">
            <button 
              className="refresh-button"
              onClick={fetchCapacityData}
              disabled={loading}
            >
              🔄 Refresh
            </button>
          </div>
        </div>
        
        {error && (
          <div className="error-message">
            ❌ {error}
          </div>
        )}
        
        <div className="capacity-info">
          <div className="location-info-banner" style={{marginBottom: '20px'}}>
            <span>📍 Showing capacity for <strong>Location #{user?.locationId}</strong></span>
          </div>
          
          <div className="instructions-box">
            <h4>Capacity Overview:</h4>
            <ul>
              <li><strong>Max Capacity:</strong> Total available spots for appointment</li>
              <li><strong>Current Capacity:</strong> Number of booked spots</li>
              <li><strong>Available Spaces:</strong> Remaining spots</li>
              <li>Click refresh to update real-time capacity</li>
            </ul>
          </div>
        </div>
        
        <div className="capacity-section">
          <h3>Today's Capacity Status</h3>
          
          {loading ? (
            <div className="loading">Loading capacity data...</div>
          ) : capacityData.length === 0 ? (
            <div className="no-data">
              <p>No capacity data available.</p>
              <p>Schedule appointments to see capacity information.</p>
            </div>
          ) : (
            <div className="capacity-grid">
              {capacityData.map((capacity) => (
                <div key={capacity.appointmentId} className="capacity-card">
                  <div className="capacity-header">
                    <h4>{capacity.serviceName || `Appointment #${capacity.appointmentId}`}</h4>
                    <div className="capacity-time">
                      {formatTime(capacity.startTime)} - {formatTime(capacity.endTime)}
                    </div>
                  </div>
                  
                  <div className="capacity-details">
                    <div className="capacity-item">
                      <span className="capacity-label">Max Capacity:</span>
                      <span className="capacity-value">{capacity.maxCapacity}</span>
                    </div>
                    
                    <div className="capacity-item">
                      <span className="capacity-label">Booked:</span>
                      <span className="capacity-value booked">{capacity.currentCapacity}</span>
                    </div>
                    
                    <div className="capacity-item">
                      <span className="capacity-label">Available:</span>
                      <span className={`capacity-value ${
                        capacity.availableSpaces > 5 ? 'available' : 
                        capacity.availableSpaces > 0 ? 'limited' : 'full'
                      }`}>
                        {capacity.availableSpaces}
                      </span>
                    </div>
                  </div>
                  
                  <div className="capacity-progress">
                    <div 
                      className="progress-bar"
                      style={{
                        width: `${(capacity.currentCapacity / capacity.maxCapacity) * 100}%`
                      }}
                    ></div>
                  </div>
                  
                  <div className="capacity-status">
                    {capacity.availableSpaces === 0 ? (
                      <span className="status-badge full">FULL</span>
                    ) : capacity.availableSpaces <= 3 ? (
                      <span className="status-badge limited">LIMITED</span>
                    ) : (
                      <span className="status-badge available">AVAILABLE</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="capacity-stats">
            <div className="stat-item">
              <div className="stat-number">
                {capacityData.reduce((sum, cap) => sum + cap.maxCapacity, 0)}
              </div>
              <div className="stat-label">Total Capacity</div>
            </div>
            
            <div className="stat-item">
              <div className="stat-number booked">
                {capacityData.reduce((sum, cap) => sum + cap.currentCapacity, 0)}
              </div>
              <div className="stat-label">Total Booked</div>
            </div>
            
            <div className="stat-item">
              <div className="stat-number available">
                {capacityData.reduce((sum, cap) => sum + cap.availableSpaces, 0)}
              </div>
              <div className="stat-label">Total Available</div>
            </div>
          </div>
        </div>
      </>
    );
  };

  const renderAppointmentsTab = () => {
    const canCreateAppointment = hasPermission('CREATE_APPOINTMENT') || user?.role === 'EMPLOYEE';
    
    return (
      <>
        <div className="tab-header">
          <h2>📅 Appointment Management</h2>
          <div className="tab-header-actions">
            {canCreateAppointment ? (
              <button 
                className="create-button"
                onClick={handleCreateAppointment}
                disabled={loading}
              >
                + Schedule Appointment
              </button>
            ) : (
              <div className="permission-alert">
                <span>⛔ No permission to schedule appointments</span>
              </div>
            )}
          </div>
        </div>
        
        {error && (
          <div className="error-message">
            ❌ {error}
          </div>
        )}
        
        {successMessage && (
          <div className="success-message">
            ✅ {successMessage}
          </div>
        )}
        
        <div className="appointments-info">
          <div className="location-info-banner" style={{marginBottom: '20px'}}>
            <span>📍 You can schedule appointments only for members at <strong>Location #{user?.locationId}</strong></span>
          </div>
          
          <div className="instructions-box">
            <h4>How to schedule an appointment:</h4>
            <ol>
              <li>Select a member from <strong>your location only</strong></li>
              <li>Choose a service available at your location</li>
              <li>Pick a date & time (at least 2 hours in advance, 08:00 - 22:00 only)</li>
              <li>Add any notes if needed</li>
            </ol>
          </div>
        </div>
      </>
    );
  };

  if (!user) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="employee-dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>👨‍💼 Employee Dashboard</h1>
          <div className="user-role">
            <span className="role-badge">{user.role}</span>
            {user.locationName && (
              <span className="location-badge">📍 {user.locationName} (ID: {user.locationId})</span>
            )}
            {user.locationId && !user.locationName && (
              <span className="location-badge">📍 Location ID: {user.locationId}</span>
            )}
          </div>
        </div>
        
        <div className="user-info">
          <span className="welcome-text">Welcome, {user.firstName || user.email}</span>
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </div>
      </header>

      <div className="tab-navigation">
        <button 
          className={`tab-button ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          📊 Dashboard
        </button>
        <button 
          className={`tab-button ${activeTab === 'members' ? 'active' : ''}`}
          onClick={() => setActiveTab('members')}
        >
          👥 Members
        </button>
        <button 
          className={`tab-button ${activeTab === 'services' ? 'active' : ''}`}
          onClick={() => setActiveTab('services')}
        >
          🏋️ Services
        </button>
        <button 
          className={`tab-button ${activeTab === 'appointments' ? 'active' : ''}`}
          onClick={() => setActiveTab('appointments')}
        >
          📅 Appointments
        </button>
        <button 
          className={`tab-button ${activeTab === 'reservations' ? 'active' : ''}`}
          onClick={() => setActiveTab('reservations')}
        >
          📋 Reservations
        </button>
        <button 
          className={`tab-button ${activeTab === 'capacity' ? 'active' : ''}`}
          onClick={() => setActiveTab('capacity')}
        >
          📊 Capacity
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'dashboard' && renderDashboardTab()}
        {activeTab === 'members' && renderMembersTab()}
        {activeTab === 'services' && renderServicesTab()}
        {activeTab === 'appointments' && renderAppointmentsTab()}
        {activeTab === 'reservations' && renderReservationsTab()}
        {activeTab === 'capacity' && renderCapacityTab()}
      </div>

      {showCreateModal && (
        <CreateMemberModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setSuccessMessage('Member created successfully!');
            fetchMembers();
            setTimeout(() => setSuccessMessage(''), 5000);
          }}
          employeeLocationId={user?.locationId}
        />
      )}

      {showCreateServiceModal && (
        <CreateServiceModal
          onClose={() => setShowCreateServiceModal(false)}
          onSuccess={() => {
            setSuccessMessage('Service created successfully!');
            fetchServices();
            setTimeout(() => setSuccessMessage(''), 5000);
          }}
          employeeLocationId={user?.locationId}
        />
      )}

      {showCreateAppointmentModal && (
        <CreateAppointmentModal
          onClose={() => setShowCreateAppointmentModal(false)}
          onSuccess={() => {
            setSuccessMessage('Appointment scheduled successfully!');
            setTimeout(() => setSuccessMessage(''), 5000);
          }}
          employeeLocationId={user?.locationId}
        />
      )}
    </div>
  );
};

export default EmployeeDashboard;