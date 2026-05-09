'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FormData, initialFormData, STEP_META, validateStep } from '@/lib/formSchema';
import { INTAKE_SUBMITTED_KEY, PATIENT_ENTRY_KEY } from '@/lib/intakeSession';
import Step1PatientInfo from '@/components/steps/Step1PatientInfo';
import Step2DiseaseChar from '@/components/steps/Step2DiseaseChar';

const TOTAL_STEPS = 2;

const SHORT_LABELS = [
  'Patient', 'Medical',
];

export default function FormPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [sessionReady, setSessionReady] = useState(false);

  const currentMeta = STEP_META[step - 1];

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (sessionStorage.getItem(INTAKE_SUBMITTED_KEY) === '1') {
      router.replace('/');
      return;
    }
    if (!sessionStorage.getItem(PATIENT_ENTRY_KEY)) {
      router.replace('/');
      return;
    }

    const saved = sessionStorage.getItem(PATIENT_ENTRY_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setData(prev => ({
          ...prev,
          name: parsed.name || prev.name,
          email: parsed.email || prev.email,
        }));
      } catch (err) {
        console.error('Failed to parse patient_entry', err);
      }
    }
    setSessionReady(true);
  }, [router]);

  const updateData = (field: string, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => {
      const n = { ...prev };
      if (n[field]) {
        delete n[field];
      }
      return n;
    });
  };

  const nextStep = () => {
    const errs = validateStep(step, data);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setErrors({});
    setCompletedSteps(prev => new Set(prev).add(step));
    if (step < TOTAL_STEPS) {
      setStep(s => s + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    setErrors({});
    if (step > 1) {
      setStep(s => s - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const jumpToStep = (target: number) => {
    // Only allow jumping to completed steps or the current step
    if (target === step || completedSteps.has(target) || target < step) {
      setErrors({});
      setStep(target);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async () => {
    const errs = validateStep(step, data);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://admin-xi-three-76.vercel.app';
      const res = await fetch(`${apiUrl}/api/patients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      // Safely parse JSON — avoid crashing on HTML 404 pages
      let resData: any = {};
      try {
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
          resData = await res.json();
        }
      } catch {
        // ignore parse failures
      }

      if (!res.ok) {
        throw new Error(resData.error || `Server error ${res.status}`);
      }

      sessionStorage.setItem(INTAKE_SUBMITTED_KEY, '1');
      sessionStorage.removeItem(PATIENT_ENTRY_KEY);
      router.push('/success');
    } catch (error: any) {
      console.error('[handleSubmit]', error);
      setErrors({ submit: error.message || 'Network error occurred. Please try again.' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const progressPct = Math.round((step / TOTAL_STEPS) * 100);

  if (!sessionReady) {
    return (
      <div className="page-root" style={{ justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <p className="step-subtitle" style={{ margin: 0 }}>Loading…</p>
      </div>
    );
  }

  return (
    <div className="page-root">
      <header className="page-header">
        <div className="header-brand">MyGastro<span>.Ai</span></div>
        <div className="header-tag">Patient Intake</div>
      </header>

      <main className="page-main">

        {/* ── Progress Section ── */}
        <div className="progress-wrap">
          <div className="progress-label">
            <span>Form Progress</span>
            <strong>Step {step} of {TOTAL_STEPS} &nbsp;·&nbsp; {progressPct}%</strong>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progressPct}%` }} />
          </div>

          {/* Step number dots */}
          <div className="progress-steps" role="navigation" aria-label="Form steps">
            {STEP_META.map((_, i) => {
              const n = i + 1;
              const done = completedSteps.has(n);
              const active = n === step;
              const reachable = done || n < step;
              return (
                <button
                  key={n}
                  type="button"
                  className={`p-step-btn${active ? ' p-active' : done ? ' p-done' : ' p-future'}`}
                  onClick={() => jumpToStep(n)}
                  disabled={!reachable && n > step}
                  title={`Step ${n}: ${STEP_META[i].title}`}
                  aria-current={active ? 'step' : undefined}
                >
                  <span className="p-dot">
                    {done && !active ? '✓' : n}
                  </span>
                  <span className="p-label">{SHORT_LABELS[i]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Step Card ── */}
        {/* CHANGED: pb-24 → pb-36 to ensure content doesn't hide behind fixed nav on mobile */}
        <div className="step-card pb-36 md:pb-0" key={step}>
          <div className="step-card-head">
            <div className="step-num">Step {String(step).padStart(2, '0')}</div>
            <h1 className="step-title">{currentMeta.title}</h1>
            <p className="step-subtitle">{currentMeta.sub}</p>

            {errors.submit && (
              <div className="submit-err-banner">
                <span>⚠</span> {errors.submit}
              </div>
            )}
          </div>

          <div className="step-body">
            {step === 1 && <Step1PatientInfo formData={data} onChange={updateData} errors={errors} />}
            {step === 2 && <Step2DiseaseChar formData={data} onChange={updateData} errors={errors} />}
          </div>

          {/* FIXED: nav bar stays fixed on mobile with safe area inset for iPhone notch */}
          <div className={`form-nav fixed bottom-0 left-0 right-0 z-50 bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-[0_-4px_10px_rgba(0,0,0,0.08)] md:relative md:p-0 md:bg-transparent md:shadow-none md:z-auto ${step < TOTAL_STEPS ? 'form-nav-mobile-hide' : ''}`}>
            {step > 1 ? (
              <button type="button" className="btn-back" onClick={prevStep} disabled={isSubmitting}>
                ← Back
              </button>
            ) : <div />}

            <div className="form-nav-right">
              {step < TOTAL_STEPS ? (
                <button type="button" className="btn-next" onClick={nextStep}>
                  Next Step →
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-submit"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? <><span className="spinner" />Submitting…</>
                    : '✓ Submit Form'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Step mini-map (mobile) ── */}
        {/* CHANGED: hide minimap on last step so it doesn't overlap the fixed submit button */}
        {step < TOTAL_STEPS && (
          <div className="step-minimap">
            {step > 1 && (
              <button type="button" className="minimap-btn" onClick={prevStep}>← Back</button>
            )}
            <span className="minimap-label">
              {step} / {TOTAL_STEPS} — {currentMeta.title}
            </span>
            {step < TOTAL_STEPS && (
              <button type="button" className="minimap-btn minimap-btn-next" onClick={nextStep}>
                Next →
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
