'use client';

import React from 'react';
import type { AssessmentFormState, AssessmentUpdateFn } from '@/types/assessment-form';
import {
  IBD_INVESTIGATION_GROUPS,
  normalizeIbdInvestigations,
  parseIbdInvestigations,
  serializeIbdInvestigations,
  type IbdInvestigationFieldId,
  type IbdInvestigationsData,
} from '@/lib/ibd-investigations';

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
  return parseIbdInvestigations(data.ibdInvestigations);
}

export default function IbdInvestigationsForm({ data, updateData }: IbdInvestigationsFormProps) {
  const investigations = readInvestigations(data);

  const persistInvestigations = (next: IbdInvestigationsData) => {
    updateData({ ibdInvestigations: serializeIbdInvestigations(normalizeIbdInvestigations(next)) });
  };

  const setFieldValue = (fieldId: IbdInvestigationFieldId, value: string) => {
    persistInvestigations({
      ...investigations,
      values: { ...investigations.values, [fieldId]: value },
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: 8 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
          <thead>
            <tr>
              <th style={{ ...headerCell, width: '58%', textAlign: 'left' }}>Parameter</th>
              <th style={{ ...headerCell, width: '42%', textAlign: 'left' }}>Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={labelCell}>
                Date of Assessment<span style={{ color: '#dc2626', marginLeft: 3 }}>*</span>
              </td>
              <td style={valueCell}>
                <input
                  type="date"
                  required
                  style={dateInputStyle}
                  value={data.dateMostRecentLabs || ''}
                  onChange={(e) => updateData({ dateMostRecentLabs: e.target.value })}
                  onFocus={(e) => (e.target.style.borderColor = '#0891b2')}
                  onBlur={(e) => (e.target.style.borderColor = '#cbd5e1')}
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
                        value={investigations.values[field.id] || ''}
                        onChange={(e) => setFieldValue(field.id, e.target.value)}
                        onFocus={(e) => (e.target.style.borderColor = '#0891b2')}
                        onBlur={(e) => (e.target.style.borderColor = '#cbd5e1')}
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
