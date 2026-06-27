'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
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

  const handleSaved = useCallback(() => {
    setSavedAt(new Date());
    setEditing(false);
    router.refresh();
  }, [router]);

  const handleSaveReady = useCallback((save: () => Promise<void>, saving: boolean) => {
    setSaveHandler(() => save);
    setIsSaving(saving);
  }, []);

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
      `}</style>
      <div className="pds-shell">
        {editing ? (
          <>
            <div className="pds-edit-sticky-chrome">
              <PatientDetailsActionBar
                mode="edit"
                patientId={patient.id}
                onSave={() => void saveHandler?.()}
                isSaving={isSaving}
                savedAt={savedAt}
              />
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

        <PatientDetailsActionBar
          mode={editing ? 'edit' : 'view'}
          patientId={patient.id}
          onEdit={() => setEditing(true)}
          onSave={() => void saveHandler?.()}
          isSaving={isSaving}
          savedAt={savedAt}
        />
      </div>
    </>
  );
}
