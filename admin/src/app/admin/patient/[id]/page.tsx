import { prisma } from '@/lib/prisma';
import { formatSmokingSummary } from '@/lib/smoking';
import PatientActions from '../../../../components/PatientActions';
import PatientDetailsShell from '@/components/patient-detail/PatientDetailsShell';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function PatientDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const userRole = cookieStore.get('userRole');

  if (userRole?.value !== 'ADMIN') {
    redirect('/');
  }

  const { id } = await params;
  const patient = await prisma.patient.findUnique({
    where: { id: parseInt(id, 10) },
    include: { user: true },
  });

  if (!patient) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f1f5f9' }}>
        <p style={{ color: '#64748b', fontFamily: 'monospace' }}>Patient not found</p>
      </div>
    );
  }

  const activityColor: Record<string, string> = {
    Remission: '#22c55e',
    Mild: '#facc15',
    Moderate: '#f97316',
    Severe: '#ef4444',
  };
  const actColor = activityColor[patient.currentDiseaseActivity] || '#94a3b8';

  const createdDate = patient.createdAt
    ? new Date(patient.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Inter:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body {
          width: 100%;
          max-width: 100%;
          overflow-x: hidden;
        }
        body { background: #f1f5f9; font-family: 'Inter', system-ui, sans-serif; }

        .pr-root {
          min-height: 100vh;
          background: #f1f5f9;
          color: #0f172a;
          width: 100%;
          max-width: 100vw;
          min-width: 0;
          overflow-x: hidden;
        }

        .pr-header {
          background: linear-gradient(165deg, #0c1222 0%, #152238 48%, #1a2d4a 100%);
          padding: 0;
          border-bottom: 1px solid rgba(56, 189, 248, 0.22);
          box-shadow: 0 4px 24px rgba(15, 23, 42, 0.35);
          position: relative;
          width: 100%;
          max-width: 100vw;
          min-width: 0;
          overflow-x: hidden;
        }
        .pr-header::after {
          content: '';
          position: absolute;
          left: 0; right: 0; bottom: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, #2dd4bf 20%, #38bdf8 50%, #2dd4bf 80%, transparent);
          opacity: 0.55;
        }

        /* FIXED: removed width: min(1100px, 100%) and margin-inline: auto */
        .pr-header-inner {
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
          min-width: 0;
          margin-inline: 0;
          padding-inline: clamp(12px, 2vw, 24px);
        }

        .pr-topnav {
          padding: 18px 0 14px;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          border-bottom: 1px solid rgba(148, 163, 184, 0.12);
        }
        .pr-back-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 700;
          color: #0f172a;
          background: #14b8a6;
          padding: 6px 14px;
          border-radius: 7px;
          text-decoration: none;
        }
        .pr-back-link:hover { background: #2dd4bf; }

        .pr-hero {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          padding: 20px 0 0;
          flex-wrap: wrap;
        }
        .pr-hero-patient { display: flex; align-items: center; gap: 16px; }
        .pr-avatar {
          width: 56px; height: 56px;
          border-radius: 14px;
          background: linear-gradient(145deg, #1e3a5f 0%, #0f172a 100%);
          border: 1px solid rgba(56, 189, 248, 0.35);
          display: flex; align-items: center; justify-content: center;
          font-size: 22px; font-weight: 700; color: #5eead4;
          flex-shrink: 0;
        }
        .pr-patient-name {
          font-size: clamp(1.25rem, 4.5vw, 28px);
          font-weight: 700;
          color: #f8fafc;
          letter-spacing: -0.4px;
          line-height: 1.2;
        }
        .pr-patient-meta { display: flex; align-items: center; gap: 10px; margin-top: 6px; flex-wrap: wrap; }
        .pr-mono-tag { font-family: 'IBM Plex Mono', monospace; font-size: 14px; color: #94a3b8; }
        .pr-mono-tag b { color: #e2e8f0; font-weight: 600; }
        .pr-dot { color: #475569; font-size: 10px; }
        .pr-activity-pill {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 5px 12px; border-radius: 20px;
          font-size: 14px; font-weight: 600;
        }
        .pr-activity-dot { width: 6px; height: 6px; border-radius: 50%; }

        .pr-chips-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 18px;
          padding-bottom: 20px;
        }
        .pr-chip {
          background: #14b8a6;
          border-radius: 7px;
          padding: 8px 14px;
          display: flex; flex-direction: column; gap: 3px;
          min-width: 88px;
        }
        .pr-chip-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9px;
          color: rgba(15, 23, 42, 0.65);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-weight: 600;
        }
        .pr-chip-value { font-size: 13px; font-weight: 700; color: #0f172a; }

        @media (max-width: 520px) {
          .pr-header-inner { padding-inline: 12px; }
          .pr-topnav { flex-direction: column; align-items: stretch; }
          .pr-back-link { justify-content: center; width: 100%; min-height: 44px; }
        }
      `}</style>

      <div className="pr-root">
        <div className="pr-header">
          <div className="pr-header-inner">
            <div className="pr-topnav">
              <Link href="/admin" className="pr-back-link">← Back to Dashboard</Link>
              <PatientActions patient={patient} />
            </div>

            <div className="pr-hero">
              <div className="pr-hero-patient">
                <div className="pr-avatar">{patient.name?.charAt(0).toUpperCase()}</div>
                <div>
                  <div className="pr-patient-name">{patient.name}</div>
                  <div className="pr-patient-meta">
                    <span className="pr-mono-tag">MRN <b>{patient.mrn || '—'}</b></span>
                    <span className="pr-dot">●</span>
                    <span className="pr-mono-tag">DOB <b>{patient.dateOfBirth || '—'}</b></span>
                    <span className="pr-dot">●</span>
                    <span className="pr-mono-tag"><b>{patient.sex || '—'}</b></span>
                    <span className="pr-dot">●</span>
                    <div
                      className="pr-activity-pill"
                      style={{
                        background: `${actColor}20`,
                        border: `1px solid ${actColor}40`,
                        color: actColor,
                      }}
                    >
                      <span className="pr-activity-dot" style={{ background: actColor }} />
                      {patient.currentDiseaseActivity || 'Unknown'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pr-chips-row">
              {[
                { label: 'Diagnosis', value: patient.primaryDiagnosis || '—' },
                { label: 'Duration', value: patient.diseaseDuration || '—' },
                { label: 'Age', value: patient.currentAge ? `${patient.currentAge} yrs` : '—' },
                { label: 'Age at Dx', value: patient.ageAtDiagnosis ? `${patient.ageAtDiagnosis} yrs` : '—' },
                { label: 'Smoking', value: formatSmokingSummary(patient.smokingStatus, patient.smokingDetails) || '—' },
                { label: 'Submitted', value: createdDate },
              ].map((s, i) => (
                <div className="pr-chip" key={i}>
                  <span className="pr-chip-label">{s.label}</span>
                  <span className="pr-chip-value">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <PatientDetailsShell patient={patient} />
      </div>
    </>
  );
}
