import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  QrCode, 
  User, 
  LogOut, 
  LayoutDashboard, 
  Menu, 
  X,
  ExternalLink
} from 'lucide-react';
import logoImg from '../assets/logo.png';

export default function Navbar() {
  const { currentUser, userProfile, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const displayName = userProfile?.name || currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User';

  return (
    <header className="navbar-header no-print">
      <div className="navbar-container">
        {/* Brand / Logo */}
        <NavLink to={isAuthenticated ? "/dashboard" : "/"} className="navbar-brand">
          <div className="brand-icon-wrapper brand-logo-wrapper">
            <img src={logoImg} alt="N-Safe Logo" className="brand-logo-img" />
          </div>
          <div className="brand-text">
            <span className="brand-title">N-<span className="brand-accent">Safe</span></span>
          </div>
        </NavLink>

        {isAuthenticated && (
          <>
            {/* Desktop Navigation */}
            <nav className="desktop-nav">
              <NavLink 
                to="/dashboard" 
                end
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
              </NavLink>

              <NavLink 
                to="/profile" 
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <User size={18} />
                <span>Profile</span>
              </NavLink>

              {userProfile?.qrId && (
                <a
                  href={`/u/${userProfile.qrId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="nav-link nav-link-preview"
                  title="View your public contact page"
                >
                  <ExternalLink size={16} />
                  <span>Public View</span>
                </a>
              )}
            </nav>

            {/* User Info & Logout */}
            <div className="user-action-area">
              <div className="user-pill" title={userProfile?.email || currentUser?.email || ''}>
                <div className="user-avatar-circle">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <span className="user-pill-name">{displayName}</span>
              </div>

              <button 
                onClick={handleLogout} 
                className="btn-logout"
                title="Log out of your account"
                aria-label="Logout"
              >
                <LogOut size={18} />
                <span className="logout-text">Logout</span>
              </button>
            </div>

            {/* Mobile Hamburger Button */}
            <button 
              className="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </>
        )}
      </div>

      {/* Mobile Drawer Menu & Dimmed Backdrop */}
      {isAuthenticated && mobileMenuOpen && (
        <>
          <div 
            className="mobile-backdrop animate-fade-in" 
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="mobile-nav-drawer animate-fade-down" role="dialog" aria-label="Mobile Navigation">
            <div className="mobile-user-info">
              <div className="user-avatar-circle large">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="mobile-user-text">
                <p className="mobile-user-name">{displayName}</p>
                <p className="mobile-user-email text-truncate">{userProfile?.email || currentUser?.email}</p>
              </div>
            </div>

            <div className="mobile-nav-links">
              <NavLink 
                to="/dashboard" 
                end
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
              >
                <LayoutDashboard size={20} />
                <span>Dashboard</span>
              </NavLink>

              <NavLink 
                to="/profile" 
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
              >
                <User size={20} />
                <span>Profile Settings</span>
              </NavLink>

              {userProfile?.qrId && (
                <a
                  href={`/u/${userProfile.qrId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMobileMenuOpen(false)}
                  className="mobile-nav-link"
                >
                  <ExternalLink size={20} />
                  <span>Open Public Page</span>
                </a>
              )}
            </div>

            <div className="mobile-nav-footer">
              <button 
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }} 
                className="btn-logout-mobile"
              >
                <LogOut size={20} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </>
      )}
    </header>
  );
}
