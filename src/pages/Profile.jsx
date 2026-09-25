import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateUserProfile } from '../services/userService';
import { isValidPhone, formatPhoneDisplay, normalizePhone } from '../utils/phone';
import { getPublicQrUrl } from '../utils/qr';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  QrCode, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink,
  ShieldAlert,
  Plus,
  Trash2
} from 'lucide-react';

export default function Profile() {
  const { currentUser, userProfile, refreshProfile } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
  });
  const [alternateNumbers, setAlternateNumbers] = useState(['']);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const userId = currentUser?.uid || userProfile?.userId;

  useEffect(() => {
    if (userProfile) {
      setFormData({
        name: userProfile.name || '',
        phone: userProfile.phone || '',
        address: userProfile.address || '',
      });
      setAlternateNumbers(
        Array.isArray(userProfile.alternateNumbers) && userProfile.alternateNumbers.length > 0
          ? userProfile.alternateNumbers
          : ['']
      );
    }
  }, [userProfile]);

  const handleAlternateNumberChange = (index, value) => {
    setAlternateNumbers((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
    if (error) setError('');
    if (success) setSuccess(false);
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
    if (success) setSuccess(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!formData.name.trim()) {
      setError('Full name is required.');
      return;
    }

    if (!formData.phone.trim()) {
      setError('Phone number is required.');
      return;
    }

    if (!isValidPhone(formData.phone)) {
      setError('Please provide a valid phone number (e.g. +91 98765 43210).');
      return;
    }

    if (!formData.address.trim()) {
      setError('Address is required.');
      return;
    }

    // Validate alternate numbers (optional, but format check if entered)
    for (let i = 0; i < alternateNumbers.length; i++) {
      const trimmed = alternateNumbers[i].trim();
      if (trimmed && !isValidPhone(trimmed)) {
        setError(`Alternate number #${i + 1} is invalid. Please check the format.`);
        return;
      }
    }

    setLoading(true);
    try {
      const cleanedAlternateNumbers = alternateNumbers
        .map((num) => num.trim())
        .filter((num) => num.length > 0)
        .map((num) => normalizePhone(num));

      await updateUserProfile(userId, {
        ...formData,
        alternateNumbers: cleanedAlternateNumbers,
      });
      await refreshProfile();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      setError(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const publicUrl = getPublicQrUrl(userProfile?.qrId);

  return (
    <div className="page-container profile-page">
      <div className="page-header-row animate-fade-down">
        <div>
          <h1 className="page-title">Profile Settings</h1>
          <p className="page-subtitle">
            Manage your personal contact info and public QR page configuration.
          </p>
        </div>
      </div>

      <div className="profile-layout-grid">
        {/* Profile Edit Card */}
        <div className="card profile-form-card animate-fade-up">
          <div className="card-header-bordered">
            <h2 className="card-title">Personal Information</h2>
            <p className="card-desc">
              Your name and phone number will be used when visitors scan your QR code.
            </p>
          </div>

          {success && (
            <div className="alert-box alert-success animate-fade-in" role="status">
              <CheckCircle2 size={18} />
              <span>Profile updated successfully!</span>
            </div>
          )}

          {error && (
            <div className="alert-box alert-error animate-fade-in" role="alert">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="profile-form">
            {/* Full Name */}
            <div className="form-group">
              <label htmlFor="prof-name" className="form-label">
                Full Name
              </label>
              <div className="input-with-icon">
                <User className="input-icon" size={18} />
                <input
                  id="prof-name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Your Full Name"
                  required
                />
              </div>
            </div>

            {/* Email (Read Only) */}
            <div className="form-group">
              <label htmlFor="prof-email" className="form-label">
                Email Address <span className="badge-tag">Login Identifier</span>
              </label>
              <div className="input-with-icon input-disabled">
                <Mail className="input-icon" size={18} />
                <input
                  id="prof-email"
                  type="email"
                  value={userProfile?.email || currentUser?.email || ''}
                  className="form-input disabled"
                  disabled
                />
              </div>
              <span className="field-hint">
                Email cannot be changed directly as it is tied to your Firebase authentication.
              </span>
            </div>

            {/* Phone Number */}
            <div className="form-group">
              <label htmlFor="prof-phone" className="form-label">
                Phone Number (WhatsApp & Direct Calling)
              </label>
              <div className="input-with-icon">
                <Phone className="input-icon" size={18} />
                <input
                  id="prof-phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="+91 98765 43210"
                  required
                />
              </div>
              <span className="field-hint">
                Currently formatted as: {formatPhoneDisplay(formData.phone) || 'N/A'}
              </span>
            </div>

            {/* Alternate numbers (Optional - up to 5) */}
            <div className="form-group alternate-numbers-group">
              <div className="alternate-header-row">
                <label className="alternate-title-wrap" htmlFor="prof-alt-phone-0">
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
                        id={`prof-alt-phone-${index}`}
                        name={`alternatePhone-${index}`}
                        type="tel"
                        className="form-input"
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

              <span className="field-hint">
                Optional backup phone numbers (up to 5) saved to your profile.
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
              <label htmlFor="prof-address" className="form-label">
                Residential / Work Address
              </label>
              <div className="input-with-icon">
                <MapPin className="input-icon" size={18} />
                <input
                  id="prof-address"
                  name="address"
                  type="text"
                  value={formData.address}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Your Address"
                  required
                />
              </div>
            </div>

            <div className="form-actions-right">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
              >
                {loading ? (
                  <>
                    <span className="spinner-sm white"></span>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* QR Identifier & Privacy Sidebar */}
        <div className="profile-sidebar">
          {/* QR Identifiers Card */}
          <div className="card qr-info-card">
            <div className="flex-row items-center gap-2 mb-3">
              <QrCode size={20} className="text-indigo" />
              <h3 className="card-title">QR Connection Info</h3>
            </div>

            <div className="info-kv-group">
              <span className="info-k">Public QR ID</span>
              <span className="info-v font-mono">{userProfile?.qrId || 'Pending'}</span>
            </div>

            <div className="info-kv-group mt-3">
              <span className="info-k">Public URL</span>
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="public-link-chip"
              >
                <span className="text-truncate">{publicUrl}</span>
                <ExternalLink size={14} />
              </a>
            </div>

            <div className="privacy-callout mt-4">
              <div className="flex-row gap-2">
                <ShieldAlert size={18} className="text-amber" />
                <span className="font-semibold text-sm">Privacy Protection</span>
              </div>
              <p className="text-xs text-muted mt-1 leading-relaxed">
                Your account password, email, and physical address are NEVER revealed on the public QR page. Only your name and phone dialer/WhatsApp link are accessible.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
