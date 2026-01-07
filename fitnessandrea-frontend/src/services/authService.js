// src/services/authService.js

const API_URL = 'http://localhost:8080';

export const login = async (email, password) => {
  console.log('🔗 Sending request to:', `${API_URL}/auth/login`);
  console.log('📤 Data:', { email, password: '***' });
  
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        email, 
        password 
      }),
    });

    console.log('📥 Response status:', response.status);
    console.log('📥 Status text:', response.statusText);

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('❌ Not JSON response:', text);
      throw new Error(`Server did not return JSON. Status: ${response.status}, Body: ${text.substring(0, 100)}...`);
    }

    const data = await response.json();
    console.log('📦 Response data:', data);

    if (!response.ok) {
      throw new Error(data.message || data.error || `Login failed: ${response.status}`);
    }

    const userData = {
      id: data.userId,
      email: data.email,
      role: data.role,
      firstName: data.firstName || null,
      lastName: data.lastName || null,
      locationId: data.locationId || null,
      locationName: data.locationName || null,
 
    };

    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(userData));

    console.log('✅ Login successful! User:', userData);
    return data;

  } catch (error) {
    console.error('❌ Login error:', error);
    throw error;
  }
};

export const getPermissionsForRole = (role) => {
  const permissions = {
    'ADMIN': [
      'CREATE_MEMBER', 
      'EDIT_MEMBER', 
      'DELETE_MEMBER', 
      'VIEW_ALL_MEMBERS', 
      'MANAGE_USERS',
      'MANAGE_LOCATIONS',
      'VIEW_REPORTS',
      'MANAGE_SERVICES'
    ],
    'EMPLOYEE': [
      'CREATE_MEMBER', 
      'EDIT_MEMBER', 
      'VIEW_ALL_MEMBERS',
      'VIEW_SCHEDULE',
      'MANAGE_OWN_SCHEDULE'
    ],
    'MEMBER': [
      'VIEW_OWN_PROFILE', 
      'EDIT_OWN_PROFILE',
      'VIEW_SCHEDULE',
      'BOOK_SESSIONS'
    ]
  };
  
  return permissions[role] || [];
};

export const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  
  try {
    const user = JSON.parse(userStr);
    
    // Dodaj permisije ako nisu prisutne
    if (!user.permissions) {
      user.permissions = getPermissionsForRole(user.role);
    }
    
    return user;
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
};

export const getUserRole = () => {
  const user = getCurrentUser();
  return user ? user.role : null;
};

export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  const hasToken = !!token;
  console.log('🔐 Authentication check:', { hasToken, token: token ? 'has token' : 'no token' });
  return hasToken;
};

export const logout = () => {
  console.log('🚪 Logout');
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const testBackendConnection = async () => {
  try {
    console.log('🔌 Testing connection to:', API_URL);
    const response = await fetch(`${API_URL}/actuator/health`, {
      method: 'GET',
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Backend connection successful:', data);
      return true;
    } else {
      console.log('❌ Backend connection failed, status:', response.status);
      return false;
    }
  } catch (error) {
    console.error('❌ Backend connection error:', error);
    return false;
  }
};

export const hasRole = (role) => {
  const userRole = getUserRole();
  return userRole === role;
};

export const hasAnyRole = (roles) => {
  const userRole = getUserRole();
  return roles.includes(userRole || '');
};

export const getUserId = () => {
  const user = getCurrentUser();
  return user ? user.id : null;
};

export const getUserEmail = () => {
  const user = getCurrentUser();
  return user ? user.email : null;
};


export const hasPermission = (permission) => {
  const user = getCurrentUser();
  return user ? (user.permissions || []).includes(permission) : false;
};

export const hasAnyPermission = (permissions) => {
  const user = getCurrentUser();
  if (!user || !user.permissions) return false;
  
  return permissions.some(permission => 
    user.permissions.includes(permission)
  );
};

export const hasAllPermissions = (permissions) => {
  const user = getCurrentUser();
  if (!user || !user.permissions) return false;
  
  return permissions.every(permission => 
    user.permissions.includes(permission)
  );
};


export const authService = {
  login,
  logout,
  getCurrentUser,
  getUserRole,
  isAuthenticated,
  testBackendConnection,
  hasRole,
  hasAnyRole,
  getUserId,
  getUserEmail,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getPermissionsForRole
};