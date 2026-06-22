'use client';

import React from 'react';
import type { AssessmentFormState, AssessmentUpdateFn } from '@/types/assessment-form';
import {
  emptyInfectionScreeningSet,
  INFECTION_SCREENING_FIELDS,
  INFECTION_SCREENING_PICKLIST_OPTIONS,
  normalizeInfectionScreening,
  parseInfectionScreening,
  serializeInfectionScreening,
  TB_SCREENING_SUBFIELDS,
  type InfectionScreeningSet,
  type InfectionScreeningData,
} from '@/lib/infection-screening';
import { isFutureIsoDate, todayIsoDate } from '@/lib/iso-date';

const inter = "'Inter', sans-serif";
const maxDate = todayIsoDate();
const SECTION_HEADER = '#0e7490';

const selectStyle: React.CSSProperties = {
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
  cursor: 'pointer',
};

const groupLabelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.07em',
  textTransform: 'uppercase',
  color: '#475569',
  fontFamily: inter,
  margin: 0,
};

const fieldLabelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.07em',
  textTransform: 'uppercase',
  color: '#475569',
  fontFamily: inter,
};

type Props = {
  data: AssessmentFormState;
  updateData: AssessmentUpdateFn;
};

function readInfectionScreening(data: AssessmentFormState): InfectionScreeningData {
  return parseInfectionScreening((data as Record<string, unknown>).infectionScreening);
}

function PickListField({
  label,
  required,
  value,
  onChange,
  indent = false,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  indent?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        paddingLeft: indent ? 16 : 0,
        borderLeft: indent ? '2px solid #e2e8f0' : undefined,
      }}
    >
      <label style={fieldLabelStyle}>
        {label}
        {required ? <span style={{ color: '#dc2626', marginLeft: 4 }}>*</span> : null}
      </label>
      <select
        style={selectStyle}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        onFocus={(e) => {
          e.target.style.borderColor = '#0891b2';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = '#cbd5e1';
        }}
      >
        <option value="">—</option>
        {INFECTION_SCREENING_PICKLIST_OPTIONS.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

function ScreeningSetBlock({
  setIndex,
  set,
  canRemove,
  onUpdate,
  onRemove,
}: {
  setIndex: number;
  set: InfectionScreeningSet;
  canRemove: boolean;
  onUpdate: (patch: Partial<InfectionScreeningSet>) => void;
  onRemove: () => void;
}) {
  const updateScreeningDate = (value: string) => {
    if (value && isFutureIsoDate(value)) return;
    onUpdate({ screeningDate: value });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <div
        style={{
          padding: '8px 12px',
          background: SECTION_HEADER,
          borderRadius: setIndex === 0 ? '8px 8px 0 0' : '8px 8px 0 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            color: '#ffffff',
            fontFamily: inter,
            lineHeight: 1.25,
          }}
        >
          Infection Screening
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto', flexWrap: 'wrap' }}>
          <label
            htmlFor={`screeningDate-${setIndex}`}
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: '#e0f2fe',
              fontFamily: inter,
              whiteSpace: 'nowrap',
            }}
          >
            Screening date
            <span style={{ color: '#fecaca', marginLeft: 4 }}>*</span>
          </label>
          <input
            id={`screeningDate-${setIndex}`}
            type="date"
            required
            max={maxDate}
            value={set.screeningDate || ''}
            onChange={(e) => updateScreeningDate(e.target.value)}
            style={{
              padding: '6px 10px',
              fontSize: 12,
              fontWeight: 500,
              fontFamily: inter,
              color: '#0f172a',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: 6,
              outline: 'none',
              cursor: 'pointer',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#0891b2';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#cbd5e1';
            }}
          />
          {canRemove ? (
            <button
              type="button"
              onClick={onRemove}
              style={{
                padding: '6px 10px',
                fontSize: 11,
                fontWeight: 600,
                fontFamily: inter,
                color: '#ffffff',
                background: 'rgba(220, 38, 38, 0.85)',
                border: '1px solid #fecaca',
                borderRadius: 6,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              Remove
            </button>
          ) : null}
        </div>
      </div>

      <div
        style={{
          border: `1px solid ${SECTION_HEADER}`,
          borderTop: 'none',
          borderRadius: '0 0 8px 8px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          background: '#ffffff',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h4 style={groupLabelStyle}>
            TB Screening Status
            <span style={{ color: '#dc2626', marginLeft: 4 }}>*</span>
          </h4>
          {TB_SCREENING_SUBFIELDS.map((field) => (
            <PickListField
              key={field.id}
              label={field.label}
              required
              indent
              value={set[field.id]}
              onChange={(value) => onUpdate({ [field.id]: value })}
            />
          ))}
        </div>

        {INFECTION_SCREENING_FIELDS.map((field) => (
          <PickListField
            key={field.id}
            label={field.label}
            required
            value={set[field.id]}
            onChange={(value) => onUpdate({ [field.id]: value })}
          />
        ))}
      </div>
    </div>
  );
}

export default function InfectionScreeningForm({ data, updateData }: Props) {
  const screening = readInfectionScreening(data);

  const persist = (next: InfectionScreeningData) => {
    const normalized = normalizeInfectionScreening(next);
    updateData({
      infectionScreening: serializeInfectionScreening(normalized),
    });
  };

  const updateSet = (setIndex: number, patch: Partial<InfectionScreeningSet>) => {
    const sets = screening.sets.map((set, index) =>
      index === setIndex ? { ...set, ...patch } : set,
    );
    persist({ sets });
  };

  const addSet = () => {
    persist({ sets: [...screening.sets, emptyInfectionScreeningSet()] });
  };

  const removeSet = (setIndex: number) => {
    if (screening.sets.length <= 1) return;
    persist({ sets: screening.sets.filter((_, index) => index !== setIndex) });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {screening.sets.map((set, setIndex) => (
        <ScreeningSetBlock
          key={setIndex}
          setIndex={setIndex}
          set={set}
          canRemove={screening.sets.length > 1}
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
        + Add Additional Screening
      </button>
    </div>
  );
}
