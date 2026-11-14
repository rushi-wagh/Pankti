import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, LockKeyhole } from 'lucide-react';
import { api } from '../lib/api';

export default function Auth() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function submit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      localStorage.setItem('qf-token', data.token);
      localStorage.setItem('qf-manager', JSON.stringify(data.manager));
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth">
      <div className="auth-glow auth-glow-one" />
      <div className="auth-glow auth-glow-two" />
      <div className="auth-card">
        <div className="auth-brand"><img src="/logo.png" alt="Pankti Logo" className="brand-mark" style={{ objectFit: 'cover' }} /><span>Pankti<span>.</span></span></div>
        <div className="auth-icon"><LockKeyhole size={19} /></div>
        <p className="eyebrow">MANAGER ACCESS</p>
        <h1>Welcome back<span className="heading-period">.</span></h1>
        <p className="muted">Your Queue, Organized in One Place.</p>
        <form onSubmit={submit}>
          <label htmlFor="email">Email address</label>
          <input id="email" type="email" placeholder="you@company.com" autoComplete="username" required value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} />
          <label htmlFor="password">Password</label>
          <div className="password-field"><input id="password" type={showPassword ? 'text' : 'password'} placeholder="Enter your password" autoComplete="current-password" required value={form.password} onChange={event => setForm({ ...form, password: event.target.value })} /><button type="button" className="password-toggle" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>
          {error && <div className="error">{error}</div>}
          <button className="primary full" disabled={loading}>{loading ? 'Signing in…' : <>Sign in<ArrowRight size={17} /></>}</button>
        </form>
        <div className="auth-foot"><span className="secure-dot" />Secure manager access</div>
      </div>
    </div>
  );
}
