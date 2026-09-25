import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isValidPhone, normalizePhone } from '../utils/phone';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  AlertCircle,
  Plus,
  Trash2
} from 'lucide-react';
import logoImg from '../assets/logo.png';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Register — N-Safe';
  }, []);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    confirmPassword: '',
  });

  const [alternateNumbers, setAlternateNumbers] = useState(['']);

  const handleAlternateNumberChange = (index, value) => {
    setAlternateNumbers((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
    if (fieldErrors[`alternatePhone_${index}`]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[`alternatePhone_${index}`];
        return next;
      });
    }
    if (serverError) setServerError('');
  };

  const handleAddAlternateNumber = () => {
    if (alternateNumbers.length < 5) {
      setAlternateNumbers((prev) => [...prev, '']);
    }
  };

  const handleRemoveAlternateNumber = (index) => {
    setAlternateNumbers((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.length > 0 ? next : [''];
    });
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[`alternatePhone_${index}`];
      return next;
    });
  };

  const handleShowAllSlots = () => {
    setAlternateNumbers((prev) => {
      const next = [...prev];
      while (next.length < 5) {
        next.push('');
      }
      return next;
    });
  };

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState('');

  const validate = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'Full name is required';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Please provide a valid email address';
    }

    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!isValidPhone(formData.phone)) {
      errors.phone = 'Please provide a valid phone number (e.g. +91 98765 43210)';
    }

    // Alternate numbers are optional; but validate format if entered
    alternateNumbers.forEach((num, index) => {
      const trimmed = num.trim();
      if (trimmed && !isValidPhone(trimmed)) {
        errors[`alternatePhone_${index}`] = 'Please provide a valid phone number (e.g. +91 98765 43210)';
      }
    });

    if (!formData.address.trim()) {
      errors.address = 'Address is required';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters long';
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (serverError) setServerError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!validate()) return;

    setLoading(true);
    try {
      // Mark pending promo state so any auth state trigger routes exclusively to /promo
      sessionStorage.setItem('nsafe_pending_promo', 'true');

      const cleanedAlternateNumbers = alternateNumbers
        .map((num) => num.trim())
        .filter((num) => num.length > 0)
        .map((num) => normalizePhone(num));

      await register({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        alternateNumbers: cleanedAlternateNumbers,
        address: formData.address,
        password: formData.password,
      });
      // Redirect newly registered users directly to promo activation page
      navigate('/promo', { replace: true });
    } catch (err) {
      sessionStorage.removeItem('nsafe_pending_promo');
      setServerError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card animate-fade-up">
        {/* Brand Header */}
        <div className="auth-header">
          <div className="auth-logo-container">
            <img src={logoImg} alt="N-Safe Logo" className="auth-brand-logo" />
          </div>
          <h1 className="auth-title">Create your Account</h1>
          <p className="auth-subtitle">
            Get your instant personal QR code for seamless visitor contact & messaging
          </p>
        </div>

        {serverError && (
          <div className="alert-box alert-error animate-fade-in" role="alert">
            <AlertCircle size={20} />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          {/* Full Name */}
          <div className="form-group">
            <label className="form-label" htmlFor="reg-name">
              Full Name <span className="req-star">*</span>
            </label>
            <div className="input-with-icon">
              <User className="input-icon" size={18} />
              <input
                id="reg-name"
                name="name"
                type="text"
                className={`form-input ${fieldErrors.name ? 'input-error' : ''}`}
                placeholder="e.g. Alexander Pierce"
                value={formData.name}
                onChange={handleChange}
                disabled={loading}
                autoComplete="name"
              />
            </div>
            {fieldErrors.name && <span className="field-error-text">{fieldErrors.name}</span>}
          </div>

          {/* Email */}
          <div className="form-group">
            <label className="form-label" htmlFor="reg-email">
              Email Address <span className="req-star">*</span>
            </label>
            <div className="input-with-icon">
              <Mail className="input-icon" size={18} />
              <input
                id="reg-email"
                name="email"
                type="email"
                className={`form-input ${fieldErrors.email ? 'input-error' : ''}`}
                placeholder="alex@example.com"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
                autoComplete="email"
              />
            </div>
            {fieldErrors.email && <span className="field-error-text">{fieldErrors.email}</span>}
          </div>

          {/* Phone Number */}
          <div className="form-group">
            <label className="form-label" htmlFor="reg-phone">
              Phone Number <span className="req-star">*</span>
            </label>
            <div className="input-with-icon">
              <Phone className="input-icon" size={18} />
              <input
                id="reg-phone"
                name="phone"
                type="tel"
                className={`form-input ${fieldErrors.phone ? 'input-error' : ''}`}
                placeholder="+91 98765 43210 or +1 234 567 8900"
                value={formData.phone}
                onChange={handleChange}
                disabled={loading}
                autoComplete="tel"
              />
            </div>
            <span className="field-hint">
              Used for WhatsApp & phone calls when visitors scan your QR code.
            </span>
            {fieldErrors.phone && <span className="field-error-text">{fieldErrors.phone}</span>}
          </div>

          {/* Alternate numbers (Optional - up to 5) */}
          <div className="form-group alternate-numbers-group">
            <div className="alternate-header-row">
              <label className="alternate-title-wrap" htmlFor="reg-alt-phone-0">
                <span className="alternate-title-text">Alternate numbers</span>
                <span className="opt-tag">(Optional)</span>
              </label>
              <span className="alternate-counter">
                {alternateNumbers.filter((n) => n.trim().length > 0).length} / 5 added
              </span>
            </div>

            <div className="alternate-inputs-list">
              {alternateNumbers.map((altNumber, index) => (
                <div key={index} className="alternate-input-row">
                  <div className="input-with-icon flex-1">
                    <Phone className="input-icon" size={18} />
                    <input
                      id={`reg-alt-phone-${index}`}
                      name={`alternatePhone-${index}`}
                      type="tel"
                      className={`form-input ${fieldErrors[`alternatePhone_${index}`] ? 'input-error' : ''}`}
                      placeholder={`Alternate number ${index + 1} (optional)`}
                      value={altNumber}
                      onChange={(e) => handleAlternateNumberChange(index, e.target.value)}
                      disabled={loading}
                      autoComplete="tel"
                    />
                  </div>
                  {alternateNumbers.length > 1 && (
                    <button
                      type="button"
                      className="btn-remove-alt"
                      onClick={() => handleRemoveAlternateNumber(index)}
                      title="Remove this alternate number"
                      aria-label="Remove alternate number"
                      disabled={loading}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Display errors for alternate numbers */}
            {alternateNumbers.map((_, index) => (
              fieldErrors[`alternatePhone_${index}`] && (
                <span key={`err-${index}`} className="field-error-text">
                  {`Alternate #${index + 1}: ${fieldErrors[`alternatePhone_${index}`]}`}
                </span>
              )
            ))}

            <span className="field-hint">
              Optional backup phone numbers saved to your account profile.
            </span>

            <div className="alternate-actions-bar">
              {alternateNumbers.length < 5 ? (
                <button
                  type="button"
                  className="btn-add-alt-slot"
                  onClick={handleAddAlternateNumber}
                  disabled={loading}
                >
                  <Plus size={15} />
                  <span>Add another number ({alternateNumbers.length}/5)</span>
                </button>
              ) : (
                <span className="max-reached-note">Maximum 5 alternate numbers reached</span>
              )}

              {alternateNumbers.length < 5 && (
                <button
                  type="button"
                  className="btn-link-sm"
                  onClick={handleShowAllSlots}
                  disabled={loading}
                >
                  Show all 5 fields
                </button>
              )}
            </div>
          </div>

          {/* Address */}
          <div className="form-group">
            <label className="form-label" htmlFor="reg-address">
              Address <span className="req-star">*</span>
            </label>
            <div className="input-with-icon">
              <MapPin className="input-icon" size={18} />
              <input
                id="reg-address"
                name="address"
                type="text"
                className={`form-input ${fieldErrors.address ? 'input-error' : ''}`}
                placeholder="e.g. 742 Evergreen Terrace, Springfield"
                value={formData.address}
                onChange={handleChange}
                disabled={loading}
                autoComplete="street-address"
              />
            </div>
            {fieldErrors.address && <span className="field-error-text">{fieldErrors.address}</span>}
          </div>

          {/* Password & Confirm Grid */}
          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label" htmlFor="reg-password">
                Password <span className="req-star">*</span>
              </label>
              <div className="input-with-icon">
                <Lock className="input-icon" size={18} />
                <input
                  id="reg-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  className={`form-input pr-10 ${fieldErrors.password ? 'input-error' : ''}`}
                  placeholder="Min 6 characters"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="btn-toggle-eye"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {fieldErrors.password && <span className="field-error-text">{fieldErrors.password}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-confirm">
                Confirm Password <span className="req-star">*</span>
              </label>
              <div className="input-with-icon">
                <Lock className="input-icon" size={18} />
                <input
                  id="reg-confirm"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  className={`form-input pr-10 ${fieldErrors.confirmPassword ? 'input-error' : ''}`}
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={loading}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="btn-toggle-eye"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <span className="field-error-text">{fieldErrors.confirmPassword}</span>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary btn-block btn-auth-submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-sm white"></span>
                <span>Generating account & QR...</span>
              </>
            ) : (
              <>
                <span>Register & Get My QR</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p className="auth-footer-text">
            Already have an account?{' '}
            <Link to="/login" className="auth-link">
              Login now
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
