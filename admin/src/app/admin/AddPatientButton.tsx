'use client';

import { useRouter } from 'next/navigation';

export default function AddPatientButton() {
  const router = useRouter();

  const handleClick = () => {
    router.push('/admin/patient/new');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 6 }}>
      <button
        type="button"
        onClick={handleClick}
        style={{
          background: 'rgba(13,148,136,0.1)',
          color: '#0d9488',
          padding: '10px 18px',
          borderRadius: '8px',
          border: '1px solid rgba(13,148,136,0.35)',
          fontSize: '14px',
          fontWeight: 600,
          cursor: 'pointer',
          opacity: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          minHeight: 44,
          boxSizing: 'border-box',
          fontFamily: 'inherit',
        }}
      >
        Add Patient
      </button>
    </div>
  );
}
