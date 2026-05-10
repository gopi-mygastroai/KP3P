'use client';
import { useState, useRef } from 'react';
import { PatientData } from '@/lib/kp3p-prompt';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const DEFAULT_CARESHEET_FAILURE =
  'Care sheet generation failed. Please try again or contact support.';

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
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [htmlContent, setHtmlContent] = useState('');
  const previewRef = useRef<HTMLDivElement>(null);

  const dismissBanner = () => setBannerError(null);

  const handleGenerateClick = async () => {
    setStatus('loading');
    setBannerError(null);
    try {
      const res = await fetch('/api/generate-caresheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patient),
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
    } catch {
      setBannerError(DEFAULT_CARESHEET_FAILURE);
      setStatus('idle');
    }
  };

  const downloadPdf = async () => {
    if (!previewRef.current) return;
    setStatus('loading');
    setBannerError(null);
    try {
      const el = previewRef.current;
      const originalHeight = el.style.height;
      const originalOverflow = el.style.overflow;
      el.style.height = 'auto';
      el.style.overflow = 'visible';

      const canvas = await html2canvas(el, { scale: 2, useCORS: true });

      el.style.height = originalHeight;
      el.style.overflow = originalOverflow;

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

      pdf.save(`KP3P_${patient.name}.pdf`);
      setStatus('idle');
    } catch {
      setBannerError('PDF download failed. Please try again.');
      setStatus('preview');
    }
  };

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
          {status === 'loading' ? '⏳ Generating...' : label || '📋 Generate KP-3P Care Sheet'}
        </button>
      </div>

      {status === 'preview' && (
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
            }}
          >
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
                onClick={() => {
                  setStatus('idle');
                  dismissBanner();
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#64748b',
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
                <style
                  dangerouslySetInnerHTML={{
                    __html: `
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
                `,
                  }}
                />
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
                onClick={() => {
                  setStatus('idle');
                  dismissBanner();
                }}
                style={{
                  padding: '10px 20px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: '#fff',
                  color: '#475569',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Cancel
              </button>
              <button
                onClick={downloadPdf}
                style={{
                  padding: '10px 20px',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#2563eb',
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Confirm & Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
