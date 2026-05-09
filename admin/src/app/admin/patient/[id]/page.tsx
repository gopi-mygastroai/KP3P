import { prisma } from '@/lib/prisma';
import { formatSmokingSummary } from '@/lib/smoking';
import PatientActions from '../../../../components/PatientActions';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';

/** User-linked account email, else intake email on Patient (structural typing — Prisma include payload can lag `email` in TS). */
function patientContactEmail(p: { user: { email: string } | null; email?: string | null }): string {
  const fromUser = p.user?.email?.trim();
  const fromRecord = typeof p.email === 'string' ? p.email.trim() : '';
  return fromUser || fromRecord || 'N/A';
}

export default async function PatientDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const userRole = cookieStore.get('userRole');

  if (userRole?.value !== 'ADMIN') {
    redirect('/');
  }

  const { id } = await params;
  const patient = await prisma.patient.findUnique({
    where: { id: parseInt(id, 10) },
    include: { user: true }
  });

  if (!patient) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f1f5f9' }}>
        <p style={{ color: '#64748b', fontFamily: 'monospace' }}>Patient not found</p>
      </div>
    );
  }

  const parseSurgeries = (() => {
    try { return JSON.parse(patient.previousSurgeries || '[]'); } catch { return []; }
  })();
  const parsePreviousTreatments = (() => {
    try { return JSON.parse(patient.previousTreatmentsTried || '[]'); } catch { return []; }
  })();
  const parseComorbidities = (() => {
    try { return JSON.parse(patient.comorbidities || '[]'); } catch { return []; }
  })();

  const activityColor: Record<string, string> = {
    Remission: '#22c55e',
    Mild: '#facc15',
    Moderate: '#f97316',
    Severe: '#ef4444',
  };
  const actColor = activityColor[patient.currentDiseaseActivity] || '#94a3b8';

  const labStatusColor = (v: string) => {
    if (!v || v === '-') return '#94a3b8';
    if (v.toLowerCase().includes('negative')) return '#16a34a';
    if (v.toLowerCase().includes('positive')) return '#f97316';
    return '#94a3b8';
  };

  const createdDate = patient.createdAt
    ? new Date(patient.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

  const renderVaccineCard = (name: string, dataStr: string) => {
    let status = 'unknown';
    let doses: any[] = [];
    try {
      if (dataStr) {
        const parsed = JSON.parse(dataStr);
        if (typeof parsed === 'object') {
          status = parsed.status || 'unknown';
          doses = Array.isArray(parsed.doses) ? parsed.doses : [];
        } else { status = dataStr; }
      }
    } catch { status = dataStr || 'unknown'; }

    let badgeColor = '#94a3b8', badgeBg = 'rgba(148,163,184,0.12)', displayStatus = status.charAt(0).toUpperCase() + status.slice(1);
    const sLower = status.toLowerCase();
    if (sLower === 'given' || sLower === 'completed') { badgeColor = '#16a34a'; badgeBg = 'rgba(22,163,74,0.1)'; displayStatus = 'Completed'; }
    else if (sLower === 'pending') { badgeColor = '#d97706'; badgeBg = 'rgba(217,119,6,0.1)'; displayStatus = 'Pending'; }
    else if (sLower === 'never' || sLower === 'not taken' || sLower === 'unknown') { badgeColor = '#dc2626'; badgeBg = 'rgba(220,38,38,0.1)'; displayStatus = sLower === 'unknown' ? 'Unknown' : 'Not Taken'; }

    return (
      <div key={name} style={{ background: '#f8fafc', border: '0.5px solid #e2e8f0', borderRadius: 10, padding: '14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <span style={{ fontWeight: 600, color: '#0f172a', fontSize: 14 }}>{name}</span>
          <span style={{ background: badgeBg, color: badgeColor, padding: '3px 9px', borderRadius: 100, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{displayStatus}</span>
        </div>
        {doses.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {doses.map((d: any, i: number) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', background: '#f1f5f9', padding: '6px 10px', borderRadius: 6, fontSize: 11.5, color: '#475569' }}>
                <span>Dose {i + 1}: <span style={{ color: '#94a3b8' }}>{d.date || 'N/A'}</span></span>
                {d.dosage && <span style={{ color: '#0891b2' }}>{d.dosage}</span>}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>No doses recorded</div>
        )}
      </div>
    );
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Inter:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f1f5f9; font-family: 'Inter', system-ui, sans-serif; }

        .pr-root { min-height: 100vh; background: #f1f5f9; color: #0f172a; }

        /* ── HEADER ── */
        .pr-header {
          background: linear-gradient(135deg, #0891b2 0%, #a5f3fc 100%);
          padding: 0 28px;
        }

        /* top nav row */
        .pr-topnav {
          padding: 16px 0;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
        }
        .pr-back-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          font-weight: 600;
          color: #0f766e;
          background: #ffffff;
          padding: 8px 16px;
          border-radius: 8px;
          text-decoration: none;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          transition: all 0.2s;
        }
        .pr-back-link:hover { 
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        /* hero row */
        .pr-hero {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          padding: 16px 0 0;
          flex-wrap: wrap;
        }
        .pr-hero-patient { display: flex; align-items: center; gap: 14px; }
        .pr-avatar {
          width: 52px; height: 52px;
          border-radius: 14px;
          background: #fff;
          display: flex; align-items: center; justify-content: center;
          font-size: 22px; font-weight: 700; color: #0f766e;
          flex-shrink: 0;
        }
        .pr-patient-name { font-size: clamp(1.25rem, 4.5vw, 26px); font-weight: 700; color: #fff; letter-spacing: -0.3px; line-height: 1.2; }
        .pr-patient-meta { display: flex; align-items: center; gap: 10px; margin-top: 4px; flex-wrap: wrap; }
        .pr-mono-tag { font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: rgba(255,255,255,0.7); }
        .pr-mono-tag b { color: #fff; }
        .pr-dot { color: rgba(255,255,255,0.4); font-size: 8px; }
        .pr-activity-pill {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 3px 10px; border-radius: 20px;
          font-size: 11px; font-weight: 600;
        }
        .pr-activity-dot { width: 6px; height: 6px; border-radius: 50%; }

        /* chips */
        .pr-chips-row { display: flex; gap: 4px; flex-wrap: wrap; margin-top: 14px; }
        .pr-chip {
          background: rgba(255,255,255,0.12);
          border: 1px solid rgba(255,255,255,0.2);
          border-bottom: none;
          border-radius: 10px 10px 0 0;
          padding: 8px 14px;
          display: flex; flex-direction: column; gap: 2px;
          min-width: 80px;
        }
        .pr-chip-label { font-family: 'IBM Plex Mono', monospace; font-size: 9px; color: rgba(255,255,255,0.6); text-transform: uppercase; letter-spacing: 0.07em; }
        .pr-chip-value { font-size: 13px; font-weight: 600; color: #fff; }

        /* action buttons */
        .pr-btn-ghost {
          font-size: 12px; padding: 6px 14px; border-radius: 7px;
          border: 1px solid rgba(255,255,255,0.35);
          background: rgba(255,255,255,0.08);
          color: #fff; cursor: pointer; font-weight: 500;
          font-family: 'Inter', sans-serif; transition: all 0.2s;
        }
        .pr-btn-ghost:hover { background: rgba(255,255,255,0.15); }
        .pr-btn-white {
          font-size: 12px; padding: 6px 14px; border-radius: 7px;
          border: none; background: #fff; color: #0f766e;
          cursor: pointer; font-weight: 700;
          font-family: 'Inter', sans-serif; transition: all 0.2s;
        }
        .pr-btn-white:hover { background: #f0fdfa; }

        /* ── BODY ── */
        .pr-body {
          max-width: 1100px; margin: 0 auto;
          padding: 16px 28px 80px;
          display: grid; grid-template-columns: 1fr 200px; gap: 14px; align-items: start;
        }
        @media (max-width: 860px) {
          .pr-body { grid-template-columns: 1fr; padding: 14px 16px 60px; }
          .pr-header { padding: 0 16px; }
        }
        @media (max-width: 520px) {
          .pr-topnav { flex-direction: column; align-items: stretch; }
          .pr-back-link { justify-content: center; width: 100%; box-sizing: border-box; min-height: 44px; }
          .pr-hero-patient { flex-direction: column; align-items: flex-start; }
          .pr-chips-row { gap: 8px; }
          .pr-chip { min-width: 0; flex: 1 1 calc(50% - 4px); border-radius: 10px; }
        }

        /* ── CARD ── */
        .pr-card { background: #fff; border: 0.5px solid #e2e8f0; border-radius: 12px; overflow: hidden; margin-bottom: 10px; }
        .pr-card-head { display: flex; align-items: center; gap: 8px; padding: 10px 14px; background: #f8fafc; border-bottom: 0.5px solid #e2e8f0; }
        .pr-card-icon { width: 25px; height: 25px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 12px; flex-shrink: 0; }
        .pr-card-title { font-size: 10px; font-weight: 700; color: #374151; letter-spacing: 0.07em; text-transform: uppercase; flex: 1; }
        .pr-card-num { font-size: 10px; color: #cbd5e1; font-family: 'IBM Plex Mono', monospace; }

        /* field grid */
        .pr-field-grid { display: grid; grid-template-columns: 1fr 1fr; padding: 4px 8px 8px; }
        @media (max-width: 540px) { .pr-field-grid { grid-template-columns: 1fr; } }
        .pr-field { padding: 7px 8px; border-radius: 7px; transition: background 0.15s; }
        .pr-field:hover { background: #f8fafc; }
        .pr-field-label { font-family: 'IBM Plex Mono', monospace; font-size: 9px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 3px; }
        .pr-field-value { font-size: 12.5px; color: #0f172a; line-height: 1.4; word-break: break-word; }
        .pr-field-value.empty { color: #cbd5e1; font-style: italic; }

        /* tag list */
        .pr-tag-list { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 2px; }
        .pr-tag { background: rgba(59,130,246,0.08); border: 0.5px solid rgba(59,130,246,0.2); color: #3b82f6; font-size: 11px; padding: 2px 8px; border-radius: 5px; }

        /* serology */
        .pr-serology-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 8px; padding: 10px 12px 12px; }
        .pr-serology-pill { background: #f8fafc; border: 0.5px solid #e2e8f0; border-radius: 8px; padding: 8px 12px; }
        .pr-serology-label { font-family: 'IBM Plex Mono', monospace; font-size: 9px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 4px; }
        .pr-serology-value { font-size: 12px; font-weight: 600; }

        /* vaccine */
        .pr-vaccine-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 10px; padding: 12px; }
        @media (max-width: 380px) { .pr-vaccine-grid { grid-template-columns: 1fr; } }

        /* status badge */
        .pr-status-badge { display: inline-flex; align-items: center; gap: 5px; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
        .pr-status-dot { width: 6px; height: 6px; border-radius: 50%; }

        /* ── SIDEBAR ── */
        .pr-sidebar-card { background: #fff; border: 0.5px solid #e2e8f0; border-radius: 10px; overflow: hidden; margin-bottom: 8px; }
        .pr-sidebar-head { padding: 9px 12px; background: #f8fafc; border-bottom: 0.5px solid #e2e8f0; font-family: 'IBM Plex Mono', monospace; font-size: 9px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.08em; }
        .pr-sidebar-big { padding: 14px; text-align: center; }
        .pr-sidebar-big-val { font-size: 20px; font-weight: 700; margin-bottom: 3px; }
        .pr-sidebar-big-label { font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.06em; }
        .pr-srow { display: flex; justify-content: space-between; align-items: center; padding: 6px 12px; border-bottom: 0.5px solid #f8fafc; }
        .pr-srow:last-child { border-bottom: none; }
        .pr-srow-label { font-size: 11px; color: #64748b; }
        .pr-srow-val { font-size: 11px; color: #94a3b8; font-weight: 500; font-family: 'IBM Plex Mono', monospace; }
        .pr-infection-row { display: flex; align-items: center; justify-content: space-between; padding: 6px 12px; border-bottom: 0.5px solid #f8fafc; }
        .pr-infection-row:last-child { border-bottom: none; }
      `}</style>

      <div className="pr-root">

        {/* ── HEADER ── */}
        <div className="pr-header">

          {/* top nav */}
          <div className="pr-topnav">
            <Link href="/admin" className="pr-back-link">← Back to Dashboard</Link>
            <PatientActions patient={patient} />
          </div>

          {/* hero */}
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

          {/* chips */}
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

        {/* ── BODY ── */}
        <div className="pr-body">

          {/* LEFT COLUMN */}
          <div>

            {/* 01 Patient Characteristics */}
            <div className="pr-card">
              <div className="pr-card-head">
                <div className="pr-card-icon" style={{ background: '#eff6ff' }}>👤</div>
                <span className="pr-card-title">Patient Characteristics</span>
                <span className="pr-card-num">01</span>
              </div>
              <div className="pr-field-grid">
                {[
                  { label: 'Full Name', value: patient.name },
                  { label: 'Email', value: patientContactEmail(patient) },
                  { label: 'Medical Record No.', value: patient.mrn },
                  { label: 'Contact Phone', value: patient.contactPhone },
                  { label: 'Place of Living', value: patient.placeOfLiving },
                  { label: 'Referred By', value: patient.referredBy },
                  { label: 'Date of Birth', value: patient.dateOfBirth },
                  { label: 'Preferred Language', value: patient.preferredLanguage },
                  { label: 'Occupation', value: patient.occupation },
                  { label: 'Special Considerations', value: patient.specialConsiderations },
                  {
                    label: 'Smoking',
                    value: formatSmokingSummary(patient.smokingStatus, patient.smokingDetails),
                  },
                ].map((f, i) => (
                  <div className="pr-field" key={i}>
                    <div className="pr-field-label">{f.label}</div>
                    <div className={`pr-field-value${!f.value || f.value === 'N/A' ? ' empty' : ''}`}>{f.value || 'Not provided'}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 02 Disease Characteristics */}
            <div className="pr-card">
              <div className="pr-card-head">
                <div className="pr-card-icon" style={{ background: '#faf5ff' }}>🧬</div>
                <span className="pr-card-title">Disease Characteristics</span>
                <span className="pr-card-num">02</span>
              </div>
              <div className="pr-field-grid">
                <div className="pr-field">
                  <div className="pr-field-label">Primary Diagnosis</div>
                  <div className="pr-field-value" style={{ color: '#7c3aed', fontWeight: 600 }}>{patient.primaryDiagnosis || '—'}</div>
                </div>
                <div className="pr-field">
                  <div className="pr-field-label">Disease Duration</div>
                  <div className="pr-field-value">{patient.diseaseDuration || '—'}</div>
                </div>
                {patient.primaryDiagnosis === "Crohn's Disease" && (
                  <div className="pr-field" style={{ gridColumn: '1 / -1' }}>
                    <div className="pr-field-label">Perianal Disease Assessment</div>
                    <div className={`pr-field-value${!patient.perianalDiseaseAssessment?.trim() ? ' empty' : ''}`}>
                      {patient.perianalDiseaseAssessment?.trim() || 'Not provided'}
                    </div>
                  </div>
                )}
                <div className="pr-field">
                  <div className="pr-field-label">Montreal Classification</div>
                  <div className="pr-field-value">{patient.montrealClass || '—'}</div>
                </div>
                <div className="pr-field">
                  <div className="pr-field-label">Previous Surgeries</div>
                  <div className="pr-field-value">
                    {parseSurgeries.length > 0
                      ? <div className="pr-tag-list">{parseSurgeries.map((s: string, i: number) => <span key={i} className="pr-tag">{s}</span>)}</div>
                      : <span className="empty">None</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* 03 Disease Activity */}
            <div className="pr-card">
              <div className="pr-card-head">
                <div className="pr-card-icon" style={{ background: '#fefce8' }}>📊</div>
                <span className="pr-card-title">Disease Activity & Symptoms</span>
                <span className="pr-card-num">03</span>
              </div>
              <div className="pr-field-grid">
                <div className="pr-field" style={{ gridColumn: '1/-1' }}>
                  <div className="pr-field-label">Current Disease Activity</div>
                  <div className="pr-status-badge" style={{ background: `${actColor}15`, border: `1px solid ${actColor}30`, color: actColor, marginTop: 4 }}>
                    <span className="pr-status-dot" style={{ background: actColor }} />
                    {patient.currentDiseaseActivity || '—'}
                  </div>
                </div>
                {[
                  { label: 'Stool Frequency', value: patient.stoolFrequency },
                  { label: 'Blood in Stool', value: patient.bloodInStool },
                  { label: 'Abdominal Pain', value: patient.abdominalPain },
                  { label: 'Impact on QoL', value: patient.impactOnQoL },
                  { label: 'Weight Loss', value: patient.weightLoss },
                ].map((f, i) => (
                  <div className="pr-field" key={i}>
                    <div className="pr-field-label">{f.label}</div>
                    <div className={`pr-field-value${!f.value ? ' empty' : ''}`}>{f.value || '—'}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 04 Labs */}
            <div className="pr-card">
              <div className="pr-card-head">
                <div className="pr-card-icon" style={{ background: '#f0fdfa' }}>🔬</div>
                <span className="pr-card-title">Laboratory & Investigations</span>
                <span className="pr-card-num">04</span>
              </div>
              <div className="pr-field-grid">
                {[
                  { label: 'Date of Most Recent Labs', value: patient.dateMostRecentLabs },
                ].map((f, i) => (
                  <div className="pr-field" key={i}>
                    <div className="pr-field-label">{f.label}</div>
                    <div className={`pr-field-value${!f.value ? ' empty' : ''}`}>{f.value || '—'}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 05 Current Treatment */}
            <div className="pr-card">
              <div className="pr-card-head">
                <div className="pr-card-icon" style={{ background: '#eff6ff' }}>⚕️</div>
                <span className="pr-card-title">Current Treatment</span>
                <span className="pr-card-num">05</span>
              </div>
              <div className="pr-field-grid">
                <div className="pr-field">
                  <div className="pr-field-label">Current IBD Medications</div>
                  <div className="pr-field-value">{patient.currentIbdMedications || '—'}</div>
                </div>
                <div className="pr-field">
                  <div className="pr-field-label">Steroid Use</div>
                  <div className="pr-field-value">{patient.steroidUse || '—'}</div>
                </div>
                <div className="pr-field">
                  <div className="pr-field-label">TDM Results</div>
                  <div className="pr-field-value">{patient.tdmResults || '—'}</div>
                </div>
                <div className="pr-field">
                  <div className="pr-field-label">Response to Treatment</div>
                  <div className="pr-field-value">
                    {patient.responseToTreatment
                      ? <span className="pr-status-badge" style={{
                        background: patient.responseToTreatment === 'Complete' ? 'rgba(22,163,74,0.1)' : 'rgba(217,119,6,0.1)',
                        border: `1px solid ${patient.responseToTreatment === 'Complete' ? '#16a34a30' : '#d9770630'}`,
                        color: patient.responseToTreatment === 'Complete' ? '#16a34a' : '#d97706',
                        fontSize: 12,
                      }}>{patient.responseToTreatment}</span>
                      : '—'}
                  </div>
                </div>
                <div className="pr-field">
                  <div className="pr-field-label">Current Supplements</div>
                  <div className="pr-field-value">{patient.currentSupplements || '—'}</div>
                </div>
              </div>
            </div>

            {/* 06 Treatment History */}
            <div className="pr-card">
              <div className="pr-card-head">
                <div className="pr-card-icon" style={{ background: '#fff1f2' }}>💊</div>
                <span className="pr-card-title">Treatment History</span>
                <span className="pr-card-num">06</span>
              </div>
              <div className="pr-field-grid">
                <div className="pr-field">
                  <div className="pr-field-label">Previous Treatments Tried</div>
                  <div className="pr-field-value">
                    {parsePreviousTreatments.length > 0
                      ? <div className="pr-tag-list">{parsePreviousTreatments.map((s: string, i: number) => <span key={i} className="pr-tag" style={{ background: 'rgba(220,38,38,0.07)', borderColor: 'rgba(220,38,38,0.2)', color: '#dc2626' }}>{s}</span>)}</div>
                      : <span style={{ color: '#cbd5e1', fontStyle: 'italic' }}>None</span>}
                  </div>
                </div>
                <div className="pr-field">
                  <div className="pr-field-label">Failed Treatments Details</div>
                  <div className="pr-field-value">{patient.failedTreatments || '—'}</div>
                </div>
              </div>
            </div>

            {/* 07 Serology */}
            <div className="pr-card">
              <div className="pr-card-head">
                <div className="pr-card-icon" style={{ background: '#fff0f9' }}>🩸</div>
                <span className="pr-card-title">Infection Screening & Serology</span>
                <span className="pr-card-num">07</span>
              </div>
              <div className="pr-serology-grid">
                {[
                  { label: 'TB Screening', value: patient.tbScreening },
                  { label: 'HBsAg', value: patient.hepBSurfaceAg },
                  { label: 'HBsAb', value: patient.hepBSurfaceAb },
                  { label: 'HBcAb', value: patient.hepBCoreAb },
                  { label: 'Anti-HCV', value: patient.antiHcv },
                  { label: 'Anti-HIV', value: patient.antiHiv },
                ].map((s, i) => (
                  <div className="pr-serology-pill" key={i}>
                    <div className="pr-serology-label">{s.label}</div>
                    <div className="pr-serology-value" style={{ color: labStatusColor(s.value) }}>{s.value || '—'}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 08 Vaccination */}
            <div className="pr-card">
              <div className="pr-card-head">
                <div className="pr-card-icon" style={{ background: '#f0fdf4' }}>💉</div>
                <span className="pr-card-title">Vaccination History</span>
                <span className="pr-card-num">08</span>
              </div>
              <div className="pr-vaccine-grid">
                {renderVaccineCard('Influenza', patient.influenza)}
                {renderVaccineCard('COVID-19', patient.covid19)}
                {renderVaccineCard('Pneumococcal', patient.pneumococcal)}
                {renderVaccineCard('Hepatitis B', patient.hepatitisB)}
                {renderVaccineCard('Hepatitis A', patient.hepatitisA)}
                {renderVaccineCard('Hepatitis E', patient.hepatitisE)}
                {renderVaccineCard('Zoster (Shingrix)', patient.zoster)}
                {renderVaccineCard('MMR / Varicella', patient.mmrVaricella)}
                {renderVaccineCard('Tetanus (Tdap)', patient.tetanusTdap)}
              </div>
            </div>

            {/* 09 Comorbidities */}
            <div className="pr-card">
              <div className="pr-card-head">
                <div className="pr-card-icon" style={{ background: '#eef2ff' }}>📋</div>
                <span className="pr-card-title">Comorbidities & Final Details</span>
                <span className="pr-card-num">09</span>
              </div>
              <div className="pr-field-grid">
                <div className="pr-field">
                  <div className="pr-field-label">Comorbidities</div>
                  <div className="pr-field-value">
                    {parseComorbidities.length > 0
                      ? <div className="pr-tag-list">{parseComorbidities.map((s: string, i: number) => <span key={i} className="pr-tag" style={{ background: 'rgba(249,115,22,0.08)', borderColor: 'rgba(249,115,22,0.2)', color: '#ea580c' }}>{s}</span>)}</div>
                      : <span className="empty">None</span>}
                  </div>
                </div>
                {[
                  { label: 'Extraintestinal Manifestations', value: patient.extraintestinalManif },
                  { label: 'Pregnancy Planning', value: patient.pregnancyPlanning },
                ].map((f, i) => (
                  <div className="pr-field" key={i}>
                    <div className="pr-field-label">{f.label}</div>
                    <div className={`pr-field-value${!f.value ? ' empty' : ''}`}>{f.value || '—'}</div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* RIGHT SIDEBAR */}
          <div>

            <div className="pr-sidebar-card">
              <div className="pr-sidebar-head">Disease Activity</div>
              <div className="pr-sidebar-big">
                <div className="pr-sidebar-big-val" style={{ color: actColor }}>{patient.currentDiseaseActivity || '—'}</div>
                <div className="pr-sidebar-big-label">{patient.primaryDiagnosis}</div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 5 }}>Montreal: {patient.montrealClass || '—'}</div>
              </div>
            </div>

            <div className="pr-sidebar-card">
              <div className="pr-sidebar-head">Demographics</div>
              {[
                { label: 'Age', value: patient.currentAge ? `${patient.currentAge} years` : '—' },
                { label: 'Age at Dx', value: patient.ageAtDiagnosis ? `${patient.ageAtDiagnosis} years` : '—' },
                { label: 'Sex', value: patient.sex },
                { label: 'Smoking', value: formatSmokingSummary(patient.smokingStatus, patient.smokingDetails) },
                { label: 'Location', value: patient.placeOfLiving },
                { label: 'Language', value: patient.preferredLanguage },
                { label: 'Occupation', value: patient.occupation },
              ].map((r, i) => (
                <div key={i} className="pr-srow">
                  <span className="pr-srow-label">{r.label}</span>
                  <span className="pr-srow-val">{r.value || '—'}</span>
                </div>
              ))}
            </div>

            <div className="pr-sidebar-card">
              <div className="pr-sidebar-head">Clinical Snapshot</div>
              {[
                { label: 'Stool / day', value: patient.stoolFrequency },
                { label: 'Abdominal Pain', value: patient.abdominalPain },
                { label: 'Blood in Stool', value: patient.bloodInStool },
                { label: 'QoL Impact', value: patient.impactOnQoL },
                { label: 'Weight Loss', value: patient.weightLoss },
                { label: 'Steroid Use', value: patient.steroidUse },
              ].map((r, i) => (
                <div key={i} className="pr-srow">
                  <span className="pr-srow-label">{r.label}</span>
                  <span className="pr-srow-val">{r.value || '—'}</span>
                </div>
              ))}
            </div>

            <div className="pr-sidebar-card">
              <div className="pr-sidebar-head">Serology Summary</div>
              {[
                { label: 'TB', value: patient.tbScreening },
                { label: 'HBsAg', value: patient.hepBSurfaceAg },
                { label: 'Anti-HCV', value: patient.antiHcv },
                { label: 'Anti-HIV', value: patient.antiHiv },
              ].map((r, i) => (
                <div key={i} className="pr-infection-row">
                  <span style={{ fontSize: 11, color: '#64748b' }}>{r.label}</span>
                  <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: labStatusColor(r.value) }}>{r.value || '—'}</span>
                </div>
              ))}
            </div>

            <div className="pr-sidebar-card">
              <div className="pr-sidebar-head">Record Info</div>
              {[
                { label: 'Patient ID', value: `#${patient.id}` },
                { label: 'User ID', value: `#${patient.userId}` },
                { label: 'Submitted', value: createdDate },
                { label: 'Referred By', value: patient.referredBy },
                { label: 'Contact', value: patient.contactPhone },
              ].map((r, i) => (
                <div key={i} className="pr-srow">
                  <span className="pr-srow-label">{r.label}</span>
                  <span className="pr-srow-val">{r.value || '—'}</span>
                </div>
              ))}
              <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#94a3b8', padding: '8px 12px', textAlign: 'right' }}>
                REC-{patient.id}-{patient.mrn}
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
