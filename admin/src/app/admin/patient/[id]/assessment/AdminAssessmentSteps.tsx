import React from 'react';
import type { AssessmentFormState, AssessmentUpdateFn } from '@/types/assessment-form';
import { getErrorMessage } from '@/lib/get-error-message';

const inter = "'Inter', sans-serif";

function formValue(data: AssessmentFormState, key: string): unknown {
  return (data as Record<string, unknown>)[key];
}

type StepComponentProps = {
  data: AssessmentFormState;
  updateData: AssessmentUpdateFn;
};

// ── Shared field wrapper ──────────────────────────────────────────────
const FieldBox = ({
  label,
  children,
  required = false,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <label style={{
      fontSize: 11, fontWeight: 700, letterSpacing: '0.07em',
      textTransform: 'uppercase', color: '#475569', fontFamily: inter,
    }}>
      {label}
      {required && <span style={{ color: '#dc2626', marginLeft: 4 }}>*</span>}
    </label>
    {children}
  </div>
);

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  fontSize: 14,
  fontWeight: 500,
  fontFamily: inter,
  color: '#0f172a',
  background: '#ffffff',
  border: '1px solid #cbd5e1',
  borderRadius: 10,
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s',
};

/** Narrower date pickers for investigations step (labs / colonoscopy). */
const investigationDateInputStyle: React.CSSProperties = {
  ...inputStyle,
  width: '100%',
  maxWidth: 200,
};

// ── Helpers ───────────────────────────────────────────────────────────
export const textInput = (
  name: string,
  label: string,
  type: string = 'text',
  data: AssessmentFormState,
  updateData: AssessmentUpdateFn,
  required: boolean = false,
) => (
  <FieldBox key={name} label={label} required={required}>
    <input
      type={type}
      style={inputStyle}
      required={required}
      value={(() => {
        const v = formValue(data, name);
        return v === '' || v == null ? '' : String(v);
      })()}
      onChange={(e) => {
        const raw = e.target.value;
        if (type === 'number') {
          updateData({ [name]: raw === '' ? '' : Number(raw) });
        } else {
          updateData({ [name]: raw });
        }
      }}
      onFocus={(e) => (e.target.style.borderColor = '#0891b2')}
      onBlur={(e) => (e.target.style.borderColor = '#cbd5e1')}
    />
  </FieldBox>
);

export const textArea = (
  name: string,
  label: string,
  data: AssessmentFormState,
  updateData: AssessmentUpdateFn,
  required: boolean = false,
  helpText?: string,
  helpExample?: string,
) => (
  <FieldBox key={name} label={label} required={required}>
    <textarea
      style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }}
      rows={3}
      required={required}
      value={String(formValue(data, name) ?? '')}
      onChange={(e) => updateData({ [name]: e.target.value })}
      onFocus={(e) => (e.target.style.borderColor = '#0891b2')}
      onBlur={(e) => (e.target.style.borderColor = '#cbd5e1')}
    />
    {helpText && (
      <p style={{ fontSize: 11, color: '#64748b', margin: '8px 0 0', fontFamily: inter, lineHeight: 1.45 }}>
        {helpText}
      </p>
    )}
    {helpExample && (
      <p style={{ fontSize: 11, color: '#64748b', margin: '6px 0 0', fontFamily: inter, lineHeight: 1.45 }}>
        {helpExample}
      </p>
    )}
  </FieldBox>
);

