// src/services/paymentService.js

const API_URL = 'http://localhost:8080';

// ============================
// CREATE CHECKOUT SESSION
// ============================
export const createCheckoutSession = async (data) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Please login to continue.');

    console.log('💰 Creating checkout session for service:', data);

    const payload = {
      serviceId: data.serviceId,
      quantity: data.quantity
    };

    console.log('📦 Sending to /api/payments/checkout:', payload);

    const response = await fetch(`${API_URL}/api/payments/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    console.log('📊 Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Server error:', errorText);
      throw new Error(`Payment failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Checkout session created:', result);

    const checkoutUrl = result.checkoutUrl || result.url;

    if (checkoutUrl) {
      console.log('🔗 Opening Stripe checkout in NEW window...');
      const stripeWindow = window.open(
        checkoutUrl,
        'StripeCheckout',
        'width=600,height=700,scrollbars=yes'
      );

      if (!stripeWindow || stripeWindow.closed || typeof stripeWindow.closed === 'undefined') {
        alert('Pop-up blocker detected! Please allow pop-ups for this site.');
        window.location.href = checkoutUrl;
      }

      return result;
    } else {
      throw new Error('No checkout URL received from server');
    }

  } catch (error) {
    console.error('❌ Error creating checkout session:', error);
    throw error;
  }
};

// ============================
// TEST PAYMENT ENDPOINTS
// ============================
export const testPaymentEndpoint = async () => {
  const endpoints = [
    '/payments/checkout',
    '/api/payments/checkout',
    '/api/stripe/checkout',
    '/stripe/checkout'
  ];

  const token = localStorage.getItem('token');

  for (const endpoint of endpoints) {
    try {
      console.log(`🔍 Testing: ${API_URL}${endpoint}`);
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log(`   ${endpoint}: ${response.status}`);
    } catch (e) {
      console.log(`   ${endpoint}: ERROR - ${e.message}`);
    }
  }
};

// ============================
// CONFIRM PAYMENT
// ============================
export const confirmPayment = async (sessionId) => {
  try {
    const token = localStorage.getItem('token');

    const response = await fetch(`${API_URL}/api/payments/confirm?sessionId=${encodeURIComponent(sessionId)}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const text = await response.text();

    if (!response.ok) {
      throw new Error(text || `HTTP ${response.status}`);
    }

    try {
      const data = JSON.parse(text);
      console.log('✅ Payment confirmed:', data);
      return data;
    } catch {
      console.log('✅ Payment confirmed (text response):', text);
      return { message: text };
    }

  } catch (error) {
    console.error('❌ Confirm payment error:', error);
    throw new Error(error.message || 'Failed to confirm payment');
  }
};
