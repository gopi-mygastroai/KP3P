'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { PatientWithUser } from '@/types/assessment-form';
import { getErrorMessage } from '@/lib/get-error-message';

export default function PatientEditForm({ patient }: { patient: PatientWithUser }) {
  const router = useRouter();
  const [formData, setFormData] = useState<PatientWithUser>(patient);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const handleChange = (field: keyof PatientWithUser, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value } as PatientWithUser));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/patients/${patient.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error('Failed to update patient');

      router.push(`/admin/patient/${patient.id}`);
      router.refresh();
    } catch (error) {
      console.error(error);
      alert('Error saving data');
    } finally {
      setIsSaving(false);
    }
  };

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

  const getArrayValue = (field: keyof PatientWithUser): string[] => {
    try {
      const raw = formData[field];
      if (Array.isArray(raw)) return raw as string[];
      if (typeof raw === 'string') {
        const p = JSON.parse(raw || '[]') as unknown;
        return Array.isArray(p) ? p.map((x) => String(x)) : [];
      }
      return [];
    } catch {
      return [];
    }
  };

  const handleArrayChange = (field: keyof PatientWithUser, text: string) => {
    const arr = text.split(',').map((s) => s.trim()).filter((s) => s !== '');
    handleChange(field, JSON.stringify(arr));
  };

  const renderField = (label: string, field: keyof PatientWithUser, type = 'text', readOnly = false) => (
    <div className="pr-field">
      <label className="pr-field-label">{label}</label>
      {type === 'textarea' ? (
        <textarea
          value={String(formData[field] ?? '')}
          onChange={(e) => handleChange(field, e.target.value)}
          readOnly={readOnly}
          className="pr-input"
          rows={3}
        />
      ) : (
        <input
          type={type}
          value={String(formData[field] ?? '')}
          onChange={(e) => handleChange(field, e.target.value)}
          readOnly={readOnly}
          className={`pr-input ${readOnly ? 'read-only' : ''}`}
        />
      )}
    </div>
  );

  const renderArrayField = (label: string, field: keyof PatientWithUser) => {
    const val = getArrayValue(field).join(', ');
    return (
      <div className="pr-field" style={{ gridColumn: '1/-1' }}>
        <label className="pr-field-label">{label} <span style={{ textTransform: 'none', color: '#64748b' }}>(comma separated)</span></label>
        <textarea
          value={val}
          onChange={(e) => handleArrayChange(field, e.target.value)}
          className="pr-input"
          rows={2}
        />
      </div>
    );
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Syne:wght@400;600;700;800&family=Inter:wght@300;400;500&display=swap');

        .pr-root {
          min-height: 100vh;
          background: #f8fafc;
          color: #0f172a;
          font-family: 'Inter', sans-serif;
        }

        .pr-header-band {
          background: linear-gradient(135deg, #0891b2 0%, #a5f3fc 100%);
          border-bottom: none;
          padding: 28px 40px 24px;
          position: relative;
          overflow: hidden;
        }
        .pr-back-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          color: #3b82f6;
          text-decoration: none;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          margin-bottom: 20px;
          transition: color 0.2s;
          cursor: pointer;
          background: none; border: none;
        }
        .pr-back-link:hover { color: #93c5fd; }

        .pr-patient-name {
          font-family: 'Syne', sans-serif;
          font-size: 26px;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: -0.02em;
          line-height: 1.1;
        }

        .pr-body {
          max-width: 1100px;
          margin: 0 auto;
          padding: 36px 32px 80px;
          display: grid;
          grid-template-columns: 1fr;
          gap: 28px;
        }

        .pr-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 1px 6px rgba(0,0,0,0.05);
        }

        .pr-card-header {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 16px 22px;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
        }

        .pr-card-icon {
          width: 28px; height: 28px;
          border-radius: 7px;
          display: flex; align-items: center; justify-content: center;
          font-size: 13px;
          flex-shrink: 0;
        }

        .pr-card-title {
          font-family: 'Syne', sans-serif;
          font-size: 13px;
          font-weight: 700;
          color: #374151;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          flex: 1;
        }

        .pr-card-number {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          color: #334155;
          letter-spacing: 0.05em;
        }

        .pr-field-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          padding: 16px;
          gap: 16px;
        }
        @media (max-width: 600px) {
          .pr-field-grid { grid-template-columns: 1fr; }
        }

        .pr-field {
          display: flex;
          flex-direction: column;
        }

        .pr-field-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          margin-bottom: 6px;
        }

        .pr-input {
          background: #f8fafc;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          padding: 10px 14px;
          color: #0f172a;
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          transition: all 0.2s;
          width: 100%;
        }
        .pr-input:focus {
          outline: none;
          border-color: #0891b2;
          background: rgba(8,145,178,0.04);
          box-shadow: 0 0 0 2px rgba(8,145,178,0.1);
        }
        .pr-input.read-only {
          background: transparent;
          border-color: transparent;
          color: #94a3b8;
          padding-left: 0;
        }
        .pr-input.read-only:focus {
          box-shadow: none; border-color: transparent; background: transparent;
        }

        /* Vaccine Grid specific for editing */
        .pr-vaccine-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 16px;
          padding: 16px;
        }

        /* Action bar */
        .pr-action-bar {
          position: fixed;
          bottom: 0; left: 0; right: 0;
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
        .pr-action-bar-delete-wrap {
          margin-right: auto;
        }

        .btn-cancel {
          background: #ffffff;
          color: #475569;
          border: 1px solid #cbd5e1;
          padding: 10px 20px;
          border-radius: 8px;
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-cancel:hover { background: #f1f5f9; color: #0f172a; }

        .btn-save {
          background: #0d9488;
          color: #fff;
          border: none;
          padding: 10px 24px;
          border-radius: 8px;
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 12px rgba(13,148,136,0.25);
        }
        .btn-save:hover { background: #0f766e; transform: translateY(-1px); }
        .btn-save:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

        .btn-delete {
          background: #fff1f2;
          color: #be123c;
          border: 1px solid #fecdd3;
          padding: 10px 20px;
          border-radius: 8px;
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-delete:hover:not(:disabled) {
          background: #ffe4e6;
          border-color: #fda4af;
        }
        .btn-delete:disabled { opacity: 0.6; cursor: not-allowed; }

        .pr-delete-dialog-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 200;
          padding: 16px;
        }
        .pr-delete-dialog {
          background: #ffffff;
          border-radius: 16px;
          padding: 28px 24px;
          max-width: 400px;
          width: 100%;
          box-shadow: 0 20px 50px rgba(0,0,0,0.15);
        }
        .pr-delete-dialog h2 {
          font-family: 'Syne', sans-serif;
          font-size: 18px;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 10px;
        }
        .pr-delete-dialog p {
          font-size: 14px;
          color: #64748b;
          line-height: 1.55;
          margin: 0 0 20px;
        }
        .pr-delete-dialog-actions {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .pr-delete-dialog-actions button {
          padding: 10px 16px;
          border-radius: 9px;
          font-size: 14px;
          font-weight: 600;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
          border: none;
          width: 100%;
        }
        .pr-delete-dialog-cancel {
          background: #f8fafc;
          border: 1px solid #e2e8f0 !important;
          color: #475569;
        }
        .pr-delete-dialog-confirm {
          background: #dc2626;
          color: #ffffff;
        }
        .pr-delete-dialog-confirm:disabled { opacity: 0.7; cursor: not-allowed; }

        @media (max-width: 768px) {
          .pr-header-band { padding: 20px 24px; }
          .pr-body { padding: 20px 24px 80px; gap: 20px; }
          .pr-action-bar { padding: 12px 24px; }
        }
        @media (max-width: 480px) {
          .pr-header-band { padding: 16px; }
          .pr-body { padding: 16px 16px 80px; gap: 16px; }
          .pr-vaccine-grid { grid-template-columns: 1fr; }
          .pr-action-bar { padding: 12px 16px; flex-wrap: wrap; justify-content: flex-start; gap: 8px; }
          .btn-delete { width: 100%; order: 3; }
          .btn-cancel, .btn-save { flex: 1; text-align: center; min-width: 0; }
        }
      `}</style>

      <div className="pr-root">
        <div className="pr-header-band">
          <button onClick={() => router.push(`/admin/patient/${patient.id}`)} className="pr-back-link">
            ← Cancel Editing
          </button>
          <div>
            <h1 className="pr-patient-name">Editing: {patient.name}</h1>
          </div>
        </div>

        <div className="pr-body" style={{ paddingBottom: 100 }}>

          {/* 1. Patient Characteristics */}
          <div className="pr-card">
            <div className="pr-card-header">
              <div className="pr-card-icon" style={{ background: 'rgba(59,130,246,0.12)', color: '#3b82f6' }}>👤</div>
              <span className="pr-card-title">Patient Characteristics</span>
              <span className="pr-card-number">01</span>
            </div>
            <div className="pr-field-grid">
              {renderField('Full Name', 'name')}
              {renderField('Email', 'email', 'email')}
              {renderField('Medical Record No.', 'mrn')}
              {renderField('Contact Phone', 'contactPhone', 'tel')}
              {renderField('Place of Living', 'placeOfLiving')}
              {renderField('Referred By', 'referredBy')}
              {renderField('Date of Birth', 'dateOfBirth')}
              {renderField('Preferred Language', 'preferredLanguage')}
            </div>
          </div>

          {/* 2. Disease Characteristics */}
          <div className="pr-card">
            <div className="pr-card-header">
              <div className="pr-card-icon" style={{ background: 'rgba(168,85,247,0.12)', color: '#a855f7' }}>🧬</div>
              <span className="pr-card-title">Disease Characteristics</span>
              <span className="pr-card-number">02</span>
            </div>
            <div className="pr-field-grid">
              {renderField('Primary Diagnosis', 'primaryDiagnosis')}
              {renderField('Montreal Classification', 'montrealClass')}
              {renderField('Disease Duration', 'diseaseDuration')}
              {renderArrayField('Previous Surgeries', 'previousSurgeries')}
            </div>
          </div>

          {/* 3. Disease Activity */}
          <div className="pr-card">
            <div className="pr-card-header">
              <div className="pr-card-icon" style={{ background: 'rgba(234,179,8,0.12)', color: '#eab308' }}>📊</div>
              <span className="pr-card-title">Disease Activity & Symptoms</span>
              <span className="pr-card-number">03</span>
            </div>
            <div className="pr-field-grid">
              <div className="pr-field" style={{ gridColumn: '1/-1' }}>
                <label className="pr-field-label">Current Disease Activity (e.g. Remission, Mild, Moderate, Severe)</label>
                <select
                  value={formData.currentDiseaseActivity || ''}
                  onChange={(e) => handleChange('currentDiseaseActivity', e.target.value)}
                  className="pr-input"
                  style={{ appearance: 'none' }}
                >
                  <option value="">Select Activity...</option>
                  <option value="Remission">Remission</option>
                  <option value="Mild">Mild</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Severe">Severe</option>
                </select>
              </div>
              {renderField('Stool Frequency', 'stoolFrequency')}
              {renderField('Blood in Stool', 'bloodInStool')}
              {renderField('Abdominal Pain', 'abdominalPain')}
              {renderField('Impact on QoL', 'impactOnQoL')}
              {renderField('Weight Loss', 'weightLoss')}
            </div>
          </div>

          {/* 4. Labs & Investigations */}
          <div className="pr-card">
            <div className="pr-card-header">
              <div className="pr-card-icon" style={{ background: 'rgba(20,184,166,0.12)', color: '#14b8a6' }}>🔬</div>
              <span className="pr-card-title">Laboratory & Investigations</span>
              <span className="pr-card-number">04</span>
            </div>
            <div className="pr-field-grid">
              {renderField('Date of Most Recent Labs', 'dateMostRecentLabs', 'date')}
            </div>
          </div>

          {/* 5. Current Treatment */}
          <div className="pr-card">
            <div className="pr-card-header">
              <div className="pr-card-icon" style={{ background: 'rgba(59,130,246,0.12)', color: '#3b82f6' }}>⚕️</div>
              <span className="pr-card-title">Current Treatment</span>
              <span className="pr-card-number">05</span>
            </div>
            <div className="pr-field-grid">
              {renderField('Current IBD Medications', 'currentIbdMedications')}
              {renderField('Steroid Use', 'steroidUse')}
              {renderField('TDM Results', 'tdmResults')}
              <div className="pr-field">
                <label className="pr-field-label">Response to Treatment</label>
                <select
                  value={formData.responseToTreatment || ''}
                  onChange={(e) => handleChange('responseToTreatment', e.target.value)}
                  className="pr-input"
                  style={{ appearance: 'none' }}
                >
                  <option value="">Select Response...</option>
                  <option value="Complete">Complete</option>
                  <option value="Partial">Partial</option>
                  <option value="None">None</option>
                </select>
              </div>
              {renderField('Current Supplements', 'currentSupplements')}
            </div>
          </div>

          {/* 6. Treatment History */}
          <div className="pr-card">
            <div className="pr-card-header">
              <div className="pr-card-icon" style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}>💊</div>
              <span className="pr-card-title">Treatment History</span>
              <span className="pr-card-number">06</span>
            </div>
            <div className="pr-field-grid">
              {renderArrayField('Previous Treatments Tried', 'previousTreatmentsTried')}
              <div style={{ gridColumn: '1/-1' }}>{renderField('Failed Treatments Details', 'failedTreatments', 'textarea')}</div>
            </div>
          </div>

          {/* 7. Serology */}
          <div className="pr-card">
            <div className="pr-card-header">
              <div className="pr-card-icon" style={{ background: 'rgba(236,72,153,0.12)', color: '#ec4899' }}>🩸</div>
              <span className="pr-card-title">Infection Screening & Serology</span>
              <span className="pr-card-number">07</span>
            </div>
            <div className="pr-field-grid">
              {renderField('TB Screening', 'tbScreening')}
              {renderField('HBsAg', 'hepBSurfaceAg')}
              {renderField('HBsAb', 'hepBSurfaceAb')}
              {renderField('HBcAb', 'hepBCoreAb')}
              {renderField('Anti-HCV', 'antiHcv')}
              {renderField('Anti-HIV', 'antiHiv')}
            </div>
          </div>

          {/* 8. Vaccination */}
          <div className="pr-card">
            <div className="pr-card-header">
              <div className="pr-card-icon" style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e' }}>💉</div>
              <span className="pr-card-title">Vaccination History</span>
              <span className="pr-card-number">08</span>
            </div>
            <div className="pr-vaccine-grid">
              {renderField('Influenza', 'influenza')}
              {renderField('COVID-19', 'covid19')}
              {renderField('Pneumococcal', 'pneumococcal')}
              {renderField('Hepatitis B', 'hepatitisB')}
              {renderField('Hepatitis A', 'hepatitisA')}
              {renderField('Hepatitis E', 'hepatitisE')}
              {renderField('Zoster', 'zoster')}
              {renderField('MMR / Varicella', 'mmrVaricella')}
              {renderField('Tetanus (Tdap)', 'tetanusTdap')}
            </div>
          </div>

          {/* 9. Comorbidities & Final Details */}
          <div className="pr-card">
            <div className="pr-card-header">
              <div className="pr-card-icon" style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8' }}>📋</div>
              <span className="pr-card-title">Comorbidities & Final Details</span>
              <span className="pr-card-number">09</span>
            </div>
            <div className="pr-field-grid">
              {renderArrayField('Comorbidities', 'comorbidities')}
              <div style={{ gridColumn: '1/-1' }}>{renderField('Extraintestinal Manifestations', 'extraintestinalManif')}</div>
              {renderField('Pregnancy Planning', 'pregnancyPlanning')}
              {renderField('Occupation', 'occupation')}
              <div style={{ gridColumn: '1/-1' }}>{renderField('Special Considerations', 'specialConsiderations', 'textarea')}</div>
            </div>
          </div>

        </div>

        <div className="pr-action-bar">
          <div className="pr-action-bar-delete-wrap">
            <button
              type="button"
              className="btn-delete"
              onClick={() => {
                setDeleteError('');
                setShowDeleteDialog(true);
              }}
              disabled={isSaving || isDeleting}
            >
              Delete patient
            </button>
          </div>
          <button className="btn-cancel" onClick={() => router.push(`/admin/patient/${patient.id}`)} disabled={isSaving || isDeleting}>
            Cancel
          </button>
          <button className="btn-save" onClick={handleSave} disabled={isSaving || isDeleting}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {showDeleteDialog && (
          <div
            className="pr-delete-dialog-overlay"
            role="presentation"
            onClick={(e) => {
              if (e.target === e.currentTarget && !isDeleting) setShowDeleteDialog(false);
            }}
          >
            <div className="pr-delete-dialog" role="dialog" aria-modal="true" aria-labelledby="pr-delete-title">
              <h2 id="pr-delete-title">Delete this patient?</h2>
              <p>
                This permanently removes the record for <strong style={{ color: '#0f172a' }}>{patient.name}</strong> (ID #{patient.id}
                {patient.mrn ? `, MRN ${patient.mrn}` : ''}). This cannot be undone.
              </p>
              {deleteError ? (
                <p style={{ color: '#dc2626', fontSize: 13, marginTop: -8, marginBottom: 12 }} role="alert">
                  {deleteError}
                </p>
              ) : null}
              <div className="pr-delete-dialog-actions">
                <button
                  type="button"
                  className="pr-delete-dialog-confirm"
                  onClick={() => void handleDeleteConfirm()}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting…' : 'Yes, delete patient'}
                </button>
                <button
                  type="button"
                  className="pr-delete-dialog-cancel"
                  onClick={() => !isDeleting && setShowDeleteDialog(false)}
                  disabled={isDeleting}
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
