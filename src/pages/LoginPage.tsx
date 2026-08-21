import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import logoImg from '../assets/SHANAHAN-UNI-LOGO.png';
import { AlertIcon } from '../components/Icons';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Forgot Password State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitting, setForgotSubmitting] = useState(false);
  const [forgotMessage, setForgotMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Both Matric Number/Username and Password are required.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await login(username.trim(), password);
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Invalid credentials. Please verify your details.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotSubmitting(true);
    setForgotMessage(null);
    try {
      await api.post('/auth/forgot-password', { email: forgotEmail.trim() });
      setForgotMessage('If an account associated with this email exists, a password reset link has been dispatched to your inbox.');
    } catch (err: any) {
      setForgotMessage('If an account associated with this email exists, a password reset link has been dispatched to your inbox.');
    } finally {
      setForgotSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <img src={logoImg} alt="Logo" style={{ width: 72, height: 72, objectFit: 'contain', marginBottom: 16 }} />
          <h2 className="login-title">Shanahan University</h2>
          <p className="login-subtitle">Student Portal Authentication</p>
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
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            justifyContent: 'center'
          }}>
            <AlertIcon size={18} color="var(--danger-500)" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label className="form-label">Username / Matric Number / Email</label>
            <input
              className="form-control"
              placeholder="e.g. SU/CMP/26/1001 or student@shanahanuni.edu.ng"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label">Password</label>
              <button
                type="button"
                onClick={() => { setShowForgotModal(true); setForgotMessage(null); }}
                style={{ background: 'none', border: 'none', color: 'var(--accent-300)', fontSize: 12, cursor: 'pointer', padding: 0 }}
              >
                Forgot Password?
              </button>
            </div>
            <input
              type="password"
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary login-btn"
            disabled={loading}
          >
            {loading ? 'Verifying...' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: 28, textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)' }}>
          <div>Legacy Student or New Upload?</div>
          <Link
            to="/claim-account"
            style={{
              display: 'inline-block',
              marginTop: 6,
              fontWeight: 700,
              color: 'var(--accent-300)',
              textDecoration: 'underline'
            }}
          >
            Claim & Activate Your Account
          </Link>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="modal-overlay" onClick={() => setShowForgotModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <h3 className="modal-title">Reset Your Password</h3>
              <button className="modal-close" onClick={() => setShowForgotModal(false)}>✕</button>
            </div>
            <form onSubmit={handleForgotSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  Enter your registered institutional email address. We will send a secure password reset link to your inbox.
                </p>
                {forgotMessage && (
                  <div style={{ padding: 12, background: 'rgba(34,197,94,0.1)', border: '1px solid var(--success-500)', borderRadius: 'var(--radius-md)', color: 'var(--success-400)', fontSize: 13 }}>
                    {forgotMessage}
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="e.g. student@shanahanuni.edu.ng"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowForgotModal(false)}>Close</button>
                <button type="submit" className="btn btn-primary" disabled={forgotSubmitting}>
                  {forgotSubmitting ? 'Sending Link...' : 'Send Reset Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
