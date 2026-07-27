import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logoImg from '../assets/SHANAHAN-UNI-LOGO.png';

export function ProtectedRoute() {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Ensure role is STUDENT or APPLICANT if needed, but mainly STUDENT for this portal
  if (user?.role !== 'STUDENT') {
    // If not a student, force logout and login screen
    return <Navigate to="/login" replace />;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>
      {/* Sidebar Navigation */}
      <aside style={{
        width: 260,
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border-default)',
        padding: '24px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 24
      }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '0.05em', color: 'var(--primary-200)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src={logoImg} alt="Logo" style={{ width: 32, height: 32, objectFit: 'contain' }} /> SHANAHAN STUDENT
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, textTransform: 'uppercase', fontWeight: 600 }}>University Portal</div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
          <SidebarLink to="/dashboard" icon="📊" label="Dashboard" />
          <SidebarLink to="/payments" icon="💳" label="Fee Payments" />
          <SidebarLink to="/courses" icon="📖" label="Course Registration" />
          <SidebarLink to="/hostels" icon="🏠" label="Hostel Space" />
          <SidebarLink to="/results" icon="🎓" label="My Results" />
          <SidebarLink to="/profile" icon="👤" label="My Profile & Security" />
        </nav>

        <div style={{ borderTop: '1px solid var(--border-default)', paddingTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary-700), var(--primary-800))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 }}>
              👤
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{user?.username}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Student Profile</div>
            </div>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('umis_token');
              localStorage.removeItem('umis_user');
              window.location.href = '/login';
            }}
            className="btn btn-ghost"
            style={{ width: '100%', justifyContent: 'flex-start', color: 'var(--danger-400)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px' }}
          >
            <span>🚪</span> Log Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: 40, overflowY: 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
}

import { NavLink } from 'react-router-dom';

function SidebarLink({ to, icon, label }: { to: string; icon: string; label: string }) {
  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 14px',
        borderRadius: 'var(--radius-md)',
        fontSize: 14,
        fontWeight: 500,
        textDecoration: 'none',
        transition: 'all 0.2s',
        color: isActive ? 'var(--primary-200)' : 'var(--text-secondary)',
        background: isActive ? 'rgba(212,160,23,0.08)' : 'transparent',
        border: isActive ? '1px solid rgba(212,160,23,0.15)' : '1px solid transparent',
      })}
    >
      <span style={{ fontSize: 16 }}>{icon}</span>
      <span>{label}</span>
    </NavLink>
  );
}
