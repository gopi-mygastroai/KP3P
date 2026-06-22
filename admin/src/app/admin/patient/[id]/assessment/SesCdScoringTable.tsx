'use client';

import React from 'react';
import type { AssessmentFormState, AssessmentUpdateFn } from '@/types/assessment-form';
import {
  SES_CD_SEGMENTS,
  SES_CD_VARIABLES,
  SES_CD_GRAND_TOTAL_MAX,
  columnTotal,
  normalizeSesCdScoring,
  parseSesCdScoring,
  rowTotal,
  scoreOptionsForCell,
  sesCdGrandTotal,
  sesCdInterpretation,
  SES_CD_INTERPRETATION_LEGEND,
  serializeSesCdScoring,
  type SesCdScoringData,
  type SesCdSegmentId,
  type SesCdVariableId,
} from '@/lib/ses-cd-scoring';

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
  textAlign: 'center',
  fontFamily: inter,
  lineHeight: 1.3,
};

/** Segment columns (Terminal Ileum … Rectum) — fixed share of table width. */
const segmentHeaderCell: React.CSSProperties = {
  ...headerCell,
  width: '13%',
  maxWidth: 108,
  padding: '6px 4px',
  fontSize: 9,
  lineHeight: 1.2,
  whiteSpace: 'normal',
  wordBreak: 'break-word',
  hyphens: 'auto',
};

const segmentDataCell: React.CSSProperties = {
  padding: '4px 3px',
  background: '#ffffff',
  borderBottom: '1px solid #e2e8f0',
  borderRight: '1px solid #e2e8f0',
  textAlign: 'center',
  width: '13%',
  maxWidth: 108,
};

const labelCell: React.CSSProperties = {
  padding: '8px 10px',
  fontSize: 11,
  fontWeight: 600,
  color: '#0f172a',
  background: '#ffffff',
  borderBottom: '1px solid #e2e8f0',
  borderRight: '1px solid #e2e8f0',
  fontFamily: inter,
  textAlign: 'left',
  lineHeight: 1.25,
  whiteSpace: 'normal',
  wordBreak: 'break-word',
};

const dataCell: React.CSSProperties = {
  padding: '6px 8px',
  background: '#ffffff',
  borderBottom: '1px solid #e2e8f0',
  borderRight: '1px solid #e2e8f0',
  textAlign: 'center',
};

const totalHeaderCell: React.CSSProperties = {
  ...headerCell,
  width: '11%',
  maxWidth: 88,
  padding: '6px 4px',
  fontSize: 9,
  lineHeight: 1.2,
  whiteSpace: 'normal',
  wordBreak: 'break-word',
};

const totalCell: React.CSSProperties = {
  ...dataCell,
  background: '#f1f5f9',
  fontWeight: 700,
  fontSize: 12,
  color: '#0f172a',
  fontFamily: inter,
  width: '11%',
  maxWidth: 88,
  padding: '6px 4px',
};

const totalRowLabel: React.CSSProperties = {
  ...labelCell,
  background: '#1e3a5f',
  color: '#ffffff',
  fontWeight: 700,
};

const selectStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '100%',
  minWidth: 0,
  boxSizing: 'border-box',
  padding: '8px 5px',
  fontSize: 13,
  lineHeight: 1.35,
  fontWeight: 600,
  fontFamily: inter,
  color: '#0f172a',
  background: '#ffffff',
  border: '1px solid #cbd5e1',
  borderRadius: 6,
  cursor: 'pointer',
};

type Props = {
  data: AssessmentFormState;
  updateData: AssessmentUpdateFn;
};

