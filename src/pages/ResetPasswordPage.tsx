import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../api/client';
import logoImg from '../assets/SHANAHAN-UNI-LOGO.png';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError('Password reset token is missing from the link.');
      return;
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await api.post('/auth/reset-password', { token, newPassword });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reset password. The link may be expired.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div className="login-card" style={{ maxWidth: 440, width: '100%' }}>
        <div className="login-header" style={{ textAlign: 'center', marginBottom: 24 }}>
          <img src={logoImg} alt="Logo" style={{ width: 72, height: 72, objectFit: 'contain', marginBottom: 16 }} />
          <h2 className="login-title">Shanahan University</h2>
          <p className="login-subtitle">Student Portal — Reset Password</p>
        </div>

        {success ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              backgroundColor: 'rgba(34,197,94,0.1)',
              color: 'var(--success-500)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              fontSize: 24,
              fontWeight: 700
            }}>
              ✓
            </div>
            <h3 style={{ margin: '0 0 10px 0', color: 'var(--text-primary)', fontSize: 18 }}>
              Password Reset Successfully!
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.5, marginBottom: 24 }}>
              Your password has been updated. You can now log in with your new password.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="btn btn-primary login-btn"
              style={{ width: '100%' }}
            >
              Proceed to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="login-form">
            {error && (
              <div style={{
                backgroundColor: 'rgba(239,68,68,0.1)',
                border: '1px solid var(--danger-500)',
                color: 'var(--danger-400)',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                fontSize: 13,
                marginBottom: 16
              }}>
                {error}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">New Password *</label>
              <input
                type="password"
                required
                className="form-control"
                placeholder="At least 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 24 }}>
              <label className="form-label">Confirm New Password *</label>
              <input
                type="password"
                required
                className="form-control"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary login-btn"
              style={{ width: '100%' }}
            >
              {submitting ? 'Resetting Password...' : 'Reset Password'}
            </button>

            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <Link to="/login" style={{ color: 'var(--accent-300)', fontSize: 13, textDecoration: 'none' }}>
                Back to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
