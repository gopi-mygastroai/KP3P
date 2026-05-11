'use client';
import { useState, useRef, useCallback } from 'react';
import { PatientData } from '@/lib/kp3p-prompt';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const DEFAULT_CARESHEET_FAILURE =
  'Care sheet generation failed. Please try again or contact support.';

/** Injected into preview + off-screen PDF hosts so html2canvas always has rules (modal may unmount). */
const KP3P_PREVIEW_STYLES = `
  .kp3p-preview { outline: none; }
  .kp3p-preview:focus { box-shadow: inset 0 0 0 2px rgba(59,130,246,0.3); border-radius: 4px; }
  .kp3p-preview h2 { color: #1e3a8a; font-size: 24px; border-bottom: 2px solid #1e3a8a; padding-bottom: 8px; }
  .kp3p-preview h3 { color: #2563eb; font-size: 18px; margin-top: 24px; }
  .kp3p-preview h4 { color: #3b82f6; font-size: 16px; margin-top: 20px; }
  .kp3p-preview h5 { color: #475569; font-size: 14px; margin-top: 16px; text-transform: uppercase; }
  .kp3p-preview table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px; }
  .kp3p-preview th, .kp3p-preview td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
  .kp3p-preview th { background-color: #f1f5f9; font-weight: bold; color: #1e293b; }
  .kp3p-preview b { font-weight: 700; color: #0f172a; }
  .kp3p-preview p { margin-bottom: 12px; }
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

/** Split KP-3P preview DOM into Part 1 (physician) vs Part 2 (patient) using the Part 2 heading. */
function getKp3pPartSections(
  previewRoot: HTMLElement,
): { part1: HTMLElement[]; part2: HTMLElement[] } | null {
  const h3Part2 = [...previewRoot.querySelectorAll('h3')].find((h) => {
    const t = (h.textContent ?? '').replace(/\s+/g, ' ').trim();
    return /PART\s*2/i.test(t) && /PATIENT/i.test(t) && /CARE\s*PLAN/i.test(t);
  });
  if (!h3Part2) return null;

  let startPart2: Element = h3Part2;
  const prev = h3Part2.previousElementSibling;
  if (prev?.tagName === 'H2') startPart2 = prev;

  let boundary: Element | null = startPart2;
  while (boundary && boundary.parentElement !== previewRoot) {
    boundary = boundary.parentElement;
  }
  if (!boundary) return null;

  const topLevel = [...previewRoot.children] as HTMLElement[];
  const idx2 = topLevel.indexOf(boundary as HTMLElement);
  if (idx2 < 0) return null;

  return {
    part1: topLevel.slice(0, idx2),
    part2: topLevel.slice(idx2),
  };
}

async function htmlHostToPdf(host: HTMLElement, fileName: string): Promise<void> {
  const originalHeight = host.style.height;
  const originalOverflow = host.style.overflow;
  host.style.height = 'auto';
  host.style.overflow = 'visible';
  try {
    const canvas = await html2canvas(host, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    let heightLeft = pdfHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
    heightLeft -= pdf.internal.pageSize.getHeight();

    while (heightLeft >= 0) {
      position = heightLeft - pdfHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pdf.internal.pageSize.getHeight();
    }

    pdf.save(fileName);
  } finally {
    host.style.height = originalHeight;
    host.style.overflow = originalOverflow;
  }
}

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
  /** Which long-running step is active when `status === 'loading'` (for LLM cancel only). */
  const [loadingPhase, setLoadingPhase] = useState<'none' | 'llm' | 'pdf'>('none');
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [htmlContent, setHtmlContent] = useState('');
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
    try {
      const res = await fetch('/api/generate-caresheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patient),
        signal: ac.signal,
      });
      const data = await readJsonSafe(res);
      const apiMessage = typeof data.error === 'string' && data.error.trim() ? data.error : null;

      if (!res.ok) {
        setBannerError(apiMessage ?? DEFAULT_CARESHEET_FAILURE);
        setStatus('idle');
        return;
      }

      const html = data.htmlContent;
      if (typeof html !== 'string' || !html.trim()) {
        setBannerError(DEFAULT_CARESHEET_FAILURE);
        setStatus('idle');
        return;
      }

      setHtmlContent(html);
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

  const downloadPdf = async () => {
    if (!previewRef.current) return;
    setLoadingPhase('pdf');
    setStatus('loading');
    setBannerError(null);

    const outer = previewRef.current;
    const editable = outer.querySelector<HTMLElement>('.kp3p-preview');
    if (!editable) {
      setBannerError('PDF download failed. Please try again.');
      setStatus('preview');
      setLoadingPhase('none');
      return;
    }

    const baseName = safeFileSegment(patient.name);
    const widthPx = Math.max(outer.clientWidth, 640);

    const buildHost = (sectionNodes: HTMLElement[]): HTMLDivElement => {
      const host = document.createElement('div');
      // Must stay fully opaque: html2canvas often renders opacity:0 as a blank bitmap.
      Object.assign(host.style, {
        position: 'fixed',
        left: '-12000px',
        top: '0',
        width: `${widthPx}px`,
        boxSizing: 'border-box',
        backgroundColor: '#fff',
        padding: '40px',
        fontFamily: 'Arial, sans-serif',
        color: '#333',
        lineHeight: '1.6',
        zIndex: '2147483646',
        opacity: '1',
        pointerEvents: 'none',
        overflow: 'visible',
      });
      const styleEl = document.createElement('style');
      styleEl.textContent = KP3P_PREVIEW_STYLES;
      host.appendChild(styleEl);
      const inner = document.createElement('div');
      inner.className = 'kp3p-preview';
      for (const node of sectionNodes) {
        inner.appendChild(node.cloneNode(true));
      }
      host.appendChild(inner);
      document.body.appendChild(host);
      return host;
    };

    try {
      const sections = getKp3pPartSections(editable);
      if (!sections || sections.part1.length === 0 || sections.part2.length === 0) {
        setBannerError(
          'Could not split into Part 1 and Part 2. Keep the “PART 2: PATIENT CARE PLAN” heading, then try again.',
        );
        setStatus('preview');
        return;
      }

      const host1 = buildHost(sections.part1);
      const host2 = buildHost(sections.part2);
      try {
        await htmlHostToPdf(
          host1,
          `KP3P_${baseName}_PART1_Clinical_Protocol_Physician_Record.pdf`,
        );
        await htmlHostToPdf(host2, `KP3P_${baseName}_PART2_Patient_Care_Plan.pdf`);
      } finally {
        host1.remove();
        host2.remove();
      }

      setStatus('idle');
    } catch {
      setBannerError('PDF download failed. Please try again.');
      setStatus('preview');
    } finally {
      setLoadingPhase('none');
    }
  };

  const showPreviewModal =
    status === 'preview' || (status === 'loading' && loadingPhase === 'pdf');
  const pdfCaptureBusy = status === 'loading' && loadingPhase === 'pdf';

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
                ⏳ Building PDFs…
              </div>
            )}
            <div
              style={{
                padding: '20px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#0f172a' }}>
                Preview Caresheet
              </h2>
              <button
                type="button"
                disabled={pdfCaptureBusy}
                onClick={() => {
                  if (pdfCaptureBusy) return;
                  setStatus('idle');
                  dismissBanner();
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: pdfCaptureBusy ? 'not-allowed' : 'pointer',
                  color: '#64748b',
                  opacity: pdfCaptureBusy ? 0.4 : 1,
                }}
              >
                &times;
              </button>
            </div>

            <div
              style={{ padding: '30px', overflowY: 'auto', flex: 1, backgroundColor: '#f8fafc' }}
            >
              <div
                style={{
                  marginBottom: '16px',
                  padding: '12px',
                  backgroundColor: '#e0f2fe',
                  color: '#0369a1',
                  borderRadius: '8px',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                ✏️ <b>Edit Mode Active:</b> You can click anywhere in the document below to edit the
                text before downloading.
              </div>

              <div
                ref={previewRef}
                style={{
                  backgroundColor: '#fff',
                  padding: '40px',
                  borderRadius: '8px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  fontFamily: 'Arial, sans-serif',
                  color: '#333',
                  lineHeight: 1.6,
                }}
              >
                <style dangerouslySetInnerHTML={{ __html: KP3P_PREVIEW_STYLES }} />
                <div
                  className="kp3p-preview"
                  contentEditable={true}
                  suppressContentEditableWarning={true}
                  dangerouslySetInnerHTML={{ __html: htmlContent }}
                />
              </div>
            </div>

            <div
              style={{
                padding: '20px',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
              }}
            >
              <button
                type="button"
                disabled={pdfCaptureBusy}
                onClick={() => {
                  if (pdfCaptureBusy) return;
                  setStatus('idle');
                  dismissBanner();
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
              <button
                type="button"
                disabled={status === 'loading'}
                onClick={downloadPdf}
                style={{
                  padding: '10px 20px',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#2563eb',
                  color: '#fff',
                  cursor: status === 'loading' ? 'wait' : 'pointer',
                  fontWeight: 600,
                }}
              >
                Confirm & Download PDFs
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
