'use client';

import { FormData, VaccineEntry, VaccineDose } from '@/lib/formSchema';

interface Props {
  formData: FormData;
  onChange: (f: string, v: any) => void;
  errors: Record<string, string>;
}

type VaxField = keyof FormData;

interface VaccineConfig {
  field: VaxField;
  label: string;
  hint: string;
  typicalDoses: number;
  dosageHint: string;
  icon: string;
}

const VACCINES: VaccineConfig[] = [
  {
    field: 'influenza', label: 'Influenza (Flu) Vaccine',
    hint: 'Annual flu vaccination — record each yearly dose',
    typicalDoses: 1, icon: '💉',
    dosageHint: 'e.g. 0.5 mL IM — Quadrivalent',
  },
  {
    field: 'covid19', label: 'COVID-19 Vaccine',
    hint: 'Primary series + boosters — record all doses',
    typicalDoses: 2, icon: '🛡️',
    dosageHint: 'e.g. Covishield 0.5 mL / Covaxin 0.5 mL',
  },
  {
    field: 'pneumococcal', label: 'Pneumococcal Vaccine',
    hint: 'PCV13 / PCV20 / PPSV23 — note type for each dose',
    typicalDoses: 1, icon: '🫁',
    dosageHint: 'e.g. PCV13 0.5 mL IM',
  },
  {
    field: 'hepatitisB', label: 'Hepatitis B Vaccine',
    hint: 'Standard 3-dose series at 0, 1, and 6 months',
    typicalDoses: 3, icon: '🩺',
    dosageHint: 'e.g. Engerix-B 1 mL IM / 20 mcg',
  },
  {
    field: 'hepatitisA', label: 'Hepatitis A Vaccine',
    hint: '2-dose series — initial dose + booster at 6–12 months',
    typicalDoses: 2, icon: '🩺',
    dosageHint: 'e.g. Havrix 1 mL IM',
  },
  {
    field: 'hepatitisE', label: 'Hepatitis E Vaccine',
    hint: 'Hecolin — 3 doses at 0, 1, and 6 months',
    typicalDoses: 3, icon: '🩺',
    dosageHint: 'e.g. Hecolin 0.5 mL IM',
  },
  {
    field: 'zoster', label: 'Zoster (Shingrix) Vaccine',
    hint: '2-dose series — 2nd dose at 2–6 months after 1st',
    typicalDoses: 2, icon: '⚡',
    dosageHint: 'e.g. Shingrix 0.5 mL IM',
  },
  {
    field: 'mmrVaricella', label: 'MMR / Varicella',
    hint: '2 doses recommended — note if immunity confirmed by titre',
    typicalDoses: 2, icon: '🔬',
    dosageHint: 'e.g. MMR-II 0.5 mL SC',
  },
  {
    field: 'tetanusTdap', label: 'Tetanus / Tdap',
    hint: 'Primary series + booster every 10 years',
    typicalDoses: 1, icon: '💪',
    dosageHint: 'e.g. Boostrix / Adacel 0.5 mL IM',
  },
];

const STATUS_OPTS = [
  { value: 'given',   label: '✓ Given',   cls: 'vax-given'   },
  { value: 'never',   label: '✗ Never',   cls: 'vax-never'   },
  { value: 'unknown', label: '? Unknown', cls: 'vax-unknown' },
] as const;

