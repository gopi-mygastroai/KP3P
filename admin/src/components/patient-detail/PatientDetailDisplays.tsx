import type { CSSProperties } from 'react';
import {
  CURRENT_IBD_MEDICATION_CATALOG,
  parseCurrentIbdMedications,
} from '@/lib/current-ibd-medications';
import {
  parseSesCdScoring,
  scoreOptionsForCell,
  sesCdGrandTotal,
  sesCdInterpretation,
  SES_CD_SEGMENTS,
  SES_CD_VARIABLES,
  type SesCdSegmentId,
  type SesCdVariableId,
} from '@/lib/ses-cd-scoring';
import {
  parseUpperGiFindings,
  UPPER_GI_SEGMENT_PICKLISTS,
  UPPER_GI_SEGMENTS,
} from '@/lib/upper-gi-findings';
import {
  endoscopicRemission,
  MAYO_ENDOSCOPIC_SCORE_OPTIONS,
  MAYO_FIELD_LABEL,
  mesInterpretation,
  parseUcEndoscopicScoring,
  uceisInterpretation,
  uceisOptionLabel,
  uceisTotal,
  UCEIS_FIELDS,
} from '@/lib/uc-endoscopic-scoring';

const tableWrap: CSSProperties = {
  overflowX: 'auto',
  maxWidth: '100%',
  width: '100%',
  minWidth: 0,
  WebkitOverflowScrolling: 'touch',
  border: '0.5px solid #e2e8f0',
  borderRadius: 10,
  margin: '8px 12px 12px',
};

const thStyle: CSSProperties = {
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: 9,
  fontWeight: 700,
  color: '#64748b',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  padding: '8px 10px',
  textAlign: 'left',
  background: '#f8fafc',
  borderBottom: '0.5px solid #e2e8f0',
  whiteSpace: 'nowrap',
};

const tdStyle: CSSProperties = {
  fontSize: 12,
  color: '#0f172a',
  padding: '8px 10px',
  borderBottom: '0.5px solid #f1f5f9',
  verticalAlign: 'top',
};

function picklistLabel(
  options: readonly { value: string; label: string }[],
  value: string,
): string {
  if (!value) return '—';
  return options.find((o) => o.value === value)?.label ?? value;
}

function sesCdCellLabel(variableId: SesCdVariableId, segmentId: SesCdSegmentId, score: number): string {
  const options = scoreOptionsForCell(variableId, segmentId);
  return options.find((o) => o.score === score)?.label ?? String(score);
}

const MED_SECTION_HEADER = '#0e7490';

const medHeaderCell: CSSProperties = {
  padding: '8px 6px',
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: '#ffffff',
  background: MED_SECTION_HEADER,
  borderBottom: '1px solid #0c4a6e',
  textAlign: 'center',
  lineHeight: 1.2,
  whiteSpace: 'nowrap',
};

function medLabelCell(alt: boolean): CSSProperties {
  return {
    padding: '6px 8px',
    fontSize: 11,
    fontWeight: 600,
    color: '#0f172a',
    background: alt ? '#f0fdfa' : '#ffffff',
    borderBottom: '1px solid #e2e8f0',
    borderRight: '1px solid #e2e8f0',
    textAlign: 'left',
    verticalAlign: 'middle',
    lineHeight: 1.3,
  };
}

function medClassCell(alt: boolean): CSSProperties {
  return {
    ...medLabelCell(alt),
    fontSize: 10,
    fontWeight: 500,
    color: '#475569',
  };
}

const medValueCell: CSSProperties = {
  padding: '6px 8px',
  fontSize: 12,
  color: '#0f172a',
  borderBottom: '1px solid #e2e8f0',
  borderRight: '1px solid #e2e8f0',
  verticalAlign: 'middle',
  background: '#ffffff',
  lineHeight: 1.3,
};

function displayCell(value: string): string {
  return value.trim() || '—';
}

