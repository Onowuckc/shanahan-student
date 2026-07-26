import { useEffect, useState } from 'react';
import api from '../api/client';

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
          // Fetch settings configuration to resolve display labels for student metadata columns
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
        <div className="empty-state-icon">⚠️</div>
        <div className="empty-state-title">Failed to load profile</div>
        <div className="empty-state-desc">Please log out and log in again.</div>
      </div>
    );
  }

  const { profile, activeSession, activeSemester, financials, academic } = data;

  const initials = `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase();

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Welcome Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, var(--primary-800), var(--primary-900))',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        padding: '32px 40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: 'var(--shadow-md)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background glow effects */}
        <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: '50%', background: 'rgba(212,160,23,0.1)', filter: 'blur(40px)' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--accent-600), var(--accent-400))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
            fontWeight: 800,
            color: '#fff',
            boxShadow: '0 8px 25px rgba(212,160,23,0.3)'
          }}>
            {initials}
          </div>
          <div>
            <h1 style={{ fontSize: 24, margin: 0, fontWeight: 800 }}>Welcome, {profile.firstName} {profile.lastName}!</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
              Matriculation Number: <strong style={{ color: 'var(--primary-200)', fontFamily: 'monospace' }}>{profile.matricNumber}</strong>
            </p>
          </div>
        </div>

        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span className="badge badge-gold" style={{ fontSize: 12 }}>Active Student</span>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Level: {profile.level}L</div>
        </div>
      </div>

      {/* Semester Registration CTA Banner */}
      {academic.courseRegStatus === 'NOT_REGISTERED' && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(212,160,23,0.15), rgba(212,160,23,0.03))',
          border: '1px solid var(--accent-500)',
          borderRadius: 'var(--radius-md)',
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div>
            <h4 style={{ margin: '0 0 4px 0', fontSize: 16, fontWeight: 800, color: 'var(--accent-400)' }}>📅 Semester Registration is Open</h4>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>
              Complete your hostel selection and course registration for the current semester to finalize your enrollment.
            </p>
          </div>
          <button 
            onClick={() => window.location.href = '/courses'}
            className="btn btn-primary"
            style={{ fontWeight: 700 }}
          >
            Register for the Semester
          </button>
        </div>
      )}

      {/* KPI Stats Widgets grid */}
      <div className="kpi-grid">
        {/* Enrollment Card */}
        <div className="kpi-card" style={{ '--kpi-color': 'var(--primary-300)' } as any}>
          <div className="kpi-icon">📚</div>
          <div className="kpi-value">{profile.level} Level</div>
          <div className="kpi-label">Degree Pathway</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
            {profile.program.name}
          </div>
        </div>

        {/* Academic Period Card */}
        <div className="kpi-card" style={{ '--kpi-color': 'var(--accent-400)' } as any}>
          <div className="kpi-icon">🗓️</div>
          <div className="kpi-value" style={{ fontSize: 20, padding: '6px 0' }}>{activeSession}</div>
          <div className="kpi-label">Current Academic Session</div>
          <div style={{ fontSize: 12, color: 'var(--accent-300)', marginTop: 8 }}>
            {activeSemester} Semester
          </div>
        </div>

        {/* Course Reg Card */}
        <div className="kpi-card" style={{ '--kpi-color': academic.courseRegStatus === 'APPROVED' ? 'var(--success-500)' : 'var(--warning-500)' } as any}>
          <div className="kpi-icon">📝</div>
          <div className="kpi-value" style={{ fontSize: 16, padding: '8px 0' }}>
            {academic.courseRegStatus === 'APPROVED' ? '✅ Approved' : academic.courseRegStatus === 'PENDING_APPROVAL' ? '⏳ Pending Review' : '❌ Not Submitted'}
          </div>
          <div className="kpi-label">Course Registration</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
            Status in current semester
          </div>
        </div>

        {/* Hostel Space Card */}
        <div className="kpi-card" style={{ '--kpi-color': academic.hostelStatus === 'APPROVED' ? 'var(--success-500)' : 'var(--primary-300)' } as any}>
          <div className="kpi-icon">🏠</div>
          <div className="kpi-value" style={{ fontSize: 16, padding: '8px 0' }}>
            {academic.hostelStatus === 'APPROVED' ? `🏨 ${academic.allocatedHostelName}` : academic.hostelStatus === 'PENDING' ? '⏳ Awaiting Payment' : '❌ Off-Campus / None'}
          </div>
          <div className="kpi-label">Hostel Accommodation</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
            Allocated bed space status
          </div>
        </div>
      </div>

      {/* Main Sections Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 24, alignItems: 'start' }}>
        {/* Profile Card & Custom Columns */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="section-card" style={{ margin: 0 }}>
            <div className="section-card-header">
              <h3 className="section-card-title">Profile Specifications</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, fontSize: 14 }}>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Faculty</label>
                <div style={{ fontWeight: 600, marginTop: 4 }}>{profile.department.faculty.name}</div>
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Department</label>
                <div style={{ fontWeight: 600, marginTop: 4 }}>{profile.department.name}</div>
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Gender</label>
                <div style={{ fontWeight: 600, marginTop: 4 }}>{profile.gender}</div>
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Contact Phone</label>
                <div style={{ fontWeight: 600, marginTop: 4 }}>{profile.phoneNumber || 'N/A'}</div>
              </div>
            </div>

            {/* Render Custom dynamic columns */}
            {profile.metadata && Object.keys(profile.metadata).length > 0 && (
              <>
                <div className="divider" />
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 700, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Dynamic Custom Information</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, fontSize: 14 }}>
                  {Object.entries(profile.metadata)
                    .filter(([key]) => key !== 'dateOfBirth')
                    .map(([key, val]) => {
                      const fieldLabel = customFields.find(f => f.name === key)?.label || key.replace(/_/g, ' ');
                      return (
                        <div key={key}>
                          <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>{fieldLabel}</label>
                          <div style={{ fontWeight: 600, marginTop: 4 }}>{String(val)}</div>
                        </div>
                      );
                    })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Financial Outstanding Box */}
        <div className="section-card" style={{ margin: 0, background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-default)' }}>
          <div className="section-card-header">
            <h3 className="section-card-title">Fee Outstanding Status</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Total Session Invoiced:</span>
              <span style={{ fontWeight: 700 }}>₦{financials.totalDue.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Total Paid to Date:</span>
              <span style={{ fontWeight: 700, color: 'var(--success-500)' }}>₦{financials.totalPaid.toLocaleString()}</span>
            </div>

            <div className="divider" style={{ margin: '8px 0' }} />

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
                color: 'var(--danger-400)',
                lineHeight: 1.5,
                marginTop: 8
              }}>
                🚨 You have an outstanding fee balance. Please click the button below to initialize installment or full payment checkout.
              </div>
            ) : (
              <div style={{
                background: 'rgba(34, 197, 94, 0.08)',
                border: '1px solid rgba(34, 197, 94, 0.2)',
                borderRadius: 'var(--radius-md)',
                padding: 12,
                fontSize: 12,
                color: 'var(--success-400)',
                lineHeight: 1.5,
                marginTop: 8
              }}>
                🎉 All fees for this session have been fully cleared!
              </div>
            )}

            <button
              onClick={() => window.location.href = '/payments'}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: 8 }}
            >
              Go to Payments Ledger
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
