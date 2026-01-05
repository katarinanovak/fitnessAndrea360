// src/services/serviceService.js
const API_URL = 'http://localhost:8080';

// Kreiraj novu uslugu
export const createService = async (serviceData) => {
  try {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    
    console.log('🔍 Creating service:', serviceData);
    console.log('👤 Current user locationId:', user?.locationId);
    
    if (!token) {
      throw new Error('Please login to continue.');
    }

    // Ako je employee, koristi njegov locationId
    if (user?.role === 'EMPLOYEE' && user?.locationId) {
      serviceData.locationIds = [user.locationId]; // Employee može samo svoju lokaciju
      console.log('📍 Auto-setting locationId for employee:', user.locationId);
    }

    const response = await fetch(`${API_URL}/services`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(serviceData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Failed to create service. ';
      
      if (response.status === 400) {
        if (errorText.includes('već postoji')) {
          errorMessage += 'Service with this name already exists at this location.';
        } else {
          errorMessage += 'Please check all fields are valid.';
        }
      } else if (response.status === 403) {
        errorMessage += 'You do not have permission to create services.';
      } else {
        errorMessage += `Error: ${response.status}`;
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('✅ Service created:', data);
    return data;
    
  } catch (error) {
    console.error('❌ Error creating service:', error);
    throw error;
  }
};

// Dobavi sve usluge
// Koristite ovaj fetch kod
// export const getAllServices = async () => {
//   try {
//     const token = localStorage.getItem('token');
    
//     if (!token) {
//       throw new Error('Please login to continue.');
//     }

//     console.log('🔗 Fetching from:', `${API_URL}/services`);
    
//     const response = await fetch(`${API_URL}/services`, {
//       method: 'GET',
//       headers: {
//         'Authorization': `Bearer ${token}`,
//         'Accept': 'application/json', // OVO JE KLJUČNO
//         'Content-Type': 'application/json'
//       }
//     });

//     console.log('📊 Response status:', response.status);
//     console.log('📊 Response ok:', response.ok);
//     console.log('📊 Response headers:', response.headers);
    
//     // Proverite da li je HTML
//     const text = await response.text();
//     console.log('📄 First 500 chars of response:', text.substring(0, 500));
    
//     if (text.startsWith('<!DOCTYPE') || text.startsWith('<html')) {
//       console.error('❌ Server returned HTML instead of JSON');
//       throw new Error('Server returned HTML page. Check CORS configuration.');
//     }
    
//     if (!response.ok) {
//       throw new Error(`HTTP ${response.status}: ${text}`);
//     }
    
//     // Pokušajte parsirati JSON
//     try {
//       const data = JSON.parse(text);
//       console.log('✅ Parsed JSON data:', data.length, 'items');
//       return data;
//     } catch (parseError) {
//       console.error('❌ Failed to parse JSON:', parseError);
//       console.error('📄 Raw text was:', text);
//       throw new Error('Invalid JSON response from server');
//     }
    
//   } catch (error) {
//     console.error('❌ Error in getAllServices:', error);
//     throw error;
//   }
// };
// KOPIRAJ TAČNO KAO U employeeService.js KOJI RADI
// src/services/serviceService.js

// src/services/serviceService.js - POPRAVLJENA VERZIJA


export const getAllServices = async () => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.error('❌ No token found');
      throw new Error('No authentication token found');
    }

    console.log('🔄 Getting services...');
    
    const response = await fetch(`${API_URL}/services`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
        // NE dodajte Accept i Content-Type ako izazivaju probleme
      },
      credentials: 'include' // VAŽNO!
    });

    console.log('📊 Response status:', response.status);

    if (!response.ok) {
      // Pročitajte tekst greške
      const errorText = await response.text();
      console.error('❌ Server error:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText.substring(0, 100)}`);
    }

    // Pročitajte response kao tekst prvo
    const responseText = await response.text();
    console.log('📄 Response text length:', responseText.length);
    console.log('📄 First 200 chars:', responseText.substring(0, 200));
    
    // Pokušajte parsirati JSON
    try {
      const data = JSON.parse(responseText);
      console.log('✅ Successfully parsed JSON, items:', data.length);
      return data;
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError);
      console.error('Raw text that failed to parse:', responseText);
      throw new Error('Failed to parse server response as JSON');
    }
    
  } catch (error) {
    console.error('❌ Error in getAllServices:', error.message);
    throw error; // Ponovo bacite grešku da bi React komponenta videla
  }
};

// Ostale funkcije ostavite kako su...


// Dobavi usluge po lokaciji
export const getServicesByLocation = async (locationId) => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Please login to continue.');
    }

    const response = await fetch(`${API_URL}/services/location/${locationId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch services by location: ${response.status}`);
    }

    return await response.json();
    
  } catch (error) {
    console.error('❌ Error fetching services by location:', error);
    throw error;
  }
};

// Dobavi usluge za trenutnu lokaciju employee-a
export const getServicesForCurrentLocation = async () => {
  try {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user?.locationId) {
      throw new Error('User has no location assigned');
    }
    
    return await getServicesByLocation(user.locationId);
  } catch (error) {
    console.error('❌ Error fetching services for current location:', error);
    throw error;
  }
};

// Dobavi uslugu po ID-u
export const getServiceById = async (serviceId) => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Please login to continue.');
    }

    const response = await fetch(`${API_URL}/services/${serviceId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch service: ${response.status}`);
    }

    return await response.json();
    
  } catch (error) {
    console.error('❌ Error fetching service:', error);
    throw error;
  }
};

// Ažuriraj uslugu
export const updateService = async (serviceId, serviceData) => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Please login to continue.');
    }

    const response = await fetch(`${API_URL}/services/${serviceId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(serviceData)
    });

    if (!response.ok) {
      throw new Error(`Failed to update service: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Service updated:', data);
    return data;
    
  } catch (error) {
    console.error('❌ Error updating service:', error);
    throw error;
  }
};

// Obriši uslugu (soft delete)
export const deleteService = async (serviceId) => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Please login to continue.');
    }

    const response = await fetch(`${API_URL}/services/${serviceId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to delete service: ${response.status}`);
    }

    console.log('✅ Service deleted:', serviceId);
    return true;
    
  } catch (error) {
    console.error('❌ Error deleting service:', error);
    throw error;
  }
};

// Export objekta za retro kompatibilnost
export const serviceService = {
  createService,
  getAllServices,
  getServicesByLocation,
  getServicesForCurrentLocation,
  getServiceById,
  updateService,
  deleteService
};