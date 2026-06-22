'use client';

import React from 'react';
import type { AssessmentFormState, AssessmentUpdateFn } from '@/types/assessment-form';
import {
  DOSE_UNIT_OPTIONS,
  DRUG_NAME_OPTIONS,
  REASON_FOR_STOPPING_OPTIONS,
  emptyMedicationRow,
  parseCurrentIbdMedicationsForForm,
  serializeCurrentIbdMedicationsForForm,
  type CurrentIbdMedicationRow,
  type CurrentIbdMedicationsData,
} from '@/lib/current-ibd-medications';
import { isFutureIsoDate, todayIsoDate } from '@/lib/iso-date';

const inter = "'Inter', sans-serif";
const maxDate = todayIsoDate();

const SECTION_HEADER = '#0e7490';

const headerCell: React.CSSProperties = {
  padding: '8px 6px',
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: '#ffffff',
  background: SECTION_HEADER,
  borderBottom: '1px solid #0c4a6e',
  textAlign: 'center',
  fontFamily: inter,
  lineHeight: 1.2,
  whiteSpace: 'nowrap',
};

const valueCell: React.CSSProperties = {
  padding: '4px 5px',
  borderBottom: '1px solid #e2e8f0',
  borderRight: '1px solid #e2e8f0',
  verticalAlign: 'middle',
  background: '#ffffff',
};

const cellInputStyle: React.CSSProperties = {
  width: '100%',
  minWidth: 0,
  boxSizing: 'border-box',
  padding: '6px 8px',
  fontSize: 12,
  lineHeight: 1.3,
  fontWeight: 500,
  fontFamily: inter,
  color: '#0f172a',
  background: '#ffffff',
  border: '1px solid #cbd5e1',
  borderRadius: 6,
  outline: 'none',
};

const cellSelectStyle: React.CSSProperties = {
  ...cellInputStyle,
  cursor: 'pointer',
};

const addButtonStyle: React.CSSProperties = {
  padding: '6px 10px',
  fontSize: 11,
  fontWeight: 600,
  fontFamily: inter,
  background: '#f0fdfa',
  border: '1px solid #99f6e4',
  color: '#0f766e',
  borderRadius: 6,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};

type Props = {
  data: AssessmentFormState;
  updateData: AssessmentUpdateFn;
};

function readMedications(data: AssessmentFormState): CurrentIbdMedicationsData {
  return parseCurrentIbdMedicationsForForm(
    (data as Record<string, unknown>).currentIbdMedicationsRows,
  );
}

