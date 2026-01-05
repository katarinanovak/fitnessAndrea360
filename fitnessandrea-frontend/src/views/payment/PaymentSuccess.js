// src/views/payment/PaymentSuccess.js - NOVA VERZIJA
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { confirmPayment } from '../../services/paymentService';
import '../../styles/payment/PaymentSuccess.css';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [sessionId, setSessionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Proveri da li postoji session_id u URL-u
    const urlSessionId = searchParams.get('session_id');
    if (urlSessionId) {
      setSessionId(urlSessionId);
      // Automatski potvrdi ako ima u URL-u
      handleConfirm(urlSessionId);
    }
  }, [searchParams]);

  const handleConfirm = async (idToConfirm = sessionId) => {
    if (!idToConfirm) {
      setError('Please enter a session ID');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setMessage('');

      console.log('🔄 Confirming payment for session:', idToConfirm);
      
      const result = await confirmPayment(idToConfirm);
      
      console.log('✅ Payment confirmed:', result);
      
      setMessage(result.message || 'Payment confirmed successfully!');
      
      // Preusmeri na dashboard nakon 3 sekunde
      setTimeout(() => {
        navigate('/member/dashboard', { 
          state: { paymentSuccess: true }
        });
      }, 3000);
      
    } catch (err) {
      console.error('❌ Payment confirmation failed:', err);
      setError(err.message || 'Payment confirmation failed');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (sessionId) {
      navigator.clipboard.writeText(sessionId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="payment-success-container">
      <div className="payment-success-card">
        <h2>Payment Confirmation</h2>
        <p className="subtitle">Like in Swagger - paste your session_id here</p>
        
        <div className="session-id-section">
          <label htmlFor="sessionId">Stripe Session ID:</label>
          <div className="input-group">
            <input
              id="sessionId"
              type="text"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              placeholder="cs_test_abc123..."
              className="session-input"
            />
            <button 
              onClick={copyToClipboard}
              className="copy-button"
              title="Copy to clipboard"
            >
              {copied ? '✅ Copied!' : '📋 Copy'}
            </button>
          </div>
          
          {sessionId && (
            <div className="session-info">
              <small>Session ID detected: {sessionId.substring(0, 20)}...</small>
            </div>
          )}
        </div>

        <div className="action-section">
          <button
            onClick={() => handleConfirm()}
            disabled={loading || !sessionId}
            className="confirm-button"
          >
            {loading ? (
              <>
                <span className="spinner-small"></span>
                Confirming...
              </>
            ) : (
              '✅ Confirm Payment'
            )}
          </button>
          
          <button
            onClick={() => navigate('/member/dashboard')}
            className="back-button"
          >
            ← Back to Dashboard
          </button>
        </div>

        {message && (
          <div className="message success">
            <div className="icon">✅</div>
            <p>{message}</p>
            <p className="redirect-msg">Redirecting to dashboard...</p>
          </div>
        )}

        {error && (
          <div className="message error">
            <div className="icon">❌</div>
            <p>{error}</p>
            <button
              onClick={() => setError('')}
              className="dismiss-button"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="instructions">
          <h4>How it works:</h4>
          <ol>
            <li>Complete payment in Stripe checkout</li>
            <li>Copy the session_id from Stripe confirmation</li>
            <li>Paste it above and click "Confirm Payment"</li>
            <li>Purchase will be created in the system</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;