import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
            <label className="form-label">Username / Matric Number</label>
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
            <label className="form-label">Password</label>
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
    </div>
  );
}