export function UcEndoscopicScoringDisplay({ raw }: { raw: unknown }) {
  const uc = parseUcEndoscopicScoring(raw);
  const mayo = uc.mayoEndoscopicScore;
  const uceisScores = uc.uceis;
  const uceisTotalScore = uceisTotal(uceisScores);
  const mesInterp = mesInterpretation(mayo);
  const uceisInterp = uceisInterpretation(uceisTotalScore);
  const remission = endoscopicRemission(mayo, uceisTotalScore);
  const mayoOpt = MAYO_ENDOSCOPIC_SCORE_OPTIONS.find((o) => o.score === mayo);

  return (
    <div className="pr-field-section" style={{ margin: '4px 8px 12px' }}>
      <div className="pr-field-section-title">UC Endoscopic Scoring</div>
      <div className="pr-field-grid pr-field-grid--legacy">
        <div className="pr-field">
          <div className="pr-field-label">{MAYO_FIELD_LABEL}</div>
          <div className="pr-field-value">
            {mayoOpt ? `${mayoOpt.label} — ${mayoOpt.helpText}` : String(mayo)}
          </div>
        </div>
        {UCEIS_FIELDS.map((field) => (
          <div className="pr-field" key={field.id}>
            <div className="pr-field-label">{field.label}</div>
            <div className="pr-field-value">{uceisOptionLabel(field.id, uceisScores[field.id])}</div>
          </div>
        ))}
        <div className="pr-field">
          <div className="pr-field-label">UCEIS Total</div>
          <div className="pr-field-value" style={{ color: uceisInterp.color, fontWeight: 600 }}>
            {uceisTotalScore} / 8 — {uceisInterp.display}
          </div>
        </div>
        <div className="pr-field">
          <div className="pr-field-label">MES Grade</div>
          <div className="pr-field-value" style={{ color: mesInterp.color, fontWeight: 600 }}>
            {mesInterp.display}
          </div>
        </div>
        <div className="pr-field" style={{ gridColumn: '1 / -1' }}>
          <div className="pr-field-label">Endoscopic Remission?</div>
          <div className="pr-field-value" style={{ color: remission.color, fontWeight: 600 }}>
            {remission.display}
          </div>
        </div>
      </div>
    </div>
  );
}

