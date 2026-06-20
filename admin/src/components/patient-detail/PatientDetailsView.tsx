import { composeMontrealClass, hasMontrealSelections, montrealFieldsForDiagnosis } from '@/lib/montreal-classification';
import { formatSmokingSummary } from '@/lib/smoking';
import { filledInvestigationEntries, parseIbdInvestigations } from '@/lib/ibd-investigations';
import {
  CurrentIbdMedicationsDisplay,
  responseToTreatmentColor,
  SesCdScoringDisplay,
  UcEndoscopicScoringDisplay,
  UpperGiFindingsDisplay,
} from '@/components/patient-detail/PatientDetailDisplays';
import type { PatientWithUser } from '@/types/assessment-form';
import { renderVaccineCard, patientContactEmail, patientDetailsViewStyles, PatientFieldGrid } from '@/components/patient-detail/patient-details-view-shared';


type Props = { patient: PatientWithUser };

export default function PatientDetailsView({ patient }: Props) {
  const parseSurgeries = (() => {
    try { return JSON.parse(patient.previousSurgeries || '[]'); } catch { return []; }
  })();
  const parseComorbidities = (() => {
    try { return JSON.parse(patient.comorbidities || '[]'); } catch { return []; }
  })();
  const investigationData = parseIbdInvestigations(patient.ibdInvestigations);
  const investigationEntries = filledInvestigationEntries(investigationData);

  const montrealClassDisplay = hasMontrealSelections(patient)
    ? composeMontrealClass(montrealFieldsForDiagnosis(patient.primaryDiagnosis, patient))
    : '';

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

  return (
    <>
      <style>{patientDetailsViewStyles}</style>
      <div className="pr-view">
        <div className="pr-body">

          {/* LEFT COLUMN */}
          <div className="pr-main-column">

            {/* 01 Patient Characteristics */}
            <div className="pr-card">
              <div className="pr-card-head">
                <div className="pr-card-icon" style={{ background: '#eff6ff' }}>👤</div>
                <span className="pr-card-title">Patient Characteristics</span>
                <span className="pr-card-num">01</span>
              </div>
              <PatientFieldGrid
                fields={[
                  { label: 'Full Name', value: patient.name, empty: !patient.name },
                  { label: 'Email', value: patientContactEmail(patient), empty: patientContactEmail(patient) === 'N/A' },
                  { label: 'Medical Record No.', value: patient.mrn, empty: !patient.mrn },
                  { label: 'Contact Phone', value: patient.contactPhone, empty: !patient.contactPhone },
                  { label: 'Place of Living', value: patient.placeOfLiving, empty: !patient.placeOfLiving },
                  { label: 'Referred By', value: patient.referredBy, empty: !patient.referredBy },
                  { label: 'Date of Birth', value: patient.dateOfBirth, empty: !patient.dateOfBirth },
                  {
                    label: 'Current Age',
                    value: patient.currentAge ? `${patient.currentAge} yrs` : 'Not provided',
                    empty: !patient.currentAge,
                  },
                  { label: 'Sex', value: patient.sex, empty: !patient.sex },
                  { label: 'Preferred Language', value: patient.preferredLanguage, empty: !patient.preferredLanguage },
                  { label: 'Occupation', value: patient.occupation, empty: !patient.occupation },
                  { label: 'Special Considerations', value: patient.specialConsiderations, empty: !patient.specialConsiderations },
                  {
                    label: 'Smoking',
                    value: formatSmokingSummary(patient.smokingStatus, patient.smokingDetails) || 'Not provided',
                    empty: !formatSmokingSummary(patient.smokingStatus, patient.smokingDetails),
                    fullWidth: true,
                  },
                ]}
              />
            </div>

            {/* 02 Disease Characteristics */}
            <div className="pr-card">
              <div className="pr-card-head">
                <div className="pr-card-icon" style={{ background: '#faf5ff' }}>🧬</div>
                <span className="pr-card-title">Disease Characteristics</span>
                <span className="pr-card-num">02</span>
              </div>
              <PatientFieldGrid
                fields={[
                  {
                    label: 'Primary Diagnosis',
                    value: patient.primaryDiagnosis || '—',
                    empty: !patient.primaryDiagnosis,
                    valueStyle: { color: '#7c3aed', fontWeight: 600 },
                  },
                  {
                    label: 'Age at Diagnosis',
                    value: Number.isFinite(patient.ageAtDiagnosis) ? `${patient.ageAtDiagnosis} yrs` : '—',
                    empty: !Number.isFinite(patient.ageAtDiagnosis),
                  },
                  {
                    label: 'Disease Duration',
                    value: patient.diseaseDuration || '—',
                    empty: !patient.diseaseDuration,
                    fullWidth: true,
                  },
                  ...(patient.primaryDiagnosis === "Crohn's Disease"
                    ? [{
                        label: 'Perianal Disease Assessment',
                        value: patient.perianalDiseaseAssessment?.trim() || 'Not provided',
                        empty: !patient.perianalDiseaseAssessment?.trim(),
                        fullWidth: true,
                      }]
                    : []),
                ]}
              />
                <div className="pr-field-section">
                  <div className="pr-field-section-title" style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                    <span>Montreal Classification</span>
                    {montrealClassDisplay ? (
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#7c3aed', textTransform: 'none', letterSpacing: 0 }}>
                        {montrealClassDisplay}
                      </span>
                    ) : null}
                  </div>
                  <div className="pr-field-grid pr-field-grid--legacy">
                    <div className="pr-field">
                      <div className="pr-field-label">Age at Diagnosis</div>
                      <div className="pr-field-value">{patient.montrealAgeAtDiagnosis || '—'}</div>
                    </div>
                    {patient.primaryDiagnosis === 'Ulcerative Colitis' && (
                      <div className="pr-field">
                        <div className="pr-field-label">Extent of UC</div>
                        <div className="pr-field-value">{patient.ucExtent || '—'}</div>
                      </div>
                    )}
                    {patient.primaryDiagnosis === "Crohn's Disease" && (
                      <>
                        <div className="pr-field">
                          <div className="pr-field-label">Location of the disease</div>
                          <div className="pr-field-value">{patient.diseaseLocation || '—'}</div>
                        </div>
                        <div className="pr-field">
                          <div className="pr-field-label">Behavior</div>
                          <div className="pr-field-value">{patient.diseaseBehavior || '—'}</div>
                        </div>
                        <div className="pr-field">
                          <div className="pr-field-label">Perianal</div>
                          <div className="pr-field-value">{patient.perianalDisease || '—'}</div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div className="pr-field" style={{ margin: '4px 8px 8px' }}>
                  <div className="pr-field-label">Previous Surgeries</div>
                  <div className="pr-field-value">
                    {parseSurgeries.length > 0
                      ? <div className="pr-tag-list">{parseSurgeries.map((s: string, i: number) => <span key={i} className="pr-tag">{s}</span>)}</div>
                      : <span className="empty">None</span>}
                  </div>
                </div>
                {patient.primaryDiagnosis === 'Ulcerative Colitis' && (
                  <UcEndoscopicScoringDisplay raw={patient.ucEndoscopicScoring} />
                )}
                {patient.primaryDiagnosis === "Crohn's Disease" && (
                  <>
                    <SesCdScoringDisplay raw={patient.sesCdScoring} />
                    <UpperGiFindingsDisplay raw={patient.upperGiFindings} clinicalNotes={patient.sesCdClinicalNotes} />
                  </>
                )}
            </div>

            {/* 03 Disease Activity */}
            <div className="pr-card">
              <div className="pr-card-head">
                <div className="pr-card-icon" style={{ background: '#fefce8' }}>📊</div>
                <span className="pr-card-title">Disease Activity & Symptoms</span>
                <span className="pr-card-num">03</span>
              </div>
              <div className="pr-field-grid pr-field-grid--legacy">
                <div className="pr-field" style={{ gridColumn: '1/-1' }}>
                  <div className="pr-field-label">Current Disease Activity</div>
                  <div className="pr-status-badge" style={{ background: `${actColor}15`, border: `1px solid ${actColor}30`, color: actColor, marginTop: 4 }}>
                    <span className="pr-status-dot" style={{ background: actColor }} />
                    {patient.currentDiseaseActivity || '—'}
                  </div>
                </div>
                <div className="pr-field">
                  <div className="pr-field-label">Activity Score (Short answer)</div>
                  <div className={`pr-field-value${!patient.activityScore?.trim() ? ' empty' : ''}`}>
                    {patient.activityScore?.trim() || '—'}
                  </div>
                </div>
                {[
                  { label: 'Frequency of Stools (per day)', value: patient.stoolFrequency },
                  { label: 'Blood in Stool', value: patient.bloodInStool },
                  { label: 'Abdominal Pain', value: patient.abdominalPain },
                  { label: 'Impact on Quality of Life', value: patient.impactOnQoL },
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
              <div className="pr-field-grid pr-field-grid--legacy">
                <div className="pr-field">
                  <div className="pr-field-label">Date of Assessment</div>
                  <div className={`pr-field-value${!patient.dateMostRecentLabs ? ' empty' : ''}`}>{patient.dateMostRecentLabs || '—'}</div>
                </div>
              </div>
              {investigationEntries.length > 0 ? (
                <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {Array.from(
                    investigationEntries.reduce((groups, entry) => {
                      const list = groups.get(entry.groupTitle) ?? [];
                      list.push(entry);
                      groups.set(entry.groupTitle, list);
                      return groups;
                    }, new Map<string, typeof investigationEntries>()),
                  ).map(([groupTitle, entries]) => (
                    <div key={groupTitle}>
                      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#475569', marginBottom: 8 }}>
                        {groupTitle}
                      </div>
                      <div className="pr-field-grid pr-field-grid--legacy">
                        {entries.map((entry) => (
                          <div className="pr-field" key={`${groupTitle}-${entry.label}`}>
                            <div className="pr-field-label">{entry.label}</div>
                            <div className="pr-field-value">{entry.value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ marginTop: 12, color: '#94a3b8', fontSize: 13 }}>No investigation values recorded.</p>
              )}
            </div>

            {/* 05 Treatment History */}
            <div className="pr-card">
              <div className="pr-card-head">
                <div className="pr-card-icon" style={{ background: '#fff1f2' }}>💊</div>
                <span className="pr-card-title">Treatment History</span>
                <span className="pr-card-num">05</span>
              </div>
              <CurrentIbdMedicationsDisplay raw={patient.currentIbdMedicationsRows} />
              <div className="pr-field-grid pr-field-grid--legacy" style={{ paddingTop: 4 }}>
                <div className="pr-field" style={{ gridColumn: '1 / -1' }}>
                  <div className="pr-field-label">Response to Current Treatment</div>
                  <div className="pr-field-value">
                    {patient.responseToTreatment ? (
                      <span
                        className="pr-status-badge"
                        style={{
                          background: `${responseToTreatmentColor(patient.responseToTreatment)}15`,
                          border: `1px solid ${responseToTreatmentColor(patient.responseToTreatment)}30`,
                          color: responseToTreatmentColor(patient.responseToTreatment),
                          fontSize: 12,
                        }}
                      >
                        {patient.responseToTreatment}
                      </span>
                    ) : (
                      '—'
                    )}
                  </div>
                </div>
                <div className="pr-field" style={{ gridColumn: '1 / -1' }}>
                  <div className="pr-field-label">Details of Failed Treatments</div>
                  <div className={`pr-field-value${!patient.failedTreatments?.trim() ? ' empty' : ''}`}>
                    {patient.failedTreatments?.trim() || '—'}
                  </div>
                </div>
              </div>
            </div>

            {/* 06 Serology */}
            <div className="pr-card">
              <div className="pr-card-head">
                <div className="pr-card-icon" style={{ background: '#fff0f9' }}>🩸</div>
                <span className="pr-card-title">Infection Screening & Serology</span>
                <span className="pr-card-num">06</span>
              </div>
              <div className="pr-serology-grid">
                {[
                  { label: 'TB Screening Status', value: patient.tbScreening },
                  { label: 'Hepatitis B Surface Antigen', value: patient.hepBSurfaceAg },
                  { label: 'Hepatitis B Surface Antibody', value: patient.hepBSurfaceAb },
                  { label: 'Hepatitis B Core Antibody', value: patient.hepBCoreAb },
                  { label: 'Anti HCV', value: patient.antiHcv },
                  { label: 'Anti HIV', value: patient.antiHiv },
                ].map((s, i) => (
                  <div className="pr-serology-pill" key={i}>
                    <div className="pr-serology-label">{s.label}</div>
                    <div className="pr-serology-value" style={{ color: labStatusColor(s.value) }}>{s.value || '—'}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 07 Vaccination */}
            <div className="pr-card">
              <div className="pr-card-head">
                <div className="pr-card-icon" style={{ background: '#f0fdf4' }}>💉</div>
                <span className="pr-card-title">Vaccination History</span>
                <span className="pr-card-num">07</span>
              </div>
              <div className="pr-vaccine-grid">
                {renderVaccineCard('Influenza', patient.influenza)}
                {renderVaccineCard('COVID-19', patient.covid19)}
                {renderVaccineCard('Pneumococcal', patient.pneumococcal)}
                {renderVaccineCard('Hepatitis B', patient.hepatitisB)}
                {renderVaccineCard('Hepatitis A', patient.hepatitisA)}
                {renderVaccineCard('Hepatitis E', patient.hepatitisE)}
                {renderVaccineCard('Zoster (Shingrix)', patient.zoster)}
                {renderVaccineCard('MMR', patient.mmr)}
                {renderVaccineCard('Varicella', patient.varicella)}
                {renderVaccineCard('Tetanus (Tdap)', patient.tetanusTdap)}
              </div>
            </div>

            {/* 08 Comorbidities */}
            <div className="pr-card">
              <div className="pr-card-head">
                <div className="pr-card-icon" style={{ background: '#eef2ff' }}>📋</div>
                <span className="pr-card-title">Comorbidities & Final Details</span>
                <span className="pr-card-num">08</span>
              </div>
              <div className="pr-field-grid pr-field-grid--legacy">
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
                  { label: 'Pregnancy / Family Planning Status', value: patient.pregnancyPlanning },
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
          <div className="pr-sidebar-column">

            <div className="pr-sidebar-card">
              <div className="pr-sidebar-head">Disease Activity</div>
              <div className="pr-sidebar-body">
                <div className="pr-srow">
                  <span className="pr-srow-label">Activity</span>
                  <span className="pr-srow-val" style={{ color: actColor, fontSize: 20, fontWeight: 700 }}>
                    {patient.currentDiseaseActivity || '—'}
                  </span>
                </div>
                <div className="pr-srow">
                  <span className="pr-srow-label">Diagnosis</span>
                  <span className="pr-srow-val" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {patient.primaryDiagnosis || '—'}
                  </span>
                </div>
                <div className="pr-srow">
                  <span className="pr-srow-label">Montreal</span>
                  <span className="pr-srow-val">{montrealClassDisplay || '—'}</span>
                </div>
              </div>
            </div>

            <div className="pr-sidebar-card">
              <div className="pr-sidebar-head">Demographics</div>
              <div className="pr-sidebar-body">
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
            </div>

            <div className="pr-sidebar-card">
              <div className="pr-sidebar-head">Clinical Snapshot</div>
              <div className="pr-sidebar-body">
              {[
                { label: 'Activity Score', value: patient.activityScore },
                { label: 'Stool / day', value: patient.stoolFrequency },
                { label: 'Abdominal Pain', value: patient.abdominalPain },
                { label: 'Blood in Stool', value: patient.bloodInStool },
                { label: 'QoL Impact', value: patient.impactOnQoL },
                { label: 'Weight Loss', value: patient.weightLoss },
              ].map((r, i) => (
                <div key={i} className="pr-srow">
                  <span className="pr-srow-label">{r.label}</span>
                  <span className="pr-srow-val">{r.value || '—'}</span>
                </div>
              ))}
              </div>
            </div>

            <div className="pr-sidebar-card">
              <div className="pr-sidebar-head">Serology Summary</div>
              <div className="pr-sidebar-body">
              {[
                { label: 'TB', value: patient.tbScreening },
                { label: 'HBsAg', value: patient.hepBSurfaceAg },
                { label: 'Anti-HCV', value: patient.antiHcv },
                { label: 'Anti-HIV', value: patient.antiHiv },
              ].map((r, i) => (
                <div key={i} className="pr-infection-row">
                  <span className="pr-srow-label">{r.label}</span>
                  <span className="pr-srow-val" style={{ color: labStatusColor(r.value) }}>{r.value || '—'}</span>
                </div>
              ))}
              </div>
            </div>

            <div className="pr-sidebar-card">
              <div className="pr-sidebar-head">Record Info</div>
              <div className="pr-sidebar-body">
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
              </div>
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
