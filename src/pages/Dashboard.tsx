import { useEffect, useState } from 'react';
import api from '../api/client';
import {
  CoursesIcon,
  HostelsIcon,
  ResultsIcon,
  PaymentsIcon,
  CheckIcon,
  AlertIcon
} from '../components/Icons';

interface DashboardData {
  profile: {
    id: string;
    matricNumber: string;
    firstName: string;
    lastName: string;
    level: number;
    gender: string;
    phoneNumber: string | null;
    metadata: Record<string, any> | null;
    department: {
      name: string;
      faculty: { name: string };
    };
    program: {
      name: string;
    };
  };
  activeSession: string;
  activeSemester: string;
  financials: {
    totalDue: number;
    totalPaid: number;
    outstanding: number;
  };
  academic: {
    courseRegStatus: 'NOT_REGISTERED' | 'PENDING_APPROVAL' | 'APPROVED';
    hostelStatus: 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';
    allocatedHostelName: string | null;
  };
}

interface CustomField {
  name: string;
  label: string;
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [dashRes, fieldsRes] = await Promise.all([
          api.get('/student/dashboard-stats'),
          api.get('/admin/settings/custom-fields?key=custom_student_fields').catch(() => ({ data: { data: [] } }))
        ]);
        setData(dashRes.data);
        setCustomFields(fieldsRes.data.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner" />
        <p style={{ marginTop: 12, color: 'var(--text-secondary)' }}>Loading dashboard...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon"><AlertIcon size={32} color="var(--danger-500)" /></div>
        <div className="empty-state-title">Failed to load profile</div>
        <div className="empty-state-desc">Please log out and log in again.</div>
      </div>
    );
  }

  const { profile, activeSession, activeSemester, financials, academic } = data;
  const initials = `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase();

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Opus Hero Welcome Banner */}
      <div className="hero-banner">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{
              width: 68,
              height: 68,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent-500), var(--accent-600))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              fontWeight: 800,
              color: '#150207',
              boxShadow: '0 6px 20px rgba(212,175,55,0.4)',
              border: '2px solid #FFF'
            }}>
              {initials}
            </div>
            <div>
              <h1 className="hero-title">Welcome back, {profile.firstName}!</h1>
              <p className="hero-subtitle">
                Matriculation ID: <strong style={{ color: 'var(--accent-400)', fontFamily: 'monospace' }}>{profile.matricNumber}</strong>
                <span style={{ margin: '0 8px', opacity: 0.5 }}>|</span>
                Program: <strong style={{ color: '#FFF' }}>{profile.program.name}</strong>
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
            <span className="badge badge-gold" style={{ fontSize: 11, padding: '4px 12px' }}>
              Enrolled Student • {profile.level}L
            </span>
            <div style={{ fontSize: 12, color: '#FCE7F3' }}>
              {activeSession} Session ({activeSemester} Semester)
            </div>
          </div>
        </div>
      </div>

      {/* Semester Registration CTA Banner */}
      {academic.courseRegStatus === 'NOT_REGISTERED' && (
        <div style={{
          background: '#FEFCE8',
          border: '1px solid #FDE047',
          borderRadius: 'var(--radius-lg)',
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
          boxShadow: 'var(--shadow-sm)',
          flexWrap: 'wrap'
        }}>
          <div>
            <h4 style={{ margin: '0 0 4px 0', fontSize: 16, fontWeight: 800, color: '#854D0E' }}>
              Semester Registration Open
            </h4>
            <p style={{ margin: 0, fontSize: 13, color: '#713F12' }}>
              Hostel space selection and course registration are available for the active academic session.
            </p>
          </div>
          <button 
            onClick={() => window.location.href = '/courses'}
            className="btn btn-gold"
            style={{ fontWeight: 700, color: '#4A0E17' }}
          >
            Register Courses Now
          </button>
        </div>
      )}

      {/* KPI Stats Widgets grid */}
      <div className="kpi-grid">
        {/* Degree Card */}
        <div className="stat-card-opus">
          <div className="stat-card-header">
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Academic Level</span>
            <div className="stat-card-icon"><CoursesIcon size={20} /></div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>{profile.level} Level</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{profile.department.faculty.name}</div>
        </div>

        {/* Academic Period Card */}
        <div className="stat-card-opus">
          <div className="stat-card-header">
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Active Period</span>
            <div className="stat-card-icon"><ResultsIcon size={20} /></div>
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>{activeSession}</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{activeSemester} Semester</div>
        </div>

        {/* Course Reg Card */}
        <div className="stat-card-opus">
          <div className="stat-card-header">
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Course Registration</span>
            <div className="stat-card-icon"><CheckIcon size={20} /></div>
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: academic.courseRegStatus === 'APPROVED' ? 'var(--success-500)' : 'var(--warning-500)' }}>
            {academic.courseRegStatus === 'APPROVED' ? 'Approved & Enrolled' : academic.courseRegStatus === 'PENDING_APPROVAL' ? 'Pending Approval' : 'Not Submitted'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Status in current semester</div>
        </div>

        {/* Hostel Space Card */}
        <div className="stat-card-opus">
          <div className="stat-card-header">
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Hostel Status</span>
            <div className="stat-card-icon"><HostelsIcon size={20} /></div>
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: academic.hostelStatus === 'APPROVED' ? 'var(--success-500)' : 'var(--text-secondary)' }}>
            {academic.hostelStatus === 'APPROVED' ? academic.allocatedHostelName : academic.hostelStatus === 'PENDING' ? 'Awaiting Allocation' : 'Off-Campus'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Bed space allocation</div>
        </div>
      </div>

      {/* Main Sections Row */}
      <div className="grid-2" style={{ alignItems: 'start' }}>
        {/* Profile Specifications Card */}
        <div className="section-card" style={{ margin: 0 }}>
          <div className="section-card-header">
            <h3 className="section-card-title">Profile Specifications</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, fontSize: 13 }}>
            <div>
              <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Faculty</label>
              <div style={{ fontWeight: 600, marginTop: 2 }}>{profile.department.faculty.name}</div>
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Department</label>
              <div style={{ fontWeight: 600, marginTop: 2 }}>{profile.department.name}</div>
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Gender</label>
              <div style={{ fontWeight: 600, marginTop: 2 }}>{profile.gender}</div>
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Contact Phone</label>
              <div style={{ fontWeight: 600, marginTop: 2 }}>{profile.phoneNumber || 'N/A'}</div>
            </div>
          </div>

          {/* Dynamic Custom Metadata */}
          {profile.metadata && Object.keys(profile.metadata).length > 0 && (
            <>
              <div className="divider" />
              <div style={{ fontSize: 11, color: 'var(--accent-400)', fontWeight: 700, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Dynamic Custom Info</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, fontSize: 13 }}>
                {Object.entries(profile.metadata)
                  .filter(([key]) => key !== 'dateOfBirth')
                  .map(([key, val]) => {
                    const fieldLabel = customFields.find(f => f.name === key)?.label || key.replace(/_/g, ' ');
                    return (
                      <div key={key}>
                        <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>{fieldLabel}</label>
                        <div style={{ fontWeight: 600, marginTop: 2 }}>{String(val)}</div>
                      </div>
                    );
                  })}
              </div>
            </>
          )}
        </div>

        {/* Financial Outstanding Box */}
        <div className="section-card" style={{ margin: 0 }}>
          <div className="section-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 className="section-card-title">Fee Outstanding Status</h3>
            <PaymentsIcon size={20} color="var(--accent-400)" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Total Session Invoiced:</span>
              <span style={{ fontWeight: 700 }}>₦{financials.totalDue.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Total Paid to Date:</span>
              <span style={{ fontWeight: 700, color: 'var(--success-500)' }}>₦{financials.totalPaid.toLocaleString()}</span>
            </div>

            <div className="divider" style={{ margin: '4px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>Outstanding Balance:</span>
              <span style={{ fontSize: 20, fontWeight: 800, color: financials.outstanding > 0 ? 'var(--danger-500)' : 'var(--success-500)' }}>
                ₦{financials.outstanding.toLocaleString()}
              </span>
            </div>

            {financials.outstanding > 0 ? (
              <div style={{
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: 'var(--radius-md)',
                padding: 12,
                fontSize: 12,
                color: 'var(--danger-500)',
                lineHeight: 1.5,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8
              }}>
                <AlertIcon size={16} color="var(--danger-500)" style={{ flexShrink: 0, marginTop: 1 }} />
                <span>Outstanding balance detected. Proceed to the payments portal to settle installments or full clear.</span>
              </div>
            ) : (
              <div style={{
                background: 'rgba(34, 197, 94, 0.08)',
                border: '1px solid rgba(34, 197, 94, 0.2)',
                borderRadius: 'var(--radius-md)',
                padding: 12,
                fontSize: 12,
                color: 'var(--success-500)',
                lineHeight: 1.5,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8
              }}>
                <CheckIcon size={16} color="var(--success-500)" style={{ flexShrink: 0, marginTop: 1 }} />
                <span>All fees for this session have been cleared in full!</span>
              </div>
            )}

            <button
              onClick={() => window.location.href = '/payments'}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: 4 }}
            >
              Go to Payments Ledger
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
