'use client';

import React from 'react';
import type { AssessmentFormState, AssessmentUpdateFn } from '@/types/assessment-form';
import {
  HBI_ABDOMINAL_MASS_OPTIONS,
  HBI_ABDOMINAL_PAIN_OPTIONS,
  HBI_FOOTNOTE,
  HBI_GENERAL_WELLBEING_OPTIONS,
  HBI_REFERENCE_ROWS,
  hbiInterpretation,
  hbiTotal,
  normalizeHarveyBradshawIndex,
  parseHarveyBradshawIndex,
  serializeHarveyBradshawIndex,
  type HarveyBradshawIndexData,
  type HbiPicklistOption,
} from '@/lib/harvey-bradshaw-index';
import { isFutureIsoDate, todayIsoDate } from '@/lib/iso-date';
import {
  fieldBorderColor,
  FIELD_ERROR_LABEL,
  fieldGroupErrorStyle,
  useAssessmentFieldError,
} from './assessment-field-errors';

const inter = "'Inter', sans-serif";

const headerCell: React.CSSProperties = {
  padding: '10px 8px',
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  color: '#ffffff',
  background: '#1e3a5f',
  borderBottom: '1px solid #0f172a',
  fontFamily: inter,
  lineHeight: 1.3,
};

const labelCell: React.CSSProperties = {
  padding: '10px 12px',
  fontSize: 12,
  fontWeight: 700,
  color: '#0f172a',
  background: '#ffffff',
  borderBottom: '1px solid #e2e8f0',
  borderRight: '1px solid #e2e8f0',
  fontFamily: inter,
  verticalAlign: 'top',
};

const helpCell: React.CSSProperties = {
  ...labelCell,
  fontWeight: 500,
  color: '#64748b',
  fontSize: 11,
  lineHeight: 1.45,
};

const dataCell: React.CSSProperties = {
  padding: '8px 10px',
  background: '#ffffff',
  borderBottom: '1px solid #e2e8f0',
  borderRight: '1px solid #e2e8f0',
  verticalAlign: 'middle',
};

const scoreCell: React.CSSProperties = {
  ...dataCell,
  textAlign: 'center',
  fontWeight: 700,
  fontSize: 14,
  color: '#0f172a',
  fontFamily: inter,
  background: '#f8fafc',
};

const selectStyle: React.CSSProperties = {
  width: '100%',
  minWidth: 0,
  boxSizing: 'border-box',
  padding: '8px 10px',
  fontSize: 12,
  lineHeight: 1.35,
  fontWeight: 600,
  fontFamily: inter,
  color: '#0f172a',
  background: '#ffffff',
  border: '1px solid #cbd5e1',
  borderRadius: 6,
  cursor: 'pointer',
};

const numberInputStyle: React.CSSProperties = {
  ...selectStyle,
  cursor: 'text',
  textAlign: 'center',
};

type Props = {
  data: AssessmentFormState;
  updateData: AssessmentUpdateFn;
};

type PicklistFieldKey = 'generalWellbeing' | 'abdominalPain' | 'abdominalMass';
type NumericFieldKey = 'liquidSoftStools' | 'complications';

const PICKLIST_FIELDS: {
  id: PicklistFieldKey;
  label: string;
  helpText: string;
  options: readonly HbiPicklistOption[];
}[] = [
  {
    id: 'generalWellbeing',
    label: '1. General Well-being',
    helpText: 'How did the patient feel overall yesterday?',
    options: HBI_GENERAL_WELLBEING_OPTIONS,
  },
  {
    id: 'abdominalPain',
    label: '2. Abdominal Pain',
    helpText: 'Worst abdominal pain yesterday',
    options: HBI_ABDOMINAL_PAIN_OPTIONS,
  },
  {
    id: 'abdominalMass',
    label: '4. Abdominal Mass',
    helpText: 'Abdominal mass on examination',
    options: HBI_ABDOMINAL_MASS_OPTIONS,
  },
];

