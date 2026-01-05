import { getMemberPurchases } from './purchaseService';
// src/services/reservationService.js
const API_URL = 'http://localhost:8080';

// Kreiraj rezervaciju
export const createReservation = async (reservationData) => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Please login to continue.');
    }

    const response = await fetch(`${API_URL}/reservations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(reservationData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Failed to create reservation. ';
      
      if (response.status === 400) {
        if (errorText.includes('Termin je popunjen')) {
          errorMessage = 'Appointment is full. No available spaces.';
        } else if (errorText.includes('Već imate rezervaciju')) {
          errorMessage = 'You already have a reservation for this appointment.';
        } else if (errorText.includes('Nemate preostalih sesija')) {
          errorMessage = 'You have no remaining sessions in your package.';
        } else if (errorText.includes('Kupovina je istekla')) {
          errorMessage = 'Your package has expired.';
        } else if (errorText.includes('Kupovina nije za ovu vrstu usluge')) {
          errorMessage = 'Your package is not valid for this service type.';
        } else {
          errorMessage += 'Please check all fields are valid.';
        }
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('✅ Reservation created:', data);
    return data;
    
  } catch (error) {
    console.error('❌ Error creating reservation:', error);
    throw error;
  }
};

// Dobavi sve rezervacije za trenutnu lokaciju employee-a
export const getReservationsByLocation = async (locationId = null) => {
  try {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (!token) {
      throw new Error('Please login to continue.');
    }

    let targetLocationId = locationId;
    
    // Ako nije prosleđen locationId, uzmi iz user-a (za zaposlene)
    if (!targetLocationId && user?.role === 'EMPLOYEE' && user?.locationId) {
      targetLocationId = user.locationId;
    }

    // Ako imamo locationId, koristi endpoint za lokaciju
    if (targetLocationId) {
      const response = await fetch(`${API_URL}/reservations/location/${targetLocationId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const reservations = await response.json();
        console.log(`✅ Found ${reservations.length} reservations for location ${targetLocationId}`);
        return reservations;
      }
    }

    // Fallback: uzmi sve rezervacije (samo za admina)
    const response = await fetch(`${API_URL}/reservations`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch reservations: ${response.status}`);
    }

    const allReservations = await response.json();
    
    // Ako je employee, filtriraj po lokaciji
    if (user?.role === 'EMPLOYEE' && user?.locationId) {
      const filteredReservations = allReservations.filter(reservation => 
        reservation.locationId == user.locationId
      );
      console.log(`Filtered ${filteredReservations.length} reservations for location ${user.locationId}`);
      return filteredReservations;
    }
    
    return allReservations;
    
  } catch (error) {
    console.error('❌ Error fetching reservations:', error);
    throw error;
  }
};

// Dobavi današnje rezervacije za lokaciju
export const getTodayReservationsByLocation = async (locationId = null) => {
  try {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (!token) {
      throw new Error('Please login to continue.');
    }

    let targetLocationId = locationId;
    
    if (!targetLocationId && user?.role === 'EMPLOYEE' && user?.locationId) {
      targetLocationId = user.locationId;
    }

    if (targetLocationId) {
      const response = await fetch(`${API_URL}/reservations/location/${targetLocationId}/today`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        return await response.json();
      }
    }

    // Fallback: uzmi sve rezervacije i filtriraj na frontendu
    const allReservations = await getReservationsByLocation(locationId);
    const today = new Date().toISOString().split('T')[0];
    
    const todayReservations = allReservations.filter(reservation => {
      const appointmentDate = new Date(reservation.appointmentStartTime).toISOString().split('T')[0];
      return appointmentDate === today;
    });
    
    return todayReservations;
    
  } catch (error) {
    console.error('❌ Error fetching today reservations:', error);
    throw error;
  }
};

// Ažuriraj status rezervacije
export const updateReservationStatus = async (reservationId, status) => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Please login to continue.');
    }

    const response = await fetch(`${API_URL}/reservations/${reservationId}/status?status=${status}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to update reservation status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ Reservation ${reservationId} status updated to ${status}:`, data);
    return data;
    
  } catch (error) {
    console.error('❌ Error updating reservation status:', error);
    throw error;
  }
};

// Obriši rezervaciju
export const deleteReservation = async (reservationId) => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Please login to continue.');
    }

    const response = await fetch(`${API_URL}/reservations/${reservationId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to delete reservation: ${response.status}`);
    }

    console.log(`✅ Reservation ${reservationId} deleted`);
    return true;
    
  } catch (error) {
    console.error('❌ Error deleting reservation:', error);
    throw error;
  }
};

// Dobavi kapacitet za appointment
export const getAppointmentCapacity = async (appointmentId) => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Please login to continue.');
    }

    const response = await fetch(`${API_URL}/reservations/appointment/${appointmentId}/capacity`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch capacity: ${response.status}`);
    }

    return await response.json();
    
  } catch (error) {
    console.error('❌ Error fetching appointment capacity:', error);
    throw error;
  }
};
// Dobavi dostupne termine za člana
// U reservationService.js, promeni getAvailableAppointments funkciju:
// export const getAvailableAppointments = async () => {
//   try {
//     const token = localStorage.getItem('token');
    
