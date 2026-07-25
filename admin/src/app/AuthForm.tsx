'use client';

import { useState } from 'react';
import { getErrorMessage } from '@/lib/get-error-message';
import { ADMIN_LOGIN_EMAIL } from '@/lib/auth-credentials';

const INTAKE_APP_URL =
  process.env.NEXT_PUBLIC_INTAKE_APP_URL?.trim() || 'http://localhost:3001';

export default function AuthForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (email.trim().toLowerCase() !== ADMIN_LOGIN_EMAIL) {
      setError('Invalid username.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      let data: { error?: string; user?: { role?: string } };
      try {
        data = await res.json();
      } catch {
        throw new Error('Invalid response from server');
      }

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      window.location.href = '/admin';
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded text-sm" style={{ color: '#dc2626' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          <label style={{ fontWeight: 700, color: '#111827', fontSize: '0.8rem', letterSpacing: '0.05em' }}>
            EMAIL ID
          </label>
          <input
            type="email"
            className="form-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="example@domain.com"
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          <label style={{ fontWeight: 700, color: '#111827', fontSize: '0.8rem', letterSpacing: '0.05em' }}>
            PASSWORD
          </label>
          <div style={{ position: 'relative', width: '100%' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              className="form-input"
              style={{ width: '100%', paddingRight: '2.5rem', boxSizing: 'border-box' }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                color: '#9ca3af',
              }}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary w-full"
          disabled={loading}
        >
          {loading ? 'Please wait...' : 'Sign In'}
        </button>
      </form>

      <div style={{ marginTop: '1.25rem', marginBottom: '1rem' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <div style={{ flex: 1, borderTop: '1px solid #e5e7eb' }} />
          <span style={{ padding: '0 0.75rem', fontSize: '0.75rem', color: '#9ca3af', whiteSpace: 'nowrap' }}>
            OR
          </span>
          <div style={{ flex: 1, borderTop: '1px solid #e5e7eb' }} />
        </div>
      </div>

      <button
        type="button"
        className="btn btn-secondary w-full"
        onClick={() => {
          window.location.href = INTAKE_APP_URL;
        }}
      >
        Patient Intake Form
      </button>
    </div>
  );
}
