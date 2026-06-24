'use client';

import { useEffect, useState } from 'react';
import { PATIENT_DETAIL_SECTIONS } from '@/components/patient-detail/patient-details-sections';

const SCROLL_TOP_THRESHOLD = 160;

export default function PatientDetailsSectionNav() {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > SCROLL_TOP_THRESHOLD);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <style>{`
        .pde-section-nav-wrap {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }
        .pde-section-nav {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          padding: 10px 0 0;
          flex: 1;
          min-width: 0;
        }
        .pde-section-link {
          font-size: 11px;
          font-weight: 600;
          text-decoration: none;
          padding: 6px 12px;
          border-radius: 7px;
          background: #f1f5f9;
          color: #475569;
          border: 0.5px solid #e2e8f0;
          white-space: nowrap;
        }
        .pde-section-link:hover {
          background: #e2e8f0;
          color: #0f172a;
        }
        .pde-scroll-top {
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          margin-top: 10px;
          padding: 6px 12px;
          border-radius: 7px;
          border: 0.5px solid #cbd5e1;
          background: #ffffff;
          color: #475569;
          font-size: 11px;
          font-weight: 700;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
          white-space: nowrap;
          box-shadow: 0 1px 4px rgba(15, 23, 42, 0.06);
          transition: background 0.15s, color 0.15s, border-color 0.15s;
        }
        .pde-scroll-top:hover {
          background: #f0fdfa;
          border-color: #99f6e4;
          color: #0f766e;
        }
        .pde-scroll-top svg {
          flex-shrink: 0;
        }
      `}</style>
      <div className="pde-section-nav-wrap">
        <nav className="pde-section-nav" aria-label="Assessment sections">
          {PATIENT_DETAIL_SECTIONS.map((section) => (
            <a key={section.step} className="pde-section-link" href={`#pde-step-${section.step}`}>
              {section.step}. {section.stepLabel}
            </a>
          ))}
        </nav>
        {showScrollTop ? (
          <button
            type="button"
            className="pde-scroll-top"
            onClick={scrollToTop}
            aria-label="Back to top"
            title="Back to top"
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
            </svg>
            Top
          </button>
        ) : null}
      </div>
    </>
  );
}
