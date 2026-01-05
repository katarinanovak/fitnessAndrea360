// src/views/dashboard/AdminDashboard.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, logout, hasPermission } from '../../services/authService';
import '../../styles/dashboard/AdminDashboard.css';
import '../../styles/dashboard/EmployeeDashboard.css';

// Import servisa
import { getAllMembers, createMember } from '../../services/memberService';
import { getAllServices, createService } from '../../services/serviceService';
import { 
  createAppointment, 
  getMembersForMyLocation, 
  getServicesForMyLocation 
} from '../../services/appointmentService';
import { 
  getReservationsByLocation, 
  updateReservationStatus,
  deleteReservation,
  getLocationAppointmentsCapacity
} from '../../services/reservationService';
import { 
  createLocation, 
  getAllLocations, 
  deleteLocation,
  getLocationById,
  updateLocation 
} from '../../services/locationService';

// Create Member Modal
const CreateMemberModal = ({ onClose, onSuccess, employeeLocationId, locations }) => {
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
      const locationName = locations?.find(l => l.id === employeeLocationId)?.name || `Location #${employeeLocationId}`;
      return (
        <div className="form-group">
          <label>Location *</label>
          <input
            type="text"
            value={locationName}
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
          <label>Location *</label>
          <select
            name="locationId"
            value={formData.locationId}
            onChange={handleInputChange}
            required
            disabled={loading || !locations.length}
          >
            <option value="">Select a location</option>
            {locations.map(location => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </select>
          <small className="form-hint">Select where the member will train</small>
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

// Create Service Modal
const CreateServiceModal = ({ onClose, onSuccess, employeeLocationId, locations }) => {
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

    // Provera za locationIds
    if (!formData.locationIds || formData.locationIds.length === 0) {
      setError('At least one location must be selected');
      return;
    }

    try {
      setLoading(true);
      
      const serviceData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        priceEur: parseFloat(formData.priceEur),
        durationMinutes: parseInt(formData.durationMinutes),
        maxCapacity: parseInt(formData.maxCapacity),
        locationIds: formData.locationIds.map(id => parseInt(id))
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

  const handleLocationChange = (e) => {
    const options = e.target.options;
    const selectedIds = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selectedIds.push(parseInt(options[i].value));
      }
    }
    setFormData(prev => ({
      ...prev,
      locationIds: selectedIds
    }));
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

            <div className="form-group">
              <label>Available Locations *</label>
              <select
                multiple
                name="locationIds"
                value={formData.locationIds}
                onChange={handleLocationChange}
                required
                disabled={loading || employeeLocationId}
                size={Math.min(4, locations.length)}
                className="multi-select"
              >
                {locations.map(location => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
              <small className="form-hint">
                {employeeLocationId 
                  ? "Service will be available only at your assigned location"
                  : "Hold Ctrl/Cmd to select multiple locations"}
              </small>
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

// Create Appointment Modal
const CreateAppointmentModal = ({ onClose, onSuccess, employeeLocationId, locations }) => {
  const [formData, setFormData] = useState({
    serviceId: '',
    memberId: '',
    startTime: '',
    notes: '',
    locationId: employeeLocationId || '' // DODATA LOKACIJA
  });
  
  const [services, setServices] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedLocationName, setSelectedLocationName] = useState('');

  useEffect(() => {
    if (employeeLocationId && locations.length > 0) {
      const location = locations.find(l => l.id === employeeLocationId);
      setSelectedLocationName(location?.name || `Location #${employeeLocationId}`);
    }
  }, [employeeLocationId, locations]);

  useEffect(() => {
    if (employeeLocationId) {
      fetchData();
    }
  }, [employeeLocationId]);

  const fetchData = async () => {
    if (!employeeLocationId) {
      setError('Please select a location first');
      return;
    }

    try {
      setLoading(true);
      
      // Fetch services for selected location
      const allServices = await getAllServices();
      const servicesData = allServices.filter(service => 
        service.locationIds?.includes(employeeLocationId)
      );
      setServices(servicesData);
      
      // Fetch members for selected location
      const allMembers = await getAllMembers();
      const membersData = allMembers.filter(member => 
        member.locationId === employeeLocationId
      );
      setMembers(membersData);
      
      if (servicesData.length === 0) {
        setError('No services available at this location. Please create services first.');
      }
      
      if (membersData.length === 0) {
        setError('No members found at this location. Please create members first.');
      }
      
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

    // VALIDACIJA
    if (!employeeLocationId) {
      setError('⚠️ Location is not selected. Please select a location first.');
      return;
    }

    if (!formData.serviceId || !formData.memberId || !formData.startTime) {
      setError('Please fill all required fields.');
      return;
    }

    try {
      setLoading(true);
      
      // OBAVEZNO DODAJ locationId ZA ADMINA
      const appointmentData = {
        serviceId: parseInt(formData.serviceId),
        memberId: parseInt(formData.memberId),
        startTime: new Date(formData.startTime).toISOString(),
        notes: formData.notes || '',
        locationId: employeeLocationId // OVO JE KLJUČNO ZA ADMINA
      };

      console.log('📤 Sending appointment data:', appointmentData);

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📅 Schedule Appointment</h2>
          <button onClick={onClose} className="modal-close">&times;</button>
        </div>
        
        <div className="modal-body">
          {/* PRIKAZ SELEKTOVANE LOKACIJE */}
          {employeeLocationId ? (
            <div className="selected-location-banner">
              <strong>📍 Selected Location:</strong> {selectedLocationName}
            </div>
          ) : (
            <div className="error-banner">
              ⚠️ No location selected. Please go back and select a location first.
            </div>
          )}
          
          {error && <div className="error-message">❌ {error}</div>}
          
          {!employeeLocationId ? (
            <div className="no-data">
              <p>Please select a location to continue.</p>
              <button type="button" className="btn-secondary" onClick={onClose}>
                Go Back
              </button>
            </div>
          ) : loading ? (
            <div className="loading">Loading data...</div>
          ) : members.length === 0 ? (
            <div className="no-data">
              <p>No members found at {selectedLocationName}.</p>
              <p>Please create members first.</p>
            </div>
          ) : services.length === 0 ? (
            <div className="no-data">
              <p>No services available at {selectedLocationName}.</p>
              <p>Please create services first.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="appointment-form">
              <div className="form-group">
                <label>Member *</label>
                <select
                  name="memberId"
                  value={formData.memberId}
                  onChange={handleInputChange}
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
                  Showing only members from {selectedLocationName}
                </small>
              </div>

              <div className="form-group">
                <label>Service *</label>
                <select
                  name="serviceId"
                  value={formData.serviceId}
                  onChange={handleInputChange}
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
                  Showing only services available at {selectedLocationName}
                </small>
              </div>

              <div className="form-group">
                <label>Date & Time *</label>
                <input
                  type="datetime-local"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                  min={new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString().slice(0, 16)}
                />
                <small className="form-hint">
                  Must be at least 2 hours from now
                </small>
              </div>

              <div className="form-group">
                <label>Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Any special notes..."
                  rows="3"
                  disabled={loading}
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary" disabled={loading || !employeeLocationId}>
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

// Edit Location Modal
const EditLocationModal = ({ location, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: location?.name || '',
    address: location?.address || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

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
    
    if (!formData.name.trim() || !formData.address.trim()) {
      setError('Both name and address are required');
      return;
    }

    try {
      setLoading(true);
      await onSave(location.id, formData);
    } catch (err) {
      setError(err.message || 'Failed to update location');
    } finally {
      setLoading(false);
    }
  };

  if (!location) return null;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>✏️ Edit Location</h2>
          <button onClick={onClose} className="modal-close">&times;</button>
        </div>
        
        <div className="modal-body">
          {error && <div className="error-message">❌ {error}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Location Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter location name"
                required
                disabled={loading}
              />
            </div>
            
            <div className="form-group">
              <label>Address *</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Enter full address"
                rows="4"
                required
                disabled={loading}
              />
            </div>
            
            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Saving...
                  </>
                ) : 'Save Changes'}
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

// Glavna AdminDashboard komponenta
const AdminDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [members, setMembers] = useState([]);
  const [services, setServices] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [capacityData, setCapacityData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateServiceModal, setShowCreateServiceModal] = useState(false);
  const [showCreateAppointmentModal, setShowCreateAppointmentModal] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  const [locations, setLocations] = useState([]);
  const [showCreateLocationForm, setShowCreateLocationForm] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [locationFormData, setLocationFormData] = useState({
    name: '',
    address: ''
  });

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      navigate('/login');
      return;
    }
    setUser(currentUser);
    
    if (currentUser.role === 'ADMIN') {
      fetchLocations();
    }
    
    refreshCurrentTabData();
  }, [navigate, activeTab, selectedLocationId]);

  const refreshCurrentTabData = () => {
    if (activeTab === 'members') {
      fetchMembers();
    } else if (activeTab === 'services') {
      fetchServices();
    } else if (activeTab === 'reservations') {
      fetchReservations();
    } else if (activeTab === 'capacity') {
      fetchCapacityData();
    } else if (activeTab === 'locations') {
      fetchLocations();
    }
  };

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const data = await getAllLocations();
      setLocations(data);
      if (data.length > 0 && !selectedLocationId) {
        setSelectedLocationId(data[0].id);
      }
    } catch (err) {
      console.error('Error fetching locations:', err);
      setError('Failed to load locations');
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      setLoading(true);
      let data = await getAllMembers();
      if (user?.role === 'ADMIN' && selectedLocationId) {
        data = data.filter(member => member.locationId === selectedLocationId);
      }
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
      let data = await getAllServices();
      if (user?.role === 'ADMIN' && selectedLocationId) {
        data = data.filter(service => 
          service.locationIds?.includes(selectedLocationId)
        );
      }
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
      if (user?.role === 'ADMIN' && !selectedLocationId) {
        setError('Please select a location first');
        return;
      }
      
      const locationId = user?.role === 'ADMIN' ? selectedLocationId : user?.locationId;
      if (!locationId) {
        setError('No location selected');
        return;
      }
      
      const data = await getReservationsByLocation(locationId);
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
      if (user?.role === 'ADMIN' && !selectedLocationId) {
        setError('Please select a location first');
        return;
      }
      
      const locationId = user?.role === 'ADMIN' ? selectedLocationId : user?.locationId;
      if (!locationId) {
        setError('No location selected');
        return;
      }
      
      const data = await getLocationAppointmentsCapacity(locationId);
      setCapacityData(data);
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

  const handleCreateLocation = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!locationFormData.name.trim() || !locationFormData.address.trim()) {
      setError('Both name and address are required');
      return;
    }

    try {
      setLoading(true);
      await createLocation(locationFormData);
      setSuccessMessage('Location created successfully!');
      setLocationFormData({ name: '', address: '' });
      setShowCreateLocationForm(false);
      fetchLocations();
    } catch (err) {
      setError(err.message || 'Failed to create location');
    } finally {
      setLoading(false);
    }
  };

  const handleEditLocation = async (locationId) => {
    try {
      setLoading(true);
      const location = await getLocationById(locationId);
      setEditingLocation(location);
    } catch (err) {
      setError('Failed to load location details: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateLocation = async (locationId, updateData) => {
    try {
      setLoading(true);
      await updateLocation(locationId, updateData);
      setSuccessMessage('Location updated successfully!');
      fetchLocations();
      setEditingLocation(null);
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLocation = async (locationId) => {
    if (!window.confirm('Are you sure you want to delete this location?')) {
      return;
    }

    try {
      setLoading(true);
      await deleteLocation(locationId);
      setSuccessMessage('Location deleted successfully!');
      fetchLocations();
    } catch (err) {
      setError(err.message || 'Failed to delete location');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMember = () => {
    if (!hasPermission('CREATE_MEMBER') && user?.role !== 'ADMIN') {
      setError('You do not have permission to create members.');
      return;
    }
    
    if (user?.role === 'ADMIN' && !selectedLocationId) {
      setError('⚠️ Please select a location first from the location selector above.');
      setTimeout(() => setError(''), 5000);
      return;
    }
    
    setShowCreateModal(true);
  };

  const handleCreateService = () => {
    if (user?.role === 'ADMIN' && !selectedLocationId) {
      setError('⚠️ Please select a location first from the location selector above.');
      setTimeout(() => setError(''), 5000);
      return;
    }
    
    setShowCreateServiceModal(true);
  };

  const handleCreateAppointment = () => {
    if (user?.role === 'ADMIN' && !selectedLocationId) {
      setError('⚠️ Please select a location first from the location selector above.');
      setTimeout(() => setError(''), 5000);
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
    if (window.confirm('Are you sure you want to delete this reservation?')) {
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

  // Helper funkcije - ISPRAVLJENA VERZIJA
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

  // Rendering funkcije za tabove
  const renderDashboardTab = () => {
    const selectedLocation = locations.find(l => l.id === selectedLocationId);
    
    return (
      <>
        <h2>Admin Dashboard Overview</h2>
        
        {selectedLocation && (
          <div className="current-location-info">
            <span className="location-indicator">📍 Currently viewing:</span>
            <span className="location-name">{selectedLocation.name}</span>
          </div>
        )}
        
        <div className="admin-stats-grid">
          <div className="stat-card">
            <h3>🏢 Locations</h3>
            <p className="stat-number">{locations.length}</p>
            <button onClick={() => setActiveTab('locations')} className="stat-action">
              Manage Locations
            </button>
          </div>
          
          <div className="stat-card">
            <h3>👥 Total Members</h3>
            <p className="stat-number">{members.length}</p>
            <button onClick={() => setActiveTab('members')} className="stat-action">
              View Members
            </button>
          </div>
          
          <div className="stat-card">
            <h3>🏋️ Total Services</h3>
            <p className="stat-number">{services.length}</p>
            <button onClick={() => setActiveTab('services')} className="stat-action">
              View Services
            </button>
          </div>
          
          <div className="stat-card">
            <h3>📅 Today's Reservations</h3>
            <p className="stat-number">{reservations.filter(r => 
              new Date(r.createdAt).toDateString() === new Date().toDateString()
            ).length}</p>
            <button onClick={() => setActiveTab('reservations')} className="stat-action">
              View Reservations
            </button>
          </div>
        </div>

        <div className="actions-section">
          <h3>Quick Actions</h3>
          <div className="actions-grid">
            <button className="action-button" onClick={() => setActiveTab('locations')}>
              🏢 Manage Locations
            </button>
            <button className="action-button" onClick={() => navigate('/employee-management')}>
              👥 Manage Employees
            </button>
            <button className="action-button" onClick={handleCreateMember}>
              👤 Create Member
            </button>
            <button className="action-button" onClick={handleCreateService}>
              🏋️ Create Service
            </button>
            <button className="action-button" onClick={handleCreateAppointment}>
              📅 Schedule Appointment
            </button>
            <button className="action-button" onClick={() => setActiveTab('capacity')}>
              📊 View Capacity
            </button>
          </div>
        </div>
      </>
    );
  };

  const renderMembersTab = () => {
    const selectedLocation = locations.find(l => l.id === selectedLocationId);
    
    return (
      <>
        <div className="tab-header">
          <h2>Member Management</h2>
          <div className="tab-header-right">
            {user?.role === 'ADMIN' && (
              <div className="location-selector">
                <label>Location: </label>
                <select 
                  value={selectedLocationId || ''} 
                  onChange={(e) => setSelectedLocationId(parseInt(e.target.value))}
                  disabled={loading}
                >
                  <option value="">-- All Locations --</option>
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <button 
              className="create-button"
              onClick={handleCreateMember}
              disabled={loading || (user?.role === 'ADMIN' && !selectedLocationId)}
            >
              + Add New Member
            </button>
          </div>
        </div>
        
        {error && <div className="error-message">❌ {error}</div>}
        {successMessage && <div className="success-message">✅ {successMessage}</div>}
        
        {selectedLocation && (
          <div className="location-info-banner">
            <span>📍 Showing members for <strong>{selectedLocation.name}</strong></span>
          </div>
        )}
        
        {loading ? (
          <div className="loading">Loading members...</div>
        ) : members.length === 0 ? (
          <div className="no-data">
            <p>No members found.</p>
            <button className="create-button" onClick={handleCreateMember}>
              Create Your First Member
            </button>
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
                  <th>Location</th>
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
                      <span className="location-badge">
                        {locations.find(l => l.id === member.locationId)?.name || `Location ${member.locationId}`}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${member.status?.toLowerCase() || 'active'}`}>
                        {member.status || 'ACTIVE'}
                      </span>
                    </td>
                    <td>
                      <div className="member-actions">
                        <button className="view-button">
                          View
                        </button>
                        <button className="edit-button">
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
    const selectedLocation = locations.find(l => l.id === selectedLocationId);
    
    return (
      <>
        <div className="tab-header">
          <h2>Service Management</h2>
          <div className="tab-header-right">
            {user?.role === 'ADMIN' && (
              <div className="location-selector">
                <label>Location: </label>
                <select 
                  value={selectedLocationId || ''} 
                  onChange={(e) => setSelectedLocationId(parseInt(e.target.value))}
                  disabled={loading}
                >
                  <option value="">-- All Locations --</option>
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <button 
              className="create-button"
              onClick={handleCreateService}
              disabled={loading || (user?.role === 'ADMIN' && !selectedLocationId)}
            >
              + Add New Service
            </button>
          </div>
        </div>
        
        {error && <div className="error-message">❌ {error}</div>}
        {successMessage && <div className="success-message">✅ {successMessage}</div>}
        
        {selectedLocation && (
          <div className="location-info-banner">
            <span>📍 Showing services for <strong>{selectedLocation.name}</strong></span>
          </div>
        )}
        
        {loading ? (
          <div className="loading">Loading services...</div>
        ) : services.length === 0 ? (
          <div className="no-data">
            <p>No services found.</p>
            <button className="create-button" onClick={handleCreateService}>
              Create Your First Service
            </button>
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
                      {service.locationIds?.map(id => 
                        locations.find(l => l.id === id)?.name || `Location ${id}`
                      ).join(', ')}
                    </td>
                    <td>
                      <div className="service-actions">
                        <button className="view-button">View</button>
                        <button className="edit-button">Edit</button>
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

  const renderAppointmentsTab = () => {
    const selectedLocation = locations.find(l => l.id === selectedLocationId);
    
    return (
      <>
        <div className="tab-header">
          <h2>Appointment Management</h2>
          <div className="tab-header-right">
            {user?.role === 'ADMIN' && (
              <div className="location-selector">
                <label>Location: </label>
                <select 
                  value={selectedLocationId || ''} 
                  onChange={(e) => setSelectedLocationId(parseInt(e.target.value))}
                  disabled={loading}
                >
                  <option value="">-- Select Location --</option>
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <button 
              className="create-button"
              onClick={handleCreateAppointment}
              disabled={loading || (user?.role === 'ADMIN' && !selectedLocationId)}
            >
              + Schedule Appointment
            </button>
          </div>
        </div>
        
        {error && <div className="error-message">❌ {error}</div>}
        {successMessage && <div className="success-message">✅ {successMessage}</div>}
        
        {selectedLocation ? (
          <div className="appointments-info">
            <div className="location-info-banner">
              <span>📍 You can schedule appointments only for members at <strong>{selectedLocation.name}</strong></span>
            </div>
            
            <div className="instructions-box">
              <h4>How to schedule an appointment:</h4>
              <ol>
                <li>Select a member from <strong>{selectedLocation.name} only</strong></li>
                <li>Choose a service available at this location</li>
                <li>Pick a date & time (at least 2 hours in advance)</li>
                <li>Add any notes if needed</li>
              </ol>
            </div>
          </div>
        ) : (
          <div className="no-data">
            <p>Please select a location to schedule appointments.</p>
          </div>
        )}
      </>
    );
  };

  const renderReservationsTab = () => {
    const selectedLocation = locations.find(l => l.id === selectedLocationId);
    
    return (
      <>
        <div className="tab-header">
          <h2>Reservation Management</h2>
          <div className="tab-header-right">
            {user?.role === 'ADMIN' && (
              <div className="location-selector">
                <label>Location: </label>
                <select 
                  value={selectedLocationId || ''} 
                  onChange={(e) => setSelectedLocationId(parseInt(e.target.value))}
                  disabled={loading}
                >
                  <option value="">-- Select Location --</option>
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <button 
              className="refresh-button"
              onClick={fetchReservations}
              disabled={loading}
            >
              🔄 Refresh
            </button>
          </div>
        </div>
        
        {error && <div className="error-message">❌ {error}</div>}
        {successMessage && <div className="success-message">✅ {successMessage}</div>}
        
        {selectedLocation ? (
          <>
            <div className="location-info-banner">
              <span>📍 Showing reservations for <strong>{selectedLocation.name}</strong></span>
            </div>
            
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
            
            {loading ? (
              <div className="loading">Loading reservations...</div>
            ) : reservations.length === 0 ? (
              <div className="no-data">
                <p>No reservations found for this location.</p>
              </div>
            ) : (
              <div className="reservations-table">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Member</th>
                      <th>Service</th>
                      <th>Time</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reservations.map((reservation) => (
                      <tr key={reservation.id}>
                        <td>{reservation.id}</td>
                        <td>{reservation.memberName || `Member #${reservation.memberId}`}</td>
                        <td>{reservation.serviceName}</td>
                        <td>{formatTime(reservation.appointmentStartTime)}</td>
                        <td>
                          <span className={`status-badge ${getReservationStatusColor(reservation.status)}`}>
                            {reservation.status || 'PENDING'}
                          </span>
                        </td>
                        <td>
                          <div className="reservation-actions">
                            {reservation.status === 'CONFIRMED' && (
                              <>
                                <button
                                  onClick={() => updateReservationStatus(reservation.id, 'ATTENDED')}
                                  className="action-btn"
                                  title="Mark as Attended"
                                >
                                  👤
                                </button>
                                <button
                                  onClick={() => updateReservationStatus(reservation.id, 'NO_SHOW')}
                                  className="action-btn"
                                  title="Mark as No Show"
                                >
                                  🚫
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleCancelReservation(reservation.id)}
                              className="action-btn"
                              title="Cancel"
                            >
                              ✗
                            </button>
                            <button
                              onClick={() => handleDeleteReservation(reservation.id)}
                              className="action-btn delete"
                              title="Delete"
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
          </>
        ) : (
          <div className="no-data">
            <p>Please select a location to view reservations.</p>
          </div>
        )}
      </>
    );
  };

  const renderCapacityTab = () => {
    const selectedLocation = locations.find(l => l.id === selectedLocationId);
    
    return (
      <>
        <div className="tab-header">
          <h2>Capacity Management</h2>
          <div className="tab-header-right">
            {user?.role === 'ADMIN' && (
              <div className="location-selector">
                <label>Location: </label>
                <select 
                  value={selectedLocationId || ''} 
                  onChange={(e) => setSelectedLocationId(parseInt(e.target.value))}
                  disabled={loading}
                >
                  <option value="">-- Select Location --</option>
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <button 
              className="refresh-button"
              onClick={fetchCapacityData}
              disabled={loading}
            >
              🔄 Refresh
            </button>
          </div>
        </div>
        
        {error && <div className="error-message">❌ {error}</div>}
        
        {selectedLocation ? (
          <>
            <div className="location-info-banner">
              <span>📍 Showing capacity for <strong>{selectedLocation.name}</strong></span>
            </div>
            
            {loading ? (
              <div className="loading">Loading capacity data...</div>
            ) : capacityData.length === 0 ? (
              <div className="no-data">
                <p>No capacity data available for this location.</p>
                <p>Schedule appointments to see capacity information.</p>
              </div>
            ) : (
              <div className="capacity-grid">
                {capacityData.map((capacity) => (
                  <div key={capacity.appointmentId} className="capacity-card">
                    <div className="capacity-header">
                      <h4>{capacity.serviceName}</h4>
                      <div className="capacity-time">
                        {formatTime(capacity.startTime)} - {formatTime(capacity.endTime)}
                      </div>
                    </div>
                    
                    <div className="capacity-details">
                      <div className="capacity-item">
                        <span className="capacity-label">Max:</span>
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
          </>
        ) : (
          <div className="no-data">
            <p>Please select a location to view capacity.</p>
          </div>
        )}
      </>
    );
  };

  const renderLocationsTab = () => (
    <>
      <div className="tab-header">
        <h2>Location Management</h2>
        <button 
          className="create-button"
          onClick={() => setShowCreateLocationForm(!showCreateLocationForm)}
          disabled={loading}
        >
          {showCreateLocationForm ? 'Cancel' : '+ Add New Location'}
        </button>
      </div>
      
      {error && <div className="error-message">❌ {error}</div>}
      {successMessage && <div className="success-message">✅ {successMessage}</div>}
      
      {showCreateLocationForm && (
        <div className="create-form">
          <h3>Create New Location</h3>
          <form onSubmit={handleCreateLocation}>
            <div className="form-group">
              <label>Location Name *</label>
              <input
                type="text"
                name="name"
                value={locationFormData.name}
                onChange={(e) => setLocationFormData({...locationFormData, name: e.target.value})}
                placeholder="e.g., Main Gym, Downtown Branch"
                required
                disabled={loading}
              />
            </div>
            
            <div className="form-group">
              <label>Address *</label>
              <textarea
                name="address"
                value={locationFormData.address}
                onChange={(e) => setLocationFormData({...locationFormData, address: e.target.value})}
                placeholder="Full address including city and postal code"
                rows="3"
                required
                disabled={loading}
              />
            </div>
            
            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Creating...' : 'Create Location'}
              </button>
              <button 
                type="button"
                className="btn-secondary"
                onClick={() => setShowCreateLocationForm(false)}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading && !showCreateLocationForm ? (
        <div className="loading">Loading locations...</div>
      ) : locations.length === 0 ? (
        <div className="no-data">
          <p>No locations found.</p>
          <button 
            className="create-button"
            onClick={() => setShowCreateLocationForm(true)}
          >
            Create Your First Location
          </button>
        </div>
      ) : (
        <div className="locations-table">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Address</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {locations.map((location) => (
                <tr key={location.id}>
                  <td>{location.id}</td>
                  <td>
                    <strong>{location.name}</strong>
                    {selectedLocationId === location.id && (
                      <span className="current-location-badge">Current</span>
                    )}
                  </td>
                  <td>{location.address}</td>
                  <td>
                    <div className="location-actions">
                      <button 
                        className="select-button"
                        onClick={() => setSelectedLocationId(location.id)}
                        title="Select this location"
                      >
                        {selectedLocationId === location.id ? '✓ Selected' : 'Select'}
                      </button>
                      <button 
                        className="edit-button"
                        onClick={() => handleEditLocation(location.id)}
                        disabled={loading}
                      >
                        Edit
                      </button>
                      <button 
                        className="delete-button"
                        onClick={() => handleDeleteLocation(location.id)}
                        disabled={loading}
                      >
                        Delete
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

  const renderLocationSelector = () => {
    if (user?.role !== 'ADMIN') return null;
    
    const currentLocation = locations.find(l => l.id === selectedLocationId);
    
    return (
      <div className="admin-location-selector">
        <div className="selector-header">
          <h4>📍 Current Working Location:</h4>
          <span className="current-location">
            {currentLocation ? currentLocation.name : 'No location selected'}
          </span>
        </div>
        
        <div className="location-selector-buttons">
          {locations.map(location => (
            <button
              key={location.id}
              className={`location-btn ${selectedLocationId === location.id ? 'active' : ''}`}
              onClick={() => setSelectedLocationId(location.id)}
            >
              {location.name}
            </button>
          ))}
          <button
            className="location-btn add-new"
            onClick={() => {
              setActiveTab('locations');
              setShowCreateLocationForm(true);
            }}
            //onClick={() => setShowCreateLocationForm(!showCreateLocationForm)}
          >
            + New Location
          </button>
        </div>
      </div>
    );
  };

  if (!user) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="admin-dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>👑 Admin Dashboard</h1>
          <div className="user-role">
            <span className="role-badge admin">ADMIN</span>
            <span className="location-badge">📍 Full System Access</span>
          </div>
        </div>
        
        <div className="user-info">
          <span className="welcome-text">Welcome, {user.firstName || user.email}</span>
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </div>
      </header>

      {/* Location selector samo za admina */}
      {user.role === 'ADMIN' && renderLocationSelector()}

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
        <button 
          className={`tab-button ${activeTab === 'locations' ? 'active' : ''}`}
          onClick={() => setActiveTab('locations')}
        >
          🏢 Locations
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'dashboard' && renderDashboardTab()}
        {activeTab === 'members' && renderMembersTab()}
        {activeTab === 'services' && renderServicesTab()}
        {activeTab === 'appointments' && renderAppointmentsTab()}
        {activeTab === 'reservations' && renderReservationsTab()}
        {activeTab === 'capacity' && renderCapacityTab()}
        {activeTab === 'locations' && renderLocationsTab()}
      </div>

      {/* Modali */}
      {showCreateModal && (
        <CreateMemberModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setSuccessMessage('Member created successfully!');
            fetchMembers();
            setTimeout(() => setSuccessMessage(''), 5000);
          }}
          employeeLocationId={user.role === 'ADMIN' ? selectedLocationId : user?.locationId}
          locations={locations}
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
          employeeLocationId={user.role === 'ADMIN' ? selectedLocationId : user?.locationId}
          locations={locations}
        />
      )}

      {showCreateAppointmentModal && (
        <CreateAppointmentModal
          onClose={() => setShowCreateAppointmentModal(false)}
          onSuccess={() => {
            setSuccessMessage('Appointment scheduled successfully!');
            setTimeout(() => setSuccessMessage(''), 5000);
          }}
          employeeLocationId={selectedLocationId} 
          locations={locations}
        />
      )}

      {editingLocation && (
        <EditLocationModal
          location={editingLocation}
          onClose={() => setEditingLocation(null)}
          onSave={handleUpdateLocation}
        />
      )}
    </div>
  );
};

export default AdminDashboard;