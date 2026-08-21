import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import ClaimAccountPage from './pages/ClaimAccountPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import Dashboard from './pages/Dashboard';
import Payments from './pages/Payments';
import Courses from './pages/Courses';
import Hostels from './pages/Hostels';
import Results from './pages/Results';
import ProfilePage from './pages/ProfilePage';

function RootRedirect() {
  const token = localStorage.getItem('umis_token');
  return <Navigate to={token ? "/dashboard" : "/login"} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Authentication routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/claim-account" element={<ClaimAccountPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

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
          <Route path="/" element={<RootRedirect />} />
          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
