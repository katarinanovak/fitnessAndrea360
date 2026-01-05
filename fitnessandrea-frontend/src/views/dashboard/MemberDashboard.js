// src/views/dashboard/MemberDashboard.js - KOMPLETNO ISPRAVLJENO
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, logout } from '../../services/authService';
import { getMemberPurchases } from '../../services/purchaseService';
import { getAvailableAppointments, createReservation, getMemberReservations } from '../../services/reservationService';
import { getAllServices } from '../../services/serviceService';
import { createCheckoutSession, confirmPayment } from '../../services/paymentService';
import '../../styles/dashboard/MemberDashboard.css';

// Stripe Checkout Modal
const StripeCheckoutModal = ({ service, quantity, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkoutData, setCheckoutData] = useState(null);
  const [showSessionInfo, setShowSessionInfo] = useState(false);

  const handleCheckout = async () => {
    try {
      setLoading(true);
      setError('');
      setCheckoutData(null);
      setShowSessionInfo(false);
      
      console.log('🛒 Starting checkout for:', {
        serviceId: service.id,
        serviceName: service.name,
        quantity: quantity
      });
      
      const response = await createCheckoutSession({
        serviceId: service.id,
        quantity: quantity
      });
      
      console.log('✅ Checkout session response:', response);
      
      setCheckoutData(response);
      setShowSessionInfo(true);
      
    } catch (err) {
      console.error('❌ Checkout error:', err);
      setError(err.message || 'Failed to create checkout session');
      setLoading(false);
    }
  };

  const openStripeCheckout = () => {
    if (!checkoutData?.checkoutUrl) return;
    
    console.log('🔗 Opening Stripe checkout:', checkoutData.checkoutUrl);
    
    const stripeWindow = window.open(
      checkoutData.checkoutUrl,
      'StripeCheckout',
      'width=600,height=700,scrollbars=yes,resizable=yes'
    );
    
    if (!stripeWindow || stripeWindow.closed) {
      setError(
        <div>
          <p>⚠️ Pop-up blocked! Please click this link:</p>
          <a 
            href={checkoutData.checkoutUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            style={{color: '#0066cc', textDecoration: 'underline'}}
          >
            🔗 Open Stripe Checkout in New Tab
          </a>
        </div>
      );
    } else {
      onClose();
      if (onSuccess) onSuccess();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>💳 Purchase Training Sessions</h2>
          <button onClick={onClose} className="modal-close">&times;</button>
        </div>
        
        <div className="modal-body">
          {error && <div className="error-message">❌ {error}</div>}
          
          <div className="purchase-details">
            <h3>{service.name}</h3>
            <p>{service.description}</p>
            
            <div className="price-info">
              <div className="price-item">
                <span>Price per session:</span>
                <strong>€{service.priceEur ? service.priceEur.toFixed(2) : '0.00'}</strong>
              </div>
              <div className="price-item">
                <span>Quantity:</span>
                <strong>{quantity} session{quantity > 1 ? 's' : ''}</strong>
              </div>
              <div className="price-item total">
                <span>Total:</span>
                <strong>€{service.priceEur ? (service.priceEur * quantity).toFixed(2) : '0.00'}</strong>
              </div>
            </div>
            
            {showSessionInfo && checkoutData && (
              <div className="session-id-section">
                <h4>✅ Session Created!</h4>
                
                <div className="session-id-display">
                  <div style={{flex: 1}}>
                    <strong>Session ID:</strong>
                    <div style={{marginTop: '5px'}}>
                      <code style={{display: 'block', fontSize: '12px', wordBreak: 'break-all'}}>
                        {checkoutData.sessionId}
                      </code>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(checkoutData.sessionId);
                      alert('✅ Session ID copied to clipboard!');
                    }}
                    className="copy-btn-small"
                    style={{alignSelf: 'flex-start'}}
                  >
                    📋 Copy
                  </button>
                </div>
                
                <div className="instruction-box">
                  <p><strong>⚠️ Important:</strong> Copy this Session ID before proceeding!</p>
                  <p>If payment fails, you can use this ID in the "Manual Confirm" section.</p>
                </div>
                
                <div style={{marginTop: '15px'}}>
                  <button 
                    onClick={openStripeCheckout}
                    className="btn-primary"
                    style={{width: '100%'}}
                  >
                    🔗 Proceed to Stripe Checkout
                  </button>
                  <p style={{textAlign: 'center', marginTop: '10px', fontSize: '12px'}}>
                    Will open in a new window
                  </p>
                </div>
              </div>
            )}
            
            <div className="payment-info">
              <p className="test-mode">🛒 <strong>Test Mode</strong> - Use card: 4242 4242 4242 4242</p>
              <p className="instruction">
                {showSessionInfo 
                  ? 'Copy Session ID above, then proceed to Stripe.' 
                  : 'Click "Create Checkout" to generate a Session ID.'
                }
              </p>
            </div>
          </div>
          
          <div className="modal-actions">
            {!showSessionInfo ? (
              <button 
                onClick={handleCheckout}
                className="btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-small"></span>
                    Creating Checkout Session...
                  </>
                ) : (
                  `Create Checkout Session`
                )}
              </button>
            ) : (
              <button 
                onClick={onClose}
                className="btn-secondary"
              >
                Close Modal
              </button>
            )}
            
            <button onClick={onClose} className="btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Reservation Modal
