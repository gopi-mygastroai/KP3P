'use client';
import { useState, useRef, useCallback } from 'react';
import { PatientData } from '@/lib/kp3p-prompt';
import { injectKp3pLocalDetails } from '@/lib/kp3p-post-process';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const DEFAULT_CARESHEET_FAILURE =
  'Care sheet generation failed. Please try again or contact support.';

const KP3P_PREVIEW_STYLES = `
  /* ── Base ── */
  .kp3p-preview * { box-sizing: border-box; }
  .kp3p-preview {
    outline: none;
    font-family: -apple-system, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
    font-size: 12px;
    color: #0f172a;
    line-height: 1.62;
    background: #fff;
  }
  .kp3p-preview:focus {
    box-shadow: inset 0 0 0 2px rgba(59,130,246,0.3);
    border-radius: 4px;
  }

  /* ── Document title (h2) ── */
  .kp3p-preview h2 {
    font-size: 16px;
    font-weight: 800;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: #0f172a;
    background: transparent;
    margin: 0 -52px 20px -52px;
    padding: 15px 52px 12px 52px;
    border: none;
    border-bottom: 2px solid #0f172a;
    page-break-after: avoid;
    break-after: avoid;
    box-shadow: none;
  }

  /* ── Major sections (h3) ── */
  .kp3p-preview h3 {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #0f172a;
    background: transparent;
    margin: 18px 0 10px 0;
    padding: 0 0 6px 0;
    border: none;
    border-bottom: 2px solid #cbd5e1;
    page-break-after: avoid;
    break-after: avoid;
  }

  /* ── Sub-sections (h4) ── */
  .kp3p-preview h4 {
    font-size: 13px;
    font-weight: 700;
    color: #0f172a;
    margin: 16px 0 6px 0;
    padding: 0;
    border: none;
    page-break-after: avoid;
    break-after: avoid;
  }

  /* ── Labels (h5) ── */
  .kp3p-preview h5 {
    font-size: 11px;
    font-weight: 700;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin: 12px 0 4px 0;
    page-break-after: avoid;
    break-after: avoid;
  }

  /* ── Paragraphs — clean prose, no boxes ── */
  .kp3p-preview p {
    margin: 0 0 8px 0;
    page-break-inside: avoid;
    break-inside: avoid;
    color: #1e293b;
    font-size: 12px;
  }

  /* ── Bold ── */
  .kp3p-preview b, .kp3p-preview strong {
    font-weight: 700;
    color: #0f172a;
  }

  /* ── Italic ── */
  .kp3p-preview em, .kp3p-preview i {
    color: #475569;
    font-style: italic;
  }

  /* ── Tables ── */
  .kp3p-preview table {
    width: 100%;
    border-collapse: collapse;
    margin: 10px 0 16px 0;
    font-size: 11.5px;
    page-break-inside: auto;
    break-inside: auto;
    border: 1px solid #cbd5e1;
  }

  /* Tighten the gap when a table directly follows a heading or label paragraph */
  .kp3p-preview h2 + table,
  .kp3p-preview h3 + table,
  .kp3p-preview h4 + table,
  .kp3p-preview h5 + table,
  .kp3p-preview p + table {
    margin-top: 4px;
  }
  .kp3p-preview tr {
    page-break-inside: avoid;
    break-inside: avoid;
    page-break-after: auto;
    break-after: auto;
  }

  /* Header row — either explicit thead OR first row of any table */
  .kp3p-preview thead tr,
  .kp3p-preview table > tr:first-child,
  .kp3p-preview tbody > tr:first-child {
    background: #f1f5f9;
  }
  .kp3p-preview thead th,
  .kp3p-preview th,
  .kp3p-preview thead tr td,
  .kp3p-preview table > tr:first-child td,
  .kp3p-preview tbody > tr:first-child td {
    background: #f1f5f9;
    color: #0f172a;
    font-weight: 700;
    font-size: 11px;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    padding: 10px 14px;
    border: 1px solid #cbd5e1;
    border-right: 1px solid #e2e8f0;
    text-align: left;
    vertical-align: middle;
  }
  .kp3p-preview thead th:last-child,
  .kp3p-preview thead tr td:last-child,
  .kp3p-preview table > tr:first-child td:last-child,
  .kp3p-preview tbody > tr:first-child td:last-child {
    border-right: 1px solid #cbd5e1;
  }

  /* Body cells */
  .kp3p-preview td {
    padding: 10px 14px;
    border: 1px solid #e2e8f0;
    color: #1e293b;
    vertical-align: top;
    line-height: 1.55;
  }

  /* Zebra striping on body rows (skip the first row which is header) */
  .kp3p-preview tbody tr:nth-of-type(even):not(:first-child) { background: #f8fafc; }
  .kp3p-preview tbody tr:nth-of-type(odd):not(:first-child) { background: #ffffff; }

  /* First column emphasis */
  .kp3p-preview tbody tr:not(:first-child) td:first-child {
    font-weight: 600;
    color: #0f172a;
  }

  /* ── Lists ── */
  .kp3p-preview ul, .kp3p-preview ol {
    margin: 6px 0 12px 0;
    padding-left: 20px;
  }
  .kp3p-preview li {
    margin-bottom: 5px;
    color: #1e293b;
    line-height: 1.6;
    page-break-inside: avoid;
    break-inside: avoid;
    font-size: 12px;
  }
  .kp3p-preview li::marker { color: #1e40af; font-weight: 700; }

  /* Ordered list (medications, etc) - slightly more spacing */
  .kp3p-preview ol > li {
    padding: 3px 0 6px 0;
    margin-bottom: 8px;
  }

  /* ── Horizontal rule ── */
  .kp3p-preview hr {
    border: none;
    border-top: 1px solid #cbd5e1;
    margin: 16px 0;
  }

  /* ── Links ── */
  .kp3p-preview a {
    color: #1e40af;
    text-decoration: none;
  }

  /* ── Avoid orphans/widows on key blocks ── */
  .kp3p-preview h2 + p,
  .kp3p-preview h3 + p,
  .kp3p-preview h4 + p { page-break-before: avoid; break-before: avoid; }

  /* ── PDF export overrides (html2canvas slice; margins applied in JS) ── */
  .kp3p-preview-pdf {
    padding: 4px 0 12px 0;
  }
  .kp3p-preview-pdf h2 {
    margin: 0 0 22px 0;
    padding: 0 0 10px 0;
  }
  .kp3p-preview-pdf h3 {
    margin: 22px 0 12px 0;
    padding: 0 0 8px 0;
  }
  .kp3p-preview-pdf h4 {
    margin: 18px 0 8px 0;
  }
  .kp3p-preview-pdf p {
    margin: 0 0 10px 0;
  }
  .kp3p-preview-pdf table {
    margin: 14px 0 22px 0;
  }
  .kp3p-preview-pdf ul,
  .kp3p-preview-pdf ol {
    margin: 8px 0 16px 0;
  }
  .kp3p-preview-pdf hr {
    margin: 20px 0;
  }
`;