export default function Step8Vaccination({ formData: d, onChange, errors: e }: Props) {

  const getEntry = (field: VaxField): VaccineEntry => {
    const val = d[field];
    if (val && typeof val === 'object' && 'status' in (val as object)) return val as VaccineEntry;
    return { status: '', doses: [] };
  };

  const setStatus = (field: VaxField, status: 'given' | 'never' | 'unknown') => {
    const entry = getEntry(field);
    if (status === 'given') {
      // Seed with one empty dose slot if none exist
      onChange(field as string, {
        status,
        doses: entry.doses.length > 0 ? entry.doses : [{ date: '', dosage: '' }],
      });
    } else {
      onChange(field as string, { status, doses: [] });
    }
  };

  const addDose = (field: VaxField) => {
    const entry = getEntry(field);
    onChange(field as string, { ...entry, doses: [...entry.doses, { date: '', dosage: '' }] });
  };

  const removeDose = (field: VaxField, idx: number) => {
    const entry = getEntry(field);
    onChange(field as string, { ...entry, doses: entry.doses.filter((_, i) => i !== idx) });
  };

  const updateDose = (field: VaxField, idx: number, key: keyof VaccineDose, val: string) => {
    const entry = getEntry(field);
    const doses = entry.doses.map((dose, i) => i === idx ? { ...dose, [key]: val } : dose);
    onChange(field as string, { ...entry, doses });
  };

  return (
    <div className="vax-list">
      {VACCINES.map(({ field, label, hint, typicalDoses, dosageHint, icon }) => {
        const entry   = getEntry(field);
        const hasError = !!e[field as string];

        return (
          <div key={field as string} className={`vax-card${hasError ? ' vax-card-err' : entry.status ? ` vax-card-${entry.status}` : ''}`}>

            {/* ── Header row ── */}
            <div className="vax-card-header">
              <div className="vax-info">
                <span className="vax-icon">{icon}</span>
                <div>
                  <div className="vax-label">{label}</div>
                  <div className="vax-sublabel">{hint}</div>
                </div>
              </div>

              <div className="vax-status-row" role="group" aria-label={`Status for ${label}`}>
                {STATUS_OPTS.map(({ value, label: lbl, cls }) => (
                  <button
                    key={value}
                    type="button"
                    className={`vax-status-btn ${cls}${entry.status === value ? ' active' : ''}`}
                    onClick={() => setStatus(field, value)}
                    aria-pressed={entry.status === value}
                  >
                    {lbl}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Error message ── */}
            {hasError && (
              <div className="vax-error-strip">
                <span>⚠</span> {e[field as string]}
              </div>
            )}

            {/* ── Dose records panel ── */}
            {entry.status === 'given' && (
              <div className="vax-doses-panel">
                <div className="vax-doses-toolbar">
                  <span className="vax-doses-title">
                    Dose Records
                    <span className="vax-typical-badge">Typical: {typicalDoses} dose{typicalDoses > 1 ? 's' : ''}</span>
                  </span>
                  <button type="button" className="vax-add-dose-btn" onClick={() => addDose(field)}>
                    + Add Dose
                  </button>
                </div>

                {entry.doses.length === 0 ? (
                  <div className="vax-empty-doses">
                    No doses recorded yet — click <strong>Add Dose</strong> to begin
                  </div>
                ) : (
                  <div className="vax-dose-list">
                    {entry.doses.map((dose, idx) => (
                      <div key={idx} className="vax-dose-row">
                        <div className="vax-dose-badge">Dose {idx + 1}</div>

                        <div className="vax-dose-inputs">
                          <div className="fg">
                            <label htmlFor={`${field as string}-dose-${idx}-date`}>Date of Vaccination</label>
                            <input
                              id={`${field as string}-dose-${idx}-date`}
                              type="date"
                              className="fi"
                              max={new Date().toISOString().split('T')[0]}
                              value={dose.date}
                              onChange={x => updateDose(field, idx, 'date', x.target.value)}
                            />
                          </div>
                          <div className="fg">
                            <label htmlFor={`${field as string}-dose-${idx}-dosage`}>Dosage / Brand / Type</label>
                            <input
                              id={`${field as string}-dose-${idx}-dosage`}
                              type="text"
                              className="fi"
                              value={dose.dosage}
                              placeholder={dosageHint}
                              onChange={x => updateDose(field, idx, 'dosage', x.target.value)}
                            />
                          </div>
                        </div>

                        <button
                          type="button"
                          className="vax-remove-dose-btn"
                          onClick={() => removeDose(field, idx)}
                          title={`Remove Dose ${idx + 1}`}
                          aria-label={`Remove Dose ${idx + 1}`}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Never / Unknown note strip ── */}
            {(entry.status === 'never' || entry.status === 'unknown') && (
              <div className={`vax-status-note vax-note-${entry.status}`}>
                {entry.status === 'never'
                  ? 'Patient has never received this vaccine.'
                  : 'Vaccination history is unknown or records are unavailable.'}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