export const radioGroup = (
  name: string,
  label: string,
  options: string[],
  data: AssessmentFormState,
  updateData: AssessmentUpdateFn,
  required: boolean = false,
) => (
  <div key={name} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
    <label style={{
      fontSize: 11, fontWeight: 700, letterSpacing: '0.07em',
      textTransform: 'uppercase', color: '#475569', fontFamily: inter,
    }}>
      {label}
      {required && <span style={{ color: '#dc2626', marginLeft: 4 }}>*</span>}
    </label>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {options.map((opt, i) => {
        const isSelected = formValue(data, name) === opt;
        return (
          <label key={opt} style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '8px 14px', borderRadius: 10, cursor: 'pointer',
            border: `1px solid ${isSelected ? '#0891b2' : '#cbd5e1'}`,
            background: isSelected ? '#ecfeff' : '#ffffff',
            fontFamily: inter, fontSize: 13, fontWeight: 600,
            color: isSelected ? '#0e7490' : '#374151',
            transition: 'all 0.15s',
          }}>
            <input
              type="radio"
              name={name}
              value={opt}
              checked={isSelected}
              required={required && i === 0}
              onChange={(e) => updateData({ [name]: e.target.value })}
              style={{ accentColor: '#0891b2', width: 14, height: 14 }}
            />
            {opt}
          </label>
        );
      })}
    </div>
  </div>
);

export const checkboxGroup = (
  name: string,
  label: string,
  options: string[],
  data: AssessmentFormState,
  updateData: AssessmentUpdateFn,
  required: boolean = false,
) => {
  const raw = formValue(data, name);
  const selected = Array.isArray(raw) ? (raw as string[]) : [];
  const handleToggle = (opt: string) => {
    if (selected.includes(opt)) {
      updateData({ [name]: selected.filter((item: string) => item !== opt) });
    } else {
      updateData({ [name]: [...selected, opt] });
    }
  };

  return (
    <div key={name} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <label style={{
        fontSize: 11, fontWeight: 700, letterSpacing: '0.07em',
        textTransform: 'uppercase', color: '#475569', fontFamily: inter,
      }}>
        {label}
        {required && <span style={{ color: '#dc2626', marginLeft: 4 }}>*</span>}
      </label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {options.map((opt) => {
          const isSelected = selected.includes(opt);
          return (
            <label key={opt} style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '8px 14px', borderRadius: 10, cursor: 'pointer',
              border: `1px solid ${isSelected ? '#0891b2' : '#cbd5e1'}`,
              background: isSelected ? '#ecfeff' : '#ffffff',
              fontFamily: inter, fontSize: 13, fontWeight: 600,
              color: isSelected ? '#0e7490' : '#374151',
              transition: 'all 0.15s',
            }}>
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => handleToggle(opt)}
                style={{ accentColor: '#0891b2', width: 14, height: 14 }}
              />
              {opt}
            </label>
          );
        })}
      </div>
    </div>
  );
};

// ── Grid wrapper ──────────────────────────────────────────────────────
const Grid2 = ({ children }: { children: React.ReactNode }) => (
  <div
    className="aw-grid-2"
    style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
      gap: '20px 24px',
      marginBottom: 20,
    }}
  >
    {children}
  </div>
);

/** Single-column stack (e.g. Screening step full width). */
const ColumnStack = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
    {children}
  </div>
);

const Grid3 = ({ children }: { children: React.ReactNode }) => (
  <div
    className="aw-grid-3"
    style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
      gap: '20px 24px',
      marginBottom: 20,
    }}
  >
    {children}
  </div>
);

const Divider = ({ label }: { label: string }) => (
  <h3 style={{
    fontSize: 14, fontWeight: 700, color: '#0891b2',
    fontFamily: inter, marginBottom: 14, marginTop: 8,
    paddingBottom: 8, borderBottom: '1px solid #e2e8f0',
  }}>
    {label}
  </h3>
);

