'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AdminStep1,
  AdminStep2,
  AdminStep4,
  AdminStep5,
  AdminStep6,
  AdminStep7,
  AdminStep8,
  AdminStep9,
} from '@/app/admin/patient/[id]/assessment/AdminAssessmentSteps';
import type { AssessmentFormState, AssessmentUpdateFn, PatientWithUser } from '@/types/assessment-form';
import { getErrorMessage } from '@/lib/get-error-message';
import { buildAssessmentFormState, buildAssessmentSavePayload } from '@/lib/build-assessment-form-state';

const STEP_LABELS = [
  'Basic Info',
  'Disease Characteristics',
  'Symptoms',
  'Investigations',
  'Radiology',
  'Treatment History',
  'Vaccination History',
  'Screening',
] as const;

const STEP_HEADINGS = [
  'Patient Characteristics',
  'Disease Characteristics',
  'Disease Activity & Symptoms',
  'Laboratory & Investigations',
  'Radiology Investigations',
  'Treatment History',
  'Vaccination History',
  'Comorbidities & Infection Screening',
] as const;

const STEP_COMPONENTS = [
  AdminStep1,
  AdminStep4,
  AdminStep5,
  AdminStep6,
  AdminStep7,
  AdminStep8,
  AdminStep2,
  AdminStep9,
] as const;

type SectionConfig = {
  step: number;
  stepLabel: (typeof STEP_LABELS)[number];
  heading: (typeof STEP_HEADINGS)[number];
  Component: (typeof STEP_COMPONENTS)[number];
  compact?: boolean;
};

const SECTIONS: SectionConfig[] = STEP_LABELS.map((stepLabel, index) => ({
  step: index + 1,
  stepLabel,
  heading: STEP_HEADINGS[index],
  Component: STEP_COMPONENTS[index],
  compact: index === 3 || index === 4,
}));

type Props = {
  patient: PatientWithUser;
  chromeless?: boolean;
  onSaveReady?: (save: () => Promise<void>, isSaving: boolean) => void;
  onSaved?: () => void;
};

export default function PatientDetailsEditor({
  patient,
  chromeless = false,
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
        .pde-section-nav { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px; }
        .pde-section-link {
          font-size: 11px; font-weight: 600; text-decoration: none;
          padding: 6px 12px; border-radius: 7px;
          background: #f1f5f9; color: #475569; border: 0.5px solid #e2e8f0;
        }
        .pde-section-link:hover { background: #e2e8f0; color: #0f172a; }
        .pde-card { background: #fff; border: 0.5px solid #e2e8f0; border-radius: 12px; overflow: hidden; margin-bottom: 14px; }
        .pde-card-head { display: flex; align-items: center; gap: 8px; padding: 12px 16px; background: #f8fafc; border-bottom: 0.5px solid #e2e8f0; }
        .pde-card-num { font-size: 10px; color: #cbd5e1; font-family: 'IBM Plex Mono', monospace; margin-left: auto; }
        .pde-card-body { padding: 20px 24px; }
        .pde-card-body.compact { padding: 12px 16px; }
      `}</style>

      <div className="pde-root">
        {error ? <p style={{ color: '#dc2626', fontSize: 13, marginBottom: 12 }}>{error}</p> : null}

        <nav className="pde-section-nav" aria-label="Assessment sections">
          {SECTIONS.map((section) => (
            <a key={section.step} className="pde-section-link" href={`#pde-step-${section.step}`}>
              {section.step}. {section.stepLabel}
            </a>
          ))}
        </nav>

        {SECTIONS.map((section) => {
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
                  Step {section.step} of 7 — {section.stepLabel}
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
