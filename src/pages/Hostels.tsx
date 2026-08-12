import { useEffect, useState, useCallback } from 'react';
import api from '../api/client';
import {
  BuildingIcon,
  HostelsIcon,
  PaymentsIcon,
  CheckIcon,
  ClockIcon,
  CrossIcon,
  AlertIcon
} from '../components/Icons';

interface Hostel {
  id: string;
  name: string;
  gender: 'MALE' | 'FEMALE' | 'MIXED';
  totalCapacity: number;
  allowedLevels: number[];
  description: string | null;
  _count: {
    allocations: number;
  };
}

export default function Hostels() {
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [hostelStatus, setHostelStatus] = useState<'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED'>('NONE');
  const [allocatedHostelName, setAllocatedHostelName] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [statsRes, hostelsRes] = await Promise.all([
        api.get('/student/dashboard-stats'),
        api.get('/student/hostels').catch(() => ({ data: { data: [] } }))
      ]);
      setHostelStatus(statsRes.data.academic.hostelStatus);
      setAllocatedHostelName(statsRes.data.academic.allocatedHostelName);
      setHostels(hostelsRes.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRequestSpace = async (hostelId: string) => {
    setRequesting(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const { data } = await api.post('/student/hostels/allocate', { hostelId });
      setSuccessMsg(data.message || 'Hostel allocation request submitted successfully.');
      setTimeout(() => {
        loadData();
      }, 2500);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.error || 'Failed to submit allocation request.');
    } finally {
      setRequesting(false);
    }
  };

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div>
          <div className="page-title">Hostel Accommodation</div>
          <div className="page-subtitle">Reserve a bed space in one of our campus residential blocks</div>
        </div>
      </div>

      {errorMsg && (
        <div style={{ padding: 14, background: 'rgba(239,68,68,0.08)', border: '1px solid var(--danger-500)', borderRadius: 'var(--radius-md)', color: 'var(--danger-500)', fontSize: 13, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertIcon size={18} color="var(--danger-500)" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div style={{ padding: 14, background: 'rgba(34,197,94,0.08)', border: '1px solid var(--success-500)', borderRadius: 'var(--radius-md)', color: 'var(--success-500)', fontSize: 13, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckIcon size={18} color="var(--success-500)" />
          <span>{successMsg}</span>
        </div>
      )}

      {hostelStatus !== 'NONE' ? (
        /* Render Requested Status */
        <div className="section-card" style={{ textAlign: 'center', padding: '40px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            {hostelStatus === 'APPROVED' ? (
              <HostelsIcon size={48} color="var(--success-500)" />
            ) : hostelStatus === 'PENDING' ? (
              <ClockIcon size={48} color="var(--warning-500)" />
            ) : (
              <CrossIcon size={48} color="var(--danger-500)" />
            )}
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8, color: '#4A0E17' }}>
            {hostelStatus === 'APPROVED' 
              ? `Confirmed Bed Allocation!`
              : hostelStatus === 'PENDING' 
                ? 'Bed Reserved — Awaiting Payment'
                : 'Request Rejected'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, maxWidth: 460, margin: '0 auto 24px', lineHeight: 1.6 }}>
            {hostelStatus === 'APPROVED' 
              ? `Your bed space allocation is verified. You have been assigned space in: ${allocatedHostelName}. Please visit Student Affairs for room keys.`
              : hostelStatus === 'PENDING' 
                ? 'Your requested bed space has been reserved. You must clear outstanding Accommodation/Hostel fees in the Payments tab to auto-approve allocation.'
                : 'Your hostel allocation request has been declined. Please contact the hostel admin unit.'}
          </p>

          {hostelStatus === 'PENDING' && (
            <button
              onClick={() => window.location.href = '/payments'}
              className="btn btn-primary"
              style={{ margin: '0 auto', display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              <PaymentsIcon size={18} />
              <span>Go to Payments Page</span>
            </button>
          )}
        </div>
      ) : (
        /* Render Available Hostel Blocks */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
          {hostels.length === 0 ? (
            <div className="empty-state" style={{ gridColumn: 'span 3' }}>
              <div className="empty-state-icon"><BuildingIcon size={48} color="#800020" /></div>
              <div className="empty-state-title">No hostels available</div>
              <div className="empty-state-desc">There are no vacant residential blocks configured for your gender.</div>
            </div>
          ) : (
            hostels.map((hostel) => {
              const bedSpacesLeft = hostel.totalCapacity - hostel._count.allocations;
              const percent = Math.min(Math.round((hostel._count.allocations / hostel.totalCapacity) * 100), 100);

              return (
                <div key={hostel.id} className="glass-card" style={{ padding: '24px 28px', border: '1px solid var(--border-default)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(128,0,32,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <BuildingIcon size={24} color="#800020" />
                    </div>
                    <span className={`badge badge-${hostel.gender === 'MALE' ? 'info' : hostel.gender === 'FEMALE' ? 'danger' : 'warning'}`}>
                      {hostel.gender === 'MALE' ? 'Male Block' : hostel.gender === 'FEMALE' ? 'Female Block' : 'Mixed Block'}
                    </span>
                  </div>

                  <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>{hostel.name}</h3>
                  {hostel.description && (
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>{hostel.description}</p>
                  )}

                  <div className="divider" style={{ margin: '12px 0' }} />

                  {/* Bed Occupancy Capacity Status */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Occupancy Status:</span>
                    <span>{hostel._count.allocations} / {hostel.totalCapacity} beds</span>
                  </div>

                  <div style={{ width: '100%', height: 6, background: 'var(--border-default)', borderRadius: 3, overflow: 'hidden', marginBottom: 16 }}>
                    <div style={{ width: `${percent}%`, height: '100%', background: percent > 90 ? 'var(--danger-500)' : 'var(--primary-500)' }} />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                    <span style={{ fontSize: 12, color: bedSpacesLeft > 0 ? 'var(--success-500)' : 'var(--danger-500)', fontWeight: 700 }}>
                      {bedSpacesLeft > 0 ? `${bedSpacesLeft} bed spaces vacant` : 'Fully Occupied'}
                    </span>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleRequestSpace(hostel.id)}
                      disabled={requesting || bedSpacesLeft <= 0}
                    >
                      Request Space
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
