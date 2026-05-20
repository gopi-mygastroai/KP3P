'use client';

import React from 'react';
import type { AssessmentFormState, AssessmentUpdateFn } from '@/types/assessment-form';
import {
  UPPER_GI_FINDINGS_NOTE,
  UPPER_GI_SEGMENT_PICKLISTS,
  UPPER_GI_SEGMENTS,
  normalizeUpperGiFindings,
  parseUpperGiFindings,
  serializeUpperGiFindings,
  type UpperGiFindingsData,
  type UpperGiSegmentId,
} from '@/lib/upper-gi-findings';

const inter = "'Inter', sans-serif";

const PURPLE_HEADER = '#5b2d82';
const PURPLE_NOTE = '#f3e8ff';
const ROW_ALT = '#f5f0fa';
const INPUT_BG = '#fff9e6';

const headerCell: React.CSSProperties = {
  padding: '6px 8px',
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: '#ffffff',
  background: PURPLE_HEADER,
  borderBottom: '1px solid #4a2470',
  textAlign: 'center',
  fontFamily: inter,
  lineHeight: 1.2,
};

const segmentCell = (alt: boolean): React.CSSProperties => ({
  padding: '5px 8px',
  fontSize: 11,
  fontWeight: 600,
  color: '#0f172a',
  background: alt ? ROW_ALT : '#ffffff',
  borderBottom: '1px solid #e2e8f0',
  borderRight: '1px solid #e2e8f0',
  fontFamily: inter,
  textAlign: 'left',
  verticalAlign: 'middle',
});

const picklistCell = (alt: boolean): React.CSSProperties => ({
  padding: '3px 5px',
  background: INPUT_BG,
  borderBottom: '1px solid #e2e8f0',
  borderRight: '1px solid #e2e8f0',
  textAlign: 'center',
  verticalAlign: 'middle',
});

const selectStyle: React.CSSProperties = {
  width: '100%',
  minWidth: 0,
  boxSizing: 'border-box',
  padding: '5px 6px',
  fontSize: 13,
  lineHeight: 1.3,
  fontWeight: 500,
  fontFamily: inter,
  color: '#0f172a',
  background: INPUT_BG,
  border: '1px solid #cbd5e1',
  borderRadius: 6,
  cursor: 'pointer',
};

type Props = {
  data: AssessmentFormState;
  updateData: AssessmentUpdateFn;
};

export default function UpperGiFindingsTable({ data, updateData }: Props) {
  const findings = normalizeUpperGiFindings(
    parseUpperGiFindings((data as Record<string, unknown>).upperGiFindings),
  );
  const { rows } = findings;

  const setRowField = (
    segmentId: UpperGiSegmentId,
    field: 'endoscopicFinding' | 'biopsyTaken',
    value: string,
  ) => {
    const next: UpperGiFindingsData = {
      rows: JSON.parse(JSON.stringify(rows)) as UpperGiFindingsData['rows'],
    };
    next.rows[segmentId][field] = value;
    updateData({ upperGiFindings: serializeUpperGiFindings(normalizeUpperGiFindings(next)) });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <div style={{
        padding: '8px 12px',
        background: PURPLE_HEADER,
        borderRadius: '8px 8px 0 0',
      }}>
        <span style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          color: '#ffffff',
          fontFamily: inter,
          lineHeight: 1.25,
        }}>
          UPPER GI FINDINGS — Complete if OGD or Capsule Endoscopy performed
        </span>
      </div>

      <p style={{
        margin: 0,
        padding: '6px 10px',
        fontSize: 10,
        fontStyle: 'italic',
        lineHeight: 1.35,
        color: '#0f172a',
        background: PURPLE_NOTE,
        borderLeft: `1px solid ${PURPLE_HEADER}`,
        borderRight: `1px solid ${PURPLE_HEADER}`,
        fontFamily: inter,
      }}>
        {UPPER_GI_FINDINGS_NOTE}
      </p>

      <div style={{
        overflowX: 'hidden',
        borderRadius: '0 0 8px 8px',
        border: `1px solid ${PURPLE_HEADER}`,
        borderTop: 'none',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '28%' }} />
            <col style={{ width: '36%' }} />
            <col style={{ width: '36%' }} />
          </colgroup>
          <thead>
            <tr>
              <th style={{ ...headerCell, textAlign: 'left' }}>Upper GI Segment</th>
              <th style={headerCell}>Endoscopic Finding</th>
              <th style={headerCell}>Biopsy Taken</th>
            </tr>
          </thead>
          <tbody>
            {UPPER_GI_SEGMENTS.map((seg, index) => {
              const alt = index % 2 === 1;
              const picklists = UPPER_GI_SEGMENT_PICKLISTS[seg.id];
              const row = rows[seg.id];
              return (
                <tr key={seg.id}>
                  <td style={segmentCell(alt)}>{seg.label}</td>
                  <td style={picklistCell(alt)}>
                    <select
                      style={selectStyle}
                      value={row.endoscopicFinding}
                      onChange={(e) => setRowField(seg.id, 'endoscopicFinding', e.target.value)}
                    >
                      {picklists.endoscopicFinding.map((opt) => (
                        <option key={opt.value || '__empty'} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td style={picklistCell(alt)}>
                    <select
                      style={selectStyle}
                      value={row.biopsyTaken}
                      onChange={(e) => setRowField(seg.id, 'biopsyTaken', e.target.value)}
                    >
                      {picklists.biopsyTaken.map((opt) => (
                        <option key={opt.value || '__empty'} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        marginTop: 10,
        padding: '10px 12px',
        borderRadius: 8,
        border: '1px solid #cbd5e1',
        background: '#ffffff',
      }}>
        <label
          htmlFor="sesCdClinicalNotes"
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: '#0f172a',
            fontFamily: inter,
          }}
        >
          Clinical Notes / Impression
        </label>
        <textarea
          id="sesCdClinicalNotes"
          style={{
            width: '100%',
            minHeight: 72,
            padding: '8px 10px',
            fontSize: 13,
            lineHeight: 1.4,
            fontFamily: inter,
            color: '#0f172a',
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: 8,
            resize: 'vertical',
            boxSizing: 'border-box',
          }}
          rows={3}
          placeholder="Free-form clinical notes for the entire SES-CD scoring section…"
          value={data.sesCdClinicalNotes ?? ''}
          onChange={(e) => updateData({ sesCdClinicalNotes: e.target.value })}
          onFocus={(e) => {
            e.target.style.borderColor = '#0891b2';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#cbd5e1';
          }}
        />
        <p style={{
          margin: 0,
          fontSize: 10,
          color: '#64748b',
          fontFamily: inter,
          lineHeight: 1.35,
        }}>
          Optional notes for SES-CD scores, upper GI findings, and endoscopic impression.
        </p>
      </div>
    </div>
  );
}
