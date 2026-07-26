import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/client';

export default function ClaimAccountPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  // Form inputs
  const [username, setUsername] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // States
  const [obfuscatedEmail, setObfuscatedEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleVerifyIdentity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !dateOfBirth) {
      setError('Please provide your Username/Matric Number and Date of Birth.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data } = await api.post('/auth/claim-account/verify', {
        username: username.trim(),
        dateOfBirth
      });
      // The API returns details containing obfuscated email
      setObfuscatedEmail(data.email || 'your registered email');
      setStep(2);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Verification failed. Please ensure your Matric Number and Date of Birth match our records.');
    } finally {
      setLoading(false);
    }
  };

  const handleActivateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newPassword || !confirmPassword) {
      setError('All fields are required.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.post('/auth/claim-account/activate', {
        username: username.trim(),
        token: token.trim(),
        newPassword
      });
      setSuccessMsg('Account successfully activated! Redirecting you to login...');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Activation failed. Please check the code and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">🔒</div>
          <h2 className="login-title">Account Claiming</h2>
          <p className="login-subtitle">Activate your legacy or pre-seeded portal profile</p>
        </div>

        {error && (
          <div style={{
            padding: '12px 16px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid var(--danger-500)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--danger-500)',
            fontSize: 13,
            marginBottom: 20,
            textAlign: 'center'
          }}>
            ⚠️ {error}
          </div>
        )}

        {successMsg && (
          <div style={{
            padding: '12px 16px',
            background: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid var(--success-500)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--success-500)',
            fontSize: 13,
            marginBottom: 20,
            textAlign: 'center'
          }}>
            🎉 {successMsg}
          </div>
        )}

        {step === 1 ? (
          /* Step 1 Form */
          <form onSubmit={handleVerifyIdentity} className="login-form">
            <div className="form-group">
              <label className="form-label">Matriculation Number</label>
              <input
                className="form-control"
                placeholder="e.g. SU/CMP/26/1001"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Date of Birth</label>
              <input
                type="date"
                className="form-control"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary login-btn"
              disabled={loading}
            >
              {loading ? 'Verifying...' : 'Verify My Identity'}
            </button>
          </form>
        ) : (
          /* Step 2 Form */
          <form onSubmit={handleActivateAccount} className="login-form">
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12, textAlign: 'center' }}>
              We've generated a verification code. Please check your email <strong>{obfuscatedEmail}</strong> or request it from portal admin support.
            </div>

            <div className="form-group">
              <label className="form-label">Verification Code (6 characters)</label>
              <input
                className="form-control"
                placeholder="e.g. AB12XY"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                disabled={loading || !!successMsg}
                maxLength={6}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Choose New Password</label>
              <input
                type="password"
                className="form-control"
                placeholder="Minimum 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={loading || !!successMsg}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input
                type="password"
                className="form-control"
                placeholder="Repeat password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading || !!successMsg}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-gold login-btn"
              disabled={loading || !!successMsg}
            >
              {loading ? 'Activating...' : 'Activate My Account'}
            </button>

            <button
              type="button"
              className="btn btn-ghost"
              style={{ width: '100%', marginTop: 4 }}
              onClick={() => { setStep(1); setError(''); }}
              disabled={loading || !!successMsg}
            >
              ← Go Back
            </button>
          </form>
        )}

        <div style={{ marginTop: 28, textAlign: 'center', fontSize: 13 }}>
          <Link to="/login" style={{ color: 'var(--text-secondary)', textDecoration: 'underline' }}>
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