const ReservationModal = ({ appointment, purchase, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleReservation = async () => {
    try {
    setLoading(true);
    setError('');
    
    await createReservation({
      appointmentId: appointment.id,
      purchaseId: purchase.id
    });
    
    onSuccess();
    onClose();
  } catch (err) {
    console.error('Reservation error details:', err);
    console.error('Error response:', err.response);
    console.error('Error status:', err.status);
    console.error('Error data:', err.data);
    
    // POKUŠAJ DA DOBIJEŠ DETALJNIJU GREŠKU
    let errorMessage = 'Failed to create reservation';
    
    // Proveri različite formate greške
    if (err.response?.data?.message) {
      errorMessage = err.response.data.message;
    } else if (err.data?.message) {
      errorMessage = err.data.message;
    } else if (err.message) {
      errorMessage = err.message;
    }
    
    // Parsiranje poruke
    if (errorMessage.toLowerCase().includes('već') || 
        errorMessage.toLowerCase().includes('already') ||
        errorMessage.toLowerCase().includes('rezervaciju') ||
        errorMessage.toLowerCase().includes('reservation')) {
      errorMessage = '❌ You already have a reservation for this time slot!';
    } else if (errorMessage.toLowerCase().includes('capacity') ||
              errorMessage.toLowerCase().includes('full') ||
              errorMessage.toLowerCase().includes('puno')) {
      errorMessage = '❌ This time slot is fully booked. Please choose another time.';
    } else if (errorMessage.toLowerCase().includes('purchase') ||
              errorMessage.toLowerCase().includes('remaining') ||
              errorMessage.toLowerCase().includes('sesij')) {
      errorMessage = '❌ This purchase package has no remaining sessions.';
    }
    
    setError(errorMessage);
  } finally {
    setLoading(false);
  }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📅 Confirm Reservation</h2>
          <button onClick={onClose} className="modal-close">&times;</button>
        </div>
        
        <div className="modal-body">
          {error && <div className="error-message">❌ {error}</div>}
          
          <div className="reservation-details">
            <h3>{appointment.serviceName}</h3>
            <div className="time-info">
              <div className="time-item">
                <span>Date:</span>
                <strong>{appointment.startTime ? new Date(appointment.startTime).toLocaleDateString() : 'N/A'}</strong>
              </div>
              <div className="time-item">
                <span>Time:</span>
                <strong>{appointment.startTime ? new Date(appointment.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</strong>
              </div>
              {/* <div className="time-item">
                <span>Duration:</span>
                <strong>{appointment.durationMinutes || 0} minutes</strong>
              </div> */}
              <div className="time-item">
                <span>Duration:</span>
                <strong>
                  {appointment.durationMinutes > 0 
                    ? `${appointment.durationMinutes} minutes` 
                    : 'Duration not set'
                  }
                </strong>
              </div>
            </div>
            
            <div className="purchase-info">
              <p>Using purchase: <strong>{purchase.serviceName}</strong></p>
              <p>Remaining sessions: <strong>{purchase.remainingUses || 0}</strong></p>
            </div>
            
            <div className="confirm-info">
              <p>⚠️ One training session will be deducted from your balance.</p>
            </div>
          </div>
          
          <div className="modal-actions">
            <button 
              onClick={handleReservation}
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Confirm Reservation'}
            </button>
            <button onClick={onClose} className="btn-secondary" disabled={loading}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Purchase Selection Modal Component
const PurchaseSelectionModal = ({ 
    purchases, 
    appointment, 
    onSelect, 
    onClose 
}) => {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>📋 Select Purchase Package</h2>
                    <button onClick={onClose} className="modal-close">&times;</button>
                </div>
                
                <div className="modal-body">
                    <p>You have multiple active packages for this service. Select which one to use:</p>
                    
                    <div className="purchases-list">
                        {purchases.map(purchase => (
                            <div key={purchase.id} className="purchase-option">
                                <div className="purchase-details">
                                    <h4>{purchase.serviceName || 'Training Package'}</h4>
                                    <div className="purchase-info">
                                        <div className="info-item">
                                            <span>Remaining:</span>
                                            <strong>{purchase.remainingUses || 0} sessions</strong>
                                        </div>
                                        <div className="info-item">
                                            <span>Status:</span>
                                            <span className={`status-badge status-${(purchase.status || 'active').toLowerCase()}`}>
                                                {purchase.status || 'ACTIVE'}
                                            </span>
                                        </div>
                                        {purchase.expiryDate && (
                                            <div className="info-item">
                                                <span>Expires:</span>
                                                <strong>{purchase.expiryDate}</strong>
                                            </div>
                                        )}
                                        <div className="info-item">
                                            <span>Purchase ID:</span>
                                            <code style={{fontSize: '12px'}}>#{purchase.id}</code>
                                        </div>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => onSelect(purchase)}
                                    className="btn-primary"
                                    style={{alignSelf: 'center'}}
                                >
                                    Use This Package
                                </button>
                            </div>
                        ))}
                    </div>
                    
                    <div className="modal-actions">
                        <button onClick={onClose} className="btn-secondary">
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Glavna MemberDashboard komponenta
const MemberDashboard = () => {
  const navigate = useNavigate();
  
  // SVI STATE-OVI
  const [user, setUser] = useState(null);
  const [purchases, setPurchases] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState('');
  const [showManualConfirm, setShowManualConfirm] = useState(false);
  const [manualSessionId, setManualSessionId] = useState('');
  const [manualConfirmMessage, setManualConfirmMessage] = useState('');
  const [availablePurchases, setAvailablePurchases] = useState([]);
  const [showPurchaseSelectionModal, setShowPurchaseSelectionModal] = useState(false);

  // Debug info na početku
  useEffect(() => {
    console.log('🎯 MemberDashboard mounted');
    console.log('🔑 Token exists:', !!localStorage.getItem('token'));
    console.log('👤 User from localStorage:', JSON.parse(localStorage.getItem('user')));
  }, []);

  // Glavni useEffect za učitavanje
  // useEffect(() => {
  //   const initializeDashboard = async () => {
  //     try {
  //       console.log('🔄 Initializing dashboard...');
        
  //       const currentUser = getCurrentUser();
  //       if (!currentUser) {
  //         console.log('❌ No user found, redirecting to login');
  //         navigate('/login');
  //         return;
  //       }
        
  //       console.log('✅ User authenticated:', currentUser.email);
  //       setUser(currentUser);
        
  //       await fetchData();
        
  //     } catch (err) {
  //       console.error('❌ Initialization error:', err);
  //       setError('Failed to initialize dashboard');
  //     }
  //   };
    
  //   initializeDashboard();
  // }, [navigate]);
  
const [currentUserId, setCurrentUserId] = useState(null);
// Glavni useEffect za učitavanje
useEffect(() => {
  const initializeDashboard = async () => {
    try {
      console.log('🔄 Initializing dashboard...');
      
      const currentUser = getCurrentUser();
      if (!currentUser) {
        console.log('❌ No user found, redirecting to login');
        navigate('/login');
        return;
      }
      
      console.log('✅ User authenticated:', currentUser.email);
      console.log('👤 User ID:', currentUser.id);
      
      setUser(currentUser);
      setCurrentUserId(currentUser.id);
      
      await fetchData();
      
    } catch (err) {
      console.error('❌ Initialization error:', err);
      setError('Failed to initialize dashboard');
    }
  };
  
  initializeDashboard();
}, [navigate, currentUserId]);

  const fetchData = async () => {
    console.log('🔄 fetchData started');
    setError('');
    setLoading(true);
    
    try {
      const [purchasesData, reservationsData, appointmentsData, servicesData] = await Promise.allSettled([
        getMemberPurchases(),
        getMemberReservations(),
        getAvailableAppointments(),
        getAllServices()
      ]);
      
      console.log('📊 Fetch results:');
      console.log('  Purchases:', purchasesData.status, purchasesData.value?.length || 0);
      console.log('  Reservations:', reservationsData.status, reservationsData.value?.length || 0);
      console.log('  Appointments:', appointmentsData.status, appointmentsData.value?.length || 0);
      console.log('  Services:', servicesData.status, servicesData.value?.length || 0);
      
      if (purchasesData.status === 'fulfilled') {
        setPurchases(purchasesData.value || []);
      } else {
        console.error('❌ Failed to fetch purchases:', purchasesData.reason);
      }
      
      if (reservationsData.status === 'fulfilled') {
        setReservations(reservationsData.value || []);
      } else {
        console.error('❌ Failed to fetch reservations:', reservationsData.reason);
      }
      
      if (appointmentsData.status === 'fulfilled') {
        setAppointments(appointmentsData.value || []);
      } else {
        console.error('❌ Failed to fetch appointments:', appointmentsData.reason);
      }
      
      if (servicesData.status === 'fulfilled') {
        const servicesArray = servicesData.value || [];
        console.log('✅ Services loaded:', servicesArray.length, 'items');
        
        const validServices = servicesArray.filter(service => 
          service && service.durationMinutes && service.durationMinutes > 0
        );
        
        console.log(`📋 Valid services: ${validServices.length} of ${servicesArray.length}`);
        setServices(validServices);
      } else {
        console.error('❌ Failed to fetch services:', servicesData.reason);
        setError('Failed to load services. Please try again.');
      }
      
    } catch (err) {
      console.error('❌ Error in fetchData:', err);
      setError('Failed to load data. Please refresh the page.');
    } finally {
      setLoading(false);
      console.log('🏁 fetchData completed');
    }
  };

 
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handlePurchase = (service) => {
    if (!service || !service.id) {
      console.error('Invalid service:', service);
      setError('Invalid service selected');
      return;
    }
    
    setSelectedService(service);
    setShowCheckoutModal(true);
  };

  const handleReservation = (appointment) => {
    if (!appointment || !appointment.id) {
      console.error('Invalid appointment:', appointment);
      setError('Invalid appointment selected');
      return;
    }
    
    console.log('📊 Checking purchases for appointment:', appointment);
    console.log('All purchases:', purchases);
    
    // PRONAĐI SVE KUPOVINE za ovaj service koji imaju remainingUses > 0
    const availablePurchasesForService = purchases.filter(p => {
      const hasRemainingUses = p.remainingUses > 0;
      const isForService = p.serviceId === appointment.serviceId;
      const isActive = p.status === 'ACTIVE';
      
      console.log(`Purchase ${p.id}: remainingUses=${p.remainingUses}, serviceId=${p.serviceId}, status=${p.status}, matches=${isForService && hasRemainingUses}`);
      
      if (p.status === undefined) {
        return isForService && hasRemainingUses;
      }
      
      return isForService && hasRemainingUses && isActive;
    });
    
    console.log('✅ Available purchases:', availablePurchasesForService);
    
    if (availablePurchasesForService.length === 0) {
      setError('You need to purchase training sessions for this service first!');
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    setSelectedAppointment(appointment);
    
    // Ako ima tačno 1 kupovina, automatski je koristi
    if (availablePurchasesForService.length === 1) {
      setSelectedPurchase(availablePurchasesForService[0]);
      setShowReservationModal(true);
    } else {
      // Ako ima više kupovina, pokaži modal za izbor
      setAvailablePurchases(availablePurchasesForService);
      setShowPurchaseSelectionModal(true);
    }
  };

  const handleCheckoutSuccess = () => {
    fetchData();
    setError('');
    setTimeout(() => {
      alert('Purchase successful! You can now make reservations.');
    }, 100);
  };

  const handleReservationSuccess = () => {
    fetchData();
    setError('');
    setTimeout(() => {
      alert('Reservation created successfully!');
    }, 100);
  };

  // const formatDate = (dateString) => {
  //   if (!dateString) return 'N/A';
  //   try {
  //     return new Date(dateString).toLocaleDateString();
  //   } catch {
  //     return 'Invalid date';
  //   }
  // };

  // const formatTime = (dateString) => {
  //   if (!dateString) return 'N/A';
  //   try {
  //     return new Date(dateString).toLocaleTimeString([], { 
  //       hour: '2-digit', 
  //       minute: '2-digit' 
  //     });
  //   } catch {
  //     return 'Invalid time';
  //   }
  // };


  // Trebalo bi da postoje u kodu:

const formatDate = (dateValue) => {
  if (!dateValue) return 'Date not set';
  
  try {
    let date;
    
    // Provera 1: Ako je array (od backend-a) - konvertuj u Date
    if (Array.isArray(dateValue)) {
      const [year, month, day, hour, minute, second] = dateValue;
      date = new Date(year, month - 1, day, hour, minute, second);
      console.log('📅 Converted array to date:', date);
    } 
    // Provera 2: Ako je string - koristi new Date()
    else if (typeof dateValue === 'string') {
      date = new Date(dateValue);
    } 
    // Provera 3: Ako je već Date objekat
    else if (dateValue instanceof Date) {
      date = dateValue;
    } 
    else {
      return 'Invalid date format';
    }
    
    // Provera da li je validan datum
    if (isNaN(date.getTime())) {
      console.warn('Invalid date:', dateValue);
      return 'Invalid date';
    }
    
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (err) {
    console.warn('Date parsing error:', err);
    return 'Invalid date';
  }
};

const formatTime = (dateValue) => {
  if (!dateValue) return 'Time not set';
  
  try {
    let date;
    
    // Provera 1: Ako je array - konvertuj u Date
    if (Array.isArray(dateValue)) {
      const [year, month, day, hour, minute, second] = dateValue;
      date = new Date(year, month - 1, day, hour, minute, second);
      console.log('🕒 Converted array to time:', date);
    } 
    // Provera 2: Ako je string
    else if (typeof dateValue === 'string') {
      date = new Date(dateValue);
    } 
    // Provera 3: Ako je već Date objekat
    else if (dateValue instanceof Date) {
      date = dateValue;
    } 
    else {
      return 'Invalid time format';
    }
    
    // Provera da li je validan datum
    if (isNaN(date.getTime())) {
      console.warn('Invalid time:', dateValue);
      return 'Invalid time';
    }
    
    return date.toLocaleTimeString('en-GB', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false
    });
  } catch (err) {
    console.warn('Time parsing error:', err);
    return 'Invalid time';
  }
};
  const renderDashboardTab = () => (
    <>
      <div className="welcome-banner">
        <h2>Welcome back, {user?.firstName || user?.email || 'Member'}!</h2>
        <p>Manage your training sessions and reservations</p>
      </div>

      <div className="stats-section">
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Available Sessions</h3>
            <p className="stat-number">
              {purchases.reduce((total, p) => total + (p.remainingUses || 0), 0)}
            </p>
          </div>
          <div className="stat-card">
            <h3>Upcoming Reservations</h3>
            <p className="stat-number">
              {reservations.filter(r => 
                r.appointmentStartTime && 
                new Date(r.appointmentStartTime) > new Date() && 
                r.status === 'CONFIRMED'
              ).length}
            </p>
          </div>
          <div className="stat-card">
            <h3>Total Spent</h3>
            <p className="stat-number">
              €{purchases.reduce((total, p) => total + (p.totalPriceEur || 0), 0).toFixed(2)}
            </p>
          </div>
          <div className="stat-card">
            <h3>Next Session</h3>
            <p className="stat-number">
              {(() => {
                const upcoming = reservations
                  .filter(r => r.appointmentStartTime && new Date(r.appointmentStartTime) > new Date())
                  .sort((a, b) => new Date(a.appointmentStartTime) - new Date(b.appointmentStartTime))[0];
                
                return upcoming ? formatTime(upcoming.appointmentStartTime) : 'None';
              })()}
            </p>
          </div>
        </div>
      </div>

      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="actions-grid">
          <button 
            className="action-button"
            onClick={() => setActiveTab('purchase')}
          >
            🛒 Buy Training Sessions
          </button>
          <button 
            className="action-button"
            onClick={() => setActiveTab('reservations')}
          >
            📅 View My Reservations
          </button>
          <button 
            className="action-button"
            onClick={() => setActiveTab('appointments')}
          >
            🏋️ Book New Session
          </button>
        </div>
      </div>
    </>
  );

  const renderPurchaseTab = () => {
    console.log('🎨 Rendering purchase tab, services count:', services.length);
    
    return (
      <>
        <div className="tab-header">
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <div>
              <h2>🛒 Purchase Training Sessions</h2>
              <p>Buy sessions for the services you want to attend</p>
            </div>
            <button 
              onClick={fetchData}
              disabled={loading}
              style={{padding: '8px 16px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px'}}
            >
              🔄 Refresh
            </button>
          </div>
          
          <div style={{
            fontSize: '12px', 
            color: '#666', 
            marginTop: '5px',
            padding: '5px',
            background: '#f5f5f5',
            borderRadius: '3px'
          }}>
            Showing {services.length} services | Updated: {new Date().toLocaleTimeString()}
          </div>
        </div>

        {error && (
          <div className="error-message" style={{marginBottom: '20px'}}>
            ❌ {error}
          </div>
        )}

        {services.length === 0 ? (
          <div className="no-data">
            <p>No services available at the moment.</p>
            <p style={{fontSize: '14px', color: '#666'}}>
              Please check if services are available or try refreshing.
            </p>
            <button 
              onClick={fetchData}
              className="btn-primary"
              disabled={loading}
              style={{marginTop: '10px'}}
            >
              {loading ? 'Loading...' : '🔄 Try Again'}
            </button>
          </div>
        ) : (
          <div className="services-grid">
            {services.map(service => {
              if (!service || !service.id) return null;
              
              return (
                <div key={service.id} className="service-card">
                  <h3>{service.name || 'Unnamed Service'}</h3>
                  <p className="service-description">
                    {service.description || 'No description available'}
                  </p>
                  
                  <div className="service-details">
                    <div className="detail-item">
                      <span>Duration:</span>
                      <strong>{service.durationMinutes || 0} min</strong>
                    </div>
                    <div className="detail-item">
                      <span>Capacity:</span>
                      <strong>{service.maxCapacity || 0} people</strong>
                    </div>
                  </div>
                  
                  <div className="price-section">
                    <div className="price">
                      €{service.priceEur ? service.priceEur.toFixed(2) : '0.00'} per session
                    </div>
                    
                    <div className="quantity-selector">
                      <label>Quantity:</label>
                      <select 
                        value={quantity} 
                        onChange={(e) => setQuantity(parseInt(e.target.value))}
                      >
                        {[1, 3, 5, 10].map(num => (
                          <option key={num} value={num}>
                            {num} session{num > 1 ? 's' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <button 
                      className="buy-button"
                      onClick={() => handlePurchase(service)}
                      disabled={!service.priceEur || service.priceEur <= 0}
                    >
                      {!service.priceEur || service.priceEur <= 0 
                        ? 'Price not available'
                        : `Buy ${quantity} for €${(service.priceEur * quantity).toFixed(2)}`
                      }
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </>
    );
  };

  // const renderAppointmentsTab = () => {
  //   console.log('🛒 ALL PURCHASES:', purchases);
  //   const availablePurchases = purchases.filter(p => p.remainingUses > 0);
  //    console.log('✅ AVAILABLE PURCHASES:', availablePurchases);
    
  //   return (
  //     <>
  //       <div className="tab-header">
  //         <h2>🏋️ Available Sessions</h2>
  //         <p>Book your training sessions</p>
  //       </div>

  //       {availablePurchases.length === 0 ? (
  //         <div className="no-data">
  //           <p>You don't have any available training sessions.</p>
  //           <button 
  //             className="btn-primary"
  //             onClick={() => setActiveTab('purchase')}
  //           >
  //             Buy Training Sessions
  //           </button>
  //         </div>
  //       ) : appointments.length === 0 ? (
  //         <div className="no-data">
  //           <p>No appointments available at the moment.</p>
  //           <button 
  //             onClick={fetchData}
  //             className="btn-secondary"
  //             disabled={loading}
  //           >
  //             🔄 Refresh Appointments
  //           </button>
  //         </div>
  //       ) : (
  //         <div className="appointments-list">
  //           {appointments.map(appointment => {
  //             if (!appointment || !appointment.id) return null;
              
  //             const availableForThisService = purchases
  //               .filter(p => p.serviceId === appointment.serviceId && p.remainingUses > 0)
  //               .reduce((total, p) => total + p.remainingUses, 0);
              
  //             return (
  //               <div key={appointment.id} className="appointment-card">
  //                 <div className="appointment-header">
  //                   <h3>{appointment.serviceName || 'Unknown Service'}</h3>
  //                   <span className="capacity-badge">
  //                     {appointment.currentCapacity || 0}/{appointment.maxCapacity || 0}
  //                   </span>
  //                 </div>
                  
  //                 <div className="appointment-details">
  //                   <div className="detail-row">
  //                     <span>📅 Date:</span>
  //                     <strong>{formatDate(appointment.startTime)}</strong>
  //                   </div>
  //                   <div className="detail-row">
  //                     <span>🕒 Time:</span>
  //                     <strong>{formatTime(appointment.startTime)}</strong>
  //                   </div>
  //                   <div className="detail-row">
  //                     <span>⏱️ Duration:</span>
  //                     <strong>{appointment.durationMinutes || 0} minutes</strong>
  //                   </div>
  //                   <div className="detail-row">
  //                     <span>📍 Location:</span>
  //                     <strong>{appointment.locationName || 'Main Gym'}</strong>
  //                   </div>
  //                 </div>
                  
  //                 <div className="appointment-actions">
  //                   <button 
  //                     className="reserve-button"
  //                     onClick={() => handleReservation(appointment)}
  //                     disabled={
  //                       appointment.currentCapacity >= appointment.maxCapacity || 
  //                       availableForThisService === 0
  //                     }
  //                   >
  //                     {appointment.currentCapacity >= appointment.maxCapacity 
  //                       ? 'Fully Booked' 
  //                       : availableForThisService === 0
  //                       ? 'No Sessions'
  //                       : 'Book Session'
  //                     }
  //                   </button>
                    
  //                   {availableForThisService > 0 && (
  //                     <div className="purchase-info">
  //                       You have {availableForThisService} session{availableForThisService !== 1 ? 's' : ''} available
  //                     </div>
  //                   )}
  //                 </div>
  //               </div>
  //             );
  //           })}
  //         </div>
  //       )}
  //     </>
  //   );
  // };


//  const renderAppointmentsTab = () => {
//   console.log('🛒 ALL PURCHASES:', purchases);
//   const availablePurchases = purchases.filter(p => p.remainingUses > 0);
//   console.log('✅ AVAILABLE PURCHASES:', availablePurchases);
//   console.log('📅 ALL APPOINTMENTS:', appointments);
  
//   // Pronađi serviceId-eve iz availablePurchases
//   const availableServiceIds = [...new Set(availablePurchases.map(p => p.serviceId))];
//   console.log('🎯 Available Service IDs:', availableServiceIds);
  
//   // Filtriraj appointmente samo za usluge koje korisnik ima
//   const availableAppointments = appointments.filter(appointment => 
//     availableServiceIds.includes(appointment.serviceId)
//   );
  
//   console.log('📍 Filtered Appointments (for your services):', availableAppointments);
  
//   return (
//     <>
//       <div className="tab-header">
//         <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
//           <div>
//             <h2>🏋️ Available Sessions</h2>
//             <p>Book your training sessions</p>
//           </div>
//           <button 
//             onClick={fetchData}
//             disabled={loading}
//             style={{padding: '8px 16px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px'}}
//           >
//             {loading ? '🔄 Loading...' : '🔄 Refresh'}
//           </button>
//         </div>
        
//         {/* Info panel */}
//         <div style={{
//           fontSize: '12px', 
//           color: '#666', 
//           marginTop: '5px',
//           padding: '8px',
//           background: '#f5f5f5',
//           borderRadius: '4px',
//           display: 'flex',
//           justifyContent: 'space-between'
//         }}>
//           <span>
//             📋 You have <strong>{availablePurchases.length}</strong> active package{availablePurchases.length !== 1 ? 's' : ''}
//           </span>
//           <span>
//             📅 Showing <strong>{availableAppointments.length}</strong> available session{availableAppointments.length !== 1 ? 's' : ''}
//           </span>
//         </div>
//       </div>

//       {/* Glavni sadržaj - BITNA PROMENA OVDE */}
//       {(() => {
//         // Ako nema kupovina
//         if (availablePurchases.length === 0) {
//           return (
//             <div className="no-data">
//               <p>You don't have any available training sessions.</p>
//               <button 
//                 className="btn-primary"
//                 onClick={() => setActiveTab('purchase')}
//               >
//                 Buy Training Sessions
//               </button>
//             </div>
//           );
//         }
        
//         // Ako IMA kupovina ali NEMA appointmenta UOPŠTE
//         if (appointments.length === 0) {
//           return (
//             <div className="no-data">
//               <div className="info-message" style={{textAlign: 'left', maxWidth: '600px'}}>
//                 <h3>📭 No Training Sessions Scheduled</h3>
//                 <p>There are currently no training sessions scheduled for <strong>any services</strong>.</p>
                
//                 <div style={{
//                   background: '#fff8e1',
//                   padding: '15px',
//                   borderRadius: '5px',
//                   margin: '15px 0',
//                   border: '1px solid #ffecb3'
//                 }}>
//                   <p><strong>✅ Your purchased packages:</strong></p>
                  
//                   <div style={{marginTop: '10px'}}>
//                     {availablePurchases.map((purchase, index) => (
//                       <div key={purchase.id} style={{
//                         display: 'flex',
//                         justifyContent: 'space-between',
//                         alignItems: 'center',
//                         padding: '10px',
//                         background: index % 2 === 0 ? '#f9f9f9' : 'white',
//                         borderRadius: '4px',
//                         marginBottom: '5px',
//                         borderLeft: '4px solid #4CAF50'
//                       }}>
//                         <div>
//                           <strong style={{color: '#2c3e50'}}>{purchase.serviceName}</strong>
//                           <div style={{fontSize: '11px', color: '#7f8c8d', marginTop: '2px'}}>
//                             Purchase ID: #{purchase.id}
//                           </div>
//                         </div>
//                         <div style={{textAlign: 'right'}}>
//                           <div style={{
//                             fontSize: '16px', 
//                             fontWeight: 'bold', 
//                             color: '#27ae60'
//                           }}>
//                             {purchase.remainingUses} session{purchase.remainingUses !== 1 ? 's' : ''}
//                           </div>
//                           <div style={{fontSize: '11px', color: '#95a5a6'}}>
//                             ready to use
//                           </div>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
                
//                 <div style={{
//                   background: '#e3f2fd',
//                   padding: '15px',
//                   borderRadius: '5px',
//                   margin: '15px 0'
//                 }}>
//                   <p><strong>ℹ️ Information:</strong></p>
//                   <ul style={{margin: '10px 0', paddingLeft: '20px'}}>
//                     <li>Training sessions are scheduled by gym staff</li>
//                     <li>Check back later or refresh this page</li>
//                     <li>Contact reception if you need urgent scheduling</li>
//                   </ul>
//                 </div>
                
//                 <div style={{display: 'flex', gap: '10px', marginTop: '20px'}}>
//                   <button 
//                     onClick={fetchData}
//                     className="btn-secondary"
//                     disabled={loading}
//                   >
//                     {loading ? 'Checking...' : '🔄 Check Again'}
//                   </button>
//                   <button 
//                     className="btn-primary"
//                     onClick={() => setActiveTab('purchase')}
//                   >
//                     Buy More Sessions
//                   </button>
//                 </div>
//               </div>
//             </div>
//           );
//         }
        
//         // Ako IMA kupovina i IMA appointmenta, ali NEMA appointmenta ZA NJIHOVE USLUGE
//         if (availableAppointments.length === 0) {
//           return (
//             <div className="no-data">
//               <div className="info-message" style={{textAlign: 'left', maxWidth: '600px'}}>
//                 <h3>📅 No Sessions for Your Purchased Services</h3>
                
//                 <div style={{
//                   background: '#f3e5f5',
//                   padding: '15px',
//                   borderRadius: '5px',
//                   margin: '15px 0',
//                   border: '1px solid #e1bee7'
//                 }}>
//                   <p>
//                     There are <strong>{appointments.length}</strong> scheduled sessions, 
//                     but <strong>none are available for your purchased services</strong>.
//                   </p>
                  
//                   <div style={{marginTop: '15px'}}>
//                     <p><strong>Your purchased packages waiting for sessions:</strong></p>
//                     {availablePurchases.map((purchase, index) => (
//                       <div key={purchase.id} style={{
//                         display: 'flex',
//                         justifyContent: 'space-between',
//                         alignItems: 'center',
//                         padding: '8px',
//                         background: index % 2 === 0 ? '#f8f9fa' : 'white',
//                         borderRadius: '3px',
//                         marginBottom: '5px'
//                       }}>
//                         <div>
//                           <strong>{purchase.serviceName}</strong>
//                           <div style={{fontSize: '11px', color: '#666'}}>
//                             Purchase ID: #{purchase.id}
//                           </div>
//                         </div>
//                         <div style={{textAlign: 'right'}}>
//                           <div style={{fontSize: '14px', fontWeight: 'bold', color: '#e74c3c'}}>
//                             {purchase.remainingUses} session{purchase.remainingUses !== 1 ? 's' : ''}
//                           </div>
//                           <div style={{fontSize: '10px', color: '#666'}}>
//                             waiting for schedule
//                           </div>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
                
//                 <div style={{
//                   background: '#fff3e0',
//                   padding: '15px',
//                   borderRadius: '5px',
//                   margin: '15px 0'
//                 }}>
//                   <p><strong>📋 Currently scheduled sessions (for other services):</strong></p>
//                   <div style={{marginTop: '10px', fontSize: '14px'}}>
//                     {appointments.slice(0, 3).map((app, i) => (
//                       <div key={i} style={{
//                         padding: '5px',
//                         margin: '5px 0',
//                         background: '#fff8e1',
//                         borderRadius: '3px'
//                       }}>
//                         <strong>{app.serviceName}</strong> - {formatDate(app.startTime)} at {formatTime(app.startTime)}
//                       </div>
//                     ))}
//                     {appointments.length > 3 && (
//                       <div style={{fontSize: '12px', color: '#666', marginTop: '5px'}}>
//                         ...and {appointments.length - 3} more
//                       </div>
//                     )}
//                   </div>
//                 </div>
                
//                 <p style={{marginTop: '15px', color: '#666'}}>
//                   <strong>💡 Suggestion:</strong> Contact gym staff to schedule sessions for your purchased packages.
//                 </p>
                
//                 <div style={{display: 'flex', gap: '10px', marginTop: '20px'}}>
//                   <button 
//                     onClick={fetchData}
//                     className="btn-secondary"
//                     disabled={loading}
//                   >
//                     {loading ? 'Checking...' : '🔄 Refresh'}
//                   </button>
//                   <button 
//                     className="btn-primary"
//                     onClick={() => setActiveTab('purchase')}
//                   >
//                     Buy Other Services
//                   </button>
//                 </div>
//               </div>
//             </div>
//           );
//         }
        
//         // Prikaz appointmenta - ako ima appointmenta za usluge koje korisnik ima
//         return (
//           <div className="appointments-list">
//             {availableAppointments.map(appointment => {
//               if (!appointment || !appointment.id) return null;
              
//               const availableForThisService = purchases
//                 .filter(p => p.serviceId === appointment.serviceId && p.remainingUses > 0)
//                 .reduce((total, p) => total + p.remainingUses, 0);
              
//               return (
//                 <div key={appointment.id} className="appointment-card">
//                   <div className="appointment-header">
//                     <h3>{appointment.serviceName || 'Unknown Service'}</h3>
//                     <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
//                       <span className="capacity-badge">
//                         {appointment.currentCapacity || 0}/{appointment.maxCapacity || 0} spots
//                       </span>
//                       {availableForThisService > 0 && (
//                         <span style={{
//                           fontSize: '12px',
//                           background: '#d4edda',
//                           color: '#155724',
//                           padding: '3px 8px',
//                           borderRadius: '12px'
//                         }}>
//                           📦 You have {availableForThisService} session{availableForThisService !== 1 ? 's' : ''}
//                         </span>
//                       )}
//                     </div>
//                   </div>
                  
//                   <div className="appointment-details">
//                     <div className="detail-row">
//                       <span>📅 Date:</span>
//                       <strong>{formatDate(appointment.startTime)}</strong>
//                     </div>
//                     <div className="detail-row">
//                       <span>🕒 Time:</span>
//                       <strong>{formatTime(appointment.startTime)}</strong>
//                     </div>
//                     {/* <div className="detail-row">
//                       <span>⏱️ Duration:</span>
//                       <strong>{appointment.durationMinutes || 0} minutes</strong>
//                     </div> */}
//                     <div className="detail-row">
//   <span>⏱️ Duration:</span>
//   <strong>
//     {appointment.durationMinutes > 0 
//       ? `${appointment.durationMinutes} minutes` 
//       : 'Duration not set'
//     }
//   </strong>
// </div>
//                     <div className="detail-row">
//                       <span>📍 Location:</span>
//                       <strong>{appointment.locationName || 'Main Gym'}</strong>
//                     </div>
//                   </div>
                  
//                   <div className="appointment-actions">
//                     <button 
//                       className="reserve-button"
//                       onClick={() => handleReservation(appointment)}
//                       disabled={
//                         appointment.currentCapacity >= appointment.maxCapacity || 
//                         availableForThisService === 0
//                       }
//                     >
//                       {appointment.currentCapacity >= appointment.maxCapacity 
//                         ? 'Fully Booked' 
//                         : availableForThisService === 0
//                         ? 'No Sessions'
//                         : 'Book Session'
//                       }
//                     </button>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//         );
//       })()}
//     </>
//   );
// };
 
const renderAppointmentsTab = () => {
  if (loading) return <div className="loading">Loading appointments...</div>;
  
  if (!appointments || appointments.length === 0) {
    return (
      <div className="empty-state">
        <p>📋 No available sessions for your current packages</p>
        <p>Browse and purchase services first</p>
      </div>
    );
  }

  return (
    <div className="appointments-list">
      {appointments.map(appointment => (
        <div key={appointment.id} className="appointment-card">
          <div className="appointment-header">
            <h3>{appointment.serviceName}</h3>
            <span className="spots-badge">
              {appointment.currentCapacity}/{appointment.maxCapacity} spots
            </span>
          </div>

          <div className="appointment-details">
            {/* ✅ KORISTI formatDate() */}
            <div className="detail-row">
              <span>📅 Date:</span>
              <strong>
                {appointment.startTime 
                  ? formatDate(appointment.startTime)
                  : 'Date not set'
                }
              </strong>
            </div>

            {/* ✅ KORISTI formatTime() */}
            <div className="detail-row">
              <span>🕒 Time:</span>
              <strong>
                {appointment.startTime 
                  ? formatTime(appointment.startTime)
                  : 'Time not set'
                }
              </strong>
            </div>

            {/* ✅ KORISTI durationMinutes */}
            <div className="detail-row">
              <span>⏱️ Duration:</span>
              <strong>
                {appointment.durationMinutes || 0} minutes
              </strong>
            </div>

            {/* ✅ KORISTI locationName */}
            <div className="detail-row">
              <span>📍 Location:</span>
              <strong>
                {appointment.locationName || 'Main Gym'}
              </strong>
            </div>
          </div>

          <div className="appointment-actions">
            <button 
              className="reserve-button"
              onClick={() => handleReservation(appointment)}
            >
              Book Session
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
const renderReservationsTab = () => (
    <>
      <div className="tab-header">
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <h2>📅 My Reservations</h2>
          <button 
            className="refresh-button" 
            onClick={fetchData} 
            disabled={loading}
          >
            {loading ? 'Loading...' : '🔄 Refresh'}
          </button>
        </div>
      </div>

      {reservations.length === 0 ? (
        <div className="no-data">
          <p>You don't have any reservations yet.</p>
          <button 
            className="btn-primary"
            onClick={() => setActiveTab('appointments')}
          >
            Book Your First Session
          </button>
        </div>
      ) : (
        <div className="reservations-table">
          <table>
            <thead>
              <tr>
                <th>Service</th>
                <th>Date & Time</th>
                <th>Status</th>
                <th>Used From</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map(reservation => {
                if (!reservation || !reservation.id) return null;
                
                return (
                  <tr key={reservation.id}>
                    <td>
                      <strong>{reservation.serviceName || 'Unknown'}</strong>
                    </td>
                    <td>
                      <div>{formatDate(reservation.appointmentStartTime)}</div>
                      <div className="time-small">{formatTime(reservation.appointmentStartTime)}</div>
                    </td>
                    <td>
                      <span className={`status-badge status-${(reservation.status || 'pending').toLowerCase()}`}>
                        {reservation.status || 'PENDING'}
                      </span>
                    </td>
                    <td>
                      Purchase #{reservation.purchaseId || 'N/A'}
                    </td>
                    <td>
                      <button 
                        className="cancel-btn"
                        onClick={() => {
                          if (window.confirm('Are you sure you want to cancel this reservation?')) {
                            alert('Cancel functionality will be implemented soon');
                          }
                        }}
                        disabled={reservation.status !== 'CONFIRMED'}
                      >
                        Cancel
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );

  if (!user && !loading) {
    return (
      <div className="loading-container">
        <div className="loading">Redirecting to login...</div>
      </div>
    );
  }

  return (
    <div className="member-dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>👤 Member Dashboard</h1>
          <div className="user-role">
            <span className="role-badge">MEMBER</span>
            {user?.locationName && (
              <span className="location-badge">📍 {user.locationName}</span>
            )}
          </div>
        </div>
        
        <div className="user-info">
          <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
            <span className="welcome-text">
              Welcome, {user?.firstName || user?.email || 'Member'}
            </span>
            
            <button 
              onClick={() => setShowManualConfirm(!showManualConfirm)}
              style={{
                padding: '6px 12px',
                background: '#FF9800',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              🧪 Manual Confirm
            </button>
            
            <button 
              onClick={() => {
                console.log('🧪 Debug: Refreshing all data...');
                fetchData();
              }}
              disabled={loading}
              style={{
                padding: '6px 12px',
                background: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? '🔄 Loading...' : '🔄 Refresh All'}
            </button>
            
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="tab-navigation">
        <button 
          className={`tab-button ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
          disabled={loading}
        >
          📊 Dashboard
        </button>
        <button 
          className={`tab-button ${activeTab === 'purchase' ? 'active' : ''}`}
          onClick={() => setActiveTab('purchase')}
          disabled={loading}
        >
          🛒 Buy Sessions
        </button>
        <button 
          className={`tab-button ${activeTab === 'appointments' ? 'active' : ''}`}
          onClick={() => setActiveTab('appointments')}
          disabled={loading}
        >
          🏋️ Book Session
        </button>
        <button 
          className={`tab-button ${activeTab === 'reservations' ? 'active' : ''}`}
          onClick={() => setActiveTab('reservations')}
          disabled={loading}
        >
          📅 My Reservations
        </button>
      </div>

      <div className="dashboard-content">
        {error && (
          <div className="error-banner">
            ❌ {error}
            <button onClick={() => setError('')} style={{marginLeft: '10px'}}>
              ✕
            </button>
          </div>
        )}
        
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading your dashboard...</p>
            <p style={{fontSize: '12px', color: '#666', marginTop: '10px'}}>
              Fetching: Purchases • Reservations • Appointments • Services
            </p>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && renderDashboardTab()}
            {activeTab === 'purchase' && renderPurchaseTab()}
            {activeTab === 'appointments' && renderAppointmentsTab()}
            {activeTab === 'reservations' && renderReservationsTab()}
          </>
        )}
      </div>

      {showCheckoutModal && selectedService && (
        <StripeCheckoutModal
          service={selectedService}
          quantity={quantity}
          onClose={() => {
            setShowCheckoutModal(false);
            setSelectedService(null);
          }}
          onSuccess={handleCheckoutSuccess}
        />
      )}

      {showReservationModal && selectedAppointment && selectedPurchase && (
        <ReservationModal
          appointment={selectedAppointment}
          purchase={selectedPurchase}
          onClose={() => {
            setShowReservationModal(false);
            setSelectedAppointment(null);
            setSelectedPurchase(null);
          }}
          onSuccess={handleReservationSuccess}
        />
      )}

      {showPurchaseSelectionModal && selectedAppointment && (
        <PurchaseSelectionModal
          purchases={availablePurchases}
          appointment={selectedAppointment}
          onSelect={(purchase) => {
            setSelectedPurchase(purchase);
            setShowPurchaseSelectionModal(false);
            setShowReservationModal(true);
          }}
          onClose={() => {
            setShowPurchaseSelectionModal(false);
            setSelectedAppointment(null);
            setAvailablePurchases([]);
          }}
        />
      )}

      {showManualConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '30px',
            borderRadius: '10px',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
          }}>
            <h3 style={{ marginTop: 0 }}>🧪 Manual Payment Confirmation</h3>
            <p>Enter session_id from Stripe (like in Swagger):</p>
            
            <input
              type="text"
              value={manualSessionId}
              onChange={(e) => setManualSessionId(e.target.value)}
              placeholder="cs_test_abc123..."
              style={{
                width: '100%',
                padding: '10px',
                margin: '10px 0',
                border: '2px solid #ddd',
                borderRadius: '4px',
                fontFamily: 'monospace'
              }}
            />
            
            {manualConfirmMessage && (
              <div style={{
                padding: '10px',
                margin: '10px 0',
                background: manualConfirmMessage.includes('✅') ? '#d4edda' : '#f8d7da',
                border: `1px solid ${manualConfirmMessage.includes('✅') ? '#c3e6cb' : '#f5c6cb'}`,
                borderRadius: '4px',
                color: manualConfirmMessage.includes('✅') ? '#155724' : '#721c24'
              }}>
                {manualConfirmMessage}
              </div>
            )}
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={async () => {
                  if (!manualSessionId) {
                    setManualConfirmMessage('❌ Please enter session_id');
                    return;
                  }
                  
                  try {
                    setManualConfirmMessage('🔄 Confirming payment...');
                    const result = await confirmPayment(manualSessionId);
                    setManualConfirmMessage(`✅ ${result.message || 'Payment confirmed successfully!'}`);
                    
                    setTimeout(() => {
                      fetchData();
                    }, 1000);
                    
                    setTimeout(() => {
                      setManualSessionId('');
                      setManualConfirmMessage('');
                      setShowManualConfirm(false);
                    }, 2000);
                    
                  } catch (err) {
                    setManualConfirmMessage(`❌ Error: ${err.message}`);
                  }
                }}
                style={{
                  padding: '10px 20px',
                  background: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  flex: 1
                }}
              >
                Confirm Payment
              </button>
              
              <button
                onClick={() => {
                  setShowManualConfirm(false);
                  setManualSessionId('');
                  setManualConfirmMessage('');
                }}
                style={{
                  padding: '10px 20px',
                  background: '#f44336',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
            
            <div style={{ marginTop: '15px', fontSize: '12px', color: '#666' }}>
              <p><strong>How to use:</strong></p>
              <ol style={{ margin: '10px 0', paddingLeft: '20px' }}>
                <li>Complete payment in Stripe</li>
                <li>Copy the session_id from Stripe</li>
                <li>Paste it above and click "Confirm Payment"</li>
                <li>Purchase will be created (just like in Swagger)</li>
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberDashboard;