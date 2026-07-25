'use client';

import Link from 'next/link';

type Props = {
  patientId: number;
  sticky?: boolean;
};

export default function PatientDetailsActionBar({
  patientId,
  sticky = false,
}: Props) {
  return (
    <div
      className="pds-action-bar"
      style={{
        position: sticky ? 'sticky' : 'static',
        top: sticky ? 0 : undefined,
        zIndex: sticky ? 20 : undefined,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        flexWrap: 'wrap',
        padding: '12px 16px',
        marginBottom: 12,
        marginTop: sticky ? 0 : 8,
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: sticky ? 'blur(8px)' : undefined,
        border: '0.5px solid #e2e8f0',
        borderRadius: 10,
        boxShadow: '0 2px 12px rgba(15,23,42,0.06)',
      }}
    >
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Patient record</div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Link
          href={`/admin/patient/${patientId}/edit`}
          style={{
            fontSize: 12,
            fontWeight: 700,
            padding: '8px 18px',
            borderRadius: 8,
            background: '#14b8a6',
            border: 'none',
            color: '#0f172a',
            textDecoration: 'none',
          }}
        >
          Edit
        </Link>
      </div>
    </div>
  );
}
