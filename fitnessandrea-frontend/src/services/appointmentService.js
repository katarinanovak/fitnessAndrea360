// src/services/appointmentService.js
const API_URL = 'http://localhost:8080';

// Kreiraj novi appointment
export const createAppointment = async (appointmentData) => {
  try {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    
    console.log('🔍 Creating appointment:', appointmentData);
    console.log('👤 Current user:', user);
    
    if (!token) {
      throw new Error('Please login to continue.');
    }
     // DODAJ OVO: Ako je employee, uzmi locationId iz user objekta
    if (user?.role === 'EMPLOYEE' && user?.locationId) {
      console.log(`📍 Employee location: ${user.locationId}`);
      appointmentData.locationId = user.locationId; // DODAJ locationId
    }

    

    // // Ako je employee, NE šalji locationId - backend će ga automatski uzeti iz tokena
    // if (user?.role === 'EMPLOYEE') {
    //   console.log('📍 Employee - removing locationId from request');
    //   delete appointmentData.locationId; // Izbriši locationId iz requesta
    // }

    const response = await fetch(`${API_URL}/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(appointmentData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Failed to create appointment. ';
      
      if (response.status === 400) {
        if (errorText.includes('Član nije član ove lokacije')) {
          errorMessage = 'This member is not a member of your location. You can only schedule appointments for members of your location.';
        } else if (errorText.includes('već ima termin')) {
          errorMessage = 'Member already has an appointment in this time period.';
        } else if (errorText.includes('nije dostupna')) {
          errorMessage = 'Service is not available at your location.';
        } else if (errorText.includes('Termin mora biti')) {
          errorMessage = 'Appointment must be scheduled at least 2 hours in advance.';
        } else if (errorText.includes('Termin mora biti u budućnosti')) {
          errorMessage = 'Appointment time must be in the future.';
        } else {
          errorMessage += 'Please check all fields are valid.';
        }
      } else if (response.status === 403) {
        errorMessage = 'You do not have permission to create appointments.';
      } else {
        errorMessage += `Error: ${response.status} - ${errorText}`;
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('✅ Appointment created:', data);
    return data;
    
  } catch (error) {
    console.error('❌ Error creating appointment:', error);
    throw error;
  }
};

// Dobavi sve termine za trenutnu lokaciju employee-a
export const getAppointmentsForCurrentLocation = async () => {
  try {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (!token) {
      throw new Error('Please login to continue.');
    }

    // Proveri da li employee ima dodeljenu lokaciju
    if (user?.role === 'EMPLOYEE' && !user?.locationId) {
      throw new Error('Your account is not assigned to any location. Please contact administrator.');
    }

    // Endpoint koji vraća termine za lokaciju
    const response = await fetch(`${API_URL}/appointments/location/${user.locationId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch appointments: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Appointments fetched:', data.length);
    return data;
    
  } catch (error) {
    console.error('❌ Error fetching appointments:', error);
    throw error;
  }
};

// Dobavi današnje termine za trenutnu lokaciju
export const getTodayAppointments = async () => {
  try {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (!token) {
      throw new Error('Please login to continue.');
    }

    // Proveri da li employee ima dodeljenu lokaciju
    if (user?.role === 'EMPLOYEE' && !user?.locationId) {
      throw new Error('Your account is not assigned to any location. Please contact administrator.');
    }

    // Endpoint za današnje termine (možda ne postoji, pa ćemo filtrirati na frontendu)
    try {
      const response = await fetch(`${API_URL}/appointments/today/location/${user.locationId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (apiError) {
      console.log('Today appointments endpoint not available, filtering on frontend');
    }

    // Fallback: uzmi sve termine pa filtriraj na frontendu
    const allAppointments = await getAppointmentsForCurrentLocation();
    const today = new Date().toISOString().split('T')[0];
    
    const todayAppointments = allAppointments.filter(appointment => {
      const appointmentDate = new Date(appointment.startTime).toISOString().split('T')[0];
      return appointmentDate === today;
    });
    
    return todayAppointments;
    
  } catch (error) {
    console.error('❌ Error fetching today appointments:', error);
    throw error;
  }
};

// Otkazi appointment
export const cancelAppointment = async (appointmentId, cancellationReason) => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Please login to continue.');
    }

    const response = await fetch(`${API_URL}/appointments/${appointmentId}/cancel`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ cancellationReason })
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Failed to cancel appointment. ';
      
      if (response.status === 400) {
        if (errorText.includes('Termin se može otkazati')) {
          errorMessage = 'Appointment can only be cancelled at least 1 hour before start time.';
        }
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('✅ Appointment cancelled:', data);
    return data;
    
  } catch (error) {
    console.error('❌ Error cancelling appointment:', error);
    throw error;
  }
};

// Potvrdi dolazak na appointment
export const confirmAppointment = async (appointmentId) => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Please login to continue.');
    }

    const response = await fetch(`${API_URL}/appointments/${appointmentId}/confirm`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to confirm appointment: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Appointment confirmed:', data);
    return data;
    
  } catch (error) {
    console.error('❌ Error confirming appointment:', error);
    throw error;
  }
};

// Završi appointment
export const completeAppointment = async (appointmentId) => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Please login to continue.');
    }

    const response = await fetch(`${API_URL}/appointments/${appointmentId}/complete`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to complete appointment: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Appointment completed:', data);
    return data;
    
  } catch (error) {
    console.error('❌ Error completing appointment:', error);
    throw error;
  }
};

// Dobavi status kapaciteta za lokaciju
export const getCapacityStatus = async (locationId, date = new Date().toISOString().split('T')[0]) => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Please login to continue.');
    }

    const response = await fetch(`${API_URL}/appointments/capacity/${locationId}?date=${date}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch capacity status: ${response.status}`);
    }

    return await response.json();
    
  } catch (error) {
    console.error('❌ Error fetching capacity status:', error);
    throw error;
  }
};

// Dobavi članove samo za employee-ovu lokaciju (filtriraj na frontendu)
// ZAMENI OVU FUNKCIJU:
// Dobavi članove samo za employee-ovu lokaciju (filtriraj na frontendu)
export const getMembersForMyLocation = async () => {
  try {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (!token) {
      throw new Error('Please login to continue.');
    }

    // Ako je employee i ima locationId, koristi endpoint za članove te lokacije
    if (user?.role === 'EMPLOYEE' && user?.locationId) {
      console.log(`📋 Getting members for employee location ${user.locationId}`);
      
      const response = await fetch(`${API_URL}/members/location/${user.locationId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const members = await response.json();
        console.log(`✅ Found ${members.length} members for location ${user.locationId}`);
        return members;
      } else {
        console.warn(`⚠️ Endpoint /members/location/${user.locationId} returned ${response.status}, falling back to filtering`);
      }
    }

    // Fallback: uzmi sve članove i filtriraj na frontendu
    console.log('📋 Falling back to filtering all members');
    const response = await fetch(`${API_URL}/members`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch members: ${response.status}`);
    }

    const allMembers = await response.json();
    
    // Ako je employee, filtriraj članove po lokaciji
    if (user?.role === 'EMPLOYEE' && user?.locationId) {
      const filteredMembers = allMembers.filter(member => {
        // Član može imati locationId direktno ili kroz location objekat
        const memberLocationId = member.locationId || 
                               (member.location && member.location.id);
        
        console.log(`Member ${member.id}: locationId = ${memberLocationId}`);
        
        return memberLocationId == user.locationId;
      });
      
      console.log(`Filtered ${filteredMembers.length} members for location ${user.locationId}`);
      return filteredMembers;
    }
    
    // Ako nije employee, vrati sve članove
    console.log(`Returning all ${allMembers.length} members`);
    return allMembers;
    
  } catch (error) {
    console.error('❌ Error fetching members for my location:', error);
    throw error;
  }
};

// Dobavi sve usluge za trenutnu lokaciju employee-a
// ZAMENI I OVU FUNKCIJU:
// Dobavi sve usluge za trenutnu lokaciju employee-a
export const getServicesForMyLocation = async () => {
  try {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (!token) {
      throw new Error('Please login to continue.');
    }

    // Za sada vraćamo sve usluge, jer možda nema endpointa za usluge po lokaciji
    const response = await fetch(`${API_URL}/services`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch services: ${response.status}`);
    }

    const allServices = await response.json();
    console.log(`✅ Found ${allServices.length} total services`);
    
    // Ako želiš da filtriraš usluge po lokaciji na frontendu:
    if (user?.role === 'EMPLOYEE' && user?.locationId) {
      const filteredServices = allServices.filter(service => {
        const locationIds = service.locationIds || 
                           (service.locations && service.locations.map(l => l.id)) ||
                           [];
        
        const hasLocation = locationIds.includes(parseInt(user.locationId));
        if (!hasLocation) {
          console.log(`Service ${service.id} "${service.name}" not available at location ${user.locationId}`);
        }
        return hasLocation;
      });
      
      console.log(`Filtered ${filteredServices.length} services for location ${user.locationId}`);
      return filteredServices;
    }
    
    return allServices;
    
  } catch (error) {
    console.error('❌ Error fetching services for my location:', error);
    throw error;
  }
};

// Export objekta za retro kompatibilnost
export const appointmentService = {
  createAppointment,
  getAppointmentsForCurrentLocation,
  getTodayAppointments,
  cancelAppointment,
  confirmAppointment,
  completeAppointment,
  getCapacityStatus,
  getMembersForMyLocation,
  getServicesForMyLocation
};