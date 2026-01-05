// src/services/memberService.js
const API_URL = 'http://localhost:8080';

// Kreiraj novog člana
export const createMember = async (memberData) => {
  try {
    const token = localStorage.getItem('token');
    console.log('🔍 Token check:', token ? `${token.substring(0, 30)}...` : 'none');
    
    if (!token) {
      throw new Error('No authentication token found. Please login again.');
    }

    console.log('📤 Creating member:', memberData);
    
    const response = await fetch(`${API_URL}/members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(memberData),
      credentials: 'include' 
    });

    console.log('📥 Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Raw error response:', errorText);
      
      // Parse error message and provide user-friendly message
      let userMessage = 'Failed to create member. ';
      
      if (response.status === 403) {
        userMessage += 'Access denied. You do not have permission to create members.';
      } else if (response.status === 400) {
        // Try to extract validation errors
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.message) {
            userMessage += errorJson.message;
          } else if (errorJson.errors) {
            // Handle validation errors array
            const errors = errorJson.errors.map(err => 
              `${err.field}: ${err.defaultMessage}`
            ).join(', ');
            userMessage += `Validation errors: ${errors}`;
          }
        } catch {
          // If not JSON, use the text
          if (errorText.includes('punnoletan') || errorText.includes('18+')) {
            userMessage += 'Member must be at least 18 years old.';
          } else if (errorText.includes('Email već postoji') || errorText.includes('email already exists')) {
            userMessage += 'Email already exists in the system. Please use a different email.';
          } else if (errorText.includes('Username već postoji')) {
            userMessage += 'Username already exists. Please choose a different username.';
          } else {
            userMessage += 'Please check all fields and try again.';
          }
        }
      } else if (response.status === 401) {
        userMessage += 'Session expired. Please login again.';
      } else {
        userMessage += `Server error: ${response.status}`;
      }
      
      throw new Error(userMessage);
    }

    const data = await response.json();
    console.log('✅ Member created:', data);
    return data;
    
  } catch (error) {
    console.error('❌ Error creating member:', error);
    
    // Provide default message if error doesn't have one
    if (!error.message || error.message.includes('Failed to create member: ')) {
      error.message = 'Failed to create member. Please check all information and try again.';
    }
    
    throw error;
  }
};

// Dobavi sve članove
export const getAllMembers = async () => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_URL}/members`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch members: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Members fetched:', data.length);
    return data;
    
  } catch (error) {
    console.error('❌ Error fetching members:', error);
    throw error;
  }
};

// Dobavi članove po lokaciji
export const getMembersByLocation = async (locationId) => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_URL}/members/location/${locationId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch members by location: ${response.status}`);
    }

    return await response.json();
    
  } catch (error) {
    console.error('❌ Error fetching members by location:', error);
    throw error;
  }
};

// Export objekta za retro kompatibilnost
export const memberService = {
  createMember,
  getAllMembers,
  getMembersByLocation
};