'use client';

import React from 'react';
import type { AssessmentFormState, AssessmentUpdateFn } from '@/types/assessment-form';
import {
  emptyIbdInvestigationSet,
  IBD_INVESTIGATION_GROUPS,
  normalizeIbdInvestigations,
  parseIbdInvestigations,
  primaryInvestigationAssessmentDate,
  serializeIbdInvestigations,
  type IbdInvestigationFieldId,
  type IbdInvestigationSet,
  type IbdInvestigationsData,
} from '@/lib/ibd-investigations';
import {
  fieldBorderColor,
  FIELD_ERROR_LABEL,
  ibdInvestigationFieldKey,
  useAssessmentFieldError,
} from './assessment-field-errors';

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

const groupCell: React.CSSProperties = {
  padding: '4px 8px',
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: '#0f172a',
  background: '#f1f5f9',
  borderBottom: '1px solid #e2e8f0',
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

type IbdInvestigationsFormProps = {
  data: AssessmentFormState;
  updateData: AssessmentUpdateFn;
};

function readInvestigations(data: AssessmentFormState): IbdInvestigationsData {
  return parseIbdInvestigations(data.ibdInvestigations, data.dateMostRecentLabs);
}

type InvestigationSetBlockProps = {
  setIndex: number;
  set: IbdInvestigationSet;
  canRemove: boolean;
  onUpdate: (patch: Partial<IbdInvestigationSet>) => void;
  onRemove: () => void;
};

function InvestigationSetBlock({
  setIndex,
  set,
  canRemove,
  onUpdate,
  onRemove,
}: InvestigationSetBlockProps) {
  const dateFieldKey = ibdInvestigationFieldKey(setIndex);
  const hasDateError = useAssessmentFieldError(dateFieldKey);
  const [dateFocused, setDateFocused] = React.useState(false);
  const setFieldValue = (fieldId: IbdInvestigationFieldId, value: string) => {
    onUpdate({
      values: { ...set.values, [fieldId]: value },
    });
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
          Laboratory &amp; Investigations {setIndex + 1}
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
              <th style={{ ...headerCell, width: '58%', textAlign: 'left' }}>Parameter</th>
              <th style={{ ...headerCell, width: '42%', textAlign: 'left' }}>Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{
                ...labelCell,
                color: hasDateError ? FIELD_ERROR_LABEL : labelCell.color,
                fontWeight: hasDateError ? 700 : labelCell.fontWeight,
              }}>
                Date of Assessment<span style={{ color: '#dc2626', marginLeft: 3 }}>*</span>
              </td>
              <td style={valueCell}>
                <input
                  type="date"
                  required
                  style={{
                    ...dateInputStyle,
                    borderColor: fieldBorderColor(hasDateError, dateFocused),
                    background: hasDateError ? '#fef2f2' : '#ffffff',
                  }}
                  value={set.assessmentDate || ''}
                  onChange={(e) => onUpdate({ assessmentDate: e.target.value })}
                  onFocus={() => setDateFocused(true)}
                  onBlur={() => setDateFocused(false)}
                />
              </td>
            </tr>
            {IBD_INVESTIGATION_GROUPS.map((group) => (
              <React.Fragment key={group.id}>
                <tr>
                  <td colSpan={2} style={groupCell}>{group.title}</td>
                </tr>
                {group.fields.map((field) => (
                  <tr key={field.id}>
                    <td style={labelCell}>{field.label}</td>
                    <td style={valueCell}>
                      <input
                        type="text"
                        style={inputStyle}
                        value={set.values[field.id] || ''}
                        onChange={(e) => setFieldValue(field.id, e.target.value)}
                        onFocus={(e) => { e.target.style.borderColor = '#0891b2'; }}
                        onBlur={(e) => { e.target.style.borderColor = '#cbd5e1'; }}
                      />
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function IbdInvestigationsForm({ data, updateData }: IbdInvestigationsFormProps) {
  const investigations = readInvestigations(data);

  const persistInvestigations = (next: IbdInvestigationsData) => {
    const normalized = normalizeIbdInvestigations(next);
    updateData({
      ibdInvestigations: serializeIbdInvestigations(normalized),
      dateMostRecentLabs: primaryInvestigationAssessmentDate(normalized),
    });
  };

  const updateSet = (setIndex: number, patch: Partial<IbdInvestigationSet>) => {
    const sets = investigations.sets.map((set, i) =>
      i === setIndex ? { ...set, ...patch } : set,
    );
    persistInvestigations({ sets });
  };

  const addSet = () => {
    persistInvestigations({
      sets: [...investigations.sets, emptyIbdInvestigationSet()],
    });
  };

  const removeSet = (setIndex: number) => {
    if (investigations.sets.length <= 1) return;
    persistInvestigations({
      sets: investigations.sets.filter((_, i) => i !== setIndex),
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {investigations.sets.map((set, setIndex) => (
        <InvestigationSetBlock
          key={setIndex}
          setIndex={setIndex}
          set={set}
          canRemove={investigations.sets.length > 1}
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
        + Add additional Lab &amp; Investigations
      </button>
    </div>
  );
}
