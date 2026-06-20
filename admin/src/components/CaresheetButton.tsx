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

  /* ── Document title (h2) — professional gradient banner ── */
  .kp3p-preview h2 {
    font-size: 16px;
    font-weight: 800;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: #ffffff;
    background: linear-gradient(135deg, #1e40af 0%, #2563eb 100%);
    margin: 0 -52px 20px -52px;
    padding: 15px 52px;
    border: none;
    page-break-after: avoid;
    break-after: avoid;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }

  /* ── Major sections (h3) — prominent blue accent ── */
  .kp3p-preview h3 {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #1e40af;
    background: transparent;
    margin: 18px 0 10px 0;
    padding: 0 0 6px 0;
    border: none;
    border-bottom: 2px solid #1e40af;
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
    background: #1e40af;
  }
  .kp3p-preview thead th,
  .kp3p-preview th,
  .kp3p-preview thead tr td,
  .kp3p-preview table > tr:first-child td,
  .kp3p-preview tbody > tr:first-child td {
    background: #1e40af;
    color: #ffffff;
    font-weight: 700;
    font-size: 11px;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    padding: 9px 12px;
    border: 1px solid #1e40af;
    border-right: 1px solid rgba(255,255,255,0.2);
    text-align: left;
    vertical-align: middle;
  }
  .kp3p-preview thead th:last-child,
  .kp3p-preview thead tr td:last-child,
  .kp3p-preview table > tr:first-child td:last-child,
  .kp3p-preview tbody > tr:first-child td:last-child {
    border-right: 1px solid #1e40af;
  }

  /* Body cells */
  .kp3p-preview td {
    padding: 8px 12px;
    border: 1px solid #e2e8f0;
    color: #1e293b;
    vertical-align: top;
    line-height: 1.5;
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
`;


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
    padding: '50px 56px',
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
  inner.className = 'kp3p-preview';
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

async function htmlHostToPdf(host: HTMLElement, fileName: string): Promise<void> {
  const originalHeight = host.style.height;
  const originalOverflow = host.style.overflow;
  host.style.height = 'auto';
  host.style.overflow = 'visible';

  try {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfPageWidth = pdf.internal.pageSize.getWidth();   // 210mm
    const pdfPageHeight = pdf.internal.pageSize.getHeight(); // 297mm

    // Render the full host at 2x scale
    const fullCanvas = await html2canvas(host, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    const canvasWidth = fullCanvas.width;
    const canvasHeight = fullCanvas.height;

    // px per mm on the canvas (scaled)
    const pxPerMm = canvasWidth / pdfPageWidth;

    // A4 page height in canvas pixels
    const pageHeightPx = pdfPageHeight * pxPerMm;

    const inner = host.querySelector('.kp3p-preview') ?? host;
    const hostRect = host.getBoundingClientRect();

    // Convert a CSS pixel y to canvas-space y (host-relative, scaled by 2)
    const toCanvasPx = (cssY: number) => (cssY - hostRect.top) * 2;

    // 1) Collect granular break candidates — bottom edges of small block elements.
    //    We cut at these positions when we have to break inside a region.
    const blockEls = inner.querySelectorAll('tr, p, h2, h3, h4, h5, li');
    const breakCandidates: number[] = [0];
    blockEls.forEach((el) => {
      const rect = el.getBoundingClientRect();
      breakCandidates.push(toCanvasPx(rect.bottom));
    });
    breakCandidates.push(canvasHeight);

    // 2) Collect "keep together" ranges — tables and h3-sections.
    //    If one of these straddles a page boundary AND would fit on a fresh page,
    //    we push it to the next page instead of slicing it.
    type Range = { top: number; bottom: number; height: number };
    const keepTogether: Range[] = [];

    // Tables — keep each whole table on one page if possible
    inner.querySelectorAll('table').forEach((t) => {
      const rect = t.getBoundingClientRect();
      const top = toCanvasPx(rect.top);
      const bottom = toCanvasPx(rect.bottom);
      keepTogether.push({ top, bottom, height: bottom - top });
    });

    // h3 sections — content from each h3 to the next h3 (or end of inner)
    const h3s = Array.from(inner.querySelectorAll('h3'));
    const innerBottom = toCanvasPx(inner.getBoundingClientRect().bottom);
    h3s.forEach((h3, i) => {
      const rect = h3.getBoundingClientRect();
      const top = toCanvasPx(rect.top);
      const bottom =
        i < h3s.length - 1
          ? toCanvasPx(h3s[i + 1].getBoundingClientRect().top)
          : innerBottom;
      keepTogether.push({ top, bottom, height: bottom - top });
    });

    // 2b) Collect FORCED page-break positions — headings whose text matches
    //     FORCED_BREAK_BEFORE_PATTERNS will force a new page to start at them.
    const forcedBreaks: number[] = [];
    inner.querySelectorAll('h2, h3, h4, h5').forEach((h) => {
      const text = (h.textContent ?? '').replace(/\s+/g, ' ').trim();
      if (FORCED_BREAK_BEFORE_PATTERNS.some((p) => p.test(text))) {
        const rect = h.getBoundingClientRect();
        const top = toCanvasPx(rect.top);
        // Skip if this heading is at the very start of the document — no point
        // forcing a break before content that hasn't started yet.
        if (top > 10) forcedBreaks.push(top);
      }
    });

    // 3) Slice the canvas into PDF pages
    let pageStart = 0;
    let isFirstPage = true;

    while (pageStart < canvasHeight) {
      const pageEnd = pageStart + pageHeightPx;
      let safeCut: number;

      if (pageEnd >= canvasHeight) {
        // Last page — just take the rest
        safeCut = canvasHeight;
      } else {
        // Priority 1: forced page breaks within this page → cut at the EARLIEST one
        const forcedInPage = forcedBreaks.filter(
          (f) => f > pageStart && f <= pageEnd,
        );

        if (forcedInPage.length > 0) {
          safeCut = Math.min(...forcedInPage);
        } else {
          // Priority 2: push keep-together ranges that straddle the boundary
          //            if they would fit on a fresh page
          const straddlers = keepTogether.filter(
            (r) =>
              r.top > pageStart &&
              r.top < pageEnd &&
              r.bottom > pageEnd &&
              r.height <= pageHeightPx,
          );

          if (straddlers.length > 0) {
            const earliestTop = Math.min(...straddlers.map((r) => r.top));
            const candsBefore = breakCandidates.filter(
              (c) => c > pageStart && c <= earliestTop,
            );
            if (candsBefore.length > 0) {
              safeCut = Math.max(...candsBefore);
            } else {
              const cands = breakCandidates.filter(
                (c) => c > pageStart && c <= pageEnd,
              );
              safeCut = cands.length > 0 ? Math.max(...cands) : pageEnd;
            }
          } else {
            // Priority 3: latest granular cut within the page
            const cands = breakCandidates.filter(
              (c) => c > pageStart && c <= pageEnd,
            );
            safeCut = cands.length > 0 ? Math.max(...cands) : pageEnd;
          }
        }

        // Safety: ensure forward progress
        if (safeCut <= pageStart) safeCut = pageEnd;
      }

      const sliceHeight = Math.round(safeCut - pageStart);
      if (sliceHeight <= 0) break;

      // Slice the canvas for this page
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
      pdf.addImage(imgData, 'PNG', 0, 0, pdfPageWidth, sliceHeightMm);
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
    title: 'Document 1 — Clinician Record',
    hint: 'Review and edit Document 1, then approve to continue to Document 2.',
    fileSuffix: 'DOC1_Clinician_Record',
  },
  2: {
    title: 'Document 2 — Patient Information Sheet',
    hint: 'Review and edit Document 2, then approve to continue to Document 3.',
    fileSuffix: 'DOC2_Patient_Information_Sheet',
  },
  3: {
    title: 'Document 3 — Prescription Sheet',
    hint: 'Review and edit Document 3. Once approved, download all 3 PDFs.',
    fileSuffix: 'DOC3_Prescription_Sheet',
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
        `KP3P_${baseName}_DOC1_Clinician_Record.pdf`,
        widthPx,
      );
      await downloadSectionPdf(
        finalDocs.doc2,
        `KP3P_${baseName}_DOC2_Patient_Information_Sheet.pdf`,
        widthPx,
      );
      await downloadSectionPdf(
        finalDocs.doc3,
        `KP3P_${baseName}_DOC3_Prescription_Sheet.pdf`,
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
                          Doc {step}
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
                  Approve Document {reviewStep} →
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
