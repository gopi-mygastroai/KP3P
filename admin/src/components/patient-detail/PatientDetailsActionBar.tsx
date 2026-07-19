'use client';

import Link from 'next/link';

type Props = {
  mode: 'view' | 'edit';
  patientId: number;
  onEdit?: () => void;
  onSave?: () => void;
  onDelete?: () => void;
  isSaving?: boolean;
  isDeleting?: boolean;
  savedAt?: Date | null;
  sticky?: boolean;
};

export default function PatientDetailsActionBar({
  mode,
  patientId,
  onEdit,
  onSave,
  onDelete,
  isSaving = false,
  isDeleting = false,
  savedAt = null,
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
        marginBottom: mode === 'edit' && sticky ? 16 : 12,
        marginTop: mode === 'view' && !sticky ? 8 : 0,
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: sticky ? 'blur(8px)' : undefined,
        border: '0.5px solid #e2e8f0',
        borderRadius: 10,
        boxShadow: '0 2px 12px rgba(15,23,42,0.06)',
      }}
    >
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
          {mode === 'view' ? 'Patient record' : 'Edit patient record'}
        </div>
        {mode === 'edit' ? (
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
            All assessment fields are editable below.
          </div>
        ) : null}
        {savedAt ? (
          <div style={{ fontSize: 11, color: '#16a34a', marginTop: 4 }}>
            Saved {savedAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
          </div>
        ) : null}
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {mode === 'edit' && onDelete ? (
          <button
            type="button"
            onClick={onDelete}
            disabled={isSaving || isDeleting}
            style={{
              fontSize: 12,
              fontWeight: 600,
              padding: '8px 14px',
              borderRadius: 8,
              background: '#fff1f2',
              border: '1px solid #fecdd3',
              color: '#be123c',
              cursor: isSaving || isDeleting ? 'not-allowed' : 'pointer',
              opacity: isSaving || isDeleting ? 0.6 : 1,
              marginRight: 'auto',
            }}
          >
            Delete patient
          </button>
        ) : null}
        {mode === 'edit' ? (
          <Link
            href={`/admin/patient/${patientId}/assessment`}
            style={{
              fontSize: 12,
              fontWeight: 600,
              padding: '8px 14px',
              borderRadius: 8,
              background: '#fff',
              border: '1px solid #e2e8f0',
              color: '#475569',
              textDecoration: 'none',
            }}
          >
            Open step-by-step wizard
          </Link>
        ) : null}
        {mode === 'view' ? (
          <button
            type="button"
            onClick={onEdit}
            style={{
              fontSize: 12,
              fontWeight: 700,
              padding: '8px 18px',
              borderRadius: 8,
              background: '#14b8a6',
              border: 'none',
              color: '#0f172a',
              cursor: 'pointer',
            }}
          >
            Edit
          </button>
        ) : (
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving || isDeleting}
            style={{
              fontSize: 12,
              fontWeight: 700,
              padding: '8px 18px',
              borderRadius: 8,
              background: '#14b8a6',
              border: 'none',
              color: '#0f172a',
              cursor: isSaving || isDeleting ? 'not-allowed' : 'pointer',
              opacity: isSaving || isDeleting ? 0.8 : 1,
            }}
          >
            {isSaving ? 'Saving…' : 'Save changes'}
          </button>
        )}
      </div>
    </div>
  );
}
