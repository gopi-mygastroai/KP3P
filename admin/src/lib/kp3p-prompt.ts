export interface PatientData {
  name: string; id: string; age: number; sex: string; occupation: string;
  location: string; smoking: string; diagnosis: string; montreal: string;
  severity: string; duration: string; ageAtDx: number; priorSurgeries?: string;
  bowelFreq: string; bloodInStool: string; abdPain: string; weightLoss: string;
  hb: string; tlc: string; platelets: string; crp: string; albumin: string;
  mayoScore: string; endoscopyFindings: string; imagingFindings: string;
  dexa: string; currentMeds: string; treatmentResponse: string; tdm: string;
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
}

function ageAtDxLabel(patient: PatientData): string {
  if (patient.ageAtDiagnosis != null) return String(patient.ageAtDiagnosis);
  if (patient.ageAtDx > 0) return String(patient.ageAtDx);
  return 'N/A';
}

function labsLine(patient: PatientData): string {
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

export function buildKP3PPrompt(patient: PatientData): string {
  const protocolDate = new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  const patientRef = patient.id ? `Patient ID ${patient.id}` : 'Patient';
  const doc2Language = patient.patientLanguage?.trim() && patient.patientLanguage.toLowerCase() !== 'english'
    ? patient.patientLanguage.trim()
    : 'English';

  return `Fill the HTML template below using the patient record. Perform all KP-3P reasoning internally — output only the three final documents.

RULES:
1. Output ONLY pure HTML without Markdown fences.
2. Use standard tags only: <h2> <h3> <h4> <h5> <table> <tr> <th> <td> <ul> <li> <b> <p> <br> <hr> <div>
3. No custom CSS or inline styles.
4. Replace all [PLACEHOLDERS] with specific clinical data.
5. Reference the uploaded guideline document for all treatment and screening decisions.
6. Do NOT include physician name, clinic, phone numbers, or website — leave injection marker divs unchanged.
7. Use [Patient Name] in patient-facing sections (never the legal name).
8. Document 2 language: ${doc2Language}.

---BEGIN TEMPLATE---

<h2>DOCUMENT 1: CLINICIAN RECORD</h2>
<h3>KP-3P CLINICAL PROTOCOL</h3>
<p><b>For Physician Use Only</b></p>
<p><b>Patient:</b> ${patientRef} | <b>Date:</b> ${protocolDate} | <b>KP-3P v1.0</b></p>
<p><b>Diagnosis:</b> ${patient.diagnosis} | <b>Classification:</b> ${patient.montreal} | <b>Severity:</b> ${patient.severity}</p>

<h4>P1 — RISK STRATIFICATION</h4>
<table>
  <tr><th>Parameter</th><th>Finding</th></tr>
  <tr><td><b>Risk Level</b></td><td>[🔴 HIGH / 🟡 MODERATE / 🟢 LOW]</td></tr>
  <tr><td><b>Key Risk Factors</b></td><td>[Bullet list of factors present]</td></tr>
  <tr><td><b>Treatment Approach</b></td><td>[Step-up / Top-down / Accelerated step-up]</td></tr>
  <tr><td><b>Guideline Basis</b></td><td>[ECCO / ACG / STRIDE-II reference]</td></tr>
</table>
<p><b>Clinical Implication:</b> [One sentence on why this risk level matters for this patient]</p>

<h4>STRIDE-II THERAPEUTIC TARGETS</h4>
<table>
  <tr><th>Target</th><th>Specific Measure</th><th>Timeline</th><th>Escalation if Missed</th></tr>
  <tr><td><b>Clinical</b></td><td>[HBI &lt;5 or Mayo ≤2]</td><td>Week 12–16</td><td>Dose-optimise or switch</td></tr>
  <tr><td><b>Biochemical</b></td><td>[CRP &lt;5 mg/L, FC &lt;150 μg/g]</td><td>Week 12–24</td><td>TDM + consider escalation</td></tr>
  <tr><td><b>Endoscopic</b></td><td>[Mayo 0–1 / SES-CD &lt;3]</td><td>Month 6–12</td><td>Change mechanism</td></tr>
  <tr><td><b>Quality of Life</b></td><td>[IBDQ &gt;170]</td><td>Month 3+</td><td>Multidisciplinary review</td></tr>
</table>
<p><b>Assessment Schedule:</b> Week 4 (safety) → Week 12–16 (symptoms/labs) → Month 6–12 (endoscopy)</p>
<p><b>Evidence:</b> STRIDE-II Consensus (uploaded)</p>

<h4>P2 — INFECTION PREVENTION</h4>
<p><b>Pre-Treatment Screening Required</b> (complete before starting immunosuppression):</p>
<ul>
  <li><b>TB</b> (IGRA/TST + CXR): ${patient.tbStatus ?? 'Not documented'} — [Action]</li>
  <li><b>HBsAg, Anti-HBs, Anti-HBc:</b> HBsAg ${patient.hbsAg ?? 'Not tested'} | Anti-HBs ${patient.antiHBs ?? 'Not tested'} | Anti-HBc ${patient.antiHBc ?? 'Not tested'} — [Action]</li>
  <li><b>Anti-HCV:</b> ${patient.antiHCV ?? 'Not tested'} — [Action]</li>
  <li><b>HIV</b> (if indicated): ${patient.antiHIV ?? 'Not tested'} — [Action]</li>
  <li><b>Baseline labs:</b> CBC, CMP, LFTs — [Status/action]</li>
</ul>
<p><b>Vaccination Protocol</b> (per ACG Guidelines):</p>
<table>
  <tr><th>Vaccine</th><th>Current Status</th><th>Priority / Timing</th></tr>
  <tr><td>MMR / Varicella (if non-immune)</td><td>MMR: ${vaccineStatus(patient, 'mmr', patient.vaccineMmr)} | Varicella: ${vaccineStatus(patient, 'varicella', patient.vaccineVaricella)}</td><td>🔴 URGENT — ≥4 weeks BEFORE immunosuppression</td></tr>
  <tr><td>Pneumococcal</td><td>${vaccineStatus(patient, 'pneumococcal', patient.vaccinePneumococcal)}</td><td>🟡 HIGH — before or at treatment start</td></tr>
  <tr><td>Shingrix (×2 doses)</td><td>${vaccineStatus(patient, 'zoster', patient.vaccineZoster)}</td><td>🟡 HIGH — before or at treatment start</td></tr>
  <tr><td>Hepatitis B</td><td>${vaccineStatus(patient, 'hepatitisB', patient.vaccineHepB)}</td><td>🟡 HIGH if non-immune</td></tr>
  <tr><td>Influenza</td><td>${vaccineStatus(patient, 'influenza', patient.vaccineInfluenza)}</td><td>🟢 ROUTINE — annual</td></tr>
  <tr><td>COVID-19</td><td>${vaccineStatus(patient, 'covid19', patient.vaccineCovid)}</td><td>🟢 ROUTINE</td></tr>
  <tr><td>Tetanus / Tdap</td><td>${vaccineStatus(patient, 'tdap', patient.vaccineTetanus)}</td><td>🟢 Update if due</td></tr>
</table>
<p><b>Evidence:</b> ACG Vaccine Guidelines (uploaded)</p>

<h4>P3 — TREATMENT &amp; MONITORING PROTOCOL</h4>
<p><b>Primary Treatment:</b></p>
<table>
  <tr><th>Component</th><th>Detail</th><th>Guideline</th></tr>
  <tr><td><b>Medication</b></td><td>[Drug name]</td><td>[ECCO/ACG citation]</td></tr>
  <tr><td><b>Dose &amp; Route</b></td><td>[Specific dose, route]</td><td></td></tr>
  <tr><td><b>Schedule</b></td><td>[Frequency]</td><td></td></tr>
  <tr><td><b>Rationale</b></td><td>[Why this drug — prior failures: ${patient.priorFailed ?? 'None'}]</td><td></td></tr>
  <tr><td><b>TDM</b> (if biologic)</td><td>[Timing + target trough levels]</td><td></td></tr>
  <tr><td><b>Alternative if no response</b></td><td>[Alternative agent]</td><td></td></tr>
</table>
<p><b>Monitoring Schedule:</b></p>
<table>
  <tr><th>Timepoint</th><th>Investigations</th><th>Purpose</th></tr>
  <tr><td>Baseline</td><td>CBC, CMP, LFTs, [drug-specific]</td><td>Safety baseline</td></tr>
  <tr><td>Week 4</td><td>[Relevant safety labs]</td><td>Tolerability check</td></tr>
  <tr><td>Month 3</td><td>CBC, CRP, FC, LFTs</td><td>First efficacy signal</td></tr>
  <tr><td>Month 6</td><td>Above + colonoscopy/MRE</td><td>Treat-to-target assessment</td></tr>
  <tr><td>Month 12</td><td>Full panel + endoscopy</td><td>Confirm endoscopic remission</td></tr>
  <tr><td>Ongoing</td><td>[Per drug and disease]</td><td>[Frequency]</td></tr>
</table>
<p><b>Therapeutic Drug Monitoring</b> (if biologics): [First TDM timing, subsequent TDM, target trough levels per uploaded guidelines]</p>
<p><b>Long-Term Surveillance:</b></p>
<table>
  <tr><th>Surveillance</th><th>Schedule</th><th>Notes</th></tr>
  <tr><td>Colorectal Cancer</td><td>From year 8 post-diagnosis</td><td>Earlier if PSC, extensive colitis, family history</td></tr>
  <tr><td>Skin Cancer</td><td>Annual dermatology review</td><td>If on thiopurines or biologics</td></tr>
  <tr><td>Bone Health (DEXA)</td><td>If steroids &gt;3 months</td><td>Ca²⁺ + Vit D; bisphosphonates if indicated</td></tr>
  <tr><td>Cervical Cancer</td><td>Age-appropriate; more frequent on immunosuppression</td><td></td></tr>
  <tr><td>Lymphoma awareness</td><td>Ongoing</td><td>Especially thiopurine + biologic combination</td></tr>
</table>
<p><b>Drug-Specific Monitoring:</b> [Agent-specific monitoring per uploaded guidelines]</p>

<h4>⚠️ PHYSICIAN ALERTS</h4>
<ul>
  <li>[State "None identified" or list urgent flags for physician review]</li>
</ul>
<p><b>Guidelines Referenced:</b> STRIDE-II | ECCO | ACG | [Others as uploaded]</p>

<hr>

<h2>DOCUMENT 2: PATIENT INFORMATION SHEET</h2>
<h3>YOUR IBD CARE PLAN</h3>
<p><b>Prepared for:</b> [Patient Name] | <b>Date:</b> ${protocolDate}</p>

<h4>About Your Condition</h4>
<p>You have been diagnosed with <b>[Crohn's Disease / Ulcerative Colitis]</b> affecting [location in simple terms].</p>
<p>This is a condition where your immune system causes inflammation in your intestines. It is <b>not caused by anything you did</b>, it is <b>not contagious</b>, and with modern treatment, <b>most patients lead completely normal lives</b>.</p>
<p><b>Why treatment matters:</b> Without treatment, inflammation can silently damage your intestines even when you feel okay. Treatment heals this damage and keeps you well long-term.</p>

<h4>Your Medication</h4>
<p><b>[Medication Name]</b> — [Dose] — [e.g., "One tablet twice daily with food"]</p>
<ul>
  <li><b>What it does:</b> [One simple sentence]</li>
  <li><b>When you'll feel better:</b> Most patients notice improvement within [X weeks]</li>
  <li><b>⚠️ Important:</b> Keep taking it even when you feel well — stopping early is the number one reason for flare-ups</li>
</ul>
<p><b>Side effects to watch for:</b> [List 2–3 most relevant, in plain language]</p>

<h4>Before We Start: Your Safety Checklist</h4>
<p><b>Tests needed first:</b></p>
<ul>
  <li>[ ] TB screening (blood test + chest X-ray)</li>
  <li>[ ] Hepatitis B &amp; C blood tests</li>
  <li>[ ] General health blood panel</li>
</ul>
<p><b>Vaccines recommended:</b></p>
<ul>
  <li>[ ] [Vaccine 1 + one-line plain-language reason]</li>
  <li>[ ] [Vaccine 2 + one-line plain-language reason]</li>
  <li>[ ] [Vaccine 3 + one-line plain-language reason]</li>
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
${patient.smoking && patient.smoking !== 'Never smoked' ? '<p><b>Quit smoking</b> — this significantly improves outcomes for Crohn\'s disease.</p>' : ''}

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
<p>🚨 <b>Call the emergency number if you experience:</b></p>
<ul>
  <li>Fever above 38.3°C</li>
  <li>Severe or unusual abdominal pain</li>
  <li>Significant blood in stool</li>
  <li>Persistent vomiting</li>
  <li>Rash, swelling, or difficulty breathing (possible allergic reaction)</li>
</ul>
<p>📞 <b>Also call for:</b> New or unexplained symptoms, questions about your medication, before any surgery or new medications, if you are planning a pregnancy.</p>

<div data-kp3p-inject="physician-contact-patient"></div>

<p>Many of my patients with your condition live completely normal lives — working, travelling, raising families, pursuing their passions. <b>With the right treatment and regular monitoring, [Patient Name], you can too.</b></p>

<hr>

<h2>DOCUMENT 3: PRESCRIPTION SHEET</h2>
<div data-kp3p-inject="physician-header-prescription"></div>
<p><b>Patient Name:</b> [Patient Name] &nbsp;&nbsp; <b>Age / Sex:</b> ${patient.age} / ${patient.sex}<br>
<b>Date:</b> ${protocolDate} &nbsp;&nbsp; <b>Diagnosis:</b> ${patient.diagnosis}</p>

<h4>℞ — MEDICATIONS</h4>
<p>[For each medication from Document 1, tag [✅ RECOMMENDED — INCLUDE] or [⚠️ OPTIONAL — CONFIRM]. Include dose, form, frequency, duration.]</p>
<ol>
  <li><b>[Drug Name]</b> [✅ RECOMMENDED — INCLUDE]<br>
  Dose: [e.g., Mesalazine 4 g/day] | Form: [Oral] | Frequency: [Once daily] | Duration: [Ongoing — review at 3 months]</li>
  <li><b>[Drug Name]</b> [⚠️ OPTIONAL — CONFIRM]<br>
  Dose: [e.g., Prednisolone 40 mg] | Form: [Oral tablet] | Frequency: [Once daily, taper] | Duration: [8 weeks with tapering]</li>
</ol>

<h4>🔬 INVESTIGATIONS ADVISED</h4>
<p><b>Immediate (Before Starting Treatment):</b></p>
<table>
  <tr><th>Investigation</th><th>Approval Tag</th><th>Timing</th></tr>
  <tr><td>IGRA / Mantoux + CXR</td><td>[✅ RECOMMENDED]</td><td>Once, before treatment</td></tr>
  <tr><td>HBsAg, Anti-HBs, Anti-HBc</td><td>[✅ RECOMMENDED]</td><td>Once, before treatment</td></tr>
  <tr><td>Anti-HCV</td><td>[✅ RECOMMENDED]</td><td>Once, before treatment</td></tr>
  <tr><td>CBC, CRP, ESR</td><td>[✅ RECOMMENDED]</td><td>Baseline</td></tr>
  <tr><td>LFTs, RFTs, Albumin</td><td>[✅ RECOMMENDED]</td><td>Baseline</td></tr>
  <tr><td>Fecal Calprotectin</td><td>[✅ RECOMMENDED]</td><td>Baseline</td></tr>
  <tr><td>[Drug-specific test e.g. TPMT/NUDT15]</td><td>[⚠️ OPTIONAL — CONFIRM]</td><td>Before thiopurine</td></tr>
</table>
<p><b>Ongoing Monitoring:</b></p>
<table>
  <tr><th>Investigation</th><th>Approval Tag</th><th>Frequency</th></tr>
  <tr><td>CBC + CRP</td><td>[✅ RECOMMENDED]</td><td>Every 3 months</td></tr>
  <tr><td>LFTs</td><td>[✅ RECOMMENDED]</td><td>Every 3 months</td></tr>
  <tr><td>Fecal Calprotectin</td><td>[✅ RECOMMENDED]</td><td>Every 3–6 months</td></tr>
  <tr><td>Colonoscopy / Sigmoidoscopy</td><td>[✅ RECOMMENDED]</td><td>Month 6–12</td></tr>
  <tr><td>MRE (if Crohn's Disease)</td><td>[⚠️ OPTIONAL — CONFIRM]</td><td>Month 12</td></tr>
  <tr><td>DEXA Scan</td><td>[⚠️ OPTIONAL — CONFIRM]</td><td>If steroids &gt;3 months</td></tr>
</table>

<h4>📋 PATIENT INSTRUCTIONS</h4>
<ul>
  <li>[Instruction 1 — e.g., Take all medications with food. Do not skip doses.]</li>
  <li>[Instruction 2 — e.g., Return for blood tests before next clinic visit.]</li>
  <li>[Instruction 3 — e.g., Avoid NSAIDs unless specifically advised.]</li>
  <li>[Instruction 4 — e.g., Report fever, severe pain, or blood in stool immediately.]</li>
</ul>
<p><b>Next Appointment:</b> _______________________ &nbsp;&nbsp; <b>Follow-up Tests Due:</b> _______________________</p>
<p><b>Signature:</b> _______________________________ &nbsp;&nbsp; <b>Stamp:</b></p>
<p><i>KP-3P Model™ — Prescription generated with AI-assisted clinical decision support. Final prescription reviewed and authorised by physician.</i></p>

---END TEMPLATE---

PATIENT DATA (de-identified — use for clinical reasoning; do not output legal name):
Ref: ${patientRef} | Age: ${patient.age}y${patient.dateOfBirth ? ` | DOB: ${patient.dateOfBirth}` : ''} | Age at Dx: ${ageAtDxLabel(patient)}y | Sex: ${patient.sex}
Occupation: ${patient.occupation ?? 'N/A'} | Location: ${patient.location ?? 'N/A'} | Smoking: ${patient.smoking ?? 'N/A'}
Diagnosis: ${patient.diagnosis} | Montreal: ${patient.montreal} | Duration: ${patient.duration ?? 'N/A'}
Prior Surgeries: ${patient.priorSurgeries ?? 'None'}
Severity: ${patient.severity} | Bowel Freq: ${patient.bowelFreq ?? 'N/A'} | Blood: ${patient.bloodInStool ?? 'N/A'}
Pain: ${patient.abdPain ?? 'N/A'} | Weight Loss: ${patient.weightLoss ?? 'N/A'}
Labs: ${labsLine(patient)}
Endoscopy: ${patient.endoscopyFindings ?? 'Not provided'}
Imaging: ${patient.imagingFindings ?? 'None'}
Current Meds: ${patient.currentMeds ?? 'None'} | Response: ${patient.treatmentResponse ?? 'N/A'} | TDM: ${patient.tdm ?? 'N/A'}
Prior Failed: ${patient.priorFailed ?? 'None'}
TB: ${patient.tbStatus ?? 'Not documented'} | HBsAg: ${patient.hbsAg ?? 'Not tested'} | Anti-HBs: ${patient.antiHBs ?? 'Not tested'} | Anti-HBc: ${patient.antiHBc ?? 'Not tested'}
Anti-HCV: ${patient.antiHCV ?? 'Not tested'} | Anti-HIV: ${patient.antiHIV ?? 'Not tested'}
Vaccines — Influenza: ${vaccineStatus(patient, 'influenza', patient.vaccineInfluenza)} | COVID: ${vaccineStatus(patient, 'covid19', patient.vaccineCovid)} | Pneumococcal: ${vaccineStatus(patient, 'pneumococcal', patient.vaccinePneumococcal)}
Hep B: ${vaccineStatus(patient, 'hepatitisB', patient.vaccineHepB)} | Hep A: ${vaccineStatus(patient, 'hepatitisA', patient.vaccineHepA)} | Hep E: ${patient.vaccineHepE ?? 'Unknown'} | Zoster: ${vaccineStatus(patient, 'zoster', patient.vaccineZoster)} | MMR: ${vaccineStatus(patient, 'mmr', patient.vaccineMmr)} | Varicella: ${vaccineStatus(patient, 'varicella', patient.vaccineVaricella)} | Tetanus/Tdap: ${vaccineStatus(patient, 'tdap', patient.vaccineTetanus)}
Comorbidities: ${patient.comorbidities?.join(', ') ?? 'None'} | EIM: ${patient.eim ?? 'None'}
Special: ${patient.specialConsiderations ?? patient.specialNotes?.join('; ') ?? 'None'}
Preferred patient-facing language: ${doc2Language}`;
}
