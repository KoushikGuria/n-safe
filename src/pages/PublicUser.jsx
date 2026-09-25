import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getUserByQrId } from '../services/userService';
import ContactButtons from '../components/ContactButtons';
import Loading from '../components/Loading';
import { 
  QrCode, 
  AlertTriangle, 
  ShieldCheck, 
  Home, 
  RotateCw,
  ShieldAlert,
  UserCheck
} from 'lucide-react';

export default function PublicUser() {
  const { qrId } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [reloadTrigger, setReloadTrigger] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function loadPublicData() {
      if (!qrId) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setLoading(true);
      setErrorMessage(null);
      setNotFound(false);

      try {
        const publicData = await getUserByQrId(qrId);
        if (!isMounted) return;

        if (publicData) {
          setUser(publicData);
          setNotFound(false);
          setErrorMessage(null);
          document.title = `Contact ${publicData.name || 'User'} | N-Safe`;
        } else {
          // Document does not exist in publicProfiles collection
          setUser(null);
          setNotFound(true);
          setErrorMessage(null);
          document.title = 'QR Code Not Found | N-Safe';
        }
      } catch (err) {
        // Handle actual Firebase permission, network, or server error
        console.error('Firebase error fetching public profile:', err);
        if (!isMounted) return;

        setUser(null);
        setNotFound(false); // DO NOT mark as not found when it's a technical error!
        
        let friendlyMsg = err.message || 'An error occurred while loading this profile.';
        if (err.code === 'permission-denied') {
          friendlyMsg = 'Firestore Permission Denied: The publicProfiles collection rules do not allow public read access. Please check your Firestore security rules.';
        } else if (err.code === 'unavailable') {
          friendlyMsg = 'Network or service unavailable. Please check your internet connection.';
        }

        setErrorMessage(friendlyMsg);
        document.title = 'Error Loading Profile | N-Safe';
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadPublicData();

    return () => {
      isMounted = false;
      document.title = 'N-Safe — Personal QR Contact & Messaging';
    };
  }, [qrId, reloadTrigger]);

  if (loading) {
    return <Loading fullScreen text="Connecting to contact profile..." />;
  }

  // 1. Technical / Permission Error Screen
  if (errorMessage) {
    return (
      <div className="public-page-wrapper">
        <div className="public-card not-found-card animate-scale-in">
          <div className="not-found-icon-box" style={{ background: 'var(--color-danger-light)' }}>
            <ShieldAlert size={48} className="text-danger" style={{ color: 'var(--color-danger)' }} />
          </div>
          <h1 className="not-found-title">Unable to Load Profile</h1>
          <p className="not-found-desc" style={{ maxWidth: '400px' }}>
            {errorMessage}
          </p>
          <div className="not-found-actions flex-row justify-center gap-3">
            <button
              type="button"
              onClick={() => setReloadTrigger((prev) => prev + 1)}
              className="btn-primary"
            >
              <RotateCw size={18} />
              <span>Retry</span>
            </button>
            <Link to="/" className="btn-secondary">
              <Home size={18} />
              <span>Go to Home</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 2. Missing QR Code Screen (Document does not exist)
  if (notFound || !user) {
    return (
      <div className="public-page-wrapper">
        <div className="public-card not-found-card animate-scale-in">
          <div className="not-found-icon-box">
            <AlertTriangle size={48} className="text-amber" />
          </div>
          <h1 className="not-found-title">QR Code Not Found</h1>
          <p className="not-found-desc">
            This QR code is invalid or is no longer available.
          </p>
          <div className="not-found-actions">
            <Link to="/" className="btn-secondary">
              <Home size={18} />
              <span>Go to Homepage</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const initial = user.name ? user.name.charAt(0).toUpperCase() : 'U';

  return (
    <div className="public-page-wrapper">
      <main className="public-card animate-fade-up">
        {/* Profile Header */}
        <header className="public-header">
          <div className="public-avatar-wrapper">
            <div className="public-avatar">
              {initial}
            </div>
            <div className="public-verified-badge" title="Verified QR Profile">
              <UserCheck size={14} />
            </div>
          </div>

          <h1 className="public-user-name">{user.name}</h1>
          <p className="public-tagline">
            <span>Direct Contact Profile</span>
          </p>
        </header>

        {/* Direct Call Action */}
        <section className="public-section contact-section">
          <ContactButtons 
            phone={user.phone} 
            userName={user.name} 
          />
        </section>

        {/* Footer / Privacy Assurance */}
        <footer className="public-footer">
          <div className="privacy-pill">
            <ShieldCheck size={14} className="text-indigo" />
            <span>End-to-end direct contact • No account required</span>
          </div>
          <div className="brand-watermark">
            <Link to="/" className="watermark-link">
              <QrCode size={14} />
              <span>Powered by <strong>N-Safe</strong></span>
            </Link>
          </div>
        </footer>
      </main>
    </div>
  );
}