export function SesCdScoringDisplay({ raw }: { raw: unknown }) {
  const { scores } = parseSesCdScoring(raw);
  const grandTotal = sesCdGrandTotal(scores);
  const interpretation = sesCdInterpretation(grandTotal);

  return (
    <div className="pr-field-section" style={{ margin: '4px 8px 12px' }}>
      <div className="pr-field-section-title" style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
        <span>SES-CD Scoring</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: interpretation.color, textTransform: 'none', letterSpacing: 0 }}>
          Total: {grandTotal} / 60 — {interpretation.display}
        </span>
      </div>
      <div style={tableWrap} className="pr-contained-scroll">
        <table style={{ width: 'max-content', minWidth: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={thStyle}>Variable</th>
              {SES_CD_SEGMENTS.map((seg) => (
                <th key={seg.id} style={thStyle}>{seg.label}</th>
              ))}
              <th style={thStyle}>Row Total</th>
            </tr>
          </thead>
          <tbody>
            {SES_CD_VARIABLES.map((variable) => {
              const rowTotal = SES_CD_SEGMENTS.reduce(
                (sum, seg) => sum + (scores[variable.id][seg.id] ?? 0),
                0,
              );
              return (
                <tr key={variable.id}>
                  <td style={{ ...tdStyle, fontWeight: 500, minWidth: 160 }}>{variable.label}</td>
                  {SES_CD_SEGMENTS.map((seg) => (
                    <td key={seg.id} style={tdStyle}>
                      {sesCdCellLabel(variable.id, seg.id, scores[variable.id][seg.id] ?? 0)}
                    </td>
                  ))}
                  <td style={{ ...tdStyle, fontWeight: 600 }}>{rowTotal}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function UpperGiFindingsDisplay({
  raw,
  clinicalNotes,
}: {
  raw: unknown;
  clinicalNotes?: string | null;
}) {
  const upperGi = parseUpperGiFindings(raw);
  const filledRows = UPPER_GI_SEGMENTS.filter((seg) => {
    const row = upperGi.rows[seg.id];
    return Boolean(row.endoscopicFinding || row.biopsyTaken);
  });

  if (filledRows.length === 0 && !clinicalNotes?.trim()) return null;

  return (
    <div className="pr-field-section" style={{ margin: '4px 8px 12px' }}>
      <div className="pr-field-section-title">Upper GI Findings</div>
      {filledRows.length > 0 ? (
        <div style={tableWrap} className="pr-contained-scroll">
          <table style={{ width: 'max-content', minWidth: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Segment</th>
                <th style={thStyle}>Endoscopic Finding</th>
                <th style={thStyle}>Biopsy Taken</th>
              </tr>
            </thead>
            <tbody>
              {filledRows.map((seg) => {
                const row = upperGi.rows[seg.id];
                const picklists = UPPER_GI_SEGMENT_PICKLISTS[seg.id];
                return (
                  <tr key={seg.id}>
                    <td style={{ ...tdStyle, fontWeight: 500 }}>{seg.label}</td>
                    <td style={tdStyle}>
                      {picklistLabel(picklists.endoscopicFinding, row.endoscopicFinding)}
                    </td>
                    <td style={tdStyle}>
                      {picklistLabel(picklists.biopsyTaken, row.biopsyTaken)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p style={{ padding: '0 12px 8px', color: '#94a3b8', fontSize: 13 }}>No upper GI findings recorded.</p>
      )}
      {clinicalNotes?.trim() ? (
        <div className="pr-field" style={{ margin: '8px 12px 4px' }}>
          <div className="pr-field-label">Clinical Notes / Impression</div>
          <div className="pr-field-value">{clinicalNotes.trim()}</div>
        </div>
      ) : null}
    </div>
  );
}

export function CurrentIbdMedicationsDisplay({ raw }: { raw: unknown }) {
  const data = parseCurrentIbdMedications(raw);
  const rowById = Object.fromEntries(data.rows.map((row) => [row.drugId, row]));

  return (
    <div className="pr-contained-block" style={{ margin: '8px 12px 12px' }}>
      <div
        style={{
          padding: '8px 12px',
          background: MED_SECTION_HEADER,
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
            lineHeight: 1.25,
          }}
        >
          CURRENT IBD MEDICATIONS
        </span>
      </div>
      <div className="pr-contained-scroll" style={{
          border: `1px solid ${MED_SECTION_HEADER}`,
          borderTop: 'none',
          borderRadius: '0 0 8px 8px',
        }}
      >
        <table style={{ width: 'max-content', minWidth: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ ...medHeaderCell, minWidth: 160, textAlign: 'left' }}>DRUG NAME</th>
              <th style={{ ...medHeaderCell, minWidth: 120, textAlign: 'left' }}>CLASS</th>
              <th style={{ ...medHeaderCell, minWidth: 130 }}>CURRENTLY TAKING?</th>
              <th style={{ ...medHeaderCell, minWidth: 88 }}>DOSE (mg)</th>
              <th style={{ ...medHeaderCell, minWidth: 88 }}>DOSE UNIT</th>
              <th style={{ ...medHeaderCell, minWidth: 140 }}>FREQUENCY</th>
              <th style={{ ...medHeaderCell, minWidth: 120 }}>ROUTE</th>
              <th style={{ ...medHeaderCell, minWidth: 120 }}>DURATION (free text)</th>
              <th style={{ ...medHeaderCell, minWidth: 160 }}>REASON FOR STOPPING (if stopped)</th>
            </tr>
          </thead>
          <tbody>
            {CURRENT_IBD_MEDICATION_CATALOG.map((entry, index) => {
              const row = rowById[entry.id];
              if (!row) return null;
              const alt = index % 2 === 1;

              return (
                <tr key={entry.id}>
                  <td style={medLabelCell(alt)}>
                    {entry.allowSpecify ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span>{entry.drugName}</span>
                        {row.otherSpecify?.trim() ? (
                          <span style={{ fontSize: 11, color: '#475569', fontWeight: 500 }}>
                            {row.otherSpecify.trim()}
                          </span>
                        ) : (
                          <span style={{ fontSize: 11, color: '#cbd5e1', fontStyle: 'italic' }}>—</span>
                        )}
                      </div>
                    ) : (
                      entry.drugName
                    )}
                  </td>
                  <td style={medClassCell(alt)}>{entry.drugClass}</td>
                  <td style={medValueCell}>{displayCell(row.currentlyTaking)}</td>
                  <td style={medValueCell}>{displayCell(row.doseMg)}</td>
                  <td style={medValueCell}>{displayCell(row.doseUnit)}</td>
                  <td style={medValueCell}>{displayCell(row.frequency)}</td>
                  <td style={medValueCell}>{displayCell(row.route)}</td>
                  <td style={medValueCell}>{displayCell(row.duration)}</td>
                  <td style={medValueCell}>{displayCell(row.reasonForStopping)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function responseToTreatmentColor(value: string): string {
  const v = value.toLowerCase();
  if (v.includes('excellent') || v.includes('remission')) return '#16a34a';
  if (v.includes('partial')) return '#0369a1';
  if (v.includes('no response') || v.includes('loss of response')) return '#dc2626';
  if (v.includes('not applicable')) return '#94a3b8';
  return '#d97706';
}
