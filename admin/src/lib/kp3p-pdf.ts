import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ParsedSections } from './kp3p-parser';
import { getField, getRows, getBullets, getAlerts } from './kp3p-parser';

const M = 14;
const PRIMARY: [number, number, number] = [37, 99, 235];
const DANGER: [number, number, number] = [185, 28, 28];
const WARNING: [number, number, number] = [217, 119, 6];
const TEXT: [number, number, number] = [33, 37, 41];

type JsPdfWithTable = jsPDF & { lastAutoTable?: { finalY: number } };

function pw(doc: jsPDF): number {
  return doc.internal.pageSize.getWidth();
}

function ph(doc: jsPDF): number {
  return doc.internal.pageSize.getHeight();
}

function finalY(doc: jsPDF): number {
  const ly = (doc as JsPdfWithTable).lastAutoTable?.finalY;
  return typeof ly === 'number' ? ly : M;
}

function ensure(doc: jsPDF, y: number, need: number): number {
  if (y + need > ph(doc) - M) {
    doc.addPage();
    return M;
  }
  return y;
}

function band(doc: jsPDF, y: number, title: string): number {
  y = ensure(doc, y, 14);
  doc.setFillColor(...PRIMARY);
  doc.rect(M, y, pw(doc) - 2 * M, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(title, M + 2, y + 5);
  doc.setTextColor(...TEXT);
  doc.setFont('helvetica', 'normal');
  return y + 10;
}

function paragraph(doc: jsPDF, y: number, text: string, size = 8.5): number {
  if (!text?.trim()) return y;
  doc.setFontSize(size);
  doc.setFont('helvetica', 'normal');
  const lines = doc.splitTextToSize(text, pw(doc) - 2 * M);
  for (const line of lines) {
    y = ensure(doc, y, 5);
    doc.text(line, M, y);
    y += size * 0.42;
  }
  return y + 2;
}

function table(
  doc: jsPDF,
  y: number,
  head: string[][],
  body: string[][],
  colStyles?: Record<number, { cellWidth: number | 'auto' }>
): number {
  if (!body.length) return y;
  y = ensure(doc, y, 16);
  autoTable(doc, {
    startY: y,
    head,
    body,
    theme: 'striped',
    headStyles: { fillColor: PRIMARY, textColor: 255, fontStyle: 'bold' },
    margin: { left: M, right: M },
    styles: { fontSize: 7.5, cellPadding: 1.6, textColor: TEXT, lineColor: [226, 232, 240], lineWidth: 0.1 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: colStyles,
  });
  return finalY(doc) + 4;
}

function treatmentBlock(doc: jsPDF, y: number, text: string): number {
  const keys = [
    'MEDICATION',
    'DOSE',
    'SCHEDULE',
    'MECHANISM',
    'ONSET',
    'RATIONALE',
    'EVIDENCE',
    'ALTERNATIVE',
    'STEROID_BRIDGE',
  ] as const;
  const rows: string[][] = [];
  for (const k of keys) {
    const v = getField(text, k);
    if (v) rows.push([k.replace(/_/g, ' '), v]);
  }
  if (!rows.length) return paragraph(doc, y, text, 9);
  return table(doc, y, [['Field', 'Detail']], rows, {
    0: { cellWidth: 38 },
    1: { cellWidth: 'auto' },
  });
}

export function generateKP3PPdf(sections: ParsedSections): Buffer {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  let y = M;

  if (sections.HEADER) {
    y = band(doc, y, 'KP-3P — Protocol header');
    y = paragraph(doc, y, sections.HEADER, 9);
  }

  if (sections.RISK) {
    y = band(doc, y, 'Risk stratification');
    const r = sections.RISK;
    for (const key of ['RISK_LEVEL', 'TRAJECTORY', 'APPROACH', 'EVIDENCE', 'IMPLICATION'] as const) {
      const v = getField(r, key);
      if (v) y = paragraph(doc, y, `${key.replace(/_/g, ' ')}: ${v}`);
    }
    const bullets = getBullets(r);
    if (bullets.length) {
      y = ensure(doc, y, 6);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text('Risk factors', M, y);
      y += 5;
      doc.setFont('helvetica', 'normal');
      for (const b of bullets) {
        y = paragraph(doc, y, `• ${b}`);
      }
    }
  }

  if (sections.STRIDE) {
    y = band(doc, y, 'STRIDE-II targets');
    const rows = getRows(sections.STRIDE);
    y = table(doc, y, [['Pillar', 'Target', 'Timeline', 'Status']], rows, {
      0: { cellWidth: 30 },
      1: { cellWidth: 72 },
      2: { cellWidth: 24 },
      3: { cellWidth: 22 },
    });
    const esc = getField(sections.STRIDE, 'ESCALATION');
    if (esc) {
      doc.setFont('helvetica', 'bold');
      y = paragraph(doc, y, `Escalation: ${esc}`);
      doc.setFont('helvetica', 'normal');
    }
  }

  if (sections.SCREENING) {
    y = band(doc, y, 'Pre-treatment screening');
    const rows = getRows(sections.SCREENING);
    y = table(doc, y, [['Test', 'Result', 'Action']], rows, {
      0: { cellWidth: 50 },
      1: { cellWidth: 36 },
      2: { cellWidth: 'auto' },
    });
    for (const d of getAlerts(sections.SCREENING, 'ALERT_DANGER')) {
      doc.setFillColor(254, 226, 226);
      y = ensure(doc, y, 12);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      const alertLines = doc.splitTextToSize(`ALERT: ${d}`, pw(doc) - 2 * M - 4);
      const boxH = Math.min(6 + alertLines.length * 3.6, 36);
      doc.rect(M, y, pw(doc) - 2 * M, boxH, 'F');
      doc.setTextColor(...DANGER);
      let yy = y + 4;
      for (const line of alertLines) {
        doc.text(line, M + 2, yy);
        yy += 3.6;
      }
      y = y + boxH + 3;
      doc.setTextColor(...TEXT);
      doc.setFont('helvetica', 'normal');
    }
  }

  if (sections.VACCINES) {
    y = band(doc, y, 'Vaccination status');
    const rows = getRows(sections.VACCINES);
    y = table(doc, y, [['Vaccine', 'Status', 'Action']], rows, {
      0: { cellWidth: 44 },
      1: { cellWidth: 36 },
      2: { cellWidth: 'auto' },
    });
  }

  if (sections.TREATMENT) {
    y = band(doc, y, 'Treatment plan');
    y = treatmentBlock(doc, y, sections.TREATMENT);
  }

  if (sections.MONITORING) {
    y = band(doc, y, 'Monitoring schedule');
    const rows = getRows(sections.MONITORING);
    y = table(doc, y, [['When', 'Studies', 'Rationale']], rows, {
      0: { cellWidth: 34 },
      1: { cellWidth: 66 },
      2: { cellWidth: 'auto' },
    });
    const tdm = getField(sections.MONITORING, 'TDM');
    if (tdm) y = paragraph(doc, y, `TDM: ${tdm}`);
  }

  if (sections.COMORBIDITIES) {
    y = band(doc, y, 'Comorbidities & special considerations');
    const rows = getRows(sections.COMORBIDITIES);
    y = table(doc, y, [['Topic', 'Management']], rows, {
      0: { cellWidth: 55 },
      1: { cellWidth: 'auto' },
    });
  }

  if (sections.ALERTS) {
    y = band(doc, y, 'Clinical alerts');
    const a = sections.ALERTS;
    for (const d of getAlerts(a, 'ALERT_DANGER')) {
      doc.setTextColor(...DANGER);
      doc.setFont('helvetica', 'bold');
      y = paragraph(doc, y, `DANGER — ${d}`);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...TEXT);
    }
    for (const w of getAlerts(a, 'ALERT_WARNING')) {
      doc.setTextColor(...WARNING);
      y = paragraph(doc, y, `WARNING — ${w}`);
      doc.setTextColor(...TEXT);
    }
  }

  if (sections.EVIDENCE) {
    y = band(doc, y, 'Evidence base');
    for (const b of getBullets(sections.EVIDENCE)) {
      y = paragraph(doc, y, `• ${b}`);
    }
  }

  if (sections.PATIENT_TELUGU) {
    y = band(doc, y, 'Patient-facing care plan');
    y = paragraph(doc, y, sections.PATIENT_TELUGU, 8);
  }

  if (sections.CONTACT) {
    y = band(doc, y, 'Contact');
    y = paragraph(doc, y, sections.CONTACT, 9);
  }

  return Buffer.from(doc.output('arraybuffer'));
}
