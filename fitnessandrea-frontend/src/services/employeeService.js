// src/services/employeeService.js
const API_URL = 'http://localhost:8080';

// Kreiraj novog zaposlenog
export const createEmployee = async (employeeData) => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    console.log('📤 Creating employee:', employeeData);
    
    const response = await fetch(`${API_URL}/employees`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(employeeData)
    });

    console.log('📥 Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to create employee: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    console.log('✅ Employee created:', data);
    return data;
    
  } catch (error) {
    console.error('❌ Error creating employee:', error);
    throw error;
  }
};

// Dobavi sve zaposlene (sa opcijom filtera po lokaciji)
export const getAllEmployees = async (locationId = null) => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    let url = `${API_URL}/employees`;
    if (locationId) {
      url += `?locationId=${locationId}`;
    }

    console.log('📤 Fetching employees from:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to fetch employees: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    console.log('✅ Employees fetched:', data.length);
    return data;
    
  } catch (error) {
    console.error('❌ Error fetching employees:', error);
    throw error;
  }
};

// Dobavi zaposlenog po ID-u
export const getEmployeeById = async (employeeId) => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_URL}/employees/${employeeId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch employee: ${response.status}`);
    }

    return await response.json();
    
  } catch (error) {
    console.error('❌ Error fetching employee:', error);
    throw error;
  }
};

// Ažuriraj zaposlenog
export const updateEmployee = async (employeeId, employeeData) => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    console.log('📤 Updating employee:', employeeId, employeeData);
    
    const response = await fetch(`${API_URL}/employees/${employeeId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(employeeData)
    });

    if (!response.ok) {
      throw new Error(`Failed to update employee: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Employee updated:', data);
    return data;
    
  } catch (error) {
    console.error('❌ Error updating employee:', error);
    throw error;
  }
};

// Dodeli zaposlenog lokaciji
export const assignEmployeeToLocation = async (employeeId, locationId) => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    console.log(`📍 Assigning employee ${employeeId} to location ${locationId}`);
    
    const response = await fetch(`${API_URL}/employees/${employeeId}/location?locationId=${locationId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('📥 Assign response status:', response.status);

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ Assign error response:', errorData);
      throw new Error(`Failed to assign employee to location: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    console.log('✅ Employee assigned to location:', data);
    return data;
    
  } catch (error) {
    console.error('❌ Error assigning employee:', error);
    throw error;
  }
};

// Obriši zaposlenog
export const deleteEmployee = async (employeeId) => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    console.log(`🗑️ Deleting employee ${employeeId}...`);
    
    const response = await fetch(`${API_URL}/employees/${employeeId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('📥 Delete response status:', response.status);

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ Delete error response:', errorData);
      throw new Error(`Failed to delete employee: ${response.status} - ${errorData}`);
    }

    console.log('✅ Employee deleted successfully');
    return true;
    
  } catch (error) {
    console.error('❌ Error deleting employee:', error);
    throw error;
  }
};

// Export objekta za retro kompatibilnost
export const employeeService = {
  createEmployee,
  getAllEmployees,
  getEmployeeById,
  updateEmployee,
  assignEmployeeToLocation,
  deleteEmployee
};