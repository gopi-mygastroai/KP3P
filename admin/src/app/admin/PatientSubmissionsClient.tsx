'use client';

import { useMemo, useState } from 'react';
import RefreshButton from './RefreshButton';

export type PatientRow = {
  id: number;
  createdAt: string;
  name: string;
  mrn: string;
  patientEmail: string;
  submitterEmail: string | null;
  contactPhone: string;
  primaryDiagnosis: string;
  currentDiseaseActivity: string;
  currentAge: number;
};

const activityStyles: Record<string, { color: string; bg: string; border: string }> = {
  Remission: { color: '#166534', bg: '#dcfce7', border: '#bbf7d0' },
  Mild: { color: '#854d0e', bg: '#fef9c3', border: '#fde68a' },
  Moderate: { color: '#9a3412', bg: '#ffedd5', border: '#fed7aa' },
  Severe: { color: '#991b1b', bg: '#fee2e2', border: '#fecaca' },
};

function rowMatchesQuery(q: string, p: PatientRow): boolean {
  const t = q.trim().toLowerCase();
  if (!t) return true;
  const blob = [p.name, p.patientEmail, p.submitterEmail || '', p.contactPhone]
    .map((s) => String(s).toLowerCase())
    .join(' ');
  if (blob.includes(t)) return true;
  const digitsQ = q.replace(/\D/g, '');
  if (digitsQ.length > 0) {
    const phoneDigits = String(p.contactPhone).replace(/\D/g, '');
    if (phoneDigits.includes(digitsQ)) return true;
  }
  return false;
}

function activityStyleFor(activity: string) {
  return (
    activityStyles[activity] || {
      color: '#475569',
      bg: '#f1f5f9',
      border: '#e2e8f0',
    }
  );
}

export default function PatientSubmissionsClient({ patients }: { patients: PatientRow[] }) {
  const [query, setQuery] = useState('');
  const filtered = useMemo(
    () => (query.trim() ? patients.filter((p) => rowMatchesQuery(query, p)) : patients),
    [patients, query],
  );
  const total = patients.length;

  const dateLabel = (iso: string) =>
    new Date(iso).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  return (
    <>
      <div className="ad-search-wrap">
        <label htmlFor="ad-patient-search" className="ad-search-label">
          Search patients
        </label>
        <input
          id="ad-patient-search"
          type="search"
          className="ad-search-input"
          placeholder="Name, email, or phone number…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoComplete="off"
          enterKeyHint="search"
        />
      </div>

      <div className="ad-card">
        <div className="ad-card-header">
          <div>
            <span className="ad-card-title block mb-1">All Submissions</span>
            <span className="ad-card-count">
              {query.trim()
                ? `${filtered.length} of ${total} ${total === 1 ? 'record' : 'records'}`
                : `${total} ${total === 1 ? 'record' : 'records'}`}
            </span>
          </div>
          <div className="ad-card-header-actions">
            <RefreshButton />
          </div>
        </div>

        <div className="ad-table-wrap">
          <table className="ad-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Date</th>
                <th>Patient Name</th>
                <th>MRN</th>
                <th>Submitter</th>
                <th>Diagnosis</th>
                <th>Activity</th>
                <th>Age</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {total === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <div className="ad-empty">No submissions yet.</div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <div className="ad-empty">No patients match your search.</div>
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const act = activityStyleFor(p.currentDiseaseActivity);
                  return (
                    <tr key={p.id}>
                      <td className="td-id">#{p.id}</td>
                      <td className="td-date">{dateLabel(p.createdAt)}</td>
                      <td>
                        <div className="td-name">
                          <div className="td-avatar">{p.name?.charAt(0).toUpperCase()}</div>
                          {p.name}
                        </div>
                      </td>
                      <td className="td-mrn">{p.mrn || '—'}</td>
                      <td className="td-email" title={p.submitterEmail ?? undefined}>
                        {p.submitterEmail || 'Unknown'}
                      </td>
                      <td className="td-dx">{p.primaryDiagnosis || '—'}</td>
                      <td>
                        <span
                          className="td-activity"
                          style={{ color: act.color, background: act.bg, border: `1px solid ${act.border}` }}
                        >
                          <span className="td-activity-dot" style={{ background: act.color }} />
                          {p.currentDiseaseActivity || '—'}
                        </span>
                      </td>
                      <td className="td-age">{p.currentAge ? `${p.currentAge} yrs` : '—'}</td>
                      <td className="td-view">
                        <a href={`/admin/patient/${p.id}`} style={{ marginRight: '8px' }}>
                          View details
                        </a>
                        <a
                          href={`/admin/patient/${p.id}/assessment`}
                          style={{
                            background: 'rgba(13,148,136,0.08)',
                            borderColor: 'rgba(13,148,136,0.25)',
                            color: '#0d9488',
                          }}
                        >
                          Assessment
                        </a>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="ad-mobile-patient-list" role="list">
          {total === 0 ? (
            <div className="ad-empty">No submissions yet.</div>
          ) : filtered.length === 0 ? (
            <div className="ad-empty">No patients match your search.</div>
          ) : (
            filtered.map((p) => {
              const act = activityStyleFor(p.currentDiseaseActivity);
              return (
                <article key={p.id} className="ad-mobile-card" role="listitem">
                  <div className="ad-mobile-card-top">
                    <div>
                      <div className="ad-mobile-card-name">
                        <span className="td-avatar">{p.name?.charAt(0).toUpperCase()}</span>
                        {p.name}
                      </div>
                      <div className="ad-mobile-card-meta" style={{ marginTop: 6 }}>
                        #{p.id} · {dateLabel(p.createdAt)}
                        <br />
                        MRN {p.mrn || '—'} · {p.currentAge ? `${p.currentAge} yrs` : '—'}
                      </div>
                    </div>
                    <span
                      className="td-activity"
                      style={{
                        color: act.color,
                        background: act.bg,
                        border: `1px solid ${act.border}`,
                        flexShrink: 0,
                      }}
                    >
                      <span className="td-activity-dot" style={{ background: act.color }} />
                      {p.currentDiseaseActivity || '—'}
                    </span>
                  </div>
                  <div className="ad-mobile-card-meta">
                    <strong style={{ color: '#334155' }}>Diagnosis:</strong> {p.primaryDiagnosis || '—'}
                    <br />
                    <strong style={{ color: '#334155' }}>Submitter:</strong> {p.submitterEmail || 'Unknown'}
                  </div>
                  <div className="ad-mobile-card-actions">
                    <a href={`/admin/patient/${p.id}`}>View details</a>
                    <a href={`/admin/patient/${p.id}/assessment`} className="ad-mca-primary">
                      Assessment
                    </a>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