export default function SesCdScoringTable({ data, updateData }: Props) {
  const sesCd = normalizeSesCdScoring(
    parseSesCdScoring((data as Record<string, unknown>).sesCdScoring),
  );
  const { scores } = sesCd;
  const grandTotal = sesCdGrandTotal(scores);
  const interpretation = sesCdInterpretation(grandTotal);

  const setScore = (variableId: SesCdVariableId, segmentId: SesCdSegmentId, raw: string) => {
    const next: SesCdScoringData = {
      ...sesCd,
      scores: JSON.parse(JSON.stringify(scores)) as SesCdScoringData['scores'],
    };
    next.scores[variableId][segmentId] = Number(raw);
    updateData({ sesCdScoring: serializeSesCdScoring(normalizeSesCdScoring(next)) });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ overflowX: 'hidden', borderRadius: 10, border: '1px solid #cbd5e1' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '24%' }} />
            {SES_CD_SEGMENTS.map((seg) => (
              <col key={seg.id} style={{ width: '13%' }} />
            ))}
            <col style={{ width: '11%' }} />
          </colgroup>
          <thead>
            <tr>
              <th style={{ ...headerCell, textAlign: 'left' }}>SES-CD Variable</th>
              {SES_CD_SEGMENTS.map((seg) => (
                <th key={seg.id} style={segmentHeaderCell}>{seg.label}</th>
              ))}
              <th style={totalHeaderCell}>Segment Total</th>
            </tr>
          </thead>
          <tbody>
            {SES_CD_VARIABLES.map((variable) => (
              <tr key={variable.id}>
                <td style={labelCell}>{variable.label}</td>
                {SES_CD_SEGMENTS.map((seg) => {
                  const current = scores[variable.id][seg.id] ?? 0;
                  const options = scoreOptionsForCell(variable.id, seg.id);
                  return (
                    <td key={seg.id} style={segmentDataCell}>
                      <select
                        style={selectStyle}
                        value={String(current)}
                        onChange={(e) => setScore(variable.id, seg.id, e.target.value)}
                      >
                        {options.map((opt) => (
                          <option key={opt.score} value={String(opt.score)}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </td>
                  );
                })}
                <td style={totalCell}>{rowTotal(scores, variable.id)}</td>
              </tr>
            ))}
            <tr>
              <td style={totalRowLabel}>SES-CD Variable Total</td>
              {SES_CD_SEGMENTS.map((seg) => (
                <td key={seg.id} style={{ ...segmentDataCell, ...totalCell, background: '#1e3a5f', color: '#ffffff' }}>
                  {columnTotal(scores, seg.id)}
                </td>
              ))}
              <td style={{ ...totalCell, background: '#1e3a5f', color: '#ffffff', fontSize: 15 }}>
                {grandTotal}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        padding: '14px 18px',
        borderRadius: 10,
        background: '#1e3a5f',
        flexWrap: 'wrap',
      }}>
        <span style={{
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: '0.07em',
          textTransform: 'uppercase',
          color: '#ffffff',
          fontFamily: inter,
        }}>
          SES-CD Grand Total (0 to {SES_CD_GRAND_TOTAL_MAX})
        </span>
        <span style={{
          fontSize: 22,
          fontWeight: 800,
          color: '#ffffff',
          fontFamily: inter,
          minWidth: 48,
          textAlign: 'right',
        }}>
          {grandTotal}
        </span>
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
              SES-CD Interpretation
            </span>
          </div>
          <div style={{
            flex: '1 1 160px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            padding: '14px 18px',
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            borderLeft: 'none',
          }}>
            <span style={{
              fontSize: 22,
              fontWeight: 800,
              color: interpretation.color,
              fontFamily: inter,
              textAlign: 'right',
            }}>
              {interpretation.display}
            </span>
          </div>
        </div>
        <p style={{
          margin: 0,
          padding: '10px 14px',
          fontSize: 11,
          fontStyle: 'italic',
          lineHeight: 1.45,
          color: '#0f172a',
          background: '#e2e8f0',
          fontFamily: inter,
        }}>
          {SES_CD_INTERPRETATION_LEGEND}
        </p>
      </div>
    </div>
  );
}
