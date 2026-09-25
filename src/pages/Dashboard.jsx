import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import QRCodeCard from '../components/QRCodeCard';
import { ensurePublicProfile } from '../services/userService';
import { formatPhoneDisplay } from '../utils/phone';
import {
  User,
  ShieldCheck
} from 'lucide-react';

export default function Dashboard() {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const userId = currentUser?.uid || userProfile?.userId;

  // If newly registered user has not entered promo yet, redirect to /promo
  useEffect(() => {
    if (sessionStorage.getItem('nsafe_pending_promo') === 'true') {
      navigate('/promo', { replace: true });
    }
  }, [navigate]);

  // Self-healing migration: Ensure publicProfiles/{qrId} exists for existing accounts
  useEffect(() => {
    if (userId && userProfile?.qrId) {
      ensurePublicProfile(userId, userProfile);
    }
  }, [userId, userProfile]);

  // Guard: Never render dashboard while promo activation is pending
  if (sessionStorage.getItem('nsafe_pending_promo') === 'true') {
    return null;
  }

  return (
    <div className="page-container dashboard-page">
      {/* Welcome Banner */}
      <section className="welcome-banner no-print animate-fade-down">
        <div className="welcome-content">
          <h1 className="welcome-heading">
            Hello, <span className="text-gradient">{userProfile?.name || 'Friend'}</span>
          </h1>
          <p className="welcome-desc">
            Your unique QR code is active and ready to share.
          </p>
        </div>
      </section>

      {/* Main Grid: QR Code Prominent on Left/Center, Profile on Right */}
      <div className="dashboard-grid">
        {/* QR Code Section */}
        <div className="dashboard-col-primary">
          <QRCodeCard userProfile={userProfile} />
        </div>

        {/* Quick Profile Summary Column */}
        <div className="dashboard-col-secondary no-print">
          {/* Quick Profile Summary Card */}
          <div className="card profile-summary-card">
            <div className="card-header-simple">
              <div className="flex-row items-center gap-2">
                <User size={18} className="text-indigo" />
                <h3 className="card-title">Profile Snapshot</h3>
              </div>
              <Link to="/profile" className="link-text-sm">
                Edit Profile
              </Link>
            </div>

            <div className="profile-details-list">
              <div className="detail-item">
                <span className="detail-key">Full Name</span>
                <span className="detail-val font-semibold">{userProfile?.name || '—'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-key">Registered Email</span>
                <span className="detail-val">{userProfile?.email || currentUser?.email || '—'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-key">Contact Phone</span>
                <span className="detail-val">{formatPhoneDisplay(userProfile?.phone) || '—'}</span>
              </div>
              {userProfile?.alternateNumbers && userProfile.alternateNumbers.length > 0 && (
                <div className="detail-item">
                  <span className="detail-key">Alternate Numbers</span>
                  <span className="detail-val">
                    {userProfile.alternateNumbers.map(formatPhoneDisplay).join(', ')}
                  </span>
                </div>
              )}
              <div className="detail-item">
                <span className="detail-key">Location / Address</span>
                <span className="detail-val text-truncate">{userProfile?.address || '—'}</span>
              </div>
            </div>

            <div className="privacy-badge">
              <ShieldCheck size={16} />
              <span>Only your Name and Phone are public on your QR page.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
