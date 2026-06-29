import {
  formatEndoscopicDataForPrompt,
  formatHbiForPrompt,
  formatPartialMayoForPrompt,
  formatInvestigationsForPrompt,
  formatMedicationHistoryForPrompt,
  montrealDetailLine,
} from './kp3p-patient-context';
import { formatRadiologyForPrompt } from './radiology-investigations';

export interface PatientData {
  name: string; id: string; age: number; sex: string; occupation: string;
  location: string; smoking: string; diagnosis: string; montreal: string;
  severity: string; duration: string; ageAtDx: number; priorSurgeries?: string;
  bowelFreq: string; bloodInStool: string; abdPain: string; weightLoss: string;
  hb: string; tlc: string; platelets: string; crp: string; albumin: string;
  mayoScore: string; treatmentResponse: string;
  priorFailed: string; tbStatus: string; hbsAg: string; antiHBs: string;
  antiHBc: string; antiHCV: string; antiHIV: string;
  comorbidities?: string[]; eim?: string; specialNotes?: string[];
  patientLanguage?: string;
  vaccines?: { influenza?:string; covid19?:string; pneumococcal?:string;
    hepatitisA?:string; hepatitisB?:string; zoster?:string; mmr?:string; varicella?:string; tdap?:string; };
  dateOfBirth?: string;
  ageAtDiagnosis?: number;
  vaccineInfluenza?: string;
  vaccineCovid?: string;
  vaccinePneumococcal?: string;
  vaccineHepB?: string;
  vaccineHepA?: string;
  vaccineHepE?: string;
  vaccineZoster?: string;
  vaccineTetanus?: string;
  vaccineMmr?: string;
  vaccineVaricella?: string;
  specialConsiderations?: string;
  pregnancyPlanning?: string;
  activityScore?: string;
  impactOnQoL?: string;
  currentIbdMedicationsRows?: string;
  ibdInvestigations?: string;
  radiologyInvestigations?: string;
  investigationsDate?: string;
  sesCdScoring?: string;
  hbiScoring?: string;
  partialMayoScoring?: string;
  upperGiFindings?: string;
  ucEndoscopicScoring?: string;
  sesCdClinicalNotes?: string;
  montrealAgeAtDiagnosis?: string;
  ucExtent?: string;
  diseaseLocation?: string;
  diseaseBehavior?: string;
  perianalDisease?: string;
}

function ageAtDxLabel(patient: PatientData): string {
  if (patient.ageAtDiagnosis != null) return String(patient.ageAtDiagnosis);
  if (patient.ageAtDx > 0) return String(patient.ageAtDx);
  return 'N/A';
}

function labsLine(patient: PatientData): string {
  const fromInvestigations = formatInvestigationsForPrompt(
    patient.ibdInvestigations,
    patient.investigationsDate,
  );
  if (fromInvestigations !== 'None documented') return fromInvestigations;

  const parts = [
    patient.hb && `Hb ${patient.hb}`,
    patient.tlc && `TLC ${patient.tlc}`,
    patient.platelets && `Plt ${patient.platelets}`,
    patient.crp && `CRP ${patient.crp}`,
    patient.albumin && `Alb ${patient.albumin}`,
  ].filter(Boolean);
  return parts.length ? parts.join(', ') : 'Not provided';
}

function vaccineStatus(patient: PatientData, key: keyof NonNullable<PatientData['vaccines']>, direct?: string): string {
  return direct ?? patient.vaccines?.[key] ?? 'Unknown';
}

function patientContext(patient: PatientData) {
  const medicationHistory = formatMedicationHistoryForPrompt(patient.currentIbdMedicationsRows);
  const endoscopicSummary = formatEndoscopicDataForPrompt({
    sesCdScoring: patient.sesCdScoring,
    upperGiFindings: patient.upperGiFindings,
    ucEndoscopicScoring: patient.ucEndoscopicScoring,
    sesCdClinicalNotes: patient.sesCdClinicalNotes,
  });
  const hbiSummary = patient.hbiScoring ? formatHbiForPrompt(patient.hbiScoring) : 'Not provided';
  const partialMayoSummary = patient.partialMayoScoring
    ? formatPartialMayoForPrompt(patient.partialMayoScoring)
    : 'Not provided';
  const radiologySummary = patient.radiologyInvestigations
    ? formatRadiologyForPrompt(patient.radiologyInvestigations)
    : 'Not provided';

  return {
    medicationHistory,
    endoscopicSummary,
    hbiSummary,
    partialMayoSummary,
    radiologySummary,
    montrealDetails: montrealDetailLine(patient),
  };
}

