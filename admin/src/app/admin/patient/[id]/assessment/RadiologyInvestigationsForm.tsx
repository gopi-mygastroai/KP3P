'use client';

import React from 'react';
import type { AssessmentFormState, AssessmentUpdateFn } from '@/types/assessment-form';
import {
  emptyRadiologyInvestigationSet,
  normalizeRadiologyInvestigations,
  parseRadiologyInvestigations,
  RADIOLOGY_INVESTIGATION_FIELDS,
  serializeRadiologyInvestigations,
  type RadiologyInvestigationFieldId,
  type RadiologyInvestigationSet,
  type RadiologyInvestigationsData,
} from '@/lib/radiology-investigations';

const inter = "'Inter', sans-serif";

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '4px 8px',
  fontSize: 13,
  fontWeight: 500,
  fontFamily: inter,
  color: '#0f172a',
  background: '#ffffff',
  border: '1px solid #cbd5e1',
  borderRadius: 6,
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s',
  minHeight: 30,
};

const dateInputStyle: React.CSSProperties = {
  ...inputStyle,
  maxWidth: 180,
};

const headerCell: React.CSSProperties = {
  padding: '6px 8px',
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: '#ffffff',
  background: '#1e3a5f',
  borderBottom: '1px solid #0f172a',
  fontFamily: inter,
  lineHeight: 1.2,
};

const labelCell: React.CSSProperties = {
  padding: '4px 8px',
  fontSize: 12,
  fontWeight: 500,
  color: '#0f172a',
  background: '#ffffff',
  borderBottom: '1px solid #e2e8f0',
  borderRight: '1px solid #e2e8f0',
  fontFamily: inter,
  verticalAlign: 'middle',
  lineHeight: 1.25,
};

const valueCell: React.CSSProperties = {
  padding: '3px 6px',
  background: '#ffffff',
  borderBottom: '1px solid #e2e8f0',
  verticalAlign: 'middle',
};

type Props = {
  data: AssessmentFormState;
  updateData: AssessmentUpdateFn;
};

type SetBlockProps = {
  setIndex: number;
  set: RadiologyInvestigationSet;
  canRemove: boolean;
  onUpdate: (patch: Partial<RadiologyInvestigationSet>) => void;
  onRemove: () => void;
};

function RadiologySetBlock({
  setIndex,
  set,
  canRemove,
  onUpdate,
  onRemove,
}: SetBlockProps) {
  const setFieldValue = (fieldId: RadiologyInvestigationFieldId, value: string) => {
    onUpdate({ [fieldId]: value });
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      padding: '16px 18px',
      borderRadius: 12,
      border: '1px solid #e2e8f0',
      background: '#f8fafc',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        flexWrap: 'wrap',
      }}>
        <h4 style={{
          margin: 0,
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: '0.07em',
          textTransform: 'uppercase',
          color: '#475569',
          fontFamily: inter,
        }}>
          Radiology Investigations {setIndex + 1}
        </h4>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            style={{
              padding: '6px 12px',
              fontSize: 12,
              fontWeight: 600,
              fontFamily: inter,
              background: '#fff1f2',
              border: '1px solid #fecdd3',
              color: '#e11d48',
              borderRadius: 8,
              cursor: 'pointer',
            }}
          >
            Remove section
          </button>
        )}
      </div>

      <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: 8, background: '#ffffff' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
          <thead>
            <tr>
              <th style={{ ...headerCell, width: '40%', textAlign: 'left' }}>Parameter</th>
              <th style={{ ...headerCell, width: '60%', textAlign: 'left' }}>Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={labelCell}>
                Date of Assessment
              </td>
              <td style={valueCell}>
                <input
                  type="date"
                  style={dateInputStyle}
                  value={set.assessmentDate || ''}
                  onChange={(e) => onUpdate({ assessmentDate: e.target.value })}
                  onFocus={(e) => { e.target.style.borderColor = '#0891b2'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#cbd5e1'; }}
                />
              </td>
            </tr>
            {RADIOLOGY_INVESTIGATION_FIELDS.map((field) => (
              <tr key={field.id}>
                <td style={labelCell}>{field.label}</td>
                <td style={valueCell}>
                  <input
                    type="text"
                    style={inputStyle}
                    value={set[field.id] || ''}
                    onChange={(e) => setFieldValue(field.id, e.target.value)}
                    onFocus={(e) => { e.target.style.borderColor = '#0891b2'; }}
                    onBlur={(e) => { e.target.style.borderColor = '#cbd5e1'; }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function RadiologyInvestigationsForm({ data, updateData }: Props) {
  const radiology = parseRadiologyInvestigations(data.radiologyInvestigations);

  const persistRadiology = (next: RadiologyInvestigationsData) => {
    updateData({
      radiologyInvestigations: serializeRadiologyInvestigations(normalizeRadiologyInvestigations(next)),
    });
  };

  const updateSet = (setIndex: number, patch: Partial<RadiologyInvestigationSet>) => {
    const sets = radiology.sets.map((set, i) =>
      i === setIndex ? { ...set, ...patch } : set,
    );
    persistRadiology({ sets });
  };

  const addSet = () => {
    persistRadiology({
      sets: [...radiology.sets, emptyRadiologyInvestigationSet()],
    });
  };

  const removeSet = (setIndex: number) => {
    if (radiology.sets.length <= 1) return;
    persistRadiology({
      sets: radiology.sets.filter((_, i) => i !== setIndex),
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {radiology.sets.map((set, setIndex) => (
        <RadiologySetBlock
          key={setIndex}
          setIndex={setIndex}
          set={set}
          canRemove={setIndex > 0}
          onUpdate={(patch) => updateSet(setIndex, patch)}
          onRemove={() => removeSet(setIndex)}
        />
      ))}

      <button
        type="button"
        onClick={addSet}
        style={{
          alignSelf: 'flex-start',
          padding: '10px 16px',
          fontSize: 13,
          fontWeight: 600,
          fontFamily: inter,
          background: '#f0fdfa',
          border: '1px solid #99f6e4',
          color: '#0f766e',
          borderRadius: 10,
          cursor: 'pointer',
        }}
      >
        + Add additional Radiology Investigations
      </button>
    </div>
  );
}
