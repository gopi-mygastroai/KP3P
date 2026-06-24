'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AssessmentFormState, AssessmentUpdateFn, PatientWithUser } from '@/types/assessment-form';
import { getErrorMessage } from '@/lib/get-error-message';
import { buildAssessmentFormState, buildAssessmentSavePayload } from '@/lib/build-assessment-form-state';
import PatientDetailsSectionNav from '@/components/patient-detail/PatientDetailsSectionNav';
import { PATIENT_DETAIL_SECTIONS } from '@/components/patient-detail/patient-details-sections';

type Props = {
  patient: PatientWithUser;
  chromeless?: boolean;
  showSectionNav?: boolean;
  onSaveReady?: (save: () => Promise<void>, isSaving: boolean) => void;
  onSaved?: () => void;
};

export default function PatientDetailsEditor({
  patient,
  chromeless = false,
  showSectionNav = true,
  onSaveReady,
  onSaved,
}: Props) {
  const router = useRouter();
  const [formData, setFormData] = useState<AssessmentFormState>(() => buildAssessmentFormState(patient));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const updateData: AssessmentUpdateFn = (fields) => {
    setFormData((prev) => ({ ...prev, ...fields }) as AssessmentFormState);
  };

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setError('');
    try {
      const body = JSON.stringify(buildAssessmentSavePayload(formData));
      const res = await fetch(`/api/patient/${patient.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body,
      });
      if (!res.ok) {
        let msg = 'Failed to save patient';
        try {
          const j: unknown = await res.json();
          if (j && typeof j === 'object' && 'error' in j && typeof (j as { error: unknown }).error === 'string') {
            msg = (j as { error: string }).error;
          }
        } catch {
          /* ignore */
        }
        throw new Error(msg);
      }
      onSaved?.();
      router.refresh();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }, [formData, onSaved, patient.id, router]);

  useEffect(() => {
    onSaveReady?.(handleSave, isSaving);
  }, [handleSave, isSaving, onSaveReady]);

  return (
    <>
      <style>{`
        .pde-root { max-width: 1100px; margin: 0 auto; padding: ${chromeless ? '0' : '16px 28px 80px'}; }
        .pde-card { background: #fff; border: 0.5px solid #e2e8f0; border-radius: 12px; overflow: hidden; margin-bottom: 14px; scroll-margin-top: 140px; }
        .pde-card-head { display: flex; align-items: center; gap: 8px; padding: 12px 16px; background: #f8fafc; border-bottom: 0.5px solid #e2e8f0; }
        .pde-card-num { font-size: 10px; color: #cbd5e1; font-family: 'IBM Plex Mono', monospace; margin-left: auto; }
        .pde-card-body { padding: 20px 24px; }
        .pde-card-body.compact { padding: 12px 16px; }
      `}</style>

      <div className="pde-root">
        {error ? <p style={{ color: '#dc2626', fontSize: 13, marginBottom: 12 }}>{error}</p> : null}

        {showSectionNav ? <PatientDetailsSectionNav /> : null}

        {PATIENT_DETAIL_SECTIONS.map((section) => {
          const StepComponent = section.Component;
          return (
            <section key={section.step} id={`pde-step-${section.step}`} className="pde-card">
              <div className="pde-card-head">
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#374151',
                    letterSpacing: '0.07em',
                    textTransform: 'uppercase',
                  }}
                >
                  Step {section.step} of 8 — {section.stepLabel}
                </span>
                <span className="pde-card-num">{String(section.step).padStart(2, '0')}</span>
              </div>
              <div
                style={{
                  padding: '10px 16px 0',
                  background: '#f8fafc',
                  borderBottom: '0.5px solid #e2e8f0',
                }}
              >
                <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: '0 0 10px' }}>
                  {section.heading}
                </h2>
              </div>
              <div className={`pde-card-body${section.compact ? ' compact' : ''}`}>
                <StepComponent data={formData} updateData={updateData} />
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
