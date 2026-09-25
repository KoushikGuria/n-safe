import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, ArrowLeft, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="auth-page-wrapper">
      <div className="auth-card not-found-card text-center animate-fade-in">
        <div className="not-found-icon-box">
          <HelpCircle size={48} className="text-indigo" />
        </div>
        <h1 className="auth-title mt-2">404 - Page Not Found</h1>
        <p className="auth-subtitle mt-1">
          The page you requested could not be located.
        </p>

        <div className="flex-row justify-center gap-3 mt-4">
          <Link to="/dashboard" className="btn-primary">
            <Home size={18} />
            <span>Go to Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