export default function HarveyBradshawIndexForm({ data, updateData }: Props) {
  const hbi = normalizeHarveyBradshawIndex(
    parseHarveyBradshawIndex((data as Record<string, unknown>).hbiScoring),
  );
  const total = hbiTotal(hbi);
  const interpretation = hbiInterpretation(total);
  const hasDateError = useAssessmentFieldError('hbiScoring.assessmentDate');
  const [dateFocused, setDateFocused] = React.useState(false);

  const updateHbi = (patch: Partial<HarveyBradshawIndexData>) => {
    const next = { ...hbi, ...patch };
    updateData({
      hbiScoring: serializeHarveyBradshawIndex(normalizeHarveyBradshawIndex(next)),
    });
  };

  const setPicklistField = (fieldId: PicklistFieldKey, raw: string) => {
    updateHbi({ [fieldId]: raw === '' ? 0 : Number(raw) });
  };

  const setNumericField = (fieldId: NumericFieldKey, raw: string) => {
    const max = fieldId === 'complications' ? 8 : 999;
    const n = raw === '' ? 0 : Math.min(max, Math.max(0, Math.trunc(Number(raw))));
    updateHbi({ [fieldId]: Number.isFinite(n) ? n : 0 });
  };

  const setAssessmentDate = (date: string) => {
    if (date && isFutureIsoDate(date)) return;
    updateHbi({ assessmentDate: date });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 180, ...fieldGroupErrorStyle(hasDateError) }}>
          <label style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.07em',
            textTransform: 'uppercase',
            color: hasDateError ? FIELD_ERROR_LABEL : '#475569',
            fontFamily: inter,
          }}>
            Date of Assessment
          </label>
          <input
            type="date"
            style={{
              ...numberInputStyle,
              width: 180,
              textAlign: 'left',
              borderColor: fieldBorderColor(hasDateError, dateFocused),
              background: hasDateError ? '#fef2f2' : '#ffffff',
            }}
            value={hbi.assessmentDate ? String(hbi.assessmentDate).substring(0, 10) : todayIsoDate()}
            max={todayIsoDate()}
            onChange={(e) => setAssessmentDate(e.target.value)}
            onFocus={() => setDateFocused(true)}
            onBlur={() => setDateFocused(false)}
          />
        </div>
      </div>

      <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid #cbd5e1' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
          <thead>
            <tr>
              <th style={{ ...headerCell, textAlign: 'left', width: '22%' }}>Symptom / Sign</th>
              <th style={{ ...headerCell, textAlign: 'left', width: '28%' }} />
              <th style={{ ...headerCell, textAlign: 'left', width: '34%' }}>Options</th>
              <th style={{ ...headerCell, textAlign: 'center', width: '16%' }}>Score</th>
            </tr>
          </thead>
          <tbody>
            {PICKLIST_FIELDS.slice(0, 2).map((field) => (
              <tr key={field.id}>
                <td style={labelCell}>{field.label}</td>
                <td style={helpCell}>{field.helpText}</td>
                <td style={dataCell}>
                  <select
                    style={selectStyle}
                    value={String(hbi[field.id])}
                    onChange={(e) => setPicklistField(field.id, e.target.value)}
                  >
                    {field.options.map((opt) => (
                      <option key={opt.score} value={String(opt.score)}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td style={scoreCell}>{hbi[field.id]}</td>
              </tr>
            ))}

            <tr>
              <td style={labelCell}>3. Number of Liquid / Soft Stools</td>
              <td style={helpCell}>Total liquid or soft stools in the past 24 hours</td>
              <td style={dataCell}>
                <input
                  type="number"
                  min={0}
                  step={1}
                  style={numberInputStyle}
                  value={hbi.liquidSoftStools}
                  onChange={(e) => setNumericField('liquidSoftStools', e.target.value)}
                />
              </td>
              <td style={scoreCell}>{hbi.liquidSoftStools}</td>
            </tr>

            <tr>
              <td style={labelCell}>{PICKLIST_FIELDS[2].label}</td>
              <td style={helpCell}>{PICKLIST_FIELDS[2].helpText}</td>
              <td style={dataCell}>
                <select
                  style={selectStyle}
                  value={String(hbi.abdominalMass)}
                  onChange={(e) => setPicklistField('abdominalMass', e.target.value)}
                >
                  {HBI_ABDOMINAL_MASS_OPTIONS.map((opt) => (
                    <option key={opt.score} value={String(opt.score)}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </td>
              <td style={scoreCell}>{hbi.abdominalMass}</td>
            </tr>

            <tr>
              <td style={labelCell}>5. Complications</td>
              <td style={{ ...helpCell, whiteSpace: 'pre-line' }}>
                Each complication scores 1 point. Enter total count (0–8).
                {'\n'}(Arthralgia, Uveitis, Erythema nodosum, Aphthous ulcers,
                {'\n'}Pyoderma gangrenosum, Anal fissure, New fistula, Abscess)
              </td>
              <td style={dataCell}>
                <input
                  type="number"
                  min={0}
                  max={8}
                  step={1}
                  style={numberInputStyle}
                  value={hbi.complications}
                  onChange={(e) => setNumericField('complications', e.target.value)}
                />
              </td>
              <td style={scoreCell}>{hbi.complications}</td>
            </tr>

            <tr>
              <td style={{ ...labelCell, background: '#1e3a5f', color: '#ffffff' }}>TOTAL HBI SCORE</td>
              <td style={{ ...helpCell, background: '#1e3a5f' }} />
              <td style={{ ...dataCell, background: '#1e3a5f' }} />
              <td style={{ ...scoreCell, background: '#1e3a5f', color: '#ffffff', fontSize: 18 }}>{total}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'stretch', flexWrap: 'wrap' }}>
          <div style={{
            flex: '1 1 200px',
            display: 'flex',
            alignItems: 'center',
            padding: '14px 18px',
            background: '#1e3a5f',
          }}>
            <span style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.07em',
              textTransform: 'uppercase',
              color: '#ffffff',
              fontFamily: inter,
            }}>
              Interpretation — Disease Activity
            </span>
          </div>
          <div style={{
            flex: '1 1 200px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '14px 18px',
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            borderLeft: 'none',
            gap: 4,
          }}>
            <span style={{
              fontSize: 20,
              fontWeight: 800,
              color: interpretation.color,
              fontFamily: inter,
            }}>
              {interpretation.display}
            </span>
            <span style={{ fontSize: 12, color: '#64748b', fontFamily: inter }}>
              {interpretation.clinicalMeaning}
            </span>
          </div>
        </div>
      </div>

      <div style={{ borderRadius: 10, border: '1px solid #cbd5e1', overflow: 'hidden' }}>
        <div style={{
          padding: '12px 16px',
          background: '#e2e8f0',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: '#0f172a',
          fontFamily: inter,
        }}>
          HBI Score Reference — Cut-offs &amp; Interpretation
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ ...headerCell, background: '#334155', textAlign: 'left' }}>HBI Score</th>
              <th style={{ ...headerCell, background: '#334155', textAlign: 'left' }}>Category</th>
              <th style={{ ...headerCell, background: '#334155', textAlign: 'left' }}>Clinical Meaning</th>
            </tr>
          </thead>
          <tbody>
            {HBI_REFERENCE_ROWS.map((row) => (
              <tr key={row.range}>
                <td style={labelCell}>{row.range}</td>
                <td style={labelCell}>{row.category}</td>
                <td style={helpCell}>{row.meaning}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p style={{
        margin: 0,
        padding: '10px 14px',
        fontSize: 11,
        fontStyle: 'italic',
        lineHeight: 1.45,
        color: '#0f172a',
        background: '#e2e8f0',
        borderRadius: 10,
        fontFamily: inter,
      }}>
        ℹ  {HBI_FOOTNOTE}
      </p>
    </div>
  );
}