export default function CurrentIbdMedicationsTable({ data, updateData }: Props) {
  const medications = readMedications(data);

  const persist = (next: CurrentIbdMedicationsData) => {
    updateData({
      currentIbdMedicationsRows: serializeCurrentIbdMedicationsForForm(next),
    });
  };

  const updateRow = (rowIndex: number, patch: Partial<CurrentIbdMedicationRow>) => {
    const rows = medications.rows.map((row, index) =>
      index === rowIndex ? { ...row, ...patch } : row,
    );
    persist({ rows });
  };

  const addRow = () => {
    persist({ rows: [...medications.rows, emptyMedicationRow()] });
  };

  const removeRow = (rowIndex: number) => {
    if (medications.rows.length <= 1) return;
    persist({ rows: medications.rows.filter((_, index) => index !== rowIndex) });
  };

  const updateDateField = (
    rowIndex: number,
    field: 'startDate' | 'endDate',
    value: string,
  ) => {
    if (value && isFutureIsoDate(value)) return;
    updateRow(rowIndex, { [field]: value });
  };

  const lastRowIndex = medications.rows.length - 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <div
        style={{
          padding: '8px 12px',
          background: SECTION_HEADER,
          borderRadius: '8px 8px 0 0',
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
          CURRENT IBD MEDICATIONS
        </span>
      </div>

      <div
        style={{
          overflowX: 'auto',
          border: `1px solid ${SECTION_HEADER}`,
          borderTop: 'none',
          borderRadius: '0 0 8px 8px',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1040 }}>
          <thead>
            <tr>
              <th style={{ ...headerCell, minWidth: 180, textAlign: 'left' }}>DRUG NAME</th>
              <th style={{ ...headerCell, minWidth: 90 }}>DOSE</th>
              <th style={{ ...headerCell, minWidth: 110 }}>DOSE UNIT</th>
              <th style={{ ...headerCell, minWidth: 120 }}>START DATE</th>
              <th style={{ ...headerCell, minWidth: 120 }}>END DATE</th>
              <th style={{ ...headerCell, minWidth: 72 }}>ONGOING</th>
              <th style={{ ...headerCell, minWidth: 180, textAlign: 'left' }}>REASON FOR STOPPING IF ANY</th>
              <th style={{ ...headerCell, minWidth: 140, borderRight: 'none' }} />
            </tr>
          </thead>
          <tbody>
            {medications.rows.map((row, rowIndex) => {
              const isLastRow = rowIndex === lastRowIndex;
              const canRemove = medications.rows.length > 1;

              return (
                <tr key={rowIndex}>
                  <td style={valueCell}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <select
                        style={cellSelectStyle}
                        value={row.drugName}
                        onChange={(e) => {
                          const drugName = e.target.value;
                          updateRow(rowIndex, {
                            drugName,
                            otherDrugSpecify: drugName === 'Other' ? row.otherDrugSpecify ?? '' : undefined,
                          });
                        }}
                      >
                        <option value="">—</option>
                        {DRUG_NAME_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                      {row.drugName === 'Other' ? (
                        <input
                          type="text"
                          style={{ ...cellInputStyle, fontSize: 11 }}
                          value={row.otherDrugSpecify ?? ''}
                          placeholder="Specify drug…"
                          onChange={(e) => updateRow(rowIndex, { otherDrugSpecify: e.target.value })}
                          onFocus={(e) => {
                            e.target.style.borderColor = '#0891b2';
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = '#cbd5e1';
                          }}
                        />
                      ) : null}
                    </div>
                  </td>
                  <td style={valueCell}>
                    <input
                      type="text"
                      style={cellInputStyle}
                      value={row.dose}
                      placeholder="Free text"
                      onChange={(e) => updateRow(rowIndex, { dose: e.target.value })}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#0891b2';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#cbd5e1';
                      }}
                    />
                  </td>
                  <td style={valueCell}>
                    <select
                      style={cellSelectStyle}
                      value={row.doseUnit}
                      onChange={(e) => updateRow(rowIndex, { doseUnit: e.target.value })}
                    >
                      <option value="">—</option>
                      {DOSE_UNIT_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td style={valueCell}>
                    <input
                      type="date"
                      style={cellInputStyle}
                      value={row.startDate || ''}
                      max={maxDate}
                      onChange={(e) => updateDateField(rowIndex, 'startDate', e.target.value)}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#0891b2';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#cbd5e1';
                      }}
                    />
                  </td>
                  <td style={valueCell}>
                    <input
                      type="date"
                      style={cellInputStyle}
                      value={row.endDate || ''}
                      max={maxDate}
                      disabled={row.ongoing}
                      onChange={(e) => updateDateField(rowIndex, 'endDate', e.target.value)}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#0891b2';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#cbd5e1';
                      }}
                    />
                  </td>
                  <td style={{ ...valueCell, textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={row.ongoing}
                      onChange={(e) => {
                        const ongoing = e.target.checked;
                        updateRow(rowIndex, {
                          ongoing,
                          endDate: ongoing ? '' : row.endDate,
                        });
                      }}
                      style={{ width: 16, height: 16, cursor: 'pointer' }}
                    />
                  </td>
                  <td style={valueCell}>
                    <select
                      style={cellSelectStyle}
                      value={row.reasonForStopping}
                      onChange={(e) => updateRow(rowIndex, { reasonForStopping: e.target.value })}
                    >
                      <option value="">—</option>
                      {REASON_FOR_STOPPING_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td style={{ ...valueCell, borderRight: 'none' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                        gap: 6,
                        flexWrap: 'wrap',
                      }}
                    >
                      {canRemove ? (
                        <button
                          type="button"
                          onClick={() => removeRow(rowIndex)}
                          aria-label="Remove medication row"
                          style={{
                            padding: '6px 10px',
                            fontSize: 11,
                            fontWeight: 600,
                            fontFamily: inter,
                            color: '#dc2626',
                            background: '#fef2f2',
                            border: '1px solid #fecaca',
                            borderRadius: 6,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          Remove
                        </button>
                      ) : null}
                      {isLastRow ? (
                        <button type="button" onClick={addRow} style={addButtonStyle}>
                          + Add Medication
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
