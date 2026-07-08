import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import LandingPage from './pages/LandingPage';
import EventDetail from './pages/EventDetail';
import AdminLogin from './pages/AdminLogin';
import Dashboard from './pages/Dashboard';
import EventsManagement from './pages/EventsManagement';
import EventParticipants from './pages/EventParticipants';
import Scanner from './pages/Scanner';
import Users from './pages/Users';
import Admins from './pages/Admins';
import Roles from './pages/Roles';
import Reports from './pages/Reports';
import EmailLogs from './pages/EmailLogs';
import Profile from './pages/Profile';
import Settings from './pages/Settings';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
       
          <Route path="/" element={<LandingPage />} />
          <Route path="/events/:id" element={<EventDetail />} />
          <Route path="/admin/login" element={<AdminLogin />} />

          <Route path="/admin/scanner" element={<ProtectedRoute allowedRoles={['Admin Level 1', 'Admin Level 2']}><Scanner /></ProtectedRoute>} />
          <Route path="/admin/profile" element={<ProtectedRoute allowedRoles={['Admin Level 1', 'Admin Level 2']}><Profile /></ProtectedRoute>} />
          <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['Admin Level 1', 'Admin Level 2']}><Settings /></ProtectedRoute>} />

          <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['Admin Level 1']}><Dashboard /></ProtectedRoute>} />
          <Route path="/admin/events" element={<ProtectedRoute allowedRoles={['Admin Level 1']}><EventsManagement /></ProtectedRoute>} />
          <Route path="/admin/events/:id/participants" element={<ProtectedRoute allowedRoles={['Admin Level 1']}><EventParticipants /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['Admin Level 1']}><Users /></ProtectedRoute>} />
          <Route path="/admin/admins" element={<ProtectedRoute allowedRoles={['Admin Level 1']}><Admins /></ProtectedRoute>} />
          <Route path="/admin/roles" element={<ProtectedRoute allowedRoles={['Admin Level 1']}><Roles /></ProtectedRoute>} />
          <Route path="/admin/reports" element={<ProtectedRoute allowedRoles={['Admin Level 1']}><Reports /></ProtectedRoute>} />
          <Route path="/admin/email-logs" element={<ProtectedRoute allowedRoles={['Admin Level 1']}><EmailLogs /></ProtectedRoute>} />

          <Route path="*" element={<div className="p-10 text-center text-ink-700/50">Halaman tidak ditemukan.</div>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
