'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { PatientWithUser } from '@/types/assessment-form';
import PatientDetailsView from '@/components/patient-detail/PatientDetailsView';
import PatientDetailsEditor from '@/components/patient-detail/PatientDetailsEditor';
import PatientDetailsActionBar from '@/components/patient-detail/PatientDetailsActionBar';

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

  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollLeft = 0;
    document.body.scrollLeft = 0;
  }, [patient.id]);

  return (
    <>
      <style>{`
        .pds-shell {
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
          min-width: 0;
          margin-inline: 0;
          overflow-x: hidden;
          padding-inline: clamp(12px, 2vw, 24px);
          padding-bottom: 80px;
        }

        /* On large screens, give comfortable side padding but always fill full width */
        @media (min-width: 1400px) {
          .pds-shell {
            padding-inline: clamp(24px, 3vw, 48px);
          }
        }

        @media (max-width: 1024px) {
          .pds-shell {
            width: 100%;
            padding-inline: 0;
          }
          .pds-shell .pds-action-bar {
            border-radius: 0;
            border-left: none;
            border-right: none;
          }
          .pds-shell .pr-card,
          .pds-shell .pr-sidebar-card,
          .pds-shell .pr-field-section {
            border-radius: 0;
            border-left: none;
            border-right: none;
          }
        }

        /* Ensure the two-column layout (main + sidebar) fills full width and stacks on small screens */
        .pds-shell .pr-body {
          display: flex;
          flex-direction: row;
          width: 100%;
          gap: 16px;
          align-items: flex-start;
        }

        .pds-shell .pr-main-column {
          flex: 1 1 0;
          min-width: 0;
          width: 0; /* force flex to control width, prevents overflow */
        }

        .pds-shell .pr-sidebar-column {
          flex: 0 0 260px;
          width: 260px;
          min-width: 0;
        }

        /* Stack sidebar below main content on smaller screens */
        @media (max-width: 900px) {
          .pds-shell .pr-body {
            flex-direction: column;
            gap: 0;
          }

          .pds-shell .pr-main-column {
            width: 100%;
            flex: none;
          }

          .pds-shell .pr-sidebar-column {
            width: 100%;
            flex: none;
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
            gap: 12px;
            padding: 12px;
            box-sizing: border-box;
          }
        }

        @media (max-width: 480px) {
          .pds-shell .pr-sidebar-column {
            grid-template-columns: 1fr;
            padding: 8px;
            gap: 8px;
          }
        }
      `}</style>
      <div className="pds-shell">
        <PatientDetailsActionBar
          mode={editing ? 'edit' : 'view'}
          patientId={patient.id}
          sticky={editing}
          onEdit={() => setEditing(true)}
          onSave={() => void saveHandler?.()}
          isSaving={isSaving}
          savedAt={savedAt}
        />

        {editing ? (
          <PatientDetailsEditor
            patient={patient}
            chromeless
            onSaveReady={handleSaveReady}
            onSaved={handleSaved}
          />
        ) : (
          <PatientDetailsView patient={patient} />
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