// ── Steps ─────────────────────────────────────────────────────────────
export const AdminStep1 = ({ data, updateData }: StepComponentProps) => {
  const handleDobUpdate = (fields: Record<string, unknown>) => {
    updateData(fields);
    const dobRaw = fields.dateOfBirth;
    if (typeof dobRaw === 'string' && dobRaw.trim() !== '') {
      const dob = new Date(dobRaw);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
      updateData({ currentAge: Math.max(0, age) });
    }
  };

  return (
    <div>
      <Grid2>
        {textInput('name', 'Name', 'text', data, updateData, true)}
        {textInput('email', 'Email', 'email', data, updateData, true)}
        {textInput('mrn', 'ID / MRN', 'text', data, updateData, true)}
        {textInput('contactPhone', 'Contact Phone', 'text', data, updateData, true)}
        {textInput('placeOfLiving', 'Place of Living', 'text', data, updateData, true)}
        {textInput('referredBy', 'Referred By', 'text', data, updateData, true)}
        {textInput('dateOfBirth', 'Date of Birth', 'date', data, handleDobUpdate, true)}
        {textInput('currentAge', 'Current Age', 'number', data, updateData, true)}
        <div style={{ minWidth: 0 }}>
          {radioGroup('sex', 'Sex', ['Male', 'Female', 'Other'], data, updateData, true)}
        </div>
        {textInput('ageAtDiagnosis', 'Age at Diagnosis', 'number', data, updateData, true)}
      </Grid2>
      <div style={{ marginTop: 20 }}>
        {textInput('occupation', 'Occupation', 'text', data, updateData)}
      </div>
      <div style={{ marginTop: 20 }}>
        {radioGroup('smokingStatus', 'Smoking Status', ['Current smoker', 'Ex smoker', 'Never smoked'], data, updateData, true)}
      </div>
      {(data.smokingStatus === 'Current smoker' ||
        data.smokingStatus === 'Ex smoker' ||
        data.smokingStatus === 'Current' ||
        data.smokingStatus === 'Former') && (
        <div style={{ marginTop: 20 }}>
          {textArea(
            'smokingDetails',
            'Smoking amount (e.g. packs per day, cigarettes/day, pack-years)',
            data,
            updateData,
            true,
          )}
        </div>
      )}
      <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
        {radioGroup('preferredLanguage', "Patient's Preferred Language for Care Plan", [
          'English',
          'Telugu',
          'Hindi',
          'Tamil',
          'Kannada',
          'Bengali',
          'Malayalam',
          'Marathi',
          'Punjabi',
        ], data, updateData)}
        {textArea('specialConsiderations', 'Special Considerations (Travel, Dietary, etc.)', data, updateData)}
      </div>
    </div>
  );
};

type VaccineDose = { date?: string; dosage?: string };

// Parses vaccine field which may be a JSON object {status, doses} or plain string
const parseVaccine = (val: unknown): { status: string; doses: VaccineDose[] } => {
  if (val == null || val === '') return { status: '', doses: [] };
  if (typeof val === 'object' && !Array.isArray(val)) {
    const o = val as Record<string, unknown>;
    const status = typeof o.status === 'string' ? o.status : '';
    const d = o.doses;
    const doses = Array.isArray(d)
      ? d.filter((x): x is VaccineDose => x !== null && typeof x === 'object' && !Array.isArray(x)).map((x) => {
          const row = x as Record<string, unknown>;
          return {
            date: typeof row.date === 'string' ? row.date : undefined,
            dosage: typeof row.dosage === 'string' ? row.dosage : undefined,
          };
        })
      : [];
    return { status, doses };
  }
  if (typeof val === 'string') {
    try {
      return parseVaccine(JSON.parse(val) as unknown);
    } catch {
      return { status: val, doses: [] };
    }
  }
  return { status: '', doses: [] };
};

