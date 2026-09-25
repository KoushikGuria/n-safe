import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import PublicOnlyRoute from '../components/PublicOnlyRoute';

// Pages
import Login from '../pages/Login';
import Register from '../pages/Register';
import Promo from '../pages/Promo';
import Dashboard from '../pages/Dashboard';
import Messages from '../pages/Messages';
import Profile from '../pages/Profile';
import PublicUser from '../pages/PublicUser';
import NotFound from '../pages/NotFound';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Root route: Opens Register page for visitors, or Dashboard if authenticated */}
      <Route
        path="/"
        element={
          <PublicOnlyRoute>
            <Register />
          </PublicOnlyRoute>
        }
      />

      {/* Public Auth Routes */}
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <Login />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicOnlyRoute redirectTo="/promo">
            <Register />
          </PublicOnlyRoute>
        }
      />

      {/* Promo Activation Route */}
      <Route
        path="/promo"
        element={
          <ProtectedRoute>
            <Promo />
          </ProtectedRoute>
        }
      />

      {/* Protected User Dashboard Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-qr"
        element={<Navigate to="/dashboard" replace />}
      />
      <Route
        path="/messages"
        element={
          <ProtectedRoute>
            <Messages />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />

      {/* Public Visitor Contact Route (NO AUTH REQUIRED) */}
      <Route path="/u/:qrId" element={<PublicUser />} />

      {/* Catch-all 404 Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
