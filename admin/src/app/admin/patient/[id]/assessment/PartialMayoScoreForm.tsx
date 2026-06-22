'use client';

import React from 'react';
import type { AssessmentFormState, AssessmentUpdateFn } from '@/types/assessment-form';
import {
  normalizePartialMayoScore,
  parsePartialMayoScore,
  partialMayoInterpretation,
  partialMayoTotal,
  PMAYO_FOOTNOTE,
  PMAYO_PGA_OPTIONS,
  PMAYO_RECTAL_BLEEDING_OPTIONS,
  PMAYO_REFERENCE_ROWS,
  PMAYO_STOOL_FREQUENCY_OPTIONS,
  serializePartialMayoScore,
  type PartialMayoScoreData,
  type PMayoPicklistOption,
} from '@/lib/partial-mayo-score';
import { isFutureIsoDate, todayIsoDate } from '@/lib/iso-date';

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

const dateInputStyle: React.CSSProperties = {
  ...selectStyle,
  cursor: 'text',
  textAlign: 'left',
};

type Props = {
  data: AssessmentFormState;
  updateData: AssessmentUpdateFn;
};

type PicklistFieldKey = 'stoolFrequency' | 'rectalBleeding' | 'physiciansGlobalAssessment';

const PICKLIST_FIELDS: {
  id: PicklistFieldKey;
  label: string;
  helpText: string;
  options: readonly PMayoPicklistOption[];
}[] = [
  {
    id: 'stoolFrequency',
    label: '1. Stool Frequency',
    helpText: 'Number of stools per day beyond normal for the patient (in last 24 hours)',
    options: PMAYO_STOOL_FREQUENCY_OPTIONS,
  },
  {
    id: 'rectalBleeding',
    label: '2. Rectal Bleeding',
    helpText: 'Most severe rectal bleeding in the past 24 hours',
    options: PMAYO_RECTAL_BLEEDING_OPTIONS,
  },
  {
    id: 'physiciansGlobalAssessment',
    label: "3. Physician's Global Assessment (PGA)",
    helpText: "Physician's overall assessment of patient's disease activity",
    options: PMAYO_PGA_OPTIONS,
  },
];

export default function PartialMayoScoreForm({ data, updateData }: Props) {
  const pMayo = normalizePartialMayoScore(
    parsePartialMayoScore((data as Record<string, unknown>).partialMayoScoring),
  );
  const total = partialMayoTotal(pMayo);
  const interpretation = partialMayoInterpretation(total);

  const updatePMayo = (patch: Partial<PartialMayoScoreData>) => {
    const next = { ...pMayo, ...patch };
    updateData({
      partialMayoScoring: serializePartialMayoScore(normalizePartialMayoScore(next)),
    });
  };

  const setPicklistField = (fieldId: PicklistFieldKey, raw: string) => {
    updatePMayo({ [fieldId]: raw === '' ? 0 : Number(raw) });
  };

  const setAssessmentDate = (date: string) => {
    if (date && isFutureIsoDate(date)) return;
    updatePMayo({ assessmentDate: date });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 180 }}>
          <label style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.07em',
            textTransform: 'uppercase',
            color: '#475569',
            fontFamily: inter,
          }}>
            Date of Assessment
          </label>
          <input
            type="date"
            style={{ ...dateInputStyle, width: 180 }}
            value={pMayo.assessmentDate ? String(pMayo.assessmentDate).substring(0, 10) : todayIsoDate()}
            max={todayIsoDate()}
            onChange={(e) => setAssessmentDate(e.target.value)}
          />
        </div>
      </div>

      <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid #cbd5e1' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
          <thead>
            <tr>
              <th style={{ ...headerCell, textAlign: 'left', width: '22%' }}>Symptom / Sign</th>
              <th style={{ ...headerCell, textAlign: 'left', width: '28%' }}>Clinical Description</th>
              <th style={{ ...headerCell, textAlign: 'left', width: '34%' }}>Options</th>
              <th style={{ ...headerCell, textAlign: 'center', width: '16%' }}>Score</th>
            </tr>
          </thead>
          <tbody>
            {PICKLIST_FIELDS.map((field) => (
              <tr key={field.id}>
                <td style={labelCell}>{field.label}</td>
                <td style={helpCell}>{field.helpText}</td>
                <td style={dataCell}>
                  <select
                    style={selectStyle}
                    value={String(pMayo[field.id])}
                    onChange={(e) => setPicklistField(field.id, e.target.value)}
                  >
                    {field.options.map((opt) => (
                      <option key={opt.score} value={String(opt.score)}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td style={scoreCell}>{pMayo[field.id]}</td>
              </tr>
            ))}

            <tr>
              <td style={{ ...labelCell, background: '#1e3a5f', color: '#ffffff' }}>TOTAL PARTIAL MAYO SCORE</td>
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
              Interpretation
            </span>
          </div>
          <div style={{
            flex: '1 1 240px',
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
            <span style={{ fontSize: 12, color: '#475569', fontFamily: inter, fontWeight: 600 }}>
              Action: {interpretation.action}
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
          Partial Mayo Score Reference — Cut-offs &amp; Interpretation
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ ...headerCell, background: '#334155', textAlign: 'left' }}>pMayo Score</th>
              <th style={{ ...headerCell, background: '#334155', textAlign: 'left' }}>Category</th>
              <th style={{ ...headerCell, background: '#334155', textAlign: 'left' }}>Clinical Meaning</th>
              <th style={{ ...headerCell, background: '#334155', textAlign: 'left' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {PMAYO_REFERENCE_ROWS.map((row) => (
              <tr key={row.range}>
                <td style={labelCell}>{row.range}</td>
                <td style={labelCell}>{row.category}</td>
                <td style={helpCell}>{row.meaning}</td>
                <td style={helpCell}>{row.action}</td>
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
        ℹ  {PMAYO_FOOTNOTE}
      </p>
    </div>
  );
}