//     if (!token) {
//       throw new Error('Please login to continue.');
//     }

//     console.log('🔗 Fetching available appointments...');
    
//     const response = await fetch(`${API_URL}/appointments/available`, {
//       method: 'GET',
//       headers: {
//         'Authorization': `Bearer ${token}`,
//         'Accept': 'application/json'
//       }
//     });

//     console.log('📊 Response status:', response.status);
    
//     if (!response.ok) {
//       throw new Error(`Failed to fetch available appointments: ${response.status}`);
//     }

//     const data = await response.json();
//     console.log('✅ Available appointments fetched:', data.length, 'items');
    
//     // DEBUG: Prikaži prvi appointment
//     if (data.length > 0) {
//       console.log('First appointment:', data[0]);
//       console.log('Service ID:', data[0].serviceId);
//       console.log('Start time:', data[0].startTime);
//     }
    
//     return data;
    
//   } catch (error) {
//     console.error('❌ Error fetching available appointments:', error);
//     throw error;
//   }
// };
// src/services/reservationService.js - PROMENI OVU FUNKCIJU:

// export const getAvailableAppointments = async () => {
//   try {
//     const token = localStorage.getItem('token');
//     const user = JSON.parse(localStorage.getItem('user'));
    
//     if (!token) {
//       throw new Error('Please login to continue.');
//     }

//     console.log('🔗 Fetching available appointments for member:', user?.id);
    
//     // VARIJANTA 1: Pokušaj sa member-specific endpointom
//     try {
//       const response = await fetch(`${API_URL}/appointments/available-for-member`, {
//         method: 'GET',
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Accept': 'application/json'
//         }
//       });

//       if (response.ok) {
//         const data = await response.json();
//         console.log('✅ Member-specific appointments fetched:', data.length);
//         return data;
//       }
//     } catch (apiError) {
//       console.log('Member-specific endpoint not available, trying generic');
//     }

//     // VARIJANTA 2: Uzmi sve termine i filtriraj na frontendu
//     console.log('📋 Falling back to filtering all appointments');
//     const response = await fetch(`${API_URL}/appointments/available`, {
//       method: 'GET',
//       headers: {
//         'Authorization': `Bearer ${token}`,
//         'Accept': 'application/json'
//       }
//     });

//     console.log('📊 Response status:', response.status);
    
//     if (!response.ok) {
//       throw new Error(`Failed to fetch available appointments: ${response.status}`);
//     }

//     const allAppointments = await response.json();
//     console.log('📦 All available appointments:', allAppointments.length);
    
//     // FILTRIRAJ: samo termini koje član MOŽE da rezerviše
//     // 1. Proveri da li član ima purchase za taj servis
//     const memberPurchases = await getMemberPurchases();
//     console.log('🛒 Member purchases:', memberPurchases.length);
    
//     // 2. Filtriraj termine
//     const filteredAppointments = allAppointments.filter(appointment => {
//       // A) Da li je termin još uvek slobodan?
//       const hasCapacity = (appointment.currentCapacity || 0) < (appointment.maxCapacity || 1);
      
//       // B) Da li član ima purchase za ovaj servis?
//       const hasPurchaseForService = memberPurchases.some(purchase => 
//         purchase.serviceId === appointment.serviceId && 
//         purchase.remainingUses > 0
//       );
      
//       // C) Da li je član već rezervisao ovaj termin?
//       // (Ovo ćemo proveriti kasnije)
      
//       return hasCapacity && hasPurchaseForService;
//     });
    
//     console.log(`✅ Filtered to ${filteredAppointments.length} available appointments for member`);
    
//     return filteredAppointments;
    
