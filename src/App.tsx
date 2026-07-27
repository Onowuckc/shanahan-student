import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import ClaimAccountPage from './pages/ClaimAccountPage';
import Dashboard from './pages/Dashboard';
import Payments from './pages/Payments';
import Courses from './pages/Courses';
import Hostels from './pages/Hostels';
import Results from './pages/Results';
import ProfilePage from './pages/ProfilePage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Authentication routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/claim-account" element={<ClaimAccountPage />} />

          {/* Protected Student Portal routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/hostels" element={<Hostels />} />
            <Route path="/results" element={<Results />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>

          {/* Fallbacks */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
