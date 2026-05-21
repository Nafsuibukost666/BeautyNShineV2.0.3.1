import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';

const containerStyle: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  background: 'linear-gradient(135deg, #0f0f13 0%, #1a1a24 50%, #0f0f13 100%)',
  padding: 20,
};

const cardStyle: React.CSSProperties = {
  background: '#1e1e2e',
  border: '1px solid #2e2e3e',
  borderRadius: 16,
  padding: 40,
  width: '100%',
  maxWidth: 400,
};

const titleStyle: React.CSSProperties = {
  fontSize: 24,
  fontWeight: 700,
  color: '#e8a87c',
  textAlign: 'center',
  marginBottom: 8,
};

const subtitleStyle: React.CSSProperties = {
  fontSize: 14,
  color: '#6b6865',
  textAlign: 'center',
  marginBottom: 32,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 16px',
  background: '#2a2a3e',
  border: '1px solid #2e2e3e',
  borderRadius: 10,
  color: '#f0ece4',
  fontSize: 14,
  outline: 'none',
  transition: 'border-color 0.2s',
};

const submitBtnStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px',
  background: 'linear-gradient(135deg, #c4895e, #e8a87c)',
  color: '#fff',
  border: 'none',
  borderRadius: 10,
  fontSize: 15,
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'opacity 0.2s',
};

const errorStyle: React.CSSProperties = {
  background: 'rgba(224,108,108,0.1)',
  border: '1px solid rgba(224,108,108,0.3)',
  color: '#e06c6c',
  padding: '10px 14px',
  borderRadius: 8,
  marginBottom: 16,
  fontSize: 13,
  textAlign: 'center',
};

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { username, password });
      const { token, user } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login gagal. Periksa username dan password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={titleStyle}>ERP Core</div>
        <div style={subtitleStyle}>Salon Management Dashboard</div>

        {error && <div style={errorStyle}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, color: '#a8a4a0', marginBottom: 6, fontWeight: 500 }}>
              Username
            </label>
            <input
              style={inputStyle}
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Masukkan username"
              required
              onFocus={(e) => e.target.style.borderColor = '#e8a87c'}
              onBlur={(e) => e.target.style.borderColor = '#2e2e3e'}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 13, color: '#a8a4a0', marginBottom: 6, fontWeight: 500 }}>
              Password
            </label>
            <input
              style={inputStyle}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password"
              required
              onFocus={(e) => e.target.style.borderColor = '#e8a87c'}
              onBlur={(e) => e.target.style.borderColor = '#2e2e3e'}
            />
          </div>

          <button
            style={submitBtnStyle}
            type="submit"
            disabled={loading}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>
      </div>
    </div>
  );
}
