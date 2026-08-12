import { useState } from 'react';
import { Navigate, Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logoImg from '../assets/SHANAHAN-UNI-LOGO.png';
import {
  DashboardIcon,
  PaymentsIcon,
  CoursesIcon,
  HostelsIcon,
  ResultsIcon,
  ProfileIcon,
  LogoutIcon,
  CrossIcon,
  MenuIcon
} from './Icons';

export function ProtectedRoute() {
  const { isAuthenticated, user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'STUDENT') {
    return <Navigate to="/login" replace />;
  }

  const closeMobile = () => setMobileOpen(false);

  return (
    <div className="app-shell">
      {/* Mobile Topbar */}
      <header className="mobile-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src={logoImg} alt="Logo" style={{ width: 28, height: 28, objectFit: 'contain' }} />
          <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--primary-200)' }}>SHANAHAN STUDENT</span>
        </div>
        <button className="hamburger-btn" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <CrossIcon size={20} /> : <MenuIcon size={20} />}
        </button>
      </header>

      {/* Backdrop overlay for mobile drawer */}
      <div className={`sidebar-backdrop ${mobileOpen ? 'show' : ''}`} onClick={closeMobile} />

      {/* Sidebar Navigation Drawer */}
      <aside className={`sidebar-drawer ${mobileOpen ? 'mobile-open' : ''}`} style={{
        width: 265,
        background: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border-default)',
        padding: '24px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
        flexShrink: 0
      }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: '0.04em', color: 'var(--primary-200)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src={logoImg} alt="Logo" style={{ width: 34, height: 34, objectFit: 'contain' }} /> SHANAHAN STUDENT
          </div>
          <div style={{ fontSize: 10, color: 'var(--accent-400)', marginTop: 4, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.06em' }}>University Portal</div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
          <SidebarLink to="/dashboard" icon={<DashboardIcon size={18} />} label="Dashboard" onClick={closeMobile} />
          <SidebarLink to="/payments" icon={<PaymentsIcon size={18} />} label="Fee Payments" onClick={closeMobile} />
          <SidebarLink to="/courses" icon={<CoursesIcon size={18} />} label="Course Registration" onClick={closeMobile} />
          <SidebarLink to="/hostels" icon={<HostelsIcon size={18} />} label="Hostel Space" onClick={closeMobile} />
          <SidebarLink to="/results" icon={<ResultsIcon size={18} />} label="My Results" onClick={closeMobile} />
          <SidebarLink to="/profile" icon={<ProfileIcon size={18} />} label="My Profile & Security" onClick={closeMobile} />
        </nav>

        <div style={{ borderTop: '1px solid var(--border-default)', paddingTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div className="user-avatar" style={{ width: 36, height: 36, fontSize: 13, background: 'linear-gradient(135deg, var(--primary-700), var(--primary-800))', border: '1px solid var(--border-accent)' }}>
              {user?.username?.slice(0, 2).toUpperCase() || 'ST'}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.username}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Student Profile</div>
            </div>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('umis_token');
              localStorage.removeItem('umis_user');
              window.location.href = '/login';
            }}
            className="btn btn-ghost"
            style={{ width: '100%', justifyContent: 'flex-start', color: 'var(--danger-400)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12 }}
          >
            <LogoutIcon size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content-area" style={{ flex: 1, padding: 36, overflowY: 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
}

function SidebarLink({ to, icon, label, onClick }: { to: string; icon: React.ReactNode; label: string; onClick?: () => void }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
    >
      <span className="nav-icon">{icon}</span>
      <span>{label}</span>
    </NavLink>
  );
}
