'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  AdminStep1, AdminStep2, AdminStep4, AdminStep5,
  AdminStep6, AdminStep7, AdminStep8, AdminStep9
} from './AdminAssessmentSteps';
import type { PatientWithUser, AssessmentFormState, AssessmentUpdateFn } from '@/types/assessment-form';
import { getErrorMessage } from '@/lib/get-error-message';
import { montrealValidationMissing } from '@/lib/montreal-classification';
import { parseIbdInvestigations } from '@/lib/ibd-investigations';
import { parseRadiologyInvestigations } from '@/lib/radiology-investigations';
import {
  isFutureIsoDate,
  normalizeUcEndoscopicScoring,
  parseUcEndoscopicScoring,
} from '@/lib/uc-endoscopic-scoring';
import {
  normalizeHarveyBradshawIndex,
  parseHarveyBradshawIndex,
} from '@/lib/harvey-bradshaw-index';
import {
  normalizePartialMayoScore,
  parsePartialMayoScore,
} from '@/lib/partial-mayo-score';
import {
  normalizeSesCdScoring,
  parseSesCdScoring,
} from '@/lib/ses-cd-scoring';
import { performLogout } from '@/lib/logout-client';
import {
  assessmentField,
  buildAssessmentFormState,
  buildAssessmentSavePayload,
} from '@/lib/build-assessment-form-state';
import {
  parseInfectionScreening,
  validateInfectionScreeningSets,
} from '@/lib/infection-screening';

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

const stepLabels = [
  "Basic Info",
  "Disease Characteristics",
  "Symptoms",
  "Investigations",
  "Radiology",
  "Treatment History",
  "Vaccination History",
  "Screening",
];

const stepHeadings = [
  "Patient Characteristics",
  "Disease Characteristics",
  "Disease Activity & Symptoms",
  "Laboratory & Investigations",
  "Radiology Investigations",
  "Treatment History",
  "Vaccination History",
  "Comorbidities & Infection Screening",
];

const ASSESSMENT_TOTAL_STEPS = 8;

/** Map saved step index from prior 7-step assessments (before Radiology step). */
function mapLegacyAssessmentStep(step: number): number {
  if (step <= 4) return step;
  if (step <= 7) return step + 1;
  return ASSESSMENT_TOTAL_STEPS;
}

function clampAssessmentStep(step: unknown): number {
  const n = typeof step === 'number' ? step : parseInt(String(step ?? ''), 10);
  if (!Number.isFinite(n)) return 1;
  return mapLegacyAssessmentStep(Math.min(Math.max(n, 1), 9));
}

function completedStepsBefore(step: number): Set<number> {
  const completed = new Set<number>();
  for (let i = 1; i < step; i++) completed.add(i);
  return completed;
}

function initialAssessmentStep(patient: PatientWithUser): number {
  if (patient.assessmentComplete) return 1;
  return clampAssessmentStep(patient.assessmentCurrentStep);
}