export function buildKP3PPrompt(patient: PatientData): string {
  const protocolDate = new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  const patientRef = patient.id ? `Patient ID ${patient.id}` : 'Patient';
  const doc2Language = patient.patientLanguage?.trim() && patient.patientLanguage.toLowerCase() !== 'english'
    ? patient.patientLanguage.trim()
    : 'English';
  const ctx = patientContext(patient);

  return `Fill the HTML template below using the patient record. Perform all KP-3P reasoning internally — output only the three final documents.

RULES:
1. Output ONLY pure HTML without Markdown fences.
2. Use standard tags only: <h2> <h3> <h4> <h5> <table> <tr> <th> <td> <ul> <li> <b> <p> <br> <hr> <div>
3. No custom CSS or inline styles.
4. Replace all [PLACEHOLDERS] with specific clinical data.
5. Reference the uploaded guideline document for all treatment and screening decisions.
6. Do NOT include physician name, clinic, phone numbers, or website — leave injection marker divs unchanged.
7. Use [Patient Name] in patient-facing sections (never the legal name). Use [Patient Name] 2–3 times in Document 2.
8. Document 2 language: ${doc2Language}.
9. Document 1 must always complete ALL four K — Know Your Patient subsections: Severity Assessment table, Laboratory Trend table, Radiology Trend section, and Medication History Summary table — none are optional.
10. Apply endoscopic precedence: when both clinical and endoscopic scores exist, endoscopic score determines severity; note override in clinician record.
11. State lab trend direction explicitly (Improving / Worsening / Stable / Stable remission / Insufficient data — single timepoint). Use trends for risk and treatment urgency.
12. Classify radiology trend with free-text limitation acknowledged; flag "uncertain — clinician review required" when ambiguous.
13. Apply medication reason logic: primary NR = avoid class; secondary LOR = TDM first; intolerance/ADR = caution; poor compliance = re-recommend with adherence strategy in patient sheet; remission = consider re-induction.
14. Any pending or blank infection screening result = "DO NOT START IMMUNOSUPPRESSION" flag in clinician record.
15. Complete Pregnancy &amp; Family Planning section for ALL patients; include applicable flags in both Document 1 and Document 2.
16. Never recommend a drug in a mechanism class that previously failed (primary NR) without documented rationale.

---BEGIN TEMPLATE---

<h2>DOCUMENT 1: CLINICIAN RECORD</h2>
<h3>KP-3P CLINICAL PROTOCOL</h3>
<p><b>For Physician Use Only</b> | Maximum 3 Pages</p>
<p><b>Patient:</b> ${patientRef} | <b>Date:</b> ${protocolDate} | <b>KP-3P v1.0</b></p>
<p><b>Diagnosis:</b> ${patient.diagnosis} | <b>Classification:</b> ${patient.montreal} | <b>Severity:</b> [Mild / Moderate / Severe — per endoscopic precedence]</p>

<h4>K — KNOW YOUR PATIENT</h4>

<h5>Severity Assessment</h5>
<table>
  <tr><th>Score Type</th><th>Tool</th><th>Result</th><th>Date</th></tr>
  <tr><td><b>Clinical Score</b></td><td>Partial Mayo Score (UC) / HBI (CD)</td><td>[Score + interpretation]</td><td>[Date]</td></tr>
  <tr><td><b>Endoscopic Score</b></td><td>MES / UCEIS (UC) / SES-CD / CDEIS (CD)</td><td>[Score + interpretation]</td><td>[Date of colonoscopy]</td></tr>
  <tr><td><b>Final Severity Classification</b></td><td>[Endoscopic precedence applied]</td><td>[Mild / Moderate / Severe]</td><td>—</td></tr>
</table>
<p><b>Note:</b> Endoscopic score has taken precedence over clinical score for severity classification, as mucosal findings more accurately reflect disease activity than symptom indices alone. [State explicitly if endoscopic score upgraded or downgraded the clinical assessment, or state if only one score type was available.]</p>

<h5>Laboratory Trend</h5>
<table>
  <tr><th>Parameter</th><th>[Date 1]</th><th>[Date 2]</th><th>[Date 3]</th><th>Trend</th><th>Clinical Implication</th></tr>
  <tr><td>CRP (mg/L)</td><td>[Value]</td><td>[Value]</td><td>[Value]</td><td>[Improving / Worsening / Stable / Stable remission / Single timepoint]</td><td>[Implication]</td></tr>
  <tr><td>Fecal Calprotectin (µg/g)</td><td>[Value]</td><td>[Value]</td><td>[Value]</td><td>[Trend]</td><td>[Implication]</td></tr>
  <tr><td>Albumin (g/dL)</td><td>[Value]</td><td>[Value]</td><td>[Value]</td><td>[Trend]</td><td>[Implication]</td></tr>
  <tr><td>Haemoglobin (g/dL)</td><td>[Value]</td><td>[Value]</td><td>[Value]</td><td>[Trend]</td><td>[Implication]</td></tr>
  <tr><td>WBC</td><td>[Value]</td><td>[Value]</td><td>[Value]</td><td>[Trend]</td><td>[Implication]</td></tr>
  <tr><td>[Other]</td><td>[Value]</td><td>[Value]</td><td>[Value]</td><td>[Trend]</td><td>[Implication]</td></tr>
</table>
<p><b>Overall Biochemical Trend:</b> [Improving / Worsening / Stable / Mixed — one sentence summary and its implication for treatment urgency]</p>

<h5>Radiology Trend</h5>
<table>
  <tr><th>Modality</th><th>Date</th><th>Key Findings</th><th>Comparison to Prior</th></tr>
  <tr><td>[CT / MRI / IUS]</td><td>[Date]</td><td>[Free-text findings]</td><td>[Better / Worse / Stable / First study]</td></tr>
</table>
<p><b>Overall Radiology Trend:</b> [Improving / Worsening / Stable / Insufficient data / uncertain — clinician review required]</p>
<p><b>Disease behaviour implication:</b> [Note if radiology trend has changed B classification or revealed new structural complication]</p>
<p><b>Limitation:</b> Radiology findings are recorded as free text and may reflect variable clinical terminology. Where findings were ambiguous, trend classification has been marked "uncertain — clinician review required." Trend interpretation should be confirmed against original reports.</p>

<h5>Medication History Summary</h5>
<table>
  <tr><th>Category</th><th>Drug</th><th>Dose / Duration</th><th>Status</th><th>Reason for Stopping</th><th>System Action</th></tr>
  <tr><td><b>Current</b></td><td>[Drug name]</td><td>[Dose / Duration]</td><td>Active</td><td>—</td><td>[Incorporated into treatment plan]</td></tr>
  <tr><td><b>Prior</b></td><td>[Drug name]</td><td>[Dose / Duration]</td><td>Stopped</td><td>[Primary NR / Secondary LOR / Intolerance-ADR / Poor compliance / Remission]</td><td>[Avoid class / TDM first / Caution / Re-recommend with adherence strategy / Re-induction consider]</td></tr>
</table>
<p><b>Steroid Exposure:</b> [Number] courses | Last course: [Date] | Steroid dependent: Yes / No</p>
<p><b>Immunosuppression Level at Presentation:</b> None / Low / Moderate / High</p>
<p><b>Biologic-naive:</b> Yes / No | <b>Prior biologic failures:</b> [Number and agents, mechanism of failure if determinable]</p>
<p><b>Clinical Implication:</b> [One sentence on how medication history — including any compliance issues and failed mechanisms — impacts risk level and treatment selection]</p>

<h4>P1 — RISK STRATIFICATION</h4>
<table>
  <tr><th>Parameter</th><th>Finding</th></tr>
  <tr><td><b>Risk Level</b></td><td>[HIGH / MODERATE / LOW]</td></tr>
  <tr><td><b>Key Risk Factors</b></td><td>[List — include steroid dependence, prior biologic failure, worsening lab trend, worsening radiology trend if applicable]</td></tr>
  <tr><td><b>Treatment Approach</b></td><td>[Step-up / Top-down / Accelerated step-up]</td></tr>
  <tr><td><b>Guideline Basis</b></td><td>[ECCO / ACG / STRIDE-II reference]</td></tr>
</table>
<p><b>Clinical Implication:</b> [One sentence on why this risk level and approach for this patient, referencing trend data and medication history]</p>

<h4>STRIDE-II THERAPEUTIC TARGETS</h4>
<table>
  <tr><th>Target</th><th>Specific Measure</th><th>Timeline</th><th>Escalation if Missed</th></tr>
  <tr><td><b>Clinical</b></td><td>[PMS ≤1 or HBI &lt;5]</td><td>Week 12–16</td><td>Dose-optimise or switch</td></tr>
  <tr><td><b>Biochemical</b></td><td>[CRP &lt;5 mg/L, FC &lt;150 μg/g]</td><td>Week 12–24</td><td>TDM + consider escalation</td></tr>
  <tr><td><b>Endoscopic</b></td><td>[MES 0–1 / SES-CD &lt;3]</td><td>Month 6–12</td><td>Change mechanism</td></tr>
  <tr><td><b>Quality of Life</b></td><td>[IBDQ &gt;170]</td><td>Month 3+</td><td>Multidisciplinary review</td></tr>
</table>
<p><b>Assessment Schedule:</b> Week 4 (safety) → Week 12–16 (symptoms/labs) → Month 6–12 (endoscopy)</p>
<p><b>Evidence:</b> STRIDE-II Consensus (uploaded)</p>

<h4>P2 — INFECTION PREVENTION</h4>
<p><b>Pre-Treatment Screening</b> (mandatory — do not start immunosuppression until all results available):</p>
<ul>
  <li>[ ] <b>TB:</b> IGRA / TST + CXR — Result/Action: ${patient.tbStatus ?? 'Not documented'} | CT Chest: [if indicated — Result: ___________]</li>
  <li>[ ] <b>HBsAg</b> — Result/Action: ${patient.hbsAg ?? 'Not tested'}</li>
  <li>[ ] <b>Anti-HBs</b> — Result/Action: ${patient.antiHBs ?? 'Not tested'}</li>
  <li>[ ] <b>Anti-HBc</b> — Result/Action: ${patient.antiHBc ?? 'Not tested'}</li>
  <li>[ ] <b>Anti-HCV</b> — Result/Action: ${patient.antiHCV ?? 'Not tested'}</li>
  <li>[ ] <b>HIV</b> (if indicated) — Result/Action: ${patient.antiHIV ?? 'Not tested'}</li>
  <li>[ ] <b>Baseline labs:</b> CBC, CMP, LFTs — [Status/action]</li>
</ul>
<p><b>MANDATORY FLAG:</b> Any of the above marked "pending" or left blank = DO NOT START IMMUNOSUPPRESSION until result is confirmed and actioned.</p>
<p><b>If patient is already on immunosuppression:</b> Live vaccines are CONTRAINDICATED. Flag below.</p>
<p><b>Vaccination Protocol</b> (per ACG Preventive Care Guidelines):</p>
<table>
  <tr><th>Vaccine</th><th>Priority</th><th>Timing Constraint</th></tr>
  <tr><td>MMR / Varicella (if non-immune) — MMR: ${vaccineStatus(patient, 'mmr', patient.vaccineMmr)}; Varicella: ${vaccineStatus(patient, 'varicella', patient.vaccineVaricella)}</td><td>URGENT</td><td>At least 4 weeks BEFORE immunosuppression — CONTRAINDICATED if already immunosuppressed</td></tr>
  <tr><td>Pneumococcal (PCV20 or PCV15 then PPSV23) — ${vaccineStatus(patient, 'pneumococcal', patient.vaccinePneumococcal)}</td><td>HIGH</td><td>Before or at treatment start</td></tr>
  <tr><td>Shingrix (×2 doses, 2–6 months apart) — ${vaccineStatus(patient, 'zoster', patient.vaccineZoster)}</td><td>HIGH</td><td>Before or at treatment start</td></tr>
  <tr><td>Hepatitis B (if non-immune) — ${vaccineStatus(patient, 'hepatitisB', patient.vaccineHepB)}</td><td>HIGH</td><td>Accelerated schedule if needed</td></tr>
  <tr><td>Influenza (inactivated) — ${vaccineStatus(patient, 'influenza', patient.vaccineInfluenza)}</td><td>ROUTINE</td><td>Annual</td></tr>
  <tr><td>HPV</td><td>IF ≤26 years</td><td>Per schedule</td></tr>
  <tr><td>COVID-19 — ${vaccineStatus(patient, 'covid19', patient.vaccineCovid)}</td><td>ROUTINE</td><td>Per current recommendations</td></tr>
  <tr><td>Tetanus / Tdap — ${vaccineStatus(patient, 'tdap', patient.vaccineTetanus)}</td><td>ROUTINE</td><td>Update if due</td></tr>
</table>
<p><b>Evidence:</b> ACG Preventive Care Guidelines (uploaded)</p>

<h4>P3 — TREATMENT &amp; MONITORING PROTOCOL</h4>
<p><b>Primary Treatment:</b></p>
<table>
  <tr><th>Component</th><th>Detail</th><th>Guideline</th></tr>
  <tr><td><b>Medication</b></td><td>[Drug name]</td><td>[ECCO/ACG citation]</td></tr>
  <tr><td><b>Dose &amp; Route</b></td><td>[Specific dose, route]</td><td></td></tr>
  <tr><td><b>Schedule</b></td><td>[Frequency]</td><td></td></tr>
  <tr><td><b>Rationale</b></td><td>[One sentence: why this drug for this patient — referencing medication history, trend data, and risk level; prior failures: ${patient.priorFailed ?? 'None'}]</td><td></td></tr>
  <tr><td><b>TDM</b> (if biologic/thiopurine)</td><td>[Timing + target trough levels]</td><td></td></tr>
  <tr><td><b>Alternative if no response</b></td><td>[Alternative agent — must not repeat failed mechanism class without justification]</td><td></td></tr>
</table>
<p><b>Monitoring Schedule:</b></p>
<table>
  <tr><th>Timepoint</th><th>Investigations</th><th>Purpose</th></tr>
  <tr><td>Baseline</td><td>CBC, CMP, LFTs, [drug-specific]</td><td>Safety baseline</td></tr>
  <tr><td>Week 4</td><td>[Relevant safety labs]</td><td>Tolerability check</td></tr>
  <tr><td>Month 3</td><td>CBC, CRP, FC, LFTs</td><td>First efficacy signal + trend update</td></tr>
  <tr><td>Month 6</td><td>Above + colonoscopy/MRE</td><td>Treat-to-target assessment</td></tr>
  <tr><td>Month 12</td><td>Full panel + endoscopy</td><td>Confirm endoscopic remission</td></tr>
  <tr><td>Ongoing</td><td>[Per drug and disease — frequency adjusted for trend severity]</td><td>Maintenance monitoring</td></tr>
</table>
<p><b>Therapeutic Drug Monitoring</b> (if biologics or thiopurines):</p>
<ul>
  <li>First TDM: [Timing per uploaded guidelines]</li>
  <li>Subsequent TDM: [Based on response and trend]</li>
  <li>Target trough levels: [Per uploaded TDM protocols]</li>
</ul>
<p><b>Long-Term Surveillance:</b></p>
<table>
  <tr><th>Surveillance</th><th>Schedule</th><th>Trigger/Notes</th></tr>
  <tr><td>Colorectal Cancer (colonoscopy)</td><td>From year 8 post-diagnosis</td><td>Earlier if PSC, extensive colitis, family history</td></tr>
  <tr><td>Skin Cancer (dermatology review)</td><td>Annual</td><td>If on thiopurines or biologics</td></tr>
  <tr><td>Bone Health (DEXA)</td><td>If steroids &gt;3 months</td><td>Ca²⁺ + Vit D supplementation; bisphosphonates if indicated</td></tr>
  <tr><td>Cervical Cancer</td><td>Age-appropriate; more frequent on immunosuppression</td><td></td></tr>
  <tr><td>Lymphoma awareness</td><td>Ongoing</td><td>Especially if on combination therapy (thiopurine + biologic)</td></tr>
</table>
<p><b>Drug-Specific Monitoring:</b></p>
<p><b>If Thiopurines:</b></p>
<ul>
  <li>TPMT / NUDT15 genotyping before initiation (NUDT15 especially important in South Asian patients)</li>
  <li>CBC: weekly ×4, then fortnightly ×4, then every 3 months</li>
  <li>LFTs: every 3 months</li>
  <li>Metabolite levels (6-TGN, 6-MMP) at 4–8 weeks, then as needed</li>
</ul>
<p><b>If Biologics:</b></p>
<ul>
  <li>TDM at specific intervals per uploaded guidelines</li>
  <li>Anti-drug antibody testing if loss of response</li>
  <li>Annual TB screening if high risk</li>
</ul>
<p><b>If Methotrexate:</b></p>
<ul>
  <li>CBC and LFTs every 2–4 weeks initially, then every 8–12 weeks</li>
  <li>Folic acid 1 mg daily supplementation</li>
</ul>

<h4>PREGNANCY &amp; FAMILY PLANNING ALERTS</h4>
<p>[Complete this section for ALL patients. State "Not applicable — no family planning concerns identified" only if the intake form explicitly confirms this. Pregnancy planning intake: ${patient.pregnancyPlanning ?? 'Not specified'}]</p>
<p><b>Female patients:</b></p>
<ul>
  <li>[ ] Methotrexate: ABSOLUTELY CONTRAINDICATED — stop minimum 3 months before conception</li>
  <li>[ ] JAK inhibitors: AVOID — insufficient safety data in pregnancy</li>
  <li>[ ] Current safe medications to continue: [List per guidelines]</li>
  <li>[ ] Refer to specialist IBD-pregnancy clinic if conception planned</li>
</ul>
<p><b>Male patients:</b></p>
<ul>
  <li>[ ] Methotrexate: impairs sperm quality — stop minimum 3 months before planned conception</li>
  <li>[ ] JAK inhibitors: limited reproductive safety data — discuss risks with patient</li>
  <li>[ ] Sulfasalazine: causes reversible oligospermia — switch to alternative 5-ASA if conception planned</li>
  <li>[ ] Note: these risks relate to sperm quality and early embryo development; mechanism differs from female teratogenicity</li>
</ul>

<h4>⚠️ PHYSICIAN ALERTS</h4>
<ul>
  <li>[State "None identified" if not applicable]</li>
  <li>[Flag 1 — e.g., Severe disease — hospitalisation may be required]</li>
  <li>[Flag 2 — e.g., Prior biologic failure — confirm mechanism of failure before selecting next agent]</li>
  <li>[Flag 3 — e.g., Steroid dependent — escalation to biologic mandatory regardless of current symptom status]</li>
  <li>[Flag 4 — e.g., Worsening biochemical trend despite current therapy — escalation warranted]</li>
  <li>[Flag 5 — e.g., Pending infection screening — immunosuppression must not be started]</li>
  <li>[Flag 6 — e.g., Already on immunosuppression — live vaccines contraindicated]</li>
  <li>[Flag 7 — e.g., Poor compliance history — adherence strategy included in patient information sheet]</li>
  <li>[Flag 8 — e.g., Family planning — drug modifications required; see pregnancy section]</li>
</ul>
<p><b>Guidelines Referenced:</b> STRIDE-II | ECCO | ACG | [Others as uploaded]</p>

<hr>

<h2>DOCUMENT 2: PATIENT INFORMATION SHEET</h2>
<h3>YOUR IBD CARE PLAN</h3>
<p><b>For Patient</b> | Maximum 2 Pages</p>
<p><b>Prepared for:</b> [Patient Name] | <b>Date:</b> ${protocolDate}</p>
<p><b>Your Doctor:</b> Gastroenterologist &amp; IBD Specialist (contact details below)</p>

<h4>About Your Condition</h4>
<p>You have been diagnosed with <b>[Crohn's Disease / Ulcerative Colitis]</b> affecting [location in simple terms — e.g., "the lower part of your large intestine"].</p>
<p>This is a condition where your immune system causes inflammation in your intestines. It is <b>not caused by anything you did</b>, it is <b>not contagious</b>, and with modern treatment, <b>most patients lead completely normal lives</b>.</p>
<p><b>Why treatment matters:</b> Without treatment, inflammation can silently damage your intestines even when you feel okay. Treatment heals this damage and keeps you well long-term.</p>

<h4>Your Medication</h4>
<p><b>[Medication Name]</b> — [Dose] — [e.g., "One tablet twice daily with food"]</p>
<ul>
  <li><b>What it does:</b> [One simple sentence]</li>
  <li><b>When you'll feel better:</b> Most patients notice improvement within [X weeks]</li>
  <li><b>Important:</b> Keep taking it even when you feel well — stopping early is the number one reason for flare-ups</li>
</ul>
<p><b>Side effects to watch for:</b> [List 2–3 most relevant, in plain language]</p>
<p>[If prior medications were stopped due to primary non-response or intolerance: "We have reviewed the medications you have tried before and selected this treatment based on what will work best for you now."]</p>

<h4>Staying on Track with Your Medication</h4>
<p>[Include this entire section only if a prior medication was stopped due to poor compliance]</p>
<p>We know that taking medication every day — especially when you feel well — can be hard. Here are some practical tips that help:</p>
<ul>
  <li>Set a daily phone reminder at the same time every day</li>
  <li>Keep your medication next to something you use every day (toothbrush, breakfast items)</li>
  <li>Ask a family member to check in with you</li>
  <li>Use a weekly pill box so you can see at a glance if you've taken your dose</li>
  <li>If side effects are making it difficult to take your medication, please tell us before stopping — there is often something we can do to help</li>
</ul>
<p>Missing doses allows inflammation to return silently. If you are struggling, call us — we will find a way to make this work for you.</p>

<h4>Before We Start: Your Safety Checklist</h4>
<p>These tests and vaccines protect you while on treatment:</p>
<p><b>Tests needed first:</b></p>
<ul>
  <li>[ ] TB screening (blood test + chest X-ray)</li>
  <li>[ ] Hepatitis B &amp; C blood tests</li>
  <li>[ ] General health blood panel</li>
</ul>
<p><b>Vaccines recommended:</b></p>
<ul>
  <li>[ ] [Vaccine 1] — [one-line plain-language reason]</li>
  <li>[ ] [Vaccine 2] — [one-line plain-language reason]</li>
  <li>[ ] [Vaccine 3] — [one-line plain-language reason]</li>
</ul>

<h4>Your Goals &amp; Milestones</h4>
<table>
  <tr><th>When</th><th>Our Goal</th></tr>
  <tr><td><b>Month 1</b></td><td>Symptoms noticeably improving</td></tr>
  <tr><td><b>Month 3–4</b></td><td>Feeling much better + blood tests normalising</td></tr>
  <tr><td><b>Month 6–12</b></td><td>Scope confirms your intestines have healed</td></tr>
  <tr><td><b>Ongoing</b></td><td>Stay in remission — no symptoms, great quality of life</td></tr>
</table>
<p>If we are not hitting these milestones, we adjust your treatment. We never accept partial improvement.</p>

<h4>Diet &amp; Lifestyle</h4>
<p><b>Foods that may help</b> (especially during symptoms): Well-cooked vegetables, lean proteins, white rice, ripe bananas, plenty of water</p>
<p><b>Foods to limit</b> (especially during symptoms): Raw vegetables and fruits, spicy foods, fried or fatty foods</p>
<p><b>Lifestyle:</b> Manage stress, gentle regular exercise (walking, swimming), adequate sleep</p>
${patient.smoking && !/never/i.test(patient.smoking) ? '<p><b>Quit smoking</b> — this significantly improves outcomes for Crohn\'s disease.</p>' : ''}

<h4>Important: If You Are Planning a Family</h4>
<p>[Include this section only if applicable — complete for both male and female patients as appropriate]</p>
<p><b>For women planning a pregnancy:</b> Some of the medications used for IBD are not safe during pregnancy and need to be stopped well before you try to conceive. Please speak to your doctor before stopping any contraception or trying for a baby so we can review your medications in advance. Many IBD medications are safe in pregnancy, but some — including [methotrexate / JAK inhibitors if applicable] — need to be changed. Planning ahead gives us time to switch you to a safe alternative without disrupting your disease control.</p>
<p><b>For men planning to father a child:</b> Some IBD medications can affect sperm quality and may need to be stopped or changed before you try for a baby. [Methotrexate / JAK inhibitors / Sulfasalazine — as applicable] are among these. Please inform your doctor if you are planning a family so we can review your medications well in advance. This is a straightforward change that is best planned ahead of time.</p>

<h4>Your Follow-Up Appointments</h4>
<table>
  <tr><th>When</th><th>What Happens</th></tr>
  <tr><td>Week 2–4</td><td>Check-in — how are you tolerating the medication?</td></tr>
  <tr><td>Month 3</td><td>Blood tests + symptom review</td></tr>
  <tr><td>Month 6–12</td><td>Scope or scan to confirm healing</td></tr>
  <tr><td>Every [X] months</td><td>Ongoing monitoring to keep you well</td></tr>
</table>
<p><b>Please do not miss these appointments — they are essential, not optional.</b></p>

<h4>When to Call Immediately</h4>
<p><b>Call the emergency number if you experience:</b></p>
<ul>
  <li>Fever above 38.3°C</li>
  <li>Severe or unusual abdominal pain</li>
  <li>Significant blood in stool</li>
  <li>Persistent vomiting</li>
  <li>Rash, swelling, or difficulty breathing (possible allergic reaction)</li>
</ul>
<p><b>Also call for:</b> New or unexplained symptoms, questions about your medication, before any surgery or new medications, if you are planning a pregnancy.</p>

<div data-kp3p-inject="physician-contact-patient"></div>

<p>Many of my patients with your condition live completely normal lives — working, travelling, raising families, pursuing their passions. <b>With the right treatment and regular monitoring, [Patient Name], you can too.</b></p>

<hr>

<h2>DOCUMENT 3: PRESCRIPTION SHEET</h2>
<p><b>For Patient</b> | Maximum 1 Page</p>
<p><b>SYSTEM INSTRUCTION:</b> Generate this document as a pre-drafted prescription based on Document 1 recommendations. Tag each item as either [RECOMMENDED — INCLUDE] or [OPTIONAL — CONFIRM]. Physician reviews, removes unwanted items, and prints. If content risks exceeding one page, move lower-priority optional items to a single footnote line rather than expanding the document.</p>
<div data-kp3p-inject="physician-header-prescription"></div>
<p><b>Patient Name:</b> [Patient Name] &nbsp;&nbsp; <b>Age / Sex:</b> ${patient.age} / ${patient.sex}<br>
<b>Date:</b> ${protocolDate} &nbsp;&nbsp; <b>Diagnosis:</b> ${patient.diagnosis}</p>

<h4>℞ — MEDICATIONS</h4>
<p>[For each medication recommended in Document 1, present as below. The AI pre-selects items based on clinical reasoning. Physician removes any items not to be included before printing.]</p>
<ol>
  <li><b>[Drug Name]</b> [RECOMMENDED — INCLUDE]<br>
  Dose: [e.g., Mesalazine 4 g/day] | Form: [e.g., Oral granules] | Frequency: [e.g., Once daily] | Duration: [e.g., Ongoing — review at 3 months]</li>
  <li><b>[Drug Name]</b> [OPTIONAL — CONFIRM]<br>
  Dose: [e.g., Prednisolone 40 mg] | Form: [e.g., Oral tablet] | Frequency: [e.g., Once daily, taper per schedule] | Duration: [e.g., 8 weeks with tapering]</li>
</ol>
<p>[Continue for all medications from Document 1]</p>

<h4>🔬 INVESTIGATIONS ADVISED</h4>
<p><b>Immediate (Before Starting Treatment):</b></p>
<table>
  <tr><th>Investigation</th><th>Approval Tag</th><th>Timing</th></tr>
  <tr><td>IGRA / Mantoux + CXR</td><td>[RECOMMENDED — INCLUDE]</td><td>Once, before treatment</td></tr>
  <tr><td>CT Chest</td><td>[OPTIONAL — CONFIRM]</td><td>If CXR inconclusive or clinically indicated</td></tr>
  <tr><td>HBsAg</td><td>[RECOMMENDED — INCLUDE]</td><td>Once, before treatment</td></tr>
  <tr><td>Anti-HBs</td><td>[RECOMMENDED — INCLUDE]</td><td>Once, before treatment</td></tr>
  <tr><td>Anti-HBc</td><td>[RECOMMENDED — INCLUDE]</td><td>Once, before treatment</td></tr>
  <tr><td>Anti-HCV</td><td>[RECOMMENDED — INCLUDE]</td><td>Once, before treatment</td></tr>
  <tr><td>CBC, CRP, ESR</td><td>[RECOMMENDED — INCLUDE]</td><td>Baseline</td></tr>
  <tr><td>LFTs, RFTs, Albumin</td><td>[RECOMMENDED — INCLUDE]</td><td>Baseline</td></tr>
  <tr><td>Fecal Calprotectin</td><td>[RECOMMENDED — INCLUDE]</td><td>Baseline</td></tr>
  <tr><td>TPMT / NUDT15 genotyping</td><td>[OPTIONAL — CONFIRM]</td><td>Before thiopurine initiation</td></tr>
</table>
<p><b>Ongoing Monitoring:</b></p>
<table>
  <tr><th>Investigation</th><th>Approval Tag</th><th>Frequency</th></tr>
  <tr><td>CBC + CRP</td><td>[RECOMMENDED — INCLUDE]</td><td>Every 3 months</td></tr>
  <tr><td>LFTs</td><td>[RECOMMENDED — INCLUDE]</td><td>Every 3 months</td></tr>
  <tr><td>Fecal Calprotectin</td><td>[RECOMMENDED — INCLUDE]</td><td>Every 3–6 months</td></tr>
  <tr><td>Colonoscopy / Sigmoidoscopy</td><td>[RECOMMENDED — INCLUDE]</td><td>Month 6–12</td></tr>
  <tr><td>MRE (if Crohn's Disease)</td><td>[OPTIONAL — CONFIRM]</td><td>Month 12</td></tr>
  <tr><td>DEXA Scan</td><td>[OPTIONAL — CONFIRM]</td><td>If steroids &gt;3 months</td></tr>
  <tr><td>Annual dermatology review</td><td>[OPTIONAL — CONFIRM]</td><td>If on thiopurines/biologics</td></tr>
</table>

<h4>📋 PATIENT INSTRUCTIONS</h4>
<ul>
  <li>[Instruction 1 — e.g., Take all medications with food. Do not skip doses.]</li>
  <li>[Instruction 2 — e.g., Return for blood tests before next clinic visit.]</li>
  <li>[Instruction 3 — e.g., Avoid NSAIDs and aspirin unless specifically advised.]</li>
  <li>[Instruction 4 — e.g., Report fever, severe pain, or blood in stool immediately.]</li>
  <li>[If poor compliance history: Instruction 5 — e.g., Set a daily reminder for your medication. Call the clinic if you have any difficulty taking it — do not stop without speaking to us first.]</li>
</ul>
<p><b>Next Appointment:</b> _______________________ &nbsp;&nbsp; <b>Follow-up Tests Due:</b> _______________________</p>
<p><b>Signature:</b> _______________________________ &nbsp;&nbsp; <b>Stamp:</b></p>
<p><i>KP-3P Model — Prescription generated with AI-assisted clinical decision support. Final prescription reviewed, verified, and authorised by physician.</i></p>

---END TEMPLATE---

PATIENT DATA (de-identified — use for clinical reasoning; do not output legal name):
Ref: ${patientRef} | Age: ${patient.age}y${patient.dateOfBirth ? ` | DOB: ${patient.dateOfBirth}` : ''} | Age at Dx: ${ageAtDxLabel(patient)}y | Sex: ${patient.sex}
Occupation: ${patient.occupation ?? 'N/A'} | Location: ${patient.location ?? 'N/A'} | Smoking: ${patient.smoking ?? 'N/A'}
Diagnosis: ${patient.diagnosis} | Montreal: ${patient.montreal} | Montreal detail: ${ctx.montrealDetails} | Duration: ${patient.duration ?? 'N/A'}
Prior Surgeries: ${patient.priorSurgeries ?? 'None'}
Severity: ${patient.severity} | Activity score: ${patient.activityScore ?? 'N/A'} | Bowel Freq: ${patient.bowelFreq ?? 'N/A'} | Blood: ${patient.bloodInStool ?? 'N/A'}
Pain: ${patient.abdPain ?? 'N/A'} | QoL impact: ${patient.impactOnQoL ?? 'N/A'} | Weight Loss: ${patient.weightLoss ?? 'N/A'}
Labs / Investigations: ${labsLine(patient)}
Radiology Investigations: ${ctx.radiologySummary}
Endoscopic data: ${ctx.endoscopicSummary}
Harvey-Bradshaw Index (HBI): ${ctx.hbiSummary}
Partial Mayo Score (pMayo): ${ctx.partialMayoSummary}
Medication history (structured): ${ctx.medicationHistory}
Treatment response: ${patient.treatmentResponse ?? 'N/A'} | Failed treatment details: ${patient.priorFailed ?? 'None'}
TB: ${patient.tbStatus ?? 'Not documented'} | HBsAg: ${patient.hbsAg ?? 'Not tested'} | Anti-HBs: ${patient.antiHBs ?? 'Not tested'} | Anti-HBc: ${patient.antiHBc ?? 'Not tested'}
Anti-HCV: ${patient.antiHCV ?? 'Not tested'} | Anti-HIV: ${patient.antiHIV ?? 'Not tested'}
Vaccines — Influenza: ${vaccineStatus(patient, 'influenza', patient.vaccineInfluenza)} | COVID: ${vaccineStatus(patient, 'covid19', patient.vaccineCovid)} | Pneumococcal: ${vaccineStatus(patient, 'pneumococcal', patient.vaccinePneumococcal)}
Hep B: ${vaccineStatus(patient, 'hepatitisB', patient.vaccineHepB)} | Hep A: ${vaccineStatus(patient, 'hepatitisA', patient.vaccineHepA)} | Hep E: ${patient.vaccineHepE ?? 'Unknown'} | Zoster: ${vaccineStatus(patient, 'zoster', patient.vaccineZoster)} | MMR: ${vaccineStatus(patient, 'mmr', patient.vaccineMmr)} | Varicella: ${vaccineStatus(patient, 'varicella', patient.vaccineVaricella)} | Tetanus/Tdap: ${vaccineStatus(patient, 'tdap', patient.vaccineTetanus)}
Comorbidities: ${patient.comorbidities?.join(', ') ?? 'None'} | EIM: ${patient.eim ?? 'None'} | Pregnancy planning: ${patient.pregnancyPlanning ?? 'Not specified'}
Special: ${patient.specialConsiderations ?? patient.specialNotes?.join('; ') ?? 'None'}
Preferred patient-facing language: ${doc2Language}`;
}
