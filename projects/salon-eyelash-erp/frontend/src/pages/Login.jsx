import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './Login.css';

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) { setError('Username dan password wajib diisi'); return; }
    setLoading(true);
    setError('');
    try {
      await login(username, password);
      window.location.href = '/';
    } catch (err) {
      setError(err.response?.data?.message || 'Login gagal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-icon"><i className="fa-solid fa-sparkles"></i></div>
        <h1 className="login-title">Salon Eyelash</h1>
        <p className="login-sub">Masuk ke POS &amp; ERP System</p>

        {error && <div className="status-box show error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <div className="input-wrap">
              <i className="fa-solid fa-user"></i>
              <input type="text" placeholder="Masukkan username" value={username}
                onChange={(e) => setUsername(e.target.value)} autoFocus />
            </div>
          </div>
          <div className="form-group">
            <label>Password</label>
            <div className="input-wrap">
              <i className="fa-solid fa-lock"></i>
              <input type="password" placeholder="Masukkan password" value={password}
                onChange={(e) => setPassword(e.target.value)} />
            </div>
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? <><span className="spinner"></span> Masuk...</> : <><i className="fa-solid fa-right-to-bracket"></i> Masuk</>}
          </button>
        </form>
        <div className="footer">Salon Eyelash ERP <span>✦</span> v3.0</div>
      </div>
    </div>
  );
}