//   } catch (error) {
//     console.error('❌ Error fetching available appointments:', error);
//     throw error;
//   }
// };
export const getAvailableAppointments = async () => {
  try {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (!token) {
      throw new Error('Please login to continue.');
    }

    console.log('🔗 Fetching available appointments for member:', user?.id);
    
    // VARIJANTA 1: Pokušaj sa member-specific endpointom
    try {
      const response = await fetch(`${API_URL}/appointments/available-for-member`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Member-specific appointments fetched:', data.length);
        return data;
      }
    } catch (apiError) {
      console.log('Member-specific endpoint not available, trying generic');
    }

    // VARIJANTA 2: Uzmi sve termine i filtriraj na frontendu
    console.log('📋 Falling back to filtering all appointments');
    const response = await fetch(`${API_URL}/appointments/available`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    console.log('📊 Response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch available appointments: ${response.status}`);
    }

    const allAppointments = await response.json();
    console.log('📦 All available appointments:', allAppointments.length);
    
    // ✅ DEBUG - DODAJ OVO!
    if (allAppointments.length > 0) {
      console.log('🔍 FIRST APPOINTMENT RAW DATA:');
      console.log(JSON.stringify(allAppointments[0], null, 2));
    }
    
    // FILTRIRAJ: samo termini koje član MOŽE da rezerviše
    const memberPurchases = await getMemberPurchases();
    console.log('🛒 Member purchases:', memberPurchases.length);
    
    const filteredAppointments = allAppointments.filter(appointment => {
      const hasCapacity = (appointment.currentCapacity || 0) < (appointment.maxCapacity || 1);
      const hasPurchaseForService = memberPurchases.some(purchase => 
        purchase.serviceId === appointment.serviceId && 
        purchase.remainingUses > 0
      );
      
      return hasCapacity && hasPurchaseForService;
    });
    
    console.log(`✅ Filtered to ${filteredAppointments.length} available appointments for member`);
    
    // ✅ DEBUG - PRIKAŽI FIRST FILTERED
    if (filteredAppointments.length > 0) {
      console.log('🔍 FIRST FILTERED APPOINTMENT:');
      console.log(JSON.stringify(filteredAppointments[0], null, 2));
    }
    
    return filteredAppointments;
    
  } catch (error) {
    console.error('❌ Error fetching available appointments:', error);
    throw error;
  }
};



// Dobavi rezervacije trenutnog člana
export const getMemberReservations = async () => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Please login to continue.');
    }

    const response = await fetch(`${API_URL}/reservations/member/current`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      // Ako endpoint ne postoji, vrati prazan array (fallback)
      console.log('Member reservations endpoint not available, returning empty array');
      return [];
    }

    const data = await response.json();
    console.log('✅ Member reservations fetched:', data.length);
    return data;
    
  } catch (error) {
    console.error('❌ Error fetching member reservations:', error);
    return []; // Vrati prazan array umesto bacanja greške
  }
};
// src/services/reservationService.js

// OVA FUNKCIJA JE ISPRAVNA - vraća samo rezervacije trenutnog člana


// DODAJ OVU FUNKCIJU ako želiš da imaš odvojenu za današnje
export const getMemberTodayReservations = async () => {
  try {
    const reservations = await getMemberReservations();
    const today = new Date().toISOString().split('T')[0];
    
    const todayReservations = reservations.filter(reservation => {
      if (!reservation.appointmentStartTime) return false;
      const appointmentDate = new Date(reservation.appointmentStartTime).toISOString().split('T')[0];
      return appointmentDate === today;
    });
    
    console.log(`📅 Found ${todayReservations.length} reservations for today`);
    return todayReservations;
    
  } catch (error) {
    console.error('❌ Error fetching member today reservations:', error);
    return [];
  }
};

// Dobavi kapacitete za sve termine na lokaciji
export const getLocationAppointmentsCapacity = async (locationId) => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Please login to continue.');
    }

    const response = await fetch(`${API_URL}/api/capacity/location/${locationId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch location capacity: ${response.status}`);
    }

    return await response.json();
    
  } catch (error) {
    console.error('❌ Error fetching location capacity:', error);
    throw error;
  }
};

// Export objekta za retro kompatibilnost
export const reservationService = {
  createReservation,
  getReservationsByLocation,
  getTodayReservationsByLocation,
  updateReservationStatus,
  deleteReservation,
  getAppointmentCapacity,
  getLocationAppointmentsCapacity
};