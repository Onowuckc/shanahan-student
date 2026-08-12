import { useState, useEffect } from 'react';
import api from '../api/client';
import { LockIcon, FileIcon } from '../components/Icons';

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<'security' | 'biodata'>('security');

  // Change Password state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Profile data & Biodata Change Request state
  const [profile, setProfile] = useState<any>(null);
  const [biodataForm, setBiodataForm] = useState({
    firstName: '',
    lastName: '',
    gender: '',
    dateOfBirth: '',
    phoneNumber: '',
    state: '',
    lga: '',
    reason: '',
    documentUrl: ''
  });
  const [biodataMsg, setBiodataMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [biodataLoading, setBiodataLoading] = useState(false);
  const [myRequests, setMyRequests] = useState<any[]>([]);

  useEffect(() => {
    fetchProfile();
    fetchBiodataRequests();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/auth/me');
      const userData = res.data.user;
      setProfile(userData);

      if (userData?.student) {
        setBiodataForm({
          firstName: userData.student.firstName || '',
          lastName: userData.student.lastName || '',
          gender: userData.student.gender || '',
          dateOfBirth: userData.student.dateOfBirth ? new Date(userData.student.dateOfBirth).toISOString().split('T')[0] : '',
          phoneNumber: userData.student.phoneNumber || '',
          state: userData.student.state || '',
          lga: userData.student.lga || '',
          reason: '',
          documentUrl: ''
        });
      }
    } catch (err: any) {
      console.error('Failed to fetch profile', err);
    }
  };

  const fetchBiodataRequests = async () => {
    try {
      const res = await api.get('/student/biodata-requests');
      setMyRequests(res.data.requests || []);
    } catch (err: any) {
      console.error('Failed to fetch biodata requests', err);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      setPasswordMsg({ type: 'error', text: 'Please fill in current and new password fields.' });
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      setPasswordMsg({ type: 'error', text: 'New password must be at least 8 characters long.' });
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    try {
      setPasswordLoading(true);
      await api.post('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      setPasswordMsg({ type: 'success', text: 'Password changed successfully!' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      setPasswordMsg({ type: 'error', text: err.response?.data?.error || 'Failed to change password.' });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleBiodataSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBiodataMsg(null);

    if (!biodataForm.reason.trim()) {
      setBiodataMsg({ type: 'error', text: 'Please provide a reason for the biodata change request.' });
      return;
    }

    const requestedData: any = {};
    if (biodataForm.firstName !== profile?.student?.firstName) requestedData.firstName = biodataForm.firstName;
    if (biodataForm.lastName !== profile?.student?.lastName) requestedData.lastName = biodataForm.lastName;
    if (biodataForm.gender !== profile?.student?.gender) requestedData.gender = biodataForm.gender;
    if (biodataForm.dateOfBirth) requestedData.dateOfBirth = biodataForm.dateOfBirth;
    if (biodataForm.phoneNumber !== profile?.student?.phoneNumber) requestedData.phoneNumber = biodataForm.phoneNumber;
    if (biodataForm.state !== profile?.student?.state) requestedData.state = biodataForm.state;
    if (biodataForm.lga !== profile?.student?.lga) requestedData.lga = biodataForm.lga;

    if (Object.keys(requestedData).length === 0) {
      setBiodataMsg({ type: 'error', text: 'No changes detected. Please modify at least one field to request a change.' });
      return;
    }

    try {
      setBiodataLoading(true);
      await api.post('/student/biodata-request', {
        requestedData,
        reason: biodataForm.reason,
        documentUrl: biodataForm.documentUrl
      });
      setBiodataMsg({ type: 'success', text: 'Biodata change request submitted successfully to Registry.' });
      fetchBiodataRequests();
    } catch (err: any) {
      setBiodataMsg({ type: 'error', text: err.response?.data?.error || 'Failed to submit biodata request.' });
    } finally {
      setBiodataLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>My Profile & Security</h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4 }}>
          Manage your account credentials and submit official biodata change requests.
        </p>
      </div>

      {/* Tabs Header */}
      <div style={{ display: 'flex', gap: 12, borderBottom: '1px solid var(--border-default)', marginBottom: 24 }}>
        <button
          onClick={() => setActiveTab('security')}
          style={{
            padding: '10px 16px',
            fontSize: 14,
            fontWeight: 600,
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'security' ? '2px solid var(--primary-200)' : '2px solid transparent',
            color: activeTab === 'security' ? 'var(--primary-200)' : 'var(--text-muted)',
            cursor: 'pointer'
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><LockIcon size={16} /> Security & Password</span>
        </button>
        <button
          onClick={() => setActiveTab('biodata')}
          style={{
            padding: '10px 16px',
            fontSize: 14,
            fontWeight: 600,
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'biodata' ? '2px solid var(--primary-200)' : '2px solid transparent',
            color: activeTab === 'biodata' ? 'var(--primary-200)' : 'var(--text-muted)',
            cursor: 'pointer'
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><FileIcon size={16} /> Request Biodata Change</span>
        </button>
      </div>

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div style={{ background: 'var(--bg-surface)', padding: 24, borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-default)' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Change Password</h2>
          
          {passwordMsg && (
            <div style={{
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              marginBottom: 16,
              fontSize: 14,
              background: passwordMsg.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
              color: passwordMsg.type === 'success' ? '#22c55e' : '#ef4444',
              border: `1px solid ${passwordMsg.type === 'success' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`
            }}>
              {passwordMsg.text}
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 500 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Current Password</label>
              <input
                type="password"
                className="input"
                style={{ width: '100%' }}
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>New Password (min 8 characters)</label>
              <input
                type="password"
                className="input"
                style={{ width: '100%' }}
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Confirm New Password</label>
              <input
                type="password"
                className="input"
                style={{ width: '100%' }}
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={passwordLoading} style={{ alignSelf: 'flex-start', marginTop: 8 }}>
              {passwordLoading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      )}

      {/* Biodata Tab */}
      {activeTab === 'biodata' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Submit Request Card */}
          <div style={{ background: 'var(--bg-surface)', padding: 24, borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-default)' }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Apply for Biodata Change</h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
              Students cannot directly alter verified institutional records. Specify proposed changes below and attach supporting legal documents (e.g. Sworn Affidavit, Gazette, or Birth Certificate) for Registry approval.
            </p>

            {biodataMsg && (
              <div style={{
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                marginBottom: 16,
                fontSize: 14,
                background: biodataMsg.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                color: biodataMsg.type === 'success' ? '#22c55e' : '#ef4444',
                border: `1px solid ${biodataMsg.type === 'success' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`
              }}>
                {biodataMsg.text}
              </div>
            )}

            <form onSubmit={handleBiodataSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>First Name</label>
                <input
                  type="text"
                  className="input"
                  style={{ width: '100%' }}
                  value={biodataForm.firstName}
                  onChange={(e) => setBiodataForm({ ...biodataForm, firstName: e.target.value })}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Last Name</label>
                <input
                  type="text"
                  className="input"
                  style={{ width: '100%' }}
                  value={biodataForm.lastName}
                  onChange={(e) => setBiodataForm({ ...biodataForm, lastName: e.target.value })}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Gender</label>
                <select
                  className="input"
                  style={{ width: '100%' }}
                  value={biodataForm.gender}
                  onChange={(e) => setBiodataForm({ ...biodataForm, gender: e.target.value })}
                >
                  <option value="MALE">MALE</option>
                  <option value="FEMALE">FEMALE</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Date of Birth</label>
                <input
                  type="date"
                  className="input"
                  style={{ width: '100%' }}
                  value={biodataForm.dateOfBirth}
                  onChange={(e) => setBiodataForm({ ...biodataForm, dateOfBirth: e.target.value })}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>State of Origin</label>
                <input
                  type="text"
                  className="input"
                  style={{ width: '100%' }}
                  value={biodataForm.state}
                  onChange={(e) => setBiodataForm({ ...biodataForm, state: e.target.value })}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>LGA</label>
                <input
                  type="text"
                  className="input"
                  style={{ width: '100%' }}
                  value={biodataForm.lga}
                  onChange={(e) => setBiodataForm({ ...biodataForm, lga: e.target.value })}
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Supporting Document URL (Affidavit / Gazette Link)</label>
                <input
                  type="text"
                  className="input"
                  placeholder="https://drive.google.com/... or document cloud link"
                  style={{ width: '100%' }}
                  value={biodataForm.documentUrl}
                  onChange={(e) => setBiodataForm({ ...biodataForm, documentUrl: e.target.value })}
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Reason for Change Request *</label>
                <textarea
                  className="input"
                  rows={3}
                  placeholder="Explain why your biodata needs correction (e.g. misspelling on JAMB slip, marriage name change, etc.)"
                  style={{ width: '100%' }}
                  value={biodataForm.reason}
                  onChange={(e) => setBiodataForm({ ...biodataForm, reason: e.target.value })}
                  required
                />
              </div>

              <div style={{ gridColumn: '1 / -1', marginTop: 8 }}>
                <button type="submit" className="btn btn-primary" disabled={biodataLoading}>
                  {biodataLoading ? 'Submitting Request...' : 'Submit Request to Registry'}
                </button>
              </div>
            </form>
          </div>

          {/* History Card */}
          <div style={{ background: 'var(--bg-surface)', padding: 24, borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-default)' }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Request History</h2>

            {myRequests.length === 0 ? (
              <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>No previous biodata change requests found.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {myRequests.map((req) => (
                  <div key={req.id} style={{
                    padding: 16,
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-default)',
                    background: 'var(--bg-base)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                        Submitted on {new Date(req.createdAt).toLocaleDateString()}
                      </span>
                      <span style={{
                        fontSize: 12,
                        fontWeight: 700,
                        padding: '4px 10px',
                        borderRadius: 12,
                        background: req.status === 'APPROVED' ? 'rgba(34,197,94,0.1)' : req.status === 'REJECTED' ? 'rgba(239,68,68,0.1)' : 'rgba(234,179,8,0.1)',
                        color: req.status === 'APPROVED' ? '#22c55e' : req.status === 'REJECTED' ? '#ef4444' : '#eab308'
                      }}>
                        {req.status}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, marginBottom: 6 }}>
                      <strong>Reason:</strong> {req.reason}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      <strong>Proposed Changes:</strong> {JSON.stringify(req.requestedData)}
                    </div>
                    {req.adminNote && (
                      <div style={{ fontSize: 13, color: 'var(--text-primary)', marginTop: 6, paddingTop: 6, borderTop: '1px dashed var(--border-default)' }}>
                        <strong>Registry Note:</strong> {req.adminNote}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
