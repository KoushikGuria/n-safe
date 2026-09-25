import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loading from './Loading';

export default function PublicOnlyRoute({ children, redirectTo = '/dashboard' }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <Loading fullScreen text="Loading..." />;
  }

  if (isAuthenticated) {
    const isPendingPromo = sessionStorage.getItem('nsafe_pending_promo') === 'true';
    const target = isPendingPromo ? '/promo' : redirectTo;
    return <Navigate to={target} replace />;
  }

  return children;
}
