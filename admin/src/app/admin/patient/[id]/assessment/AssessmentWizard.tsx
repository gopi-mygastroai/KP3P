'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { preferredLanguageScalarForForm } from '@/lib/preferredLanguagePrompt';
import { normalizeSmokingStatusForForm } from '@/lib/smoking';
import {
  AdminStep1, AdminStep2, AdminStep4, AdminStep5,
  AdminStep6, AdminStep7, AdminStep8, AdminStep9
} from './AdminAssessmentSteps';

const stepLabels = [
  "Basic Info",
  "Disease Characteristics",
  "Symptoms",
  "Investigations",
  "Current Treatment",
  "Treatment History",
  "Vaccination History",
  "Screening",
];

const stepHeadings = [
  "Patient Characteristics",
  "Disease Characteristics",
  "Disease Activity & Symptoms",
  "Laboratory & Investigations",
  "Current Treatment",
  "Treatment History",
  "Vaccination History",
  "Infection Screening & Comorbidities",
];

export default function AssessmentWizard({ patient }: { patient: any }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<any>(() => {
    const parsed = { ...patient };
    try { if (typeof parsed.previousSurgeries === 'string') parsed.previousSurgeries = JSON.parse(parsed.previousSurgeries); } catch (e) { }
    try { if (typeof parsed.previousTreatmentsTried === 'string') parsed.previousTreatmentsTried = JSON.parse(parsed.previousTreatmentsTried); } catch (e) { }
    try { if (typeof parsed.comorbidities === 'string') parsed.comorbidities = JSON.parse(parsed.comorbidities); } catch (e) { }
    try { if (typeof parsed.documents === 'string') parsed.documents = JSON.parse(parsed.documents); } catch (e) { }
    parsed.smokingStatus = normalizeSmokingStatusForForm(parsed.smokingStatus);
    if (parsed.smokingDetails == null) parsed.smokingDetails = '';
    parsed.preferredLanguage = preferredLanguageScalarForForm(parsed.preferredLanguage);
    return parsed;
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const totalSteps = 8;

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const updateData = (fields: any) => {
    setFormData((prev: any) => ({ ...prev, ...fields }));
  };

  const validateCurrentStep = () => {
    const isNonEmpty = (v: unknown) => String(v ?? '').trim() !== '';

    if (currentStep === 1) {
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
        .filter(({ key }) => !isNonEmpty(formData?.[key]))
        .map(({ label }) => label);

      if (!isNonEmpty(formData?.sex)) missing.push('Sex');

      if (!isNonEmpty(formData?.smokingStatus)) missing.push('Smoking Status');
      const needsSmokingDetails =
        formData?.smokingStatus === 'Current smoker' ||
        formData?.smokingStatus === 'Ex smoker' ||
        formData?.smokingStatus === 'Current' ||
        formData?.smokingStatus === 'Former';
      if (needsSmokingDetails && !isNonEmpty(formData?.smokingDetails)) {
        missing.push('Smoking amount');
      }

      const ca = formData?.currentAge;
      if (ca === '' || ca == null || !Number.isFinite(Number(ca))) missing.push('Current Age');
      const ad = formData?.ageAtDiagnosis;
      if (ad === '' || ad == null || !Number.isFinite(Number(ad))) missing.push('Age at Diagnosis');

      const email = String(formData?.email ?? '').trim();
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setError('Please enter a valid email address.');
        return false;
      }

      if (missing.length > 0) {
        setError(`Please fill all mandatory fields before continuing: ${missing.join(', ')}`);
        return false;
      }
    }

    if (currentStep === 2) {
      const missing: string[] = [];
      if (!isNonEmpty(formData?.primaryDiagnosis)) missing.push('Primary Diagnosis');
      if (!isNonEmpty(formData?.diseaseDuration)) missing.push('Disease Duration');
      if (!isNonEmpty(formData?.montrealClass)) missing.push('Montreal Classification');

      let surgeries: unknown[] = [];
      const raw = formData?.previousSurgeries;
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

      if (missing.length > 0) {
        setError(`Please fill all mandatory fields before continuing: ${missing.join(', ')}`);
        return false;
      }
    }

    if (currentStep === 3) {
      const requiredFields = [
        { key: 'currentDiseaseActivity', label: 'Current Disease Activity Level' },
        { key: 'stoolFrequency', label: 'Frequency of Stools (per day)' },
      ];
      const missing = requiredFields
        .filter(({ key }) => !String(formData?.[key] ?? '').trim())
        .map(({ label }) => label);

      if (missing.length > 0) {
        setError(`Please fill all mandatory fields before continuing: ${missing.join(', ')}`);
        return false;
      }
    }

    if (currentStep === 4) {
      const requiredFields = [
        { key: 'dateMostRecentLabs', label: 'Date of Most Recent Labs' },
        { key: 'recentLabValues', label: 'Recent Lab Values' },
        { key: 'dateMostRecentColonoscopy', label: 'Date of Most Recent Colonoscopy' },
        { key: 'colonoscopyFindings', label: 'Colonoscopy Findings' },
        { key: 'recentImaging', label: 'Recent Imaging' },
      ];

      const missing = requiredFields
        .filter(({ key }) => !String(formData?.[key] ?? '').trim())
        .map(({ label }) => label);

      if (missing.length > 0) {
        setError(`Please fill all mandatory fields before continuing: ${missing.join(', ')}`);
        return false;
      }
    }

    if (currentStep === 5) {
      const requiredFields = [
        { key: 'currentIbdMedications', label: 'Current IBD Medications with Duration' },
        { key: 'responseToTreatment', label: 'Response to Current Treatment' },
      ];
      const missing = requiredFields
        .filter(({ key }) => !String(formData?.[key] ?? '').trim())
        .map(({ label }) => label);

      if (missing.length > 0) {
        setError(`Please fill all mandatory fields before continuing: ${missing.join(', ')}`);
        return false;
      }
    }

    if (currentStep === 6) {
      let tried: unknown[] = [];
      const raw = formData?.previousTreatmentsTried;
      if (Array.isArray(raw)) tried = raw;
      else if (typeof raw === 'string') {
        try {
          const p = JSON.parse(raw);
          if (Array.isArray(p)) tried = p;
        } catch {
          /* ignore */
        }
      }
      if (tried.length === 0) {
        setError('Please fill all mandatory fields before continuing: Previous IBD Treatments Tried');
        return false;
      }
    }

    if (currentStep === 8) {
      const missing: string[] = [];
      if (!isNonEmpty(formData?.tbScreening)) missing.push('TB Screening Status');
      if (!isNonEmpty(formData?.hepBSurfaceAg)) missing.push('Hepatitis B Surface Antigen');

      let comorb: unknown[] = [];
      const comorbRaw = formData?.comorbidities;
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

      if (!isNonEmpty(formData?.extraintestinalManif)) missing.push('Extraintestinal Manifestations');
      if (!isNonEmpty(formData?.pregnancyPlanning)) missing.push('Pregnancy / Family Planning Status');

      if (missing.length > 0) {
        setError(`Please fill all mandatory fields before continuing: ${missing.join(', ')}`);
        return false;
      }
    }

    setError('');
    return true;
  };

  const handleNext = () => {
    if (!validateCurrentStep()) return;
    if (currentStep < totalSteps) setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep((prev) => prev - 1);
  };

  const handleSave = async () => {
    if (!validateCurrentStep()) return;
    setIsSubmitting(true);
    setError('');
    try {
      const res = await fetch(`/api/patient/${patient.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error('Failed to save assessment');
      router.push(`/admin/patient/${patient.id}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveAndLogout = async () => {
    if (!validateCurrentStep()) return;
    setIsSubmitting(true);
    setError('');
    try {
      const res = await fetch(`/api/patient/${patient.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error('Failed to save');
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/');
    } catch (err: any) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  return (
    <>
      <style>{`
        .aw-layout { flex-direction: row; }
        .aw-sidebar { width: 250px; display: flex; }
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
          .aw-layout { flex-direction: column; }
          .aw-sidebar { width: 100%; padding: 16px; }
          .aw-sidebar-desc, .aw-sidebar-steps, .aw-sidebar-footer { display: none; }
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

      {/* ── BODY: sidebar + main ── */}
      <div className="aw-layout" style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ── LEFT SIDEBAR ── */}
        <div className="aw-sidebar" style={{
          flexShrink: 0,
          background: 'linear-gradient(135deg, #0891b2 0%, #a5f3fc 100%)',
          padding: '0 20px 20px 20px',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: -50, right: -50,
            width: 180, height: 180, borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)', pointerEvents: 'none',
          }} />

          {/* Title row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, position: 'relative', zIndex: 1, paddingTop: 24 }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"
              fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
              <path d="M9 14h6"></path><path d="M9 18h6"></path><path d="M9 10h6"></path>
            </svg>
            <span style={{ color: '#ffffff', fontSize: 16, fontWeight: 700, letterSpacing: '-0.2px', fontFamily: "'Inter', sans-serif" }}>
              Clinical Assessment
            </span>
          </div>

          <p className="aw-sidebar-desc" style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11.5, lineHeight: 1.6, marginBottom: 20, position: 'relative', zIndex: 1, fontFamily: "'Inter', sans-serif" }}>
            8 Steps to complete the patient assessment
          </p>

          {/* Patient chip */}
          <div style={{
            background: 'rgba(255,255,255,0.15)',
            border: '1px solid rgba(255,255,255,0.25)',
            borderRadius: 10, padding: '8px 12px', marginBottom: 22,
            position: 'relative', zIndex: 1,
          }}>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 2, fontFamily: "'Inter', sans-serif" }}>Patient</p>
            <p style={{ color: '#ffffff', fontSize: 14, fontWeight: 700, fontFamily: "'Inter', sans-serif" }}>
              {patient.name ?? patient.user?.name ?? 'Unknown'}
            </p>
          </div>

          {/* Step list */}
          <div className="aw-sidebar-steps" style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1, position: 'relative', zIndex: 1 }}>
            {stepLabels.map((label, idx) => {
              const stepNum = idx + 1;
              const isActive = stepNum === currentStep;
              const isPast = stepNum < currentStep;
              return (
                <div key={idx} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '5px 8px', borderRadius: 8,
                  background: isActive ? 'rgba(255,255,255,0.2)' : 'transparent',
                  transition: 'background 0.2s',
                }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 700,
                    background: isActive ? '#ffffff' : isPast ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.15)',
                    color: isActive ? '#0891b2' : '#ffffff',
                    fontFamily: "'Inter', sans-serif",
                  }}>
                    {isPast ? '✓' : stepNum}
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: isActive ? 700 : 400,
                    color: isActive ? '#ffffff' : 'rgba(255,255,255,0.7)',
                    fontFamily: "'Inter', sans-serif",
                  }}>
                    {label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="aw-sidebar-footer" style={{ borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: 12, marginTop: 12, position: 'relative', zIndex: 1 }}>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11, fontFamily: "'Inter', sans-serif" }}>
              Step <span style={{ color: '#ffffff', fontWeight: 700 }}>{currentStep}</span> of {totalSteps}
            </p>
          </div>
        </div>

        {/* ── RIGHT MAIN PANEL ── */}
        <div className="aw-main" style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#fafafa', minWidth: 0, overflowY: 'auto' }}>

          {/* Horizontal step indicator */}
          <div className="aw-stepper" style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 28, paddingBottom: 24, borderBottom: '0.5px solid #e2e8f0', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 15, left: 30, right: 30, height: 2, background: '#e2e8f0', zIndex: 0 }} />
            {stepLabels.map((label, idx) => {
              const stepNum = idx + 1;
              const isActive = stepNum === currentStep;
              const isPast = stepNum < currentStep;
              return (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, zIndex: 1, minWidth: 56 }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700,
                    background: isActive ? '#2563eb' : isPast ? '#0d9488' : '#ffffff',
                    border: isActive || isPast ? 'none' : '2px solid #e2e8f0',
                    color: isActive || isPast ? '#ffffff' : '#94a3b8',
                    boxShadow: isActive ? '0 4px 12px rgba(37,99,235,0.3)' : 'none',
                    transition: 'all 0.2s',
                    fontFamily: "'Inter', sans-serif",
                  }}>
                    {isPast
                      ? <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                      : stepNum}
                  </div>
                  <span style={{
                    fontSize: 9, fontWeight: 700, textAlign: 'center',
                    textTransform: 'uppercase', letterSpacing: '0.06em', lineHeight: 1.3,
                    color: isActive ? '#2563eb' : '#94a3b8',
                    fontFamily: "'Inter', sans-serif",
                  }}>
                    {label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Step heading */}
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4, fontFamily: "'Inter', sans-serif" }}>
              Step {currentStep} of {totalSteps}
            </p>
            <h3 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', fontFamily: "'Inter', sans-serif" }}>{stepHeadings[currentStep - 1]}</h3>
          </div>

          {/* Form content */}
          <div style={{ flex: 1, background: '#ffffff', padding: '24px', borderRadius: 12, border: '0.5px solid #e2e8f0', marginBottom: 20, fontFamily: "'Inter', sans-serif" }}>
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
              <button onClick={handleBack} disabled={isSubmitting} style={{
                padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                background: '#ffffff', border: '1px solid #e2e8f0', color: '#475569',
                cursor: 'pointer', transition: 'all 0.2s', fontFamily: "'Inter', sans-serif",
              }}>
                Back
              </button>
            )}
            <button onClick={handleSave} disabled={isSubmitting} style={{
              padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              background: '#ffffff', border: '1px solid #e2e8f0', color: '#475569',
              cursor: isSubmitting ? 'not-allowed' : 'pointer', marginLeft: 'auto', transition: 'all 0.2s',
              fontFamily: "'Inter', sans-serif",
            }}>
              {isSubmitting ? 'Saving...' : 'Save & Exit'}
            </button>
            {currentStep < totalSteps ? (
              <button onClick={handleNext} style={{
                padding: '8px 22px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                background: '#2563eb', border: 'none', color: '#ffffff',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                boxShadow: '0 4px 12px rgba(37,99,235,0.25)', transition: 'all 0.2s',
                fontFamily: "'Inter', sans-serif",
              }}>
                Next <span>→</span>
              </button>
            ) : (
              <button onClick={handleSave} disabled={isSubmitting} style={{
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