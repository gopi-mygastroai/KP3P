'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { PatientWithUser } from '@/types/assessment-form';
import { getErrorMessage } from '@/lib/get-error-message';
import PatientDetailsEditor from '@/components/patient-detail/PatientDetailsEditor';

export default function PatientEditForm({ patient }: { patient: PatientWithUser }) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [saveHandler, setSaveHandler] = useState<(() => Promise<void>) | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const handleSaveReady = useCallback((save: () => Promise<void>, saving: boolean) => {
    setSaveHandler(() => save);
    setIsSaving(saving);
  }, []);

  const handleSaved = useCallback(() => {
    router.push(`/admin/patient/${patient.id}`);
    router.refresh();
  }, [patient.id, router]);

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

  return (
    <>
      <style>{`
        .pef-root {
          min-height: 100vh;
          background: #f8fafc;
          color: #0f172a;
          font-family: 'Inter', sans-serif;
        }
        .pef-header {
          background: linear-gradient(135deg, #0891b2 0%, #a5f3fc 100%);
          padding: 28px 40px 24px;
        }
        .pef-back-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 600;
          color: #0c4a6e;
          text-decoration: none;
          margin-bottom: 16px;
        }
        .pef-back-link:hover { color: #082f49; }
        .pef-title {
          font-size: 26px;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: -0.02em;
          line-height: 1.1;
          margin: 0 0 8px;
        }
        .pef-subtitle { font-size: 13px; color: rgba(255,255,255,0.9); margin: 0; }
        .pef-body {
          max-width: 1100px;
          margin: 0 auto;
          padding: 24px 28px 100px;
        }
        .pef-wizard-link {
          display: inline-flex;
          font-size: 12px;
          font-weight: 600;
          padding: 8px 14px;
          border-radius: 8px;
          background: #fff;
          border: 1px solid #e2e8f0;
          color: #475569;
          text-decoration: none;
          margin-bottom: 16px;
        }
        .pef-action-bar {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: rgba(255,255,255,0.92);
          backdrop-filter: blur(12px);
          border-top: 1px solid #e2e8f0;
          padding: 16px 32px;
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 12px;
          z-index: 100;
          box-shadow: 0 -4px 20px rgba(0,0,0,0.06);
        }
        .pef-action-bar-delete { margin-right: auto; }
        .pef-btn-cancel {
          background: #ffffff;
          color: #475569;
          border: 1px solid #cbd5e1;
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
        }
        .pef-btn-save {
          background: #0d9488;
          color: #fff;
          border: none;
          padding: 10px 24px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
        }
        .pef-btn-save:disabled { opacity: 0.6; cursor: not-allowed; }
        .pef-btn-delete {
          background: #fff1f2;
          color: #be123c;
          border: 1px solid #fecdd3;
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
        }
        .pef-delete-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 200;
          padding: 16px;
        }
        .pef-delete-dialog {
          background: #ffffff;
          border-radius: 16px;
          padding: 28px 24px;
          max-width: 400px;
          width: 100%;
          box-shadow: 0 20px 50px rgba(0,0,0,0.15);
        }
        @media (max-width: 768px) {
          .pef-header { padding: 20px 24px; }
          .pef-body { padding: 20px 16px 100px; }
          .pef-action-bar { padding: 12px 16px; flex-wrap: wrap; }
        }
      `}</style>

      <div className="pef-root">
        <div className="pef-header">
          <Link href={`/admin/patient/${patient.id}`} className="pef-back-link">
            ← Back to patient details
          </Link>
          <h1 className="pef-title">Editing: {patient.name}</h1>
          <p className="pef-subtitle">Same fields as the assessment wizard — legacy treatment fields removed.</p>
        </div>

        <div className="pef-body">
          <Link href={`/admin/patient/${patient.id}/assessment`} className="pef-wizard-link">
            Open step-by-step wizard
          </Link>
          <PatientDetailsEditor
            patient={patient}
            chromeless
            onSaveReady={handleSaveReady}
            onSaved={handleSaved}
          />
        </div>

        <div className="pef-action-bar">
          <div className="pef-action-bar-delete">
            <button
              type="button"
              className="pef-btn-delete"
              onClick={() => {
                setDeleteError('');
                setShowDeleteDialog(true);
              }}
              disabled={isSaving || isDeleting}
            >
              Delete patient
            </button>
          </div>
          <button
            type="button"
            className="pef-btn-cancel"
            onClick={() => router.push(`/admin/patient/${patient.id}`)}
            disabled={isSaving || isDeleting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="pef-btn-save"
            onClick={() => void saveHandler?.()}
            disabled={isSaving || isDeleting || !saveHandler}
          >
            {isSaving ? 'Saving…' : 'Save changes'}
          </button>
        </div>

        {showDeleteDialog ? (
          <div
            className="pef-delete-overlay"
            role="presentation"
            onClick={(e) => {
              if (e.target === e.currentTarget && !isDeleting) setShowDeleteDialog(false);
            }}
          >
            <div className="pef-delete-dialog" role="dialog" aria-modal="true" aria-labelledby="pef-delete-title">
              <h2 id="pef-delete-title" style={{ fontSize: 18, fontWeight: 700, margin: '0 0 10px' }}>
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
                  style={{ padding: '10px 16px', borderRadius: 9, background: '#dc2626', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}
                  onClick={() => void handleDeleteConfirm()}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting…' : 'Yes, delete patient'}
                </button>
                <button
                  type="button"
                  style={{ padding: '10px 16px', borderRadius: 9, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569', fontWeight: 600, cursor: 'pointer' }}
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