export default function AssessmentWizard({ patient }: { patient: PatientWithUser }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [currentStep, setCurrentStep] = useState(() => initialAssessmentStep(patient));
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(() =>
    completedStepsBefore(initialAssessmentStep(patient)),
  );
  const [formData, setFormData] = useState<AssessmentFormState>(() => buildAssessmentFormState(patient));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingStep, setIsSavingStep] = useState(false);
  const [error, setError] = useState('');
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const saveInFlightRef = useRef(false);
  const mainScrollRef = useRef<HTMLDivElement>(null);

  const totalSteps = ASSESSMENT_TOTAL_STEPS;

  useEffect(() => {
    queueMicrotask(() => {
      setMounted(true);
    });
  }, []);

  useEffect(() => {
    mainScrollRef.current?.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [currentStep]);

  if (!patient) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: "'Inter', sans-serif", color: '#64748b', fontSize: 15 }}>
        Patient not found.
      </div>
    );
  }

  if (!mounted) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          fontFamily: "'Inter', sans-serif",
          color: '#64748b',
          fontSize: 15,
        }}
      >
        Loading assessment...
      </div>
    );
  }

  const updateData: AssessmentUpdateFn = (fields) => {
    setFormData((prev) => ({ ...prev, ...fields }) as AssessmentFormState);
  };

  const validateAssessmentStep = (stepNum: number, data: AssessmentFormState): string | null => {
    const isNonEmpty = (v: unknown) => String(v ?? '').trim() !== '';

    if (stepNum === 1) {
      const requiredFields: { key: string; label: string }[] = [
        { key: 'name', label: 'Name' },
        { key: 'email', label: 'Email' },
        { key: 'mrn', label: 'ID / MRN' },
        { key: 'contactPhone', label: 'Contact Phone' },
        { key: 'placeOfLiving', label: 'Place of Living' },
        { key: 'referredBy', label: 'Referred By' },
        { key: 'dateOfBirth', label: 'Date of Birth' },
      ];
      const missing = requiredFields
        .filter(({ key }) => !isNonEmpty(assessmentField(data, key)))
        .map(({ label }) => label);

      if (!isNonEmpty(data?.sex)) missing.push('Sex');

      if (!isNonEmpty(data?.smokingStatus)) missing.push('Smoking Status');
      const needsSmokingDetails =
        data?.smokingStatus === 'Current smoker' ||
        data?.smokingStatus === 'Ex smoker' ||
        data?.smokingStatus === 'Current' ||
        data?.smokingStatus === 'Former';
      if (needsSmokingDetails && !isNonEmpty(data?.smokingDetails)) {
        missing.push('Smoking amount');
      }

      const caRaw = assessmentField(data, 'currentAge');
      const caNum = typeof caRaw === 'number' ? caRaw : typeof caRaw === 'string' ? Number(caRaw) : NaN;
      if (!Number.isFinite(caNum)) missing.push('Current Age');

      const email = String(data?.email ?? '').trim();
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return 'Please enter a valid email address.';
      }

      if (missing.length > 0) {
        return missing.join(', ');
      }
    }

    if (stepNum === 2) {
      const missing: string[] = [];
      if (!isNonEmpty(data?.primaryDiagnosis)) missing.push('Primary Diagnosis');
      const adRaw = assessmentField(data, 'ageAtDiagnosis');
      const adNum = typeof adRaw === 'number' ? adRaw : typeof adRaw === 'string' ? Number(adRaw) : NaN;
      if (!Number.isFinite(adNum)) missing.push('Age at Diagnosis');
      if (!isNonEmpty(data?.diseaseDuration)) missing.push('Disease Duration');
      missing.push(
        ...montrealValidationMissing(data?.primaryDiagnosis, {
          montrealAgeAtDiagnosis: data?.montrealAgeAtDiagnosis,
          ucExtent: data?.ucExtent,
          diseaseLocation: data?.diseaseLocation,
          diseaseBehavior: data?.diseaseBehavior,
          perianalDisease: data?.perianalDisease,
        }),
      );

      let surgeries: unknown[] = [];
      const raw = data?.previousSurgeries;
      if (Array.isArray(raw)) surgeries = raw;
      else if (typeof raw === 'string') {
        try {
          const p = JSON.parse(raw);
          if (Array.isArray(p)) surgeries = p;
        } catch {
          /* ignore */
        }
      }
      if (surgeries.length === 0) missing.push('Previous IBD Surgeries');

      if (data?.primaryDiagnosis === 'Ulcerative Colitis') {
        const ucScoring = normalizeUcEndoscopicScoring(parseUcEndoscopicScoring(data.ucEndoscopicScoring));
        if (isFutureIsoDate(ucScoring.scoringDate ?? '')) {
          return 'UC Endoscopic Scoring date cannot be in the future';
        }
        const pMayo = normalizePartialMayoScore(parsePartialMayoScore(data.partialMayoScoring));
        if (isFutureIsoDate(pMayo.assessmentDate ?? '')) {
          return 'Partial Mayo Score assessment date cannot be in the future';
        }
      }

      if (data?.primaryDiagnosis === "Crohn's Disease") {
        const sesScoring = normalizeSesCdScoring(parseSesCdScoring(data.sesCdScoring));
        if (isFutureIsoDate(sesScoring.scoringDate ?? '')) {
          return 'SES-CD Scoring date cannot be in the future';
        }
        const hbi = normalizeHarveyBradshawIndex(parseHarveyBradshawIndex(data.hbiScoring));
        if (isFutureIsoDate(hbi.assessmentDate ?? '')) {
          return 'Harvey-Bradshaw Index assessment date cannot be in the future';
        }
      }

      if (missing.length > 0) {
        return missing.join(', ');
      }
    }

    if (stepNum === 3) {
      const requiredFields = [
        { key: 'currentDiseaseActivity', label: 'Current Disease Activity Level' },
        { key: 'stoolFrequency', label: 'Frequency of Stools (per day)' },
      ];
      const missing = requiredFields
        .filter(({ key }) => !String(assessmentField(data, key) ?? '').trim())
        .map(({ label }) => label);

      if (missing.length > 0) {
        return missing.join(', ');
      }
    }

    if (stepNum === 4) {
      const inv = parseIbdInvestigations(data.ibdInvestigations, data.dateMostRecentLabs);
      if (inv.sets.length === 0) {
        return 'At least one Laboratory & Investigations section is required';
      }
      const missingDates = inv.sets
        .map((set, i) => (!String(set.assessmentDate ?? '').trim() ? `Date of Assessment (set ${i + 1})` : null))
        .filter(Boolean);
      if (missingDates.length > 0) {
        return missingDates.join(', ');
      }
    }

    if (stepNum === 5) {
      const radiology = parseRadiologyInvestigations(data.radiologyInvestigations);
      if (radiology.sets.length === 0) {
        return 'At least one Radiology Investigations section is required';
      }
      const missingDates = radiology.sets
        .map((set, i) => (!String(set.assessmentDate ?? '').trim() ? `Date of Assessment (set ${i + 1})` : null))
        .filter(Boolean);
      if (missingDates.length > 0) {
        return missingDates.join(', ');
      }
    }

    if (stepNum === 6) {
      if (!String(assessmentField(data, 'responseToTreatment') ?? '').trim()) {
        return 'Response to Current Treatment* (Based on HBI or Partial Mayo scores)';
      }
    }

    if (stepNum === 8) {
      const missing: string[] = [];
      const screening = parseInfectionScreening(
        (data as Record<string, unknown>).infectionScreening,
      );

      for (const set of screening.sets) {
        if (set.screeningDate.trim() && isFutureIsoDate(set.screeningDate)) {
          return 'Screening date cannot be in the future';
        }
      }

      missing.push(...validateInfectionScreeningSets(screening));

      let comorb: unknown[] = [];
      const comorbRaw = data?.comorbidities;
      if (Array.isArray(comorbRaw)) comorb = comorbRaw;
      else if (typeof comorbRaw === 'string') {
        try {
          const p = JSON.parse(comorbRaw);
          if (Array.isArray(p)) comorb = p;
        } catch {
          /* ignore */
        }
      }
      if (comorb.length === 0) missing.push('Comorbidities');

      let eim: unknown[] = [];
      const eimRaw = data?.extraintestinalManif;
      if (Array.isArray(eimRaw)) eim = eimRaw;
      else if (typeof eimRaw === 'string') {
        const trimmed = eimRaw.trim();
        if (trimmed.startsWith('[')) {
          try {
            const p = JSON.parse(trimmed);
            if (Array.isArray(p)) eim = p;
          } catch {
            /* ignore */
          }
        } else if (trimmed) {
          eim = [trimmed];
        }
      }
      if (eim.length === 0) missing.push('Extraintestinal Manifestations');
      if (!isNonEmpty(data?.pregnancyPlanning)) missing.push('Pregnancy / Family Planning Status');

      if (missing.length > 0) {
        return missing.join(', ');
      }
    }

    return null;
  };

  const validateCurrentStep = () => {
    const stepError = validateAssessmentStep(currentStep, formData);
    if (stepError) {
      setError(`Please fill all mandatory fields before continuing: ${stepError}`);
      return false;
    }
    setError('');
    return true;
  };

  const validateAllSteps = (): string | null => {
    const stepErrors: string[] = [];
    for (let stepNum = 1; stepNum <= totalSteps; stepNum++) {
      const stepError = validateAssessmentStep(stepNum, formData);
      if (stepError) {
        stepErrors.push(`Step ${stepNum} (${stepLabels[stepNum - 1]}): ${stepError}`);
      }
    }
    if (stepErrors.length === 0) return null;
    return `Please fix mandatory fields before completing the assessment — ${stepErrors.join('; ')}`;
  };

  const isStepReachable = (stepNum: number) =>
    stepNum === currentStep || completedSteps.has(stepNum) || stepNum < currentStep;

  const jumpToStep = (target: number) => {
    if (target === currentStep || !isStepReachable(target)) return;
    setError('');
    setCurrentStep(target);
  };

  const persistProgress = async (overrides?: Record<string, unknown>): Promise<boolean> => {
    if (saveInFlightRef.current) return false;
    saveInFlightRef.current = true;

    try {
      let body: string;
      try {
        body = JSON.stringify(buildAssessmentSavePayload(formData, overrides));
      } catch {
        setError('Could not save — form data could not be serialized.');
        return false;
      }

      if (!body) {
        setError('Could not save — empty request body.');
        return false;
      }

      const res = await fetch(`/api/patient/${patient.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body,
      });
      if (!res.ok) {
        let msg = 'Failed to save progress';
        try {
          const j: unknown = await res.json();
          if (isRecord(j) && typeof j.error === 'string') msg = j.error;
        } catch {
          /* ignore */
        }
        setError(msg);
        return false;
      }
      return true;
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return false;
      }
      setError(getErrorMessage(err));
      return false;
    } finally {
      saveInFlightRef.current = false;
    }
  };

  const handleNext = async () => {
    if (!validateCurrentStep()) return;
    setIsSavingStep(true);
    setError('');
    const ok = await persistProgress({ assessmentCurrentStep: currentStep + 1 });
    setIsSavingStep(false);
    if (!ok) return;
    setCompletedSteps((prev) => new Set(prev).add(currentStep));
    if (currentStep < totalSteps) setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep((prev) => prev - 1);
  };

  /** Persist draft and leave — no per-step validation (partial save). */
  const handleSaveAndExit = async () => {
    setIsSubmitting(true);
    setError('');
    try {
      const ok = await persistProgress({ assessmentCurrentStep: currentStep });
      if (!ok) return;
      router.push('/admin');
      router.refresh();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  /** Last step only: re-validate all steps, then save and return to patient. */
  const handleCompleteAssessment = async () => {
    const allStepsError = validateAllSteps();
    if (allStepsError) {
      setError(allStepsError);
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      const ok = await persistProgress({ assessmentComplete: true, assessmentCurrentStep: totalSteps });
      if (!ok) return;
      router.push(`/admin/patient/${patient.id}`);
      router.refresh();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveAndLogout = async () => {
    setIsSubmitting(true);
    setError('');
    try {
      const ok = await persistProgress({ assessmentCurrentStep: currentStep });
      if (!ok) {
        setIsSubmitting(false);
        return;
      }
      const logoutResult = await performLogout();
      if (!logoutResult.ok) {
        setError(logoutResult.error);
        setIsSubmitting(false);
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err));
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    setError('');
    const logoutResult = await performLogout();
    if (!logoutResult.ok) {
      setError(logoutResult.error);
    }
  };

  return (
    <>
      <style>{`
        .aw-main { padding: 32px 40px; max-width: 100%; overflow-x: hidden; }
        .aw-stepper { justify-content: space-between; }
        .aw-bottom-nav { flex-direction: row; }

        @media (max-width: 900px) {
          .aw-grid-3 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
        }
        @media (max-width: 640px) {
          .aw-grid-2, .aw-grid-3 { grid-template-columns: 1fr !important; gap: 16px !important; }
        }

        @media (max-width: 768px) {
          .aw-main { padding: 16px; }
          .aw-stepper { overflow-x: auto; padding-bottom: 16px; margin-bottom: 16px; justify-content: flex-start; gap: 20px; -webkit-overflow-scrolling: touch; }
          .aw-bottom-nav { flex-direction: column; gap: 12px; }
          .aw-bottom-nav button { width: 100%; margin-left: 0 !important; min-height: 44px; }
        }

        @media (max-width: 480px) {
          .aw-top-bar { padding-left: 12px !important; padding-right: 12px !important; flex-wrap: wrap; gap: 8px !important; height: auto !important; min-height: 52px; }
          .aw-top-bar-brand img { height: 28px !important; }
          .aw-top-bar-actions { width: 100%; justify-content: flex-end; flex-wrap: wrap; gap: 8px; }
        }
        .aw-top-bar-actions button { min-height: 44px; }
      `}</style>
      <div style={{ fontFamily: "'Inter', sans-serif" }} className="flex flex-col min-h-screen w-full bg-white overflow-hidden">

      {/* ── TOP NAV BAR ── */}
      <div
        className="aw-top-bar"
        style={{
          minHeight: 52,
        background: '#ffffff',
        borderBottom: '0.5px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        flexShrink: 0,
        zIndex: 10,
        gap: 10,
      }}
      >
        {/* Brand */}
        <Link className="aw-top-bar-brand" href="/" style={{ display: 'inline-flex', alignItems: 'center', borderRadius: 8, outline: 'none', flexShrink: 0 }} aria-label="myGastro.AI home">
          <Image
            src="/mygastro-logo.png"
            alt="myGastro.AI"
            width={230}
            height={42}
            priority
            style={{ width: 'auto', height: 36, objectFit: 'contain' }}
          />
        </Link>

        {/* Right: Admin badge + Logout */}
        <div className="aw-top-bar-actions" style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 7,
            background: '#f1f5f9', borderRadius: 8, padding: '5px 12px',
          }}>
            <div style={{
              width: 24, height: 24, borderRadius: '50%',
              background: '#0891b2', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, color: '#ffffff',
            }}>A</div>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', fontFamily: "'Inter', sans-serif" }}>Admin</span>
          </div>
          <button
            onClick={() => setShowLogoutDialog(true)}
            style={{
              padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              background: '#fff1f2', border: '1px solid #fecdd3', color: '#e11d48',
              cursor: 'pointer', fontFamily: "'Inter', sans-serif",
            }}
          >
            Log out
          </button>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="aw-layout" style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div
          ref={mainScrollRef}
          className="aw-main"
          style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#fafafa', minWidth: 0, overflowY: 'auto' }}
        >
          {/* Horizontal step indicator */}
          <div
            className="aw-stepper"
            role="navigation"
            aria-label="Assessment steps"
            style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 28, paddingBottom: 24, borderBottom: '0.5px solid #e2e8f0', position: 'relative' }}
          >
            <div style={{ position: 'absolute', top: 15, left: 30, right: 30, height: 2, background: '#e2e8f0', zIndex: 0 }} />
            {stepLabels.map((label, idx) => {
              const stepNum = idx + 1;
              const isActive = stepNum === currentStep;
              const isCompleted = completedSteps.has(stepNum) || stepNum < currentStep;
              const isReachable = isStepReachable(stepNum);
              const StepTag = isReachable ? 'button' : 'div';
              return (
                <StepTag
                  key={idx}
                  type={isReachable ? 'button' : undefined}
                  onClick={isReachable ? () => jumpToStep(stepNum) : undefined}
                  disabled={isReachable ? isActive || isSavingStep || isSubmitting : undefined}
                  aria-current={isActive ? 'step' : undefined}
                  aria-label={`Step ${stepNum}: ${label}${isCompleted ? ' (completed)' : ''}`}
                  title={isReachable && !isActive ? `Go to ${label}` : undefined}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6,
                    zIndex: 1,
                    minWidth: 56,
                    border: 'none',
                    background: 'transparent',
                    padding: 0,
                    cursor: isReachable && !isActive ? 'pointer' : 'default',
                    opacity: isReachable || isActive ? 1 : 0.85,
                  }}
                >
                  <div style={{
                    width: 30, height: 30, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700,
                    background: isActive ? '#2563eb' : isCompleted ? '#0d9488' : '#ffffff',
                    border: isActive || isCompleted ? 'none' : '2px solid #e2e8f0',
                    color: isActive || isCompleted ? '#ffffff' : '#94a3b8',
                    boxShadow: isActive ? '0 4px 12px rgba(37,99,235,0.3)' : 'none',
                    transition: 'all 0.2s',
                    fontFamily: "'Inter', sans-serif",
                  }}>
                    {isCompleted && !isActive
                      ? <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                      : stepNum}
                  </div>
                  <span style={{
                    fontSize: 9, fontWeight: 700, textAlign: 'center',
                    textTransform: 'uppercase', letterSpacing: '0.06em', lineHeight: 1.3,
                    color: isActive ? '#2563eb' : isCompleted ? '#0d9488' : '#94a3b8',
                    fontFamily: "'Inter', sans-serif",
                  }}>
                    {label}
                  </span>
                </StepTag>
              );
            })}
          </div>

          <h2 style={{
            fontSize: 20,
            fontWeight: 700,
            color: '#0f172a',
            marginBottom: 20,
            fontFamily: "'Inter', sans-serif",
          }}>
            Clinical Assessment for {patient.name ?? patient.user?.name ?? 'Unknown'}
          </h2>

          {/* Step heading */}
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4, fontFamily: "'Inter', sans-serif" }}>
              Step {currentStep} of {totalSteps}
            </p>
            <h3 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', fontFamily: "'Inter', sans-serif" }}>{stepHeadings[currentStep - 1]}</h3>
          </div>

          {/* Form content */}
          <div
            style={{
              flex: 1,
              background: '#ffffff',
              padding: currentStep === 4 || currentStep === 5 ? '12px 16px' : '24px',
              borderRadius: 12,
              border: '0.5px solid #e2e8f0',
              marginBottom: currentStep === 4 || currentStep === 5 ? 12 : 20,
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {currentStep === 1 && <AdminStep1 data={formData} updateData={updateData} />}
            {currentStep === 2 && <AdminStep4 data={formData} updateData={updateData} />}
            {currentStep === 3 && <AdminStep5 data={formData} updateData={updateData} />}
            {currentStep === 4 && <AdminStep6 data={formData} updateData={updateData} />}
            {currentStep === 5 && <AdminStep7 data={formData} updateData={updateData} />}
            {currentStep === 6 && <AdminStep8 data={formData} updateData={updateData} />}
            {currentStep === 7 && <AdminStep2 data={formData} updateData={updateData} />}
            {currentStep === 8 && <AdminStep9 data={formData} updateData={updateData} />}
          </div>

          {error && <p style={{ color: '#dc2626', fontSize: 13, marginBottom: 12, fontFamily: "'Inter', sans-serif" }}>{error}</p>}

          {/* Bottom navigation */}
          <div className="aw-bottom-nav" style={{ display: 'flex', alignItems: 'center', paddingTop: 20, borderTop: '0.5px solid #e2e8f0' }}>
            {currentStep > 1 && (
              <button onClick={handleBack} disabled={isSubmitting || isSavingStep} style={{
                padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                background: '#ffffff', border: '1px solid #e2e8f0', color: '#475569',
                cursor: 'pointer', transition: 'all 0.2s', fontFamily: "'Inter', sans-serif",
              }}>
                Back
              </button>
            )}
            <button onClick={() => void handleSaveAndExit()} disabled={isSubmitting || isSavingStep} style={{
              padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              background: '#ffffff', border: '1px solid #e2e8f0', color: '#475569',
              cursor: isSubmitting || isSavingStep ? 'not-allowed' : 'pointer', marginLeft: 'auto', transition: 'all 0.2s',
              fontFamily: "'Inter', sans-serif",
            }}>
              {isSubmitting ? 'Saving...' : 'Save & Exit'}
            </button>
            {currentStep < totalSteps ? (
              <button
                type="button"
                onClick={() => void handleNext()}
                disabled={isSavingStep || isSubmitting}
                style={{
                padding: '8px 22px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                background: '#2563eb', border: 'none', color: '#ffffff',
                cursor: isSavingStep || isSubmitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                boxShadow: '0 4px 12px rgba(37,99,235,0.25)', transition: 'all 0.2s',
                fontFamily: "'Inter', sans-serif",
                opacity: isSavingStep ? 0.85 : 1,
              }}
              >
                {isSavingStep ? 'Saving…' : 'Next'} {!isSavingStep ? <span>→</span> : null}
              </button>
            ) : (
              <button onClick={() => void handleCompleteAssessment()} disabled={isSubmitting || isSavingStep} style={{
                padding: '8px 22px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                background: '#2563eb', border: 'none', color: '#ffffff',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 12px rgba(37,99,235,0.25)', transition: 'all 0.2s',
                fontFamily: "'Inter', sans-serif",
              }}>
                {isSubmitting ? 'Saving...' : 'Complete Assessment'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── LOGOUT CONFIRMATION DIALOG ── */}
      {showLogoutDialog && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
        }}>
          <div style={{
            background: '#ffffff', borderRadius: 16, padding: '32px 28px',
            width: 380, fontFamily: "'Inter', sans-serif",
          }}>
            {/* Icon */}
            <div style={{
              width: 48, height: 48, borderRadius: 12, background: '#fff1f2',
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
            }}>
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#e11d48" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>

            <h2 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Log out?</h2>
            <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, marginBottom: 24 }}>
              You have unsaved changes. Would you like to save your progress before logging out?
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                onClick={handleSaveAndLogout}
                disabled={isSubmitting}
                style={{
                  padding: '10px 16px', borderRadius: 9, fontSize: 13, fontWeight: 700,
                  background: '#2563eb', border: 'none', color: '#ffffff',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  fontFamily: "'Inter', sans-serif", width: '100%',
                }}
              >
                {isSubmitting ? 'Saving...' : 'Save & Log out'}
              </button>

              <button
                onClick={handleLogout}
                disabled={isSubmitting}
                style={{
                  padding: '10px 16px', borderRadius: 9, fontSize: 13, fontWeight: 600,
                  background: '#fff1f2', border: '1px solid #fecdd3', color: '#e11d48',
                  cursor: 'pointer', fontFamily: "'Inter', sans-serif", width: '100%',
                }}
              >
                Log out without saving
              </button>

              <button
                onClick={() => setShowLogoutDialog(false)}
                style={{
                  padding: '10px 16px', borderRadius: 9, fontSize: 13, fontWeight: 600,
                  background: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569',
                  cursor: 'pointer', fontFamily: "'Inter', sans-serif", width: '100%',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}