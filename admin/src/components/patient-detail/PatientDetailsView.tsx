import { composeMontrealClass, hasMontrealSelections, montrealFieldsForDiagnosis } from '@/lib/montreal-classification';
import { formatSmokingSummary } from '@/lib/smoking';
import {
  filledInvestigationSets,
  parseIbdInvestigations,
} from '@/lib/ibd-investigations';
import {
  filledRadiologySets,
  parseRadiologyInvestigations,
} from '@/lib/radiology-investigations';
import {
  CurrentIbdMedicationsDisplay,
  HbiScoringDisplay,
  PartialMayoScoringDisplay,
  responseToTreatmentColor,
  SesCdScoringDisplay,
  UcEndoscopicScoringDisplay,
  UpperGiFindingsDisplay,
} from '@/components/patient-detail/PatientDetailDisplays';
import {
  formatTbScreeningSummary,
  infectionScreeningSetHasData,
  INFECTION_SCREENING_FIELDS,
  parseInfectionScreening,
  primaryInfectionScreeningSet,
  TB_SCREENING_SUBFIELDS,
} from '@/lib/infection-screening';
import type { PatientWithUser } from '@/types/assessment-form';
import { renderVaccineCard, patientContactEmail, patientDetailsViewStyles } from '@/components/patient-detail/patient-details-view-shared';


type Props = { patient: PatientWithUser };

export default function PatientDetailsView({ patient }: Props) {
  const parseSurgeries = (() => {
    try { return JSON.parse(patient.previousSurgeries || '[]'); } catch { return []; }
  })();
  const parseComorbidities = (() => {
    try { return JSON.parse(patient.comorbidities || '[]'); } catch { return []; }
  })();
  const parseExtraintestinalManif = (() => {
    const raw = patient.extraintestinalManif || '';
    if (!raw.trim()) return [];
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      return [raw];
    }
    return [];
  })();
  const investigationSets = filledInvestigationSets(
    parseIbdInvestigations(patient.ibdInvestigations, patient.dateMostRecentLabs),
  );
  const radiologySets = filledRadiologySets(
    parseRadiologyInvestigations(patient.radiologyInvestigations),
  );
  const parsedInfectionScreening = parseInfectionScreening(
    patient.infectionScreening,
    patient as Record<string, unknown>,
  );
  const infectionScreeningSets = parsedInfectionScreening.sets.filter(infectionScreeningSetHasData);
  const primaryScreening = primaryInfectionScreeningSet(parsedInfectionScreening);

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
              <div className="pr-field-grid">
                {[
                  { label: 'Full Name', value: patient.name },
                  { label: 'Email', value: patientContactEmail(patient) },
                  { label: 'Medical Record No.', value: patient.mrn },
                  { label: 'Contact Phone', value: patient.contactPhone },
                  { label: 'Place of Living', value: patient.placeOfLiving },
                  { label: 'Referred By', value: patient.referredBy },
                  { label: 'Date of Birth', value: patient.dateOfBirth },
                  { label: 'Current Age', value: patient.currentAge ? `${patient.currentAge} yrs` : '' },
                  { label: 'Sex', value: patient.sex },
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
                  <div className="pr-field-label">Age at Diagnosis</div>
                  <div className="pr-field-value">
                    {Number.isFinite(patient.ageAtDiagnosis)
                      ? `${patient.ageAtDiagnosis} yrs`
                      : '—'}
                  </div>
                </div>
                <div className="pr-field" style={{ gridColumn: '1 / -1' }}>
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
                <div className="pr-field-section">
                  <div className="pr-field-section-title" style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                    <span>Montreal Classification</span>
                    {montrealClassDisplay ? (
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#7c3aed', textTransform: 'none', letterSpacing: 0 }}>
                        {montrealClassDisplay}
                      </span>
                    ) : null}
                  </div>
                  <div className="pr-field-grid">
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
                <div className="pr-field">
                  <div className="pr-field-label">Previous Surgeries</div>
                  <div className="pr-field-value">
                    {parseSurgeries.length > 0
                      ? <div className="pr-tag-list">{parseSurgeries.map((s: string, i: number) => <span key={i} className="pr-tag">{s}</span>)}</div>
                      : <span className="empty">None</span>}
                  </div>
                </div>
                {patient.primaryDiagnosis === 'Ulcerative Colitis' && (
                  <>
                    <PartialMayoScoringDisplay raw={patient.partialMayoScoring} />
                    <UcEndoscopicScoringDisplay raw={patient.ucEndoscopicScoring} />
                  </>
                )}
                {patient.primaryDiagnosis === "Crohn's Disease" && (
                  <>
                    <HbiScoringDisplay raw={patient.hbiScoring} />
                    <SesCdScoringDisplay raw={patient.sesCdScoring} />
                    <UpperGiFindingsDisplay raw={patient.upperGiFindings} clinicalNotes={patient.sesCdClinicalNotes} />
                  </>
                )}
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
              {investigationSets.some((set) => set.entries.length > 0 || set.assessmentDate) ? (
                <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 24 }}>
                  {investigationSets.map((set, setIndex) => (
                    <div key={setIndex}>
                      <div style={{
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        color: '#475569',
                        marginBottom: 8,
                      }}>
                        Laboratory &amp; Investigations {setIndex + 1}
                        {set.assessmentDate ? ` — ${set.assessmentDate}` : ''}
                      </div>
                      {set.entries.length > 0 ? (
                        Array.from(
                          set.entries.reduce((groups, entry) => {
                            const list = groups.get(entry.groupTitle) ?? [];
                            list.push(entry);
                            groups.set(entry.groupTitle, list);
                            return groups;
                          }, new Map<string, typeof set.entries>()),
                        ).map(([groupTitle, entries]) => (
                          <div key={groupTitle} style={{ marginBottom: 16 }}>
                            <div style={{
                              fontSize: 11,
                              fontWeight: 700,
                              letterSpacing: '0.06em',
                              textTransform: 'uppercase',
                              color: '#64748b',
                              marginBottom: 8,
                            }}>
                              {groupTitle}
                            </div>
                            <div className="pr-field-grid">
                              {entries.map((entry) => (
                                <div className="pr-field" key={`${groupTitle}-${entry.label}`}>
                                  <div className="pr-field-label">{entry.label}</div>
                                  <div className="pr-field-value">{entry.value}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p style={{ color: '#94a3b8', fontSize: 13 }}>No investigation values recorded for this set.</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ marginTop: 12, color: '#94a3b8', fontSize: 13 }}>No investigation values recorded.</p>
              )}
            </div>

            {/* 05 Radiology */}
            <div className="pr-card">
              <div className="pr-card-head">
                <div className="pr-card-icon" style={{ background: '#eff6ff' }}>🩻</div>
                <span className="pr-card-title">Radiology Investigations</span>
                <span className="pr-card-num">05</span>
              </div>
              {radiologySets.some((set) => set.entries.length > 0 || set.assessmentDate) ? (
                <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 24 }}>
                  {radiologySets.map((set, setIndex) => (
                    <div key={setIndex}>
                      <div style={{
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        color: '#475569',
                        marginBottom: 8,
                      }}>
                        Radiology Investigations {setIndex + 1}
                        {set.assessmentDate ? ` — ${set.assessmentDate}` : ''}
                      </div>
                      {set.entries.length > 0 ? (
                        <div className="pr-field-grid">
                          {set.entries.map((entry) => (
                            <div className="pr-field" key={`${setIndex}-${entry.label}`}>
                              <div className="pr-field-label">{entry.label}</div>
                              <div className="pr-field-value">{entry.value}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p style={{ color: '#94a3b8', fontSize: 13 }}>No radiology values recorded for this set.</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ marginTop: 12, color: '#94a3b8', fontSize: 13 }}>No radiology investigations recorded.</p>
              )}
            </div>

            {/* 06 Treatment History */}
            <div className="pr-card">
              <div className="pr-card-head">
                <div className="pr-card-icon" style={{ background: '#fff1f2' }}>💊</div>
                <span className="pr-card-title">Treatment History</span>
                <span className="pr-card-num">06</span>
              </div>
              <CurrentIbdMedicationsDisplay raw={patient.currentIbdMedicationsRows} />
              <div className="pr-field-grid" style={{ paddingTop: 4 }}>
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

            {/* 07 Serology */}
            <div className="pr-card">
              <div className="pr-card-head">
                <div className="pr-card-icon" style={{ background: '#fff0f9' }}>🩸</div>
                <span className="pr-card-title">Infection Screening & Serology</span>
                <span className="pr-card-num">07</span>
              </div>
              <div className="pr-serology-grid">
                {infectionScreeningSets.length === 0 ? (
                  <div className="pr-serology-pill" style={{ gridColumn: '1 / -1' }}>
                    <div className="pr-serology-value empty">No infection screening recorded.</div>
                  </div>
                ) : (
                  infectionScreeningSets.map((set, setIndex) => (
                    <div key={setIndex} style={{ gridColumn: '1 / -1', display: 'contents' }}>
                      <div className="pr-serology-pill" style={{ gridColumn: '1 / -1' }}>
                        <div className="pr-serology-label">
                          Infection Screening{infectionScreeningSets.length > 1 ? ` ${setIndex + 1}` : ''}
                        </div>
                        {set.screeningDate?.trim() ? (
                          <div className="pr-serology-value" style={{ marginTop: 6 }}>
                            Screening date: {set.screeningDate.trim()}
                          </div>
                        ) : null}
                      </div>
                      <div className="pr-serology-pill" style={{ gridColumn: '1 / -1' }}>
                        <div className="pr-serology-label">TB Screening Status</div>
                        <div className="pr-field-grid" style={{ paddingTop: 8 }}>
                          {TB_SCREENING_SUBFIELDS.map((field) => (
                            <div className="pr-field" key={field.id}>
                              <div className="pr-field-label">{field.label}</div>
                              <div
                                className="pr-field-value"
                                style={{ color: labStatusColor(String(set[field.id] ?? '')) }}
                              >
                                {String(set[field.id] ?? '') || '—'}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      {INFECTION_SCREENING_FIELDS.map((field) => (
                        <div className="pr-serology-pill" key={`${setIndex}-${field.id}`}>
                          <div className="pr-serology-label">{field.label}</div>
                          <div
                            className="pr-serology-value"
                            style={{ color: labStatusColor(String(set[field.id] ?? '')) }}
                          >
                            {String(set[field.id] ?? '') || '—'}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))
                )}
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
                {renderVaccineCard('MMR', patient.mmr)}
                {renderVaccineCard('Varicella', patient.varicella)}
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
                <div className="pr-field">
                  <div className="pr-field-label">Extraintestinal Manifestations</div>
                  <div className="pr-field-value">
                    {parseExtraintestinalManif.length > 0
                      ? <div className="pr-tag-list">{parseExtraintestinalManif.map((s: string, i: number) => <span key={i} className="pr-tag" style={{ background: 'rgba(99,102,241,0.08)', borderColor: 'rgba(99,102,241,0.2)', color: '#4f46e5' }}>{s}</span>)}</div>
                      : <span className="empty">None</span>}
                  </div>
                </div>
                <div className="pr-field">
                  <div className="pr-field-label">Pregnancy / Family Planning Status</div>
                  <div className={`pr-field-value${!patient.pregnancyPlanning ? ' empty' : ''}`}>{patient.pregnancyPlanning || '—'}</div>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT SIDEBAR */}
          <div className="pr-sidebar-column">

            <div className="pr-sidebar-card">
              <div className="pr-sidebar-head">Disease Activity</div>
              <div className="pr-sidebar-big">
                <div className="pr-sidebar-big-val" style={{ color: actColor }}>{patient.currentDiseaseActivity || '—'}</div>
                <div className="pr-sidebar-big-label">{patient.primaryDiagnosis}</div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 5 }}>
                  Montreal: {montrealClassDisplay || '—'}
                </div>
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

            <div className="pr-sidebar-card">
              <div className="pr-sidebar-head">Serology Summary</div>
              {[
                { label: 'TB', value: formatTbScreeningSummary(primaryScreening) },
                { label: 'HBsAg', value: primaryScreening.hepBSurfaceAg },
                { label: 'Anti-HCV', value: primaryScreening.antiHcv },
                { label: 'Anti-HIV', value: primaryScreening.antiHiv },
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