const VaccineInput = ({
  name,
  label,
  data,
  updateData,
}: {
  name: string;
  label: string;
  data: AssessmentFormState;
  updateData: AssessmentUpdateFn;
}) => {
  const vaccine = parseVaccine(formValue(data, name));
  const statusOptions = ['Given', 'Never', 'Unknown'];

  const updateVaccine = (patch: Partial<typeof vaccine>) => {
    updateData({ [name]: { ...vaccine, ...patch } });
  };

  const updateDoseField = (i: number, field: keyof VaccineDose, value: string) => {
    const doses = [...(vaccine.doses || [])];
    doses[i] = { ...doses[i], [field]: value };
    updateVaccine({ doses });
  };

  const addDose = () => {
    updateVaccine({ doses: [...(vaccine.doses || []), { date: '', dosage: '' }] });
  };

  const removeDose = (i: number) => {
    const doses = vaccine.doses.filter((_d: VaccineDose, idx: number) => idx !== i);
    updateVaccine({ doses });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#64748b', fontFamily: inter }}>
        {label}
      </label>
      {/* Status selector */}
      <div style={{ display: 'flex', gap: 6 }}>
        {statusOptions.map((opt) => {
          const isSelected = vaccine.status?.toLowerCase() === opt.toLowerCase();
          return (
            <button key={opt} type="button" onClick={() => updateVaccine({ status: opt.toLowerCase() })} style={{
              flex: 1, padding: '7px 4px', fontSize: 12, fontWeight: 600, fontFamily: inter,
              borderRadius: 8, border: `1px solid ${isSelected ? '#0891b2' : '#cbd5e1'}`,
              background: isSelected ? '#ecfeff' : '#ffffff',
              color: isSelected ? '#0e7490' : '#64748b', cursor: 'pointer',
            }}>
              {opt}
            </button>
          );
        })}
      </div>
      {/* Dose date + dosage (matches patient intake Step8Vaccination) — only if Given */}
      {vaccine.status?.toLowerCase() === 'given' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {(vaccine.doses || []).map((dose: VaccineDose, i: number) => (
            <div
              key={i}
              style={{
                display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'flex-end',
                padding: '10px 10px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fafafa',
              }}
            >
              <div style={{ flex: '1 1 140px', minWidth: 0 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#64748b', fontFamily: inter, letterSpacing: '0.06em' }}>DATE</span>
                <input
                  type="date"
                  value={dose.date ? String(dose.date).substring(0, 10) : ''}
                  onChange={(e) => updateDoseField(i, 'date', e.target.value)}
                  style={{ ...inputStyle, fontSize: 12, padding: '7px 10px', width: '100%', marginTop: 4 }}
                />
              </div>
              <div style={{ flex: '2 1 200px', minWidth: 0 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#64748b', fontFamily: inter, letterSpacing: '0.06em' }}>DOSAGE / BRAND / TYPE</span>
                <input
                  type="text"
                  value={dose.dosage ?? ''}
                  onChange={(e) => updateDoseField(i, 'dosage', e.target.value)}
                  placeholder="e.g. 0.5 mL IM"
                  style={{ ...inputStyle, fontSize: 12, padding: '7px 10px', width: '100%', marginTop: 4 }}
                />
              </div>
              <button type="button" onClick={() => removeDose(i)} style={{
                background: '#fff1f2', border: '1px solid #fecdd3', color: '#e11d48',
                borderRadius: 7, padding: '8px 10px', fontSize: 12, cursor: 'pointer', fontFamily: inter, flexShrink: 0,
              }}>✕</button>
            </div>
          ))}
          <button type="button" onClick={addDose} style={{
            marginTop: 2, padding: '6px 10px', fontSize: 11, fontWeight: 600,
            background: '#f0fdfa', border: '1px solid #99f6e4', color: '#0f766e',
            borderRadius: 7, cursor: 'pointer', fontFamily: inter, textAlign: 'left',
          }}>
            + Add dose
          </button>
        </div>
      )}
    </div>
  );
};

const vaccineFields = [
  { name: 'influenza', label: 'Influenza' },
  { name: 'covid19', label: 'COVID-19' },
  { name: 'pneumococcal', label: 'Pneumococcal' },
  { name: 'hepatitisB', label: 'Hepatitis B' },
  { name: 'hepatitisA', label: 'Hepatitis A' },
  { name: 'hepatitisE', label: 'Hepatitis E' },
  { name: 'zoster', label: 'Zoster' },
  { name: 'mmrVaricella', label: 'MMR / Varicella' },
  { name: 'tetanusTdap', label: 'Tetanus / Tdap' },
];

export const AdminStep2 = ({ data, updateData }: StepComponentProps) => (
  <div>
    <Grid3>
      {vaccineFields.map(({ name, label }) => (
        <VaccineInput key={name} name={name} label={label} data={data} updateData={updateData} />
      ))}
    </Grid3>
  </div>
);

type AssessmentDocumentRow = {
  name?: string;
  url?: string;
  originalName?: string;
  fileId?: string;
};

export const AdminStep3 = ({ data, updateData }: StepComponentProps) => {
  const [uploading, setUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const documents = Array.isArray(data.documents) ? data.documents : [];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setUploading(true);
    setUploadError('');

    try {
      const uploaded: { name: string; url: string; originalName?: string; fileId?: string }[] = [];

      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('patientName', String(data.name || ''));
        formData.append('mrn', String(data.mrn || ''));

        const res = await fetch('/api/drive/upload', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) throw new Error(`Failed to upload ${file.name}`);
        const json = await res.json();
        uploaded.push({
          name: json.driveFileName || file.name,
          originalName: file.name,
          url: json.webViewLink || json.url,
          fileId: json.fileId,
        });
      }

      updateData({ documents: [...documents, ...uploaded] });
    } catch (err: unknown) {
      setUploadError(getErrorMessage(err) || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeDocument = (i: number) => {
    updateData({ documents: documents.filter((_doc: AssessmentDocumentRow, idx: number) => idx !== i) });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Divider label="Documents" />

      {/* Upload button */}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600,
            background: uploading ? '#f1f5f9' : '#ecfeff',
            border: `1px solid ${uploading ? '#cbd5e1' : '#67e8f9'}`,
            color: uploading ? '#94a3b8' : '#0891b2',
            cursor: uploading ? 'not-allowed' : 'pointer',
            fontFamily: inter, transition: 'all 0.15s',
          }}
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          {uploading ? 'Uploading...' : 'Upload Documents'}
        </button>
        <p style={{ fontSize: 11, color: '#94a3b8', fontFamily: inter, marginTop: 6 }}>
          Supported: PDF, JPG, PNG, DOC, DOCX
        </p>
        {uploadError && (
          <p style={{ fontSize: 12, color: '#e11d48', fontFamily: inter, marginTop: 4 }}>{uploadError}</p>
        )}
      </div>

      {/* Document list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {documents.length === 0 ? (
          <div style={{
            background: '#f8fafc', border: '1px dashed #cbd5e1',
            borderRadius: 12, padding: '32px 24px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
          }}>
            <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="#cbd5e1" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p style={{ fontSize: 13, color: '#94a3b8', fontFamily: inter, margin: 0 }}>No documents yet. Upload one above.</p>
          </div>
        ) : (
          documents.map((doc: AssessmentDocumentRow, i: number) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: '#ffffff', border: '1px solid #e2e8f0',
              borderRadius: 10, padding: '12px 16px',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 8, background: '#f0fdfa',
                border: '1px solid #99f6e4',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#0891b2" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', fontFamily: inter, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {doc.name || `Document ${i + 1}`}
                </p>
                {doc.url && (
                  <a href={doc.url} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: '#0891b2', fontFamily: inter, fontWeight: 500 }}>
                    View →
                  </a>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeDocument(i)}
                style={{
                  background: '#fff1f2', border: '1px solid #fecdd3', color: '#e11d48',
                  borderRadius: 7, padding: '5px 10px', fontSize: 12,
                  cursor: 'pointer', fontFamily: inter, flexShrink: 0,
                }}
              >
                Remove
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Must match mygastro-patient Step2DiseaseChar so imported values show as selected.
const PATIENT_PRIMARY_DIAGNOSIS = ['Ulcerative Colitis', "Crohn's Disease", 'IBD-U'] as const;
const PATIENT_DISEASE_DURATIONS = [
  '<3 months',
  '3–12 months',
  '1–2 years',
  '2–5 years',
  '5–10 years',
  '>10 years',
] as const;

export const AdminStep4 = ({ data, updateData }: StepComponentProps) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
    <Grid2>
      {radioGroup('primaryDiagnosis', 'Primary Diagnosis', [...PATIENT_PRIMARY_DIAGNOSIS], data, updateData, true)}
      {radioGroup('diseaseDuration', 'Disease Duration', [...PATIENT_DISEASE_DURATIONS], data, updateData, true)}
    </Grid2>
    {data.primaryDiagnosis === "Crohn's Disease" && (
      <FieldBox label="Perianal Disease Assessment">
        <textarea
          style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }}
          rows={3}
          value={data.perianalDiseaseAssessment || ''}
          onChange={(e) => updateData({ perianalDiseaseAssessment: e.target.value })}
          onFocus={(e) => (e.target.style.borderColor = '#0891b2')}
          onBlur={(e) => (e.target.style.borderColor = '#cbd5e1')}
        />
        <p style={{ fontSize: 11, color: '#64748b', margin: '6px 0 0', fontFamily: inter, lineHeight: 1.45 }}>
          Describe fistulas, abscesses, drainage, MRI findings if applicable
        </p>
      </FieldBox>
    )}
    {textInput('montrealClass', 'Montreal Classification (UC: E1/E2/E3 | CD: L1-4, B1-3)', 'text', data, updateData, true)}
    {checkboxGroup('previousSurgeries', 'Previous IBD Surgeries', ['None', 'Partial Colectomy', 'Total Colectomy', 'Ileo Caecal resection', 'Perianal surgery', 'Stricturoplasty', 'Ostomy', 'Segmental resection'], data, updateData, true)}
  </div>
);

export const AdminStep5 = ({ data, updateData }: StepComponentProps) => (
  <div>
    <Grid2>
      {radioGroup('currentDiseaseActivity', 'Current Disease Activity Level', ['Remission', 'Mild', 'Moderate', 'Severe'], data, updateData, true)}
      <FieldBox label="Activity Score (Short answer)">
        <input
          type="text"
          style={inputStyle}
          value={data.activityScore || ''}
          onChange={(e) => updateData({ activityScore: e.target.value })}
          onFocus={(e) => (e.target.style.borderColor = '#0891b2')}
          onBlur={(e) => (e.target.style.borderColor = '#cbd5e1')}
        />
        <p style={{ fontSize: 11, color: '#64748b', margin: 0, fontFamily: inter }}>
          Mayo score (UC) or Harvey-Bradshaw/CDAI (CD)
        </p>
      </FieldBox>
      {radioGroup('stoolFrequency', 'Frequency of Stools (per day)', ['Normal', '1-3', '4-6', '>6'], data, updateData, true)}
      {radioGroup('bloodInStool', 'Blood in Stool', ['None', 'Trace', 'Frequently visible', 'Mostly Blood'], data, updateData)}
      {radioGroup('abdominalPain', 'Abdominal Pain', ['None', 'Mild', 'Moderate', 'Severe'], data, updateData)}
      {radioGroup('impactOnQoL', 'Impact on Quality of Life', ['None', 'Mild', 'Moderate', 'Severe'], data, updateData)}
      {radioGroup('weightLoss', 'Weight Loss', ['Yes', 'No'], data, updateData)}
    </Grid2>
  </div>
);

export const AdminStep6 = ({ data, updateData }: StepComponentProps) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
    <FieldBox label="Date of Most Recent Labs" required>
      <input
        type="date"
        required
        style={investigationDateInputStyle}
        value={data.dateMostRecentLabs || ''}
        onChange={(e) => updateData({ dateMostRecentLabs: e.target.value })}
        onFocus={(e) => (e.target.style.borderColor = '#0891b2')}
        onBlur={(e) => (e.target.style.borderColor = '#cbd5e1')}
      />
    </FieldBox>
    <FieldBox label="Recent Lab Values" required>
      <input
        type="text"
        required
        style={inputStyle}
        value={data.recentLabValues || ''}
        onChange={(e) => updateData({ recentLabValues: e.target.value })}
        onFocus={(e) => (e.target.style.borderColor = '#0891b2')}
        onBlur={(e) => (e.target.style.borderColor = '#cbd5e1')}
      />
      <p style={{ fontSize: 11, color: '#64748b', margin: 0, fontFamily: inter }}>
        Fill in: Hb, TLC, Platelets, CRP, Albumin, ESR, SGOT, SGPT, T bilirubin, Creatinine (whichever available in same order)
      </p>
    </FieldBox>
    <FieldBox label="Date of Most Recent Colonoscopy" required>
      <input
        type="date"
        required
        style={investigationDateInputStyle}
        value={data.dateMostRecentColonoscopy || ''}
        onChange={(e) => updateData({ dateMostRecentColonoscopy: e.target.value })}
        onFocus={(e) => (e.target.style.borderColor = '#0891b2')}
        onBlur={(e) => (e.target.style.borderColor = '#cbd5e1')}
      />
    </FieldBox>
    <FieldBox label="Colonoscopy Findings" required>
      <input
        type="text"
        required
        style={inputStyle}
        value={data.colonoscopyFindings || ''}
        onChange={(e) => updateData({ colonoscopyFindings: e.target.value })}
        onFocus={(e) => (e.target.style.borderColor = '#0891b2')}
        onBlur={(e) => (e.target.style.borderColor = '#cbd5e1')}
      />
      <p style={{ fontSize: 11, color: '#64748b', margin: 0, fontFamily: inter }}>
        Mayo endoscopic score (UC) or SES-CD (CD), ulcers, strictures, fistulas. Example - Mayo 2, moderate inflammation sigmoid/rectum, no ulcers
      </p>
    </FieldBox>
    <FieldBox label="Recent Imaging" required>
      <input
        type="text"
        required
        style={inputStyle}
        value={data.recentImaging || ''}
        onChange={(e) => updateData({ recentImaging: e.target.value })}
        onFocus={(e) => (e.target.style.borderColor = '#0891b2')}
        onBlur={(e) => (e.target.style.borderColor = '#cbd5e1')}
      />
      <p style={{ fontSize: 11, color: '#64748b', margin: 0, fontFamily: inter }}>
        MRE, CT enterography, pelvic MRI - date and key findings
      </p>
    </FieldBox>
    <FieldBox label="Most Recent DEXA Scan">
      <input
        type="text"
        style={inputStyle}
        value={data.mostRecentDexaScan || ''}
        onChange={(e) => updateData({ mostRecentDexaScan: e.target.value })}
        onFocus={(e) => (e.target.style.borderColor = '#0891b2')}
        onBlur={(e) => (e.target.style.borderColor = '#cbd5e1')}
      />
      <p style={{ fontSize: 11, color: '#64748b', margin: 0, fontFamily: inter }}>
        T-score and date if done
      </p>
    </FieldBox>
  </div>
);

export const AdminStep7 = ({ data, updateData }: StepComponentProps) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
    {textArea(
      'currentIbdMedications',
      'Current IBD Medications with Duration',
      data,
      updateData,
      true,
      'For EACH medication: Name, dose, frequency, how long on this treatment',
      'Placeholder: Example - Adalimumab 40mg SC q2weeks (started 18 months ago, dose increased 6 months ago)',
    )}
    {radioGroup(
      'responseToTreatment',
      'Response to Current Treatment',
      [
        'Excellent response (Remission)',
        'Partial response (improved but no remission)',
        'No response',
        'Secondary loss of response (worked initially but now failing)',
        'Not applicable (Not yet on treatment)',
      ],
      data,
      updateData,
      true,
    )}
    {textArea(
      'tdmResults',
      'Therapeutic Drug Monitoring Results',
      data,
      updateData,
      false,
      'If on biologics - drug levels, anti-drug antibodies, date',
    )}
    {textArea('currentSupplements', 'Current Vitamin D / Calcium Supplementation', data, updateData)}
    <Grid2>
      {radioGroup('steroidUse', 'Current or Recent Steroid Use', [
        'Not on steroids',
        'Currently on (less than 3 months)',
        'Currently on steroids (more than 3 months)',
        'Recently stopped (less than 3 months ago)',
        'Steroid dependent (multiple courses)',
      ], data, updateData)}
    </Grid2>
  </div>
);

const PREVIOUS_IBD_TREATMENTS_OPTIONS = [
  'None (treatment-naive)',
  '5-ASA (mesalamine, sulfasalazine)',
  'Corticosteroids (prednisone, budesonide)',
  'Azathioprine / 6-Mercaptopurine',
  'Methotrexate',
  'Infliximab (Remicade / Infimab / Inflixirel)',
  'Adalimumab (Exemptia / Adfrar / Plamimumab / Mabura)',
  'Vedolizumab',
  'Ustekinumab',
  'Tofacitinib',
  'Upadacitinib',
  'Other',
] as const;

export const AdminStep8 = ({ data, updateData }: StepComponentProps) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
    {checkboxGroup('previousTreatmentsTried', 'Previous IBD Treatments Tried', [...PREVIOUS_IBD_TREATMENTS_OPTIONS], data, updateData, true)}
    {textArea(
      'failedTreatments',
      'Details of Failed Treatments',
      data,
      updateData,
      false,
      'For each failed medication - drug name, duration tried, reason for failure',
      'Placeholder: Example - Infliximab 18 months, secondary loss of response. Adalimumab 3 months, injection site reactions',
    )}
  </div>
);

export const AdminStep9 = ({ data, updateData }: StepComponentProps) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
    <ColumnStack>
      {radioGroup('tbScreening', 'TB Screening Status', [
        'Not done',
        'Done - Negative (IGRA or TST)',
        'Done - Positive, treated',
        'Done - Positive, not treated',
        'Unknown',
      ], data, updateData, true)}
      {radioGroup('hepBSurfaceAg', 'Hepatitis B Surface Antigen', [
        'Not tested',
        'Negative',
        'Positive',
        'Unknown',
      ], data, updateData, true)}
      {radioGroup('hepBSurfaceAb', 'Hepatitis B Surface Antibody', [
        'Not tested',
        'Positive (Immune)',
        'Negative (Not immune)',
        'Unknown',
      ], data, updateData)}
      {radioGroup('hepBCoreAb', 'Hepatitis B Core Antibody', [
        'Not tested',
        'Negative',
        'Positive (Past infection)',
        'Unknown',
      ], data, updateData)}
      {radioGroup('antiHcv', 'Anti HCV', [
        'Not tested',
        'Negative',
        'Positive',
        'Unknown',
      ], data, updateData)}
      {radioGroup('antiHiv', 'Anti HIV', [
        'Not tested',
        'Negative',
        'Positive',
        'Unknown',
      ], data, updateData)}
    </ColumnStack>
    {checkboxGroup('comorbidities', 'Comorbidities', [
      'None',
      'Type 2 Diabetes',
      'Hypertension',
      'Heart disease',
      'CKD',
      'Liver disease',
      'Osteoporosis / Osteopenia',
      'History of cancer (specify type in notes)',
      'Depression/Anxiety',
      'Other',
    ], data, updateData, true)}
    <ColumnStack>
      {radioGroup('extraintestinalManif', 'Extraintestinal Manifestations', [
        'None',
        'Uveitis / eye problems',
        'Arthralgia / Arthritis',
        'Erythema nodosum',
        'Pyoderma Gangrenosum',
        'Primary Sclerosing cholangitis',
      ], data, updateData, true)}
      {radioGroup('pregnancyPlanning', 'Pregnancy / Family Planning Status', [
        'Not applicable (male/post-menopausal)',
        'Not planning for pregnancy',
        'Planning pregnancy within next year',
        'Currently pregnant',
        'Currently breast feeding',
      ], data, updateData, true)}
    </ColumnStack>
  </div>
);
