'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { AdminStep1 } from '@/app/admin/patient/[id]/assessment/AdminAssessmentSteps';
import { buildAssessmentFormState } from '@/lib/build-assessment-form-state';
import { seedEmptyPatientForAdminForm } from '@/lib/seed-empty-patient-for-admin-form';
import { validateAdminPatientBasicInfo } from '@/lib/admin-patient-basic-info';
import type { AssessmentFormState, AssessmentUpdateFn } from '@/types/assessment-form';
import { getErrorMessage } from '@/lib/get-error-message';

export default function AddPatientBasicForm() {
  const router = useRouter();
  const [formData, setFormData] = useState<AssessmentFormState>(() =>
    buildAssessmentFormState(seedEmptyPatientForAdminForm()),
  );
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const updateData: AssessmentUpdateFn = (fields) => {
    setFormData((prev) => ({ ...prev, ...fields }) as AssessmentFormState);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const body = { ...(formData as unknown as Record<string, unknown>) };
    const v = validateAdminPatientBasicInfo(body);
    if (!v.ok) {
      setError(v.error);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'same-origin',
      });
      const data: unknown = await res.json().catch(() => null);
      if (!res.ok) {
        const msg =
          data && typeof data === 'object' && data !== null && 'error' in data && typeof (data as { error: unknown }).error === 'string'
            ? (data as { error: string }).error
            : 'Could not create patient';
        setError(msg);
        setSubmitting(false);
        return;
      }
      if (!data || typeof data !== 'object' || !('patientId' in data) || typeof (data as { patientId: unknown }).patientId !== 'number') {
        setError('Invalid response from server');
        setSubmitting(false);
        return;
      }
      router.push(`/admin/patient/${(data as { patientId: number }).patientId}/assessment`);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa', fontFamily: "'Inter', sans-serif" }}>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
          padding: '12px 24px',
          background: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
        }}
      >
        <Link href="/admin" style={{ display: 'inline-flex', alignItems: 'center', borderRadius: 8 }}>
          <Image src="/mygastro-logo.png" alt="myGastro.AI" width={200} height={36} style={{ width: 'auto', height: 32, objectFit: 'contain' }} />
        </Link>
        <Link
          href="/admin"
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: '#475569',
            textDecoration: 'none',
            padding: '8px 14px',
            borderRadius: 8,
            border: '1px solid #e2e8f0',
            background: '#fff',
          }}
        >
          ← Back to dashboard
        </Link>
      </header>

      <main style={{ maxWidth: 900, margin: '0 auto', padding: '28px 20px 48px' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Add patient</h1>
        <p style={{ fontSize: 14, color: '#64748b', marginBottom: 24, lineHeight: 1.5 }}>
          Enter basic information first. A patient record is created only after this step is complete; you will then continue the full assessment.
        </p>

        <form
          onSubmit={handleSubmit}
          style={{
            background: '#ffffff',
            padding: 24,
            borderRadius: 12,
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
          }}
        >
          <AdminStep1 data={formData} updateData={updateData} />
          {error ? (
            <p style={{ color: '#dc2626', fontSize: 13, marginTop: 16 }} role="alert">
              {error}
            </p>
          ) : null}
          <div style={{ marginTop: 24, display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'flex-end' }}>
            <Link
              href="/admin"
              style={{
                padding: '10px 18px',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                border: '1px solid #e2e8f0',
                background: '#fff',
                color: '#475569',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                minHeight: 44,
                boxSizing: 'border-box',
              }}
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '10px 22px',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 700,
                border: 'none',
                background: '#0d9488',
                color: '#fff',
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.85 : 1,
                minHeight: 44,
                fontFamily: 'inherit',
              }}
            >
              {submitting ? 'Creating…' : 'Create patient & continue to assessment'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
