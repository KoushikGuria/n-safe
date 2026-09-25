import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Tag, ArrowRight, AlertCircle, CheckCircle, Lock, Sparkles, ChevronDown } from 'lucide-react';
import logoImg from '../assets/logo.png';

export default function Promo() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Account Activation — N-Safe';
  }, []);

  const [promoCode, setPromoCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPromoInput, setShowPromoInput] = useState(true);

  const handlePromoSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const trimmedCode = promoCode.trim().toUpperCase();

    if (!trimmedCode) {
      setError('Please enter a promo code.');
      return;
    }

    setLoading(true);

    // Validate promo code
    if (trimmedCode === 'NRNST') {
      setSuccess('Promo code applied successfully! Unlocking your dashboard...');
      // Clear pending promo flag and save record
      try {
        sessionStorage.removeItem('nsafe_pending_promo');
        localStorage.setItem('nsafe_promo_applied', 'true');
        localStorage.setItem('nsafe_promo_code', 'NRNST');
        localStorage.setItem('nsafe_plan', 'individual');
      } catch (err) {
        console.error('Failed to save promo in storage:', err);
      }

      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 750);
    } else {
      setLoading(false);
      setError('Invalid promo code. Please enter a valid code.');
    }
  };

  return (
    <div className="auth-page-wrapper promo-page-wrapper">
      <div className="auth-card promo-card animate-fade-up">
        {/* Brand Header */}
        <div className="auth-header">
          <div className="auth-logo-container">
            <img src={logoImg} alt="N-Safe Logo" className="auth-brand-logo" />
          </div>
          <h1 className="auth-title">Activate Your Account</h1>
          <p className="auth-subtitle">
            Welcome to N-Safe! Choose an activation option below to access your personal QR code and messaging dashboard.
          </p>
        </div>

        {error && (
          <div className="alert-box alert-error animate-fade-in" role="alert">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert-box alert-success animate-fade-in" role="status">
            <CheckCircle size={20} />
            <span>{success}</span>
          </div>
        )}

        {/* Section 1: Buy Individual Plan / Get Credit */}
        <div className="plan-option-card">
          <div className="plan-option-header">
            <div className="plan-title-area">
              <span className="plan-badge">Individual Plan</span>
              <h3 className="plan-name">Buy Individual Plan</h3>
            </div>
            <span className="plan-status-pill">Coming Soon</span>
          </div>
          <p className="plan-description">
            Purchase credits to activate your personal QR code with instant visitor calls, WhatsApp linking, and real-time private messages.
          </p>

          {/* Disabled Get Credit button */}
          <button
            type="button"
            className="btn-get-credit"
            disabled={true}
            aria-disabled="true"
            title="Individual Plan credit purchases will be available soon"
          >
            <CreditCard size={18} />
            <span>Get Credit</span>
            <Lock size={15} className="ml-auto lock-icon" />
          </button>
        </div>

        <div className="promo-divider">
          <span>OR HAVE A PROMO CODE?</span>
        </div>

        {/* Section 2: Apply Promo Code */}
        <div className="promo-code-card">
          <button
            type="button"
            className="btn-apply-promo-toggle"
            onClick={() => setShowPromoInput((prev) => !prev)}
            aria-expanded={showPromoInput}
          >
            <div className="promo-toggle-content">
              <div className="promo-icon-badge">
                <Tag size={18} />
              </div>
              <div className="promo-toggle-text">
                <span className="promo-toggle-title">Apply Promo Code</span>
                <span className="promo-toggle-sub">Enter an activation code to unlock access</span>
              </div>
            </div>
            <ChevronDown size={18} className={`promo-arrow-icon ${showPromoInput ? 'open' : ''}`} />
          </button>

          {showPromoInput && (
            <form onSubmit={handlePromoSubmit} className="promo-input-form animate-fade-in" noValidate>
              <div className="form-group promo-form-group">
                <label className="form-label" htmlFor="promo-input">
                  Promo Code
                </label>
                <div className="input-with-icon">
                  <Sparkles className="input-icon promo-sparkle-icon" size={18} />
                  <input
                    id="promo-input"
                    type="text"
                    className={`form-input promo-input-field ${error ? 'input-error' : ''}`}
                    placeholder="Enter code (e.g. NRNST)"
                    value={promoCode}
                    onChange={(e) => {
                      setPromoCode(e.target.value);
                      if (error) setError('');
                    }}
                    disabled={loading || !!success}
                    autoComplete="off"
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn-primary btn-block btn-promo-submit"
                disabled={loading || !!success}
              >
                {loading ? (
                  <>
                    <span className="spinner-sm white"></span>
                    <span>Validating code...</span>
                  </>
                ) : (
                  <>
                    <span>Submit</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
