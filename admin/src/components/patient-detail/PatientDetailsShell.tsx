'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getErrorMessage } from '@/lib/get-error-message';
import type { PatientWithUser } from '@/types/assessment-form';
import PatientDetailsView from '@/components/patient-detail/PatientDetailsView';
import PatientDetailsEditor from '@/components/patient-detail/PatientDetailsEditor';
import PatientDetailsActionBar from '@/components/patient-detail/PatientDetailsActionBar';
import PatientDetailsSectionNav from '@/components/patient-detail/PatientDetailsSectionNav';

type Props = {
  patient: PatientWithUser;
};

export default function PatientDetailsShell({ patient }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [saveHandler, setSaveHandler] = useState<(() => Promise<void>) | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const handleSaved = useCallback(() => {
    setSavedAt(new Date());
    setEditing(false);
    router.refresh();
  }, [router]);

  const handleSaveReady = useCallback((save: () => Promise<void>, saving: boolean) => {
    setSaveHandler(() => save);
    setIsSaving(saving);
  }, []);

  const handleDeleteRequest = useCallback(() => {
    setDeleteError('');
    setShowDeleteDialog(true);
  }, []);

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    setDeleteError('');
    try {
      const res = await fetch(`/api/patients/${patient.id}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      });
      if (!res.ok) {
        const data: unknown = await res.json().catch(() => null);
        const msg =
          data && typeof data === 'object' && data !== null && 'error' in data && typeof (data as { error: unknown }).error === 'string'
            ? (data as { error: string }).error
            : 'Failed to delete patient';
        setDeleteError(msg);
        setIsDeleting(false);
        return;
      }
      setShowDeleteDialog(false);
      router.push('/admin');
      router.refresh();
    } catch (err: unknown) {
      setDeleteError(getErrorMessage(err));
      setIsDeleting(false);
    }
  };

  const editActionBarProps = {
    mode: 'edit' as const,
    patientId: patient.id,
    onSave: () => void saveHandler?.(),
    onDelete: handleDeleteRequest,
    isSaving,
    isDeleting,
    savedAt,
  };

  return (
    <>
      <style>{`
        .pds-shell {
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
          min-width: 0;
          margin-inline: auto;
          overflow-x: hidden;
          padding-inline: clamp(12px, 2vw, 28px);
          padding-bottom: 80px;
        }
        @media (min-width: 1400px) {
          .pds-shell {
            padding-inline: clamp(24px, 3vw, 48px);
          }
        }
        @media (max-width: 860px) {
          .pds-shell { padding-inline: 16px; }
          .pds-edit-sticky-chrome {
            margin-left: -16px !important;
            margin-right: -16px !important;
            padding-left: 16px !important;
            padding-right: 16px !important;
          }
        }
        .pds-edit-sticky-chrome {
          position: sticky;
          top: 0;
          z-index: 20;
          margin: 0 calc(-1 * clamp(12px, 2vw, 28px)) 16px;
          padding: 0 clamp(12px, 2vw, 28px) 12px;
          background: rgba(255, 255, 255, 0.97);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid #e2e8f0;
          box-shadow: 0 4px 16px rgba(15, 23, 42, 0.06);
        }
        .pds-edit-sticky-chrome .pds-action-bar {
          border: none;
          box-shadow: none;
          margin-bottom: 0;
          padding-left: 0;
          padding-right: 0;
          background: transparent;
          backdrop-filter: none;
        }
        .pds-delete-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 200;
          padding: 16px;
        }
        .pds-delete-dialog {
          background: #ffffff;
          border-radius: 16px;
          padding: 28px 24px;
          max-width: 400px;
          width: 100%;
          box-shadow: 0 20px 50px rgba(0,0,0,0.15);
        }
      `}</style>
      <div className="pds-shell">
        {editing ? (
          <>
            <div className="pds-edit-sticky-chrome">
              <PatientDetailsActionBar {...editActionBarProps} sticky />
              <PatientDetailsSectionNav />
            </div>
            <PatientDetailsEditor
              patient={patient}
              chromeless
              showSectionNav={false}
              onSaveReady={handleSaveReady}
              onSaved={handleSaved}
            />
          </>
        ) : (
          <>
            <PatientDetailsActionBar
              mode="view"
              patientId={patient.id}
              onEdit={() => setEditing(true)}
              isSaving={isSaving}
              savedAt={savedAt}
            />
            <PatientDetailsView patient={patient} />
          </>
        )}

        {editing ? (
          <PatientDetailsActionBar {...editActionBarProps} />
        ) : (
          <PatientDetailsActionBar
            mode="view"
            patientId={patient.id}
            onEdit={() => setEditing(true)}
            isSaving={isSaving}
            savedAt={savedAt}
          />
        )}

        {showDeleteDialog ? (
          <div
            className="pds-delete-overlay"
            role="presentation"
            onClick={(e) => {
              if (e.target === e.currentTarget && !isDeleting) setShowDeleteDialog(false);
            }}
          >
            <div className="pds-delete-dialog" role="dialog" aria-modal="true" aria-labelledby="pds-delete-title">
              <h2 id="pds-delete-title" style={{ fontSize: 18, fontWeight: 700, margin: '0 0 10px' }}>
                Delete this patient?
              </h2>
              <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.55, margin: '0 0 20px' }}>
                This permanently removes the record for <strong>{patient.name}</strong> (ID #{patient.id}
                {patient.mrn ? `, MRN ${patient.mrn}` : ''}). This cannot be undone.
              </p>
              {deleteError ? (
                <p style={{ color: '#dc2626', fontSize: 13, marginBottom: 12 }} role="alert">
                  {deleteError}
                </p>
              ) : null}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button
                  type="button"
                  style={{
                    padding: '10px 16px',
                    borderRadius: 9,
                    background: '#dc2626',
                    color: '#fff',
                    border: 'none',
                    fontWeight: 600,
                    cursor: isDeleting ? 'not-allowed' : 'pointer',
                    opacity: isDeleting ? 0.8 : 1,
                  }}
                  onClick={() => void handleDeleteConfirm()}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting…' : 'Yes, delete patient'}
                </button>
                <button
                  type="button"
                  style={{
                    padding: '10px 16px',
                    borderRadius: 9,
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    color: '#475569',
                    fontWeight: 600,
                    cursor: isDeleting ? 'not-allowed' : 'pointer',
                  }}
                  onClick={() => !isDeleting && setShowDeleteDialog(false)}
                  disabled={isDeleting}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
