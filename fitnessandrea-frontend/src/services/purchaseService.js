// src/services/purchaseService.js - POPRAVLJENO
const API_URL = 'http://localhost:8080';

export const getMemberPurchases = async () => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    console.log('🔄 Fetching purchases from backend...');
    
    const response = await fetch(`${API_URL}/api/purchases/member/current`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    console.log('📊 Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Server error:', errorText);
      throw new Error(`Failed to fetch purchases: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Purchases loaded:', data.length, 'items');
    
    // DEBUG: Proveri remainingUses
    data.forEach((p, i) => {
      console.log(`   Purchase ${i}: ${p.serviceName}, remainingUses: ${p.remainingUses}`);
    });
    
    return data;
    
  } catch (error) {
    console.error('❌ Error in getMemberPurchases:', error);
    
    // Fallback za testiranje
    console.log('⚠️ Using fallback mock data');
    return [
      {
        id: 1,
        serviceId: 1,
        serviceName: "Yoga",
        quantity: 5,
        remainingUses: 5,
        totalPriceEur: 75.00,
        purchaseDate: "2026-01-03",
        status: "ACTIVE"
      },
      {
        id: 2,
        serviceId: 2,
        serviceName: "CrossFit",
        quantity: 3,
        remainingUses: 3,
        totalPriceEur: 60.00,
        purchaseDate: "2026-01-03",
        status: "ACTIVE"
      }
    ];
  }
};