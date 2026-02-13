import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Knowledge from './pages/Knowledge.jsx';
import Conversations from './pages/Conversations.jsx';
import Bots from './pages/Bots.jsx';
import Servers from './pages/Servers.jsx';
import Automations from './pages/Automations.jsx';
import Insights from './pages/Insights.jsx';
import Memory from './pages/Memory.jsx';
import Login from './pages/Login.jsx';
import MainLayout from './layouts/MainLayout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { useAuth } from './context/AuthContext.jsx';

export default function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Protected Routes with MainLayout */}
      <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/knowledge" element={<Knowledge />} />
        <Route path="/conversations" element={<Conversations />} />
        <Route path="/bots" element={<Bots />} />
        <Route path="/servers" element={<Servers />} />
        <Route path="/automations" element={<Automations />} />
        <Route path="/insights" element={<Insights />} />
        <Route path="/memory" element={<Memory />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}