/** A4 page margins (mm) applied when placing slices on each PDF page */
const PDF_PAGE_MARGIN = { top: 14, bottom: 16, left: 15, right: 15 } as const;
/** Extra canvas px (scale 2) kept between page slices for breathing room */
const PDF_SLICE_GAP_PX = 12;


function isAbortError(e: unknown): boolean {
  return (
    (e instanceof DOMException && e.name === 'AbortError') ||
    (e instanceof Error && e.name === 'AbortError')
  );
}

async function readJsonSafe(res: Response): Promise<Record<string, unknown>> {
  try {
    const data: unknown = await res.json();
    return data !== null && typeof data === 'object' && !Array.isArray(data)
      ? (data as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

function safeFileSegment(name: string): string {
  const s = name.replace(/[/\\?%*:|"<>]/g, '_').trim();
  return s || 'Patient';
}

function normalizeHeadingText(el: Element): string {
  return (el.textContent ?? '').replace(/\s+/g, ' ').trim();
}

function topLevelBoundary(previewRoot: HTMLElement, startEl: Element): HTMLElement | null {
  let boundary: Element | null = startEl;
  while (boundary && boundary.parentElement !== previewRoot) {
    boundary = boundary.parentElement;
  }
  return boundary as HTMLElement | null;
}

function findDocumentStart(
  previewRoot: HTMLElement,
  docNumber: 2 | 3,
): HTMLElement | null {
  const headings = [...previewRoot.querySelectorAll('h2, h3')] as HTMLElement[];
  const pattern =
    docNumber === 2
      ? /DOCUMENT\s*2|PATIENT\s*INFORMATION\s*SHEET|YOUR\s*IBD\s*CARE\s*PLAN/i
      : /DOCUMENT\s*3|PRESCRIPTION\s*SHEET/i;

  const match = headings.find((h) => pattern.test(normalizeHeadingText(h)));
  if (!match) return null;

  let start: Element = match;
  if (match.tagName === 'H3') {
    const prev = match.previousElementSibling;
    if (prev?.tagName === 'H2' && pattern.test(normalizeHeadingText(prev))) {
      start = prev;
    }
  }
  return topLevelBoundary(previewRoot, start);
}

function getKp3pDocumentSections(previewRoot: HTMLElement): {
  doc1: HTMLElement[];
  doc2: HTMLElement[];
  doc3: HTMLElement[];
} | null {
  const topLevel = [...previewRoot.children] as HTMLElement[];
  const doc2Boundary = findDocumentStart(previewRoot, 2);
  const doc3Boundary = findDocumentStart(previewRoot, 3);
  if (!doc2Boundary || !doc3Boundary) return null;

  const idx2 = topLevel.indexOf(doc2Boundary);
  const idx3 = topLevel.indexOf(doc3Boundary);
  if (idx2 < 1 || idx3 <= idx2) return null;

  return {
    doc1: topLevel.slice(0, idx2),
    doc2: topLevel.slice(idx2, idx3),
    doc3: topLevel.slice(idx3),
  };
}

function splitHtmlIntoDocuments(html: string): {
  doc1: string;
  doc2: string;
  doc3: string;
} | null {
  const root = document.createElement('div');
  root.className = 'kp3p-preview';
  root.innerHTML = html;
  const sections = getKp3pDocumentSections(root);
  if (
    !sections ||
    sections.doc1.length === 0 ||
    sections.doc2.length === 0 ||
    sections.doc3.length === 0
  ) {
    return null;
  }
  return {
    doc1: sections.doc1.map((node) => node.outerHTML).join(''),
    doc2: sections.doc2.map((node) => node.outerHTML).join(''),
    doc3: sections.doc3.map((node) => node.outerHTML).join(''),
  };
}

function buildPdfHost(sectionHtml: string, widthPx: number): HTMLDivElement {
  const host = document.createElement('div');
  Object.assign(host.style, {
    position: 'fixed',
    left: '-12000px',
    top: '0',
    width: `${widthPx}px`,
    boxSizing: 'border-box',
    backgroundColor: '#ffffff',
    padding: '44px 48px',
    fontFamily: "-apple-system, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
    color: '#0f172a',
    lineHeight: '1.62',
    zIndex: '2147483646',
    opacity: '1',
    pointerEvents: 'none',
    overflow: 'visible',
    fontSize: '12px',
  });
  const styleEl = document.createElement('style');
  styleEl.textContent = KP3P_PREVIEW_STYLES;
  host.appendChild(styleEl);
  const inner = document.createElement('div');
  inner.className = 'kp3p-preview kp3p-preview-pdf';
  inner.innerHTML = sectionHtml;
  host.appendChild(inner);
  document.body.appendChild(host);
  return host;
}

async function downloadSectionPdf(
  sectionHtml: string,
  fileName: string,
  widthPx: number,
): Promise<void> {
  const host = buildPdfHost(sectionHtml, widthPx);
  try {
    await htmlHostToPdf(host, fileName);
  } finally {
    host.remove();
  }
}

/**
 * Section headings that MUST start on a new page when found in the document.
 * Matched case-insensitively against trimmed heading text content.
 * These force a page break BEFORE the heading.
 */
const FORCED_BREAK_BEFORE_PATTERNS: RegExp[] = [
  // Document 1 — Clinician Record section structure
  /STRIDE.{0,5}II/i,           // "STRIDE-II THERAPEUTIC TARGETS" → page 2
  /Vaccination\s+Protocol/i,    // "Vaccination Protocol" → page 3
  /^P3\b/i,                     // "P3 — TREATMENT & MONITORING..." → page 4
  /Long.?term\s+Surveillance/i, // "Long-term Surveillance" → page 5
  /Physician\s+Alerts?/i,       // "Physician Alerts" → page 6
];

type TableBlockGuard = {
  /** Top of the kept block (subheading if present, else table). */
  groupTop: number;
  subheadingBottom: number | null;
  tableTop: number;
  headerTop: number;
  headerBottom: number;
  firstBodyTop: number | null;
  keepTogetherBottom: number;
};

/** Nearest h2–h5 before a table, skipping optional label paragraphs. */
function findPrecedingTableSubheading(table: HTMLTableElement): HTMLElement | null {
  let el: Element | null = table.previousElementSibling;
  while (el) {
    if (/^H[2-5]$/.test(el.tagName)) return el as HTMLElement;
    if (el.tagName === 'P') {
      el = el.previousElementSibling;
      continue;
    }
    break;
  }
  return null;
}

function isHeadingBeforeTable(h: Element): boolean {
  let sib: Element | null = h.nextElementSibling;
  while (sib) {
    if (sib.tagName === 'TABLE') return true;
    if (/^H[2-5]$/.test(sib.tagName)) return false;
    if (sib.tagName === 'P') {
      sib = sib.nextElementSibling;
      continue;
    }
    break;
  }
  return false;
}

function isLabelParagraphBeforeTable(p: Element): boolean {
  return p.tagName === 'P' && p.nextElementSibling?.tagName === 'TABLE';
}

/** Keep subheading + table header + first body row on the same page. */
function collectTableBlockGuards(
  root: HTMLElement,
  toCanvasPx: (cssY: number) => number,
): TableBlockGuard[] {
  const guards: TableBlockGuard[] = [];

  root.querySelectorAll('table').forEach((table) => {
    const rows = [...table.querySelectorAll('tr')] as HTMLElement[];
    const subheading = findPrecedingTableSubheading(table);
    const tableRect = table.getBoundingClientRect();
    const tableTop = toCanvasPx(tableRect.top);
    const tableBottom = toCanvasPx(tableRect.bottom);
    const groupTop = subheading
      ? toCanvasPx(subheading.getBoundingClientRect().top)
      : tableTop;
    const subheadingBottom = subheading
      ? toCanvasPx(subheading.getBoundingClientRect().bottom)
      : null;

    if (rows.length < 2) {
      guards.push({
        groupTop,
        subheadingBottom,
        tableTop,
        headerTop: tableTop,
        headerBottom: tableBottom,
        firstBodyTop: null,
        keepTogetherBottom: tableBottom,
      });
      return;
    }

    const theadRows = [...table.querySelectorAll('thead tr')] as HTMLElement[];
    let headerRows: HTMLElement[];
    let firstBodyRow: HTMLElement;

    if (theadRows.length > 0) {
      headerRows = theadRows;
      firstBodyRow =
        (table.querySelector('tbody tr') as HTMLElement | null) ??
        rows.find((row) => !theadRows.includes(row))!;
    } else {
      headerRows = [rows[0]];
      firstBodyRow = rows[1];
    }

    if (!firstBodyRow || headerRows.includes(firstBodyRow)) return;

    const headerTop = Math.min(
      ...headerRows.map((row) => toCanvasPx(row.getBoundingClientRect().top)),
    );
    const headerBottom = Math.max(
      ...headerRows.map((row) => toCanvasPx(row.getBoundingClientRect().bottom)),
    );
    const firstBodyTop = toCanvasPx(firstBodyRow.getBoundingClientRect().top);
    const keepTogetherBottom = toCanvasPx(firstBodyRow.getBoundingClientRect().bottom);

    if (keepTogetherBottom > groupTop + 1) {
      guards.push({
        groupTop,
        subheadingBottom,
        tableTop,
        headerTop,
        headerBottom,
        firstBodyTop,
        keepTogetherBottom,
      });
    }
  });

  return guards;
}

function isTableHeaderRow(tr: HTMLTableRowElement): boolean {
  if (tr.closest('thead')) return true;
  const table = tr.closest('table');
  if (!table) return false;
  return tr === table.querySelector('tr') && !table.querySelector('thead tr');
}

async function htmlHostToPdf(host: HTMLElement, fileName: string): Promise<void> {
  const originalHeight = host.style.height;
  const originalOverflow = host.style.overflow;
  host.style.height = 'auto';
  host.style.overflow = 'visible';

  try {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfPageWidth = pdf.internal.pageSize.getWidth();
    const pdfPageHeight = pdf.internal.pageSize.getHeight();
    const contentWidthMm =
      pdfPageWidth - PDF_PAGE_MARGIN.left - PDF_PAGE_MARGIN.right;
    const contentHeightMm =
      pdfPageHeight - PDF_PAGE_MARGIN.top - PDF_PAGE_MARGIN.bottom;

    const fullCanvas = await html2canvas(host, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    const canvasWidth = fullCanvas.width;
    const canvasHeight = fullCanvas.height;
    const pxPerMm = canvasWidth / pdfPageWidth;
    const pageContentHeightPx = contentHeightMm * pxPerMm;

    const inner = host.querySelector('.kp3p-preview') ?? host;
    const hostRect = host.getBoundingClientRect();
    const toCanvasPx = (cssY: number) => (cssY - hostRect.top) * 2;

    type Range = { top: number; bottom: number; height: number };

    // Atomic blocks — never slice through the middle of these
    const atomicBlocks: Range[] = [];
    inner
      .querySelectorAll('tr, li, h2, h3, h4, h5, thead, tbody')
      .forEach((el) => {
        const rect = el.getBoundingClientRect();
        const top = toCanvasPx(rect.top);
        const bottom = toCanvasPx(rect.bottom);
        if (bottom > top + 1) atomicBlocks.push({ top, bottom, height: bottom - top });
      });

    const tableBlockGuards = collectTableBlockGuards(inner as HTMLElement, toCanvasPx);

    const breakCandidates: number[] = [0];
    inner.querySelectorAll('tr, p, h2, h3, h4, h5, li, table, hr').forEach((el) => {
      if (el.tagName === 'TR') {
        const tr = el as HTMLTableRowElement;
        const table = tr.closest('table');
        if (table && isTableHeaderRow(tr) && table.querySelectorAll('tr').length > 1) {
          return;
        }
      }
      if (/^H[2-5]$/.test(el.tagName) && isHeadingBeforeTable(el)) {
        return;
      }
      if (isLabelParagraphBeforeTable(el)) {
        return;
      }
      const rect = el.getBoundingClientRect();
      breakCandidates.push(toCanvasPx(rect.bottom));
    });
    breakCandidates.push(canvasHeight);
    const sortedBreaks = [...new Set(breakCandidates.map((c) => Math.round(c)))].sort(
      (a, b) => a - b,
    );

    const keepTogether: Range[] = [];
    for (const guard of tableBlockGuards) {
      keepTogether.push({
        top: guard.groupTop,
        bottom: guard.keepTogetherBottom,
        height: guard.keepTogetherBottom - guard.groupTop,
      });
    }
    inner.querySelectorAll('table').forEach((t) => {
      const rect = t.getBoundingClientRect();
      const top = toCanvasPx(rect.top);
      const bottom = toCanvasPx(rect.bottom);
      const height = bottom - top;
      if (height <= pageContentHeightPx * 0.92) {
        keepTogether.push({ top, bottom, height });
      }
    });

    // Keep each table row together when the table spans multiple pages
    inner.querySelectorAll('table tr').forEach((tr) => {
      const rect = tr.getBoundingClientRect();
      const top = toCanvasPx(rect.top);
      const bottom = toCanvasPx(rect.bottom);
      keepTogether.push({ top, bottom, height: bottom - top });
    });

    // Keep heading + immediate following block together
    inner.querySelectorAll('h2, h3, h4').forEach((heading) => {
      let sibling = heading.nextElementSibling;
      while (sibling && !['P', 'TABLE', 'UL', 'OL', 'H2', 'H3', 'H4', 'H5'].includes(sibling.tagName)) {
        sibling = sibling.nextElementSibling;
      }
      if (!sibling || ['H2', 'H3', 'H4'].includes(sibling.tagName)) return;
      const hRect = heading.getBoundingClientRect();
      const sRect = sibling.getBoundingClientRect();
      const top = toCanvasPx(hRect.top);
      const bottom = toCanvasPx(sRect.bottom);
      const height = bottom - top;
      if (height <= pageContentHeightPx * 0.85) {
        keepTogether.push({ top, bottom, height });
      }
    });

    const forcedBreaks: number[] = [];
    inner.querySelectorAll('h2, h3, h4, h5').forEach((h) => {
      const text = (h.textContent ?? '').replace(/\s+/g, ' ').trim();
      if (FORCED_BREAK_BEFORE_PATTERNS.some((p) => p.test(text))) {
        const top = toCanvasPx(h.getBoundingClientRect().top);
        if (top > 10) forcedBreaks.push(top);
      }
    });

    const isCutThroughAtomic = (cut: number): boolean =>
      atomicBlocks.some(({ top, bottom }) => cut > top + 3 && cut < bottom - 3);

    const pickCutBefore = (pageStart: number, limit: number): number => {
      const cands = sortedBreaks.filter((c) => c > pageStart + 8 && c <= limit);
      for (let i = cands.length - 1; i >= 0; i--) {
        const cut = cands[i];
        if (!isCutThroughAtomic(cut)) return cut;
      }
      return limit;
    };

    let pageStart = 0;
    let isFirstPage = true;

    while (pageStart < canvasHeight - 1) {
      const idealEnd = pageStart + pageContentHeightPx - PDF_SLICE_GAP_PX;
      let safeCut: number;

      if (idealEnd >= canvasHeight - 2) {
        safeCut = canvasHeight;
      } else {
        const forcedInPage = forcedBreaks.filter(
          (f) => f > pageStart + 8 && f <= idealEnd,
        );

        if (forcedInPage.length > 0) {
          safeCut = Math.min(...forcedInPage);
        } else {
          const straddlers = keepTogether.filter(
            (r) =>
              r.top > pageStart + 8 &&
              r.top < idealEnd &&
              r.bottom > idealEnd &&
              r.height <= pageContentHeightPx * 0.92,
          );

          if (straddlers.length > 0) {
            const earliestTop = Math.min(...straddlers.map((r) => r.top));
            safeCut = pickCutBefore(pageStart, earliestTop);
          } else {
            safeCut = pickCutBefore(pageStart, idealEnd);
          }

          // Orphan heading: don't leave a lone heading at the bottom of a page
          inner.querySelectorAll('h2, h3, h4, h5').forEach((h) => {
            const rect = h.getBoundingClientRect();
            const top = toCanvasPx(rect.top);
            const bottom = toCanvasPx(rect.bottom);
            if (
              top > pageStart + pageContentHeightPx * 0.78 &&
              top < safeCut &&
              bottom > safeCut - 4
            ) {
              safeCut = Math.min(safeCut, top);
            }
          });

          // Orphan table block: subheading and/or header must not sit alone before a page break
          for (const guard of tableBlockGuards) {
            if (guard.subheadingBottom !== null) {
              const subheadingOnPage =
                guard.groupTop >= pageStart &&
                guard.subheadingBottom <= safeCut + 2;
              const tableStartsAfterCut = guard.tableTop >= safeCut - 2;
              if (subheadingOnPage && tableStartsAfterCut && guard.groupTop > pageStart + 8) {
                safeCut = Math.min(safeCut, guard.groupTop);
              }
            }

            const headerOnPage =
              guard.headerTop >= pageStart &&
              guard.headerTop < idealEnd &&
              guard.headerBottom <= safeCut + 2;
            const bodyStartsAfterCut =
              guard.firstBodyTop !== null && guard.firstBodyTop >= safeCut - 2;
            if (headerOnPage && bodyStartsAfterCut && guard.groupTop > pageStart + 8) {
              safeCut = Math.min(safeCut, guard.groupTop);
            }
          }

          safeCut = pickCutBefore(pageStart, safeCut);
        }

        if (safeCut <= pageStart + 8) safeCut = idealEnd;
        if (isCutThroughAtomic(safeCut)) {
          safeCut = pickCutBefore(pageStart, safeCut - 4);
        }
        if (safeCut <= pageStart + 8) safeCut = Math.min(idealEnd, canvasHeight);
      }

      const sliceHeight = Math.round(safeCut - pageStart);
      if (sliceHeight <= 0) break;

      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = canvasWidth;
      pageCanvas.height = sliceHeight;
      const ctx = pageCanvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(
          fullCanvas,
          0,
          pageStart,
          canvasWidth,
          sliceHeight,
          0,
          0,
          canvasWidth,
          sliceHeight,
        );
      }

      const imgData = pageCanvas.toDataURL('image/png');
      const sliceHeightMm = sliceHeight / pxPerMm;

      if (!isFirstPage) pdf.addPage();
      pdf.addImage(
        imgData,
        'PNG',
        PDF_PAGE_MARGIN.left,
        PDF_PAGE_MARGIN.top,
        contentWidthMm,
        sliceHeightMm,
      );
      isFirstPage = false;

      pageStart = safeCut;
    }

    pdf.save(fileName);
  } finally {
    host.style.height = originalHeight;
    host.style.overflow = originalOverflow;
  }
}

const REVIEW_STEP_META: Record<
  1 | 2 | 3,
  { title: string; hint: string; fileSuffix: string }
> = {
  1: {
    title: 'Clinician Record',
    hint: 'Review and edit the Clinician Record, then approve to continue to Patient Information.',
    fileSuffix: 'Clinician_Record',
  },
  2: {
    title: 'Patient Information',
    hint: 'Review and edit Patient Information, then approve to continue to Prescription.',
    fileSuffix: 'Patient_Information',
  },
  3: {
    title: 'Prescription',
    hint: 'Review and edit the Prescription. Once approved, download all 3 PDFs.',
    fileSuffix: 'Prescription',
  },
};

export function CaresheetButton({
  patient,
  className,
  label,
}: {
  patient: PatientData;
  className?: string;
  label?: string;
}) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'preview'>('idle');
  const [loadingPhase, setLoadingPhase] = useState<'none' | 'llm' | 'pdf'>('none');
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [htmlContent, setHtmlContent] = useState('');
  const [docSections, setDocSections] = useState<{
    doc1: string;
    doc2: string;
    doc3: string;
  } | null>(null);
  const [reviewStep, setReviewStep] = useState<1 | 2 | 3>(1);
  // Track which docs have been approved (edited HTML saved)
  const [approvedDocs, setApprovedDocs] = useState<{
    doc1: string | null;
    doc2: string | null;
    doc3: string | null;
  }>({ doc1: null, doc2: null, doc3: null });

  const previewRef = useRef<HTMLDivElement>(null);
  const llmAbortRef = useRef<AbortController | null>(null);

  const dismissBanner = () => setBannerError(null);

  const handleCancelLlmGeneration = useCallback(() => {
    llmAbortRef.current?.abort();
  }, []);

  const handleGenerateClick = async () => {
    const ac = new AbortController();
    llmAbortRef.current = ac;
    setLoadingPhase('llm');
    setStatus('loading');
    setBannerError(null);
    setHtmlContent('');
    setDocSections(null);
    setReviewStep(1);
    setApprovedDocs({ doc1: null, doc2: null, doc3: null });
    try {
      const res = await fetch('/api/generate-caresheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patient),
        signal: ac.signal,
      });

      const contentType = res.headers.get('content-type') ?? '';

      if (!res.ok) {
        if (contentType.includes('application/json')) {
          const data = await readJsonSafe(res);
          const apiMessage =
            typeof data.error === 'string' && data.error.trim() ? data.error : null;
          setBannerError(apiMessage ?? DEFAULT_CARESHEET_FAILURE);
        } else {
          const text = await res.text();
          setBannerError(text.trim() || DEFAULT_CARESHEET_FAILURE);
        }
        setStatus('idle');
        return;
      }

      if (!res.body) {
        setBannerError(DEFAULT_CARESHEET_FAILURE);
        setStatus('idle');
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let html = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        html += decoder.decode(value, { stream: true });
        setHtmlContent(html);
      }
      html += decoder.decode();

      if (!html.trim() || html.length < 100) {
        setBannerError(DEFAULT_CARESHEET_FAILURE);
        setHtmlContent('');
        setStatus('idle');
        return;
      }

      const injected = injectKp3pLocalDetails(html, {
        patientName: patient.name,
        patientId: patient.id,
      });
      const split = splitHtmlIntoDocuments(injected);
      if (!split) {
        setBannerError(
          'Could not split into three documents. Keep the "DOCUMENT 2" and "DOCUMENT 3" headings, then try again.',
        );
        setHtmlContent('');
        setStatus('idle');
        return;
      }
      setHtmlContent(injected);
      setDocSections(split);
      setReviewStep(1);
      setStatus('preview');
    } catch (e: unknown) {
      if (isAbortError(e)) {
        setBannerError(null);
        setStatus('idle');
        return;
      }
      setBannerError(DEFAULT_CARESHEET_FAILURE);
      setStatus('idle');
    } finally {
      llmAbortRef.current = null;
      setLoadingPhase('none');
    }
  };

  const getCurrentDocHtml = (): string => {
    const editable = previewRef.current?.querySelector<HTMLElement>('.kp3p-preview');
    return editable?.innerHTML ?? '';
  };

  // Approve current doc (save edits) and move to next — no download yet
  const handleApproveAndNext = () => {
    if (!docSections || reviewStep >= 3) return;
    const currentHtml = getCurrentDocHtml();
    setApprovedDocs((prev) => ({
      ...prev,
      [`doc${reviewStep}`]: currentHtml,
    }));
    setReviewStep((reviewStep + 1) as 2 | 3);
  };

  // Approve doc 3 and trigger download of all 3 PDFs
  const handleApproveAndDownloadAll = async () => {
    if (!docSections) return;
    const doc3Html = getCurrentDocHtml();

    const finalDocs = {
      doc1: approvedDocs.doc1 ?? docSections.doc1,
      doc2: approvedDocs.doc2 ?? docSections.doc2,
      doc3: doc3Html,
    };

    setLoadingPhase('pdf');
    setStatus('loading');
    setBannerError(null);

    const widthPx = Math.max(previewRef.current?.clientWidth ?? 640, 640);
    const baseName = safeFileSegment(patient.name);

    try {
      await downloadSectionPdf(
        finalDocs.doc1,
        `KP3P_${baseName}_${REVIEW_STEP_META[1].fileSuffix}.pdf`,
        widthPx,
      );
      await downloadSectionPdf(
        finalDocs.doc2,
        `KP3P_${baseName}_${REVIEW_STEP_META[2].fileSuffix}.pdf`,
        widthPx,
      );
      await downloadSectionPdf(
        finalDocs.doc3,
        `KP3P_${baseName}_${REVIEW_STEP_META[3].fileSuffix}.pdf`,
        widthPx,
      );

      // All done — reset
      setStatus('idle');
      setDocSections(null);
      setApprovedDocs({ doc1: null, doc2: null, doc3: null });
      setReviewStep(1);
    } catch {
      setBannerError('PDF download failed. Please try again.');
      setStatus('preview');
    } finally {
      setLoadingPhase('none');
    }
  };

  const closePreview = () => {
    setStatus('idle');
    setDocSections(null);
    setReviewStep(1);
    setApprovedDocs({ doc1: null, doc2: null, doc3: null });
    dismissBanner();
  };

  const showPreviewModal =
    status === 'preview' ||
    (status === 'loading' && loadingPhase === 'pdf') ||
    (status === 'loading' && loadingPhase === 'llm' && htmlContent.length > 0);

  const pdfCaptureBusy = status === 'loading' && loadingPhase === 'pdf';
  const llmStreaming = status === 'loading' && loadingPhase === 'llm';
  const readyForReview = status === 'preview';
  const stepMeta = REVIEW_STEP_META[reviewStep];

  const previewHtml =
    readyForReview && docSections
      ? reviewStep === 1
        ? docSections.doc1
        : reviewStep === 2
          ? docSections.doc2
          : docSections.doc3
      : htmlContent;

  return (
    <>
      {bannerError && (
        <div
          role="alert"
          style={{
            width: '100%',
            maxWidth: 560,
            marginBottom: 12,
            padding: '12px 14px',
            borderRadius: 8,
            backgroundColor: '#fee2e2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            fontSize: 14,
            fontWeight: 600,
            fontFamily: 'Inter, sans-serif',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
            lineHeight: 1.45,
          }}
        >
          <span style={{ flex: 1 }}>{bannerError}</span>
          <button
            type="button"
            onClick={dismissBanner}
            aria-label="Dismiss error"
            style={{
              flexShrink: 0,
              background: 'transparent',
              border: 'none',
              color: '#991b1b',
              cursor: 'pointer',
              fontSize: 20,
              lineHeight: 1,
              padding: 0,
              marginTop: -2,
            }}
          >
            ×
          </button>
        </div>
      )}

      <div
        className={className}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}
      >
        <button
          type="button"
          onClick={handleGenerateClick}
          disabled={status === 'loading'}
          style={{
            fontSize: 12,
            padding: '6px 14px',
            borderRadius: 7,
            border: 'none',
            background: 'linear-gradient(135deg, #7c3aed, #0891b2)',
            color: '#fff',
            cursor: status === 'loading' ? 'wait' : 'pointer',
            fontWeight: 700,
            fontFamily: 'Inter, sans-serif',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            boxShadow: '0 2px 8px rgba(124,58,237,0.3)',
            opacity: status === 'loading' ? 0.88 : 1,
          }}
        >
          {status === 'loading' && loadingPhase === 'pdf'
            ? '⏳ Building PDFs…'
            : status === 'loading'
              ? '⏳ Generating…'
              : label || '📋 Generate KP-3P Care Sheet'}
        </button>
        {status === 'loading' && loadingPhase === 'llm' && (
          <button
            type="button"
            onClick={handleCancelLlmGeneration}
            style={{
              fontSize: 12,
              padding: '6px 14px',
              borderRadius: 7,
              border: '1px solid #fecdd3',
              background: '#fff1f2',
              color: '#be123c',
              cursor: 'pointer',
              fontWeight: 600,
              fontFamily: 'Inter, sans-serif',
            }}
          >
            Cancel generation
          </button>
        )}
      </div>

      {showPreviewModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '900px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
              position: 'relative',
            }}
          >
            {pdfCaptureBusy && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  zIndex: 10,
                  backgroundColor: 'rgba(255,255,255,0.85)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '12px',
                  fontSize: 16,
                  fontWeight: 600,
                  color: '#0f172a',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                ⏳ Building PDFs… please wait
              </div>
            )}

            {/* Header */}
            <div
              style={{
                padding: '20px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 16,
              }}
            >
              <div>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#0f172a' }}>
                  {llmStreaming ? 'Generating Care Sheet…' : stepMeta.title}
                </h2>
                {readyForReview && (
                  <div
                    style={{
                      marginTop: 8,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      fontSize: 12,
                      fontFamily: 'Inter, sans-serif',
                      color: '#64748b',
                    }}
                  >
                    {([1, 2, 3] as const).map((step) => {
                      const isApproved = step < reviewStep;
                      const isCurrent = step === reviewStep;
                      const stepLabel = REVIEW_STEP_META[step].title;
                      return (
                        <span
                          key={step}
                          style={{
                            padding: '2px 10px',
                            borderRadius: 999,
                            fontWeight: 600,
                            backgroundColor: isCurrent
                              ? '#2563eb'
                              : isApproved
                                ? '#dcfce7'
                                : '#f1f5f9',
                            color: isCurrent ? '#fff' : isApproved ? '#166534' : '#64748b',
                          }}
                        >
                          {stepLabel}
                          {isApproved ? ' ✓' : ''}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
              <button
                type="button"
                disabled={pdfCaptureBusy || llmStreaming}
                onClick={() => {
                  if (pdfCaptureBusy || llmStreaming) return;
                  closePreview();
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: pdfCaptureBusy || llmStreaming ? 'not-allowed' : 'pointer',
                  color: '#64748b',
                  opacity: pdfCaptureBusy || llmStreaming ? 0.4 : 1,
                }}
              >
                &times;
              </button>
            </div>

            {/* Body */}
            <div
              style={{ padding: '30px', overflowY: 'auto', flex: 1, backgroundColor: '#f8fafc' }}
            >
              <div
                style={{
                  marginBottom: '16px',
                  padding: '12px',
                  backgroundColor: llmStreaming ? '#fef3c7' : '#e0f2fe',
                  color: llmStreaming ? '#92400e' : '#0369a1',
                  borderRadius: '8px',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                {llmStreaming ? (
                  <>
                    ⏳ <b>Generating…</b> The care sheet is still being written. Review and
                    download will be available when generation completes.
                  </>
                ) : (
                  <>
                    ✏️ <b>Step {reviewStep} of 3:</b> {stepMeta.hint}
                  </>
                )}
              </div>

              <div
                ref={previewRef}
                style={{
                  backgroundColor: '#fff',
                  padding: '50px 56px',
                  borderRadius: '8px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  fontFamily: "-apple-system, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
                  color: '#0f172a',
                  lineHeight: 1.62,
                  fontSize: '12px',
                }}
              >
                <style dangerouslySetInnerHTML={{ __html: KP3P_PREVIEW_STYLES }} />
                <div
                  key={readyForReview ? `doc-${reviewStep}` : 'streaming'}
                  className="kp3p-preview"
                  contentEditable={readyForReview && !pdfCaptureBusy}
                  suppressContentEditableWarning={true}
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              </div>
            </div>

            {/* Footer */}
            <div
              style={{
                padding: '20px',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              {llmStreaming && (
                <span
                  style={{
                    marginRight: 'auto',
                    fontSize: 14,
                    color: '#64748b',
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  ⏳ Streaming response…
                </span>
              )}

              {!llmStreaming && (
                <button
                  type="button"
                  disabled={pdfCaptureBusy}
                  onClick={() => {
                    if (pdfCaptureBusy) return;
                    closePreview();
                  }}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    background: '#fff',
                    color: '#475569',
                    cursor: pdfCaptureBusy ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                    opacity: pdfCaptureBusy ? 0.6 : 1,
                  }}
                >
                  Cancel
                </button>
              )}

              {/* Steps 1 & 2: Approve and move to next doc (no download) */}
              {readyForReview && reviewStep < 3 && (
                <button
                  type="button"
                  disabled={pdfCaptureBusy}
                  onClick={handleApproveAndNext}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '6px',
                    border: 'none',
                    background: '#2563eb',
                    color: '#fff',
                    cursor: pdfCaptureBusy ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                    opacity: pdfCaptureBusy ? 0.6 : 1,
                  }}
                >
                  Approve {stepMeta.title} →
                </button>
              )}

              {/* Step 3: Approve doc 3 + download all 3 PDFs */}
              {readyForReview && reviewStep === 3 && (
                <button
                  type="button"
                  disabled={pdfCaptureBusy}
                  onClick={handleApproveAndDownloadAll}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '6px',
                    border: 'none',
                    background: '#059669',
                    color: '#fff',
                    cursor: pdfCaptureBusy ? 'wait' : 'pointer',
                    fontWeight: 600,
                    opacity: pdfCaptureBusy ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  ✅ Approve & Download All 3 PDFs
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
