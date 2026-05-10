'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function AddPatientButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleClick = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
        credentials: 'same-origin',
      });
      const data: unknown = await res.json().catch(() => null);
      const errMsg =
        res.ok || !isRecord(data) ? '' : typeof data.error === 'string' ? data.error : '';
      if (!res.ok) {
        setError(errMsg || 'Could not create patient');
        setLoading(false);
        return;
      }
      if (!isRecord(data) || typeof data.patientId !== 'number') {
        setError('Invalid response from server');
        setLoading(false);
        return;
      }
      router.push(`/admin/patient/${data.patientId}/assessment`);
    } catch {
      setError('Network error');
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 6 }}>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        aria-busy={loading}
        style={{
          background: 'rgba(13,148,136,0.1)',
          color: '#0d9488',
          padding: '10px 18px',
          borderRadius: '8px',
          border: '1px solid rgba(13,148,136,0.35)',
          fontSize: '14px',
          fontWeight: 600,
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.75 : 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          minHeight: 44,
          boxSizing: 'border-box',
          fontFamily: 'inherit',
        }}
      >
        {loading ? 'Creating…' : 'Add Patient'}
      </button>
      {error ? (
        <span role="alert" style={{ fontSize: 12, color: '#b91c1c', textAlign: 'center' }}>
          {error}
        </span>
      ) : null}
    </div>
  );
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}
