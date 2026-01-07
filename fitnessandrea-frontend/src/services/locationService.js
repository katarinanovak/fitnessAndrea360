// src/services/locationService.js

const API_URL = 'http://localhost:8080';


export const getLocationById = async (locationId) => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    console.log(`📤 Fetching location ${locationId}...`);
    
    const response = await fetch(`${API_URL}/locations/${locationId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('📥 Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to fetch location: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    console.log('✅ Location fetched:', data);
    return data;
    
  } catch (error) {
    console.error('❌ Error fetching location:', error);
    throw error;
  }
};


export const updateLocation = async (locationId, locationData) => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    console.log(`📤 Updating location ${locationId}:`, locationData);
    
    const response = await fetch(`${API_URL}/locations/${locationId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(locationData)
    });

    console.log('📥 Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to update location: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    console.log('✅ Location updated:', data);
    return data;
    
  } catch (error) {
    console.error('❌ Error updating location:', error);
    throw error;
  }
};


export const createLocation = async (locationData) => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    console.log('📤 Sending location data:', locationData);
    
    const response = await fetch(`${API_URL}/locations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(locationData)
    });

    console.log('📥 Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to create location: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    console.log('✅ Location created:', data);
    return data;
    
  } catch (error) {
    console.error('❌ Error creating location:', error);
    throw error;
  }
};


export const getAllLocations = async () => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_URL}/locations`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch locations: ${response.status}`);
    }

    return await response.json();
    
  } catch (error) {
    console.error('❌ Error fetching locations:', error);
    throw error;
  }
};


export const deleteLocation = async (locationId) => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_URL}/locations/${locationId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to delete location: ${response.status}`);
    }

    return true;
    
  } catch (error) {
    console.error('❌ Error deleting location:', error);
    throw error;
  }
};