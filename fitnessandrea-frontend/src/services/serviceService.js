// src/services/serviceService.js
const API_URL = 'http://localhost:8080';

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
      serviceData.locationIds = [user.locationId];
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
       
      },
      credentials: 'include' 
    });

    console.log('📊 Response status:', response.status);

    if (!response.ok) {
      
      const errorText = await response.text();
      console.error('❌ Server error:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText.substring(0, 100)}`);
    }

    
    const responseText = await response.text();
    console.log('📄 Response text length:', responseText.length);
    console.log('📄 First 200 chars:', responseText.substring(0, 200));
    
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
    throw error; 
  }
};


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


export const serviceService = {
  createService,
  getAllServices,
  getServicesByLocation,
  getServicesForCurrentLocation,
  getServiceById,
  updateService,
  deleteService
};