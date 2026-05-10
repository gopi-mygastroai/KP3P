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
    hepatitisA?:string; hepatitisB?:string; zoster?:string; mmr?:string; tdap?:string; };
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
  specialConsiderations?: string;
}

export function buildKP3PPrompt(patient: PatientData): string {
  const prompt = `You are a world-class IBD specialist. A guideline document has been provided to you 
in this conversation — use it as your primary reference for all recommendations.

Generate a complete KP-3P clinical document using EXACTLY the HTML template below.
Work through all 4 iterations before producing the final output.

RULES:
1. Output ONLY pure HTML without Markdown fences.
2. Use standard tags only: <h2> <h3> <h4> <h5> <table> <tr> <th> <td> <ul> <li> <b> <p> <br>
3. No custom CSS or inline styles.
4. Replace all [PLACEHOLDERS] with specific, clinical data from the patient record below.
5. Reference the uploaded guideline document for all treatment and screening decisions.
6. Generate BOTH Part 1 (Clinical Protocol) AND Part 2 (Patient Care Plan).
7. Output in English only.

---BEGIN TEMPLATE---

<h2>KP-3P IBD MANAGEMENT SYSTEM</h2>
<h3>PART 1: CLINICAL PROTOCOL — PHYSICIAN RECORD</h3>
<p>Know Your Patient • Predict Risk • Prevent Infections • Protect Long-term Health</p>

<h3>PATIENT IDENTIFICATION</h3>
<table>
  <tr><th>Field</th><th>Details</th></tr>
  <tr><td>Patient Name</td><td>${patient.name}</td></tr>
  <tr><td>Patient ID</td><td>${patient.id}</td></tr>
  <tr><td>Date of Birth</td><td>${patient.dateOfBirth ?? 'N/A'} | Age: ${patient.age} years | Age at Dx: ${patient.ageAtDiagnosis != null ? patient.ageAtDiagnosis : patient.ageAtDx > 0 ? patient.ageAtDx : 'N/A'} years</td></tr>
  <tr><td>Sex</td><td>${patient.sex}</td></tr>
  <tr><td>Occupation</td><td>${patient.occupation ?? 'N/A'}</td></tr>
  <tr><td>Location</td><td>${patient.location ?? 'N/A'}</td></tr>
  <tr><td>Protocol Date</td><td>${new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })} | KP-3P v1.0</td></tr>
</table>

<h3>⚠️ CRITICAL PHYSICIAN ALERTS</h3>
<p><b>⚠️ ALERT 1: [TITLE OF MOST URGENT RISK OR TREATMENT CONCERN]</b><br>
[Detailed explanation of the most urgent clinical risk and the immediate action required, 
citing the uploaded guideline where relevant]</p>
<p><b>⚠️ ALERT 2: [INFECTION RISK OR DATA GAP]</b><br>
[Explanation of any pending screening, missing serology, or urgent infection risk 
before immunosuppression can proceed]</p>

<h3>ITERATION 1 — INITIAL ASSESSMENT (Know Your Patient)</h3>
<h4>A. Disease Classification and Severity</h4>
<table>
  <tr><th>Parameter</th><th>Finding</th></tr>
  <tr><td>Diagnosis</td><td>${patient.diagnosis}</td></tr>
  <tr><td>Montreal Classification</td><td>${patient.montreal} — [Brief clinical interpretation]</td></tr>
  <tr><td>Disease Duration</td><td>${patient.duration ?? 'N/A'}</td></tr>
  <tr><td>Endoscopic Severity</td><td>${patient.endoscopyFindings ?? 'N/A'} — [Interpretation]</td></tr>
  <tr><td>Clinical Activity</td><td>${patient.severity} — [Symptoms summary from patient record]</td></tr>
  <tr><td>Biochemical Markers</td><td>[List key labs from patient record, or write Required if missing]</td></tr>
  <tr><td>Overall Severity</td><td>[Clinically X / Endoscopically Y] — [Risk phenotype]</td></tr>
</table>

<h4>B. Initial Risk Stratification</h4>
<table>
  <tr><th>Risk Factor</th><th>Present</th><th>Comment</th></tr>
  <tr><td>Age at diagnosis &lt;40 years</td><td>[Yes/No]</td><td>[Comment]</td></tr>
  <tr><td>Extensive disease</td><td>[Yes/No]</td><td>[Comment]</td></tr>
  <tr><td>Deep ulcerations / severe endoscopy</td><td>[Yes/No]</td><td>[Comment]</td></tr>
  <tr><td>Perianal disease</td><td>[Yes/No]</td><td>[Comment]</td></tr>
  <tr><td>Prior surgery</td><td>[Yes/No]</td><td>${patient.priorSurgeries ?? 'None'}</td></tr>
  <tr><td>Steroid dependence or early requirement</td><td>[Yes/No]</td><td>[Comment]</td></tr>
  <tr><td>Extraintestinal manifestations</td><td>[Yes/No]</td><td>${patient.eim ?? 'None'}</td></tr>
  <tr><td>Low albumin / anaemia</td><td>[Yes/No]</td><td>[Comment based on labs]</td></tr>
</table>

<h4>C. Initial Treatment Considerations</h4>
<p>[First-pass treatment thinking based on disease type, extent, severity, and prior therapy history. 
Reference the uploaded guideline for treatment algorithm. Note if step-up or top-down approach is indicated.]</p>

<h4>D. Initial Infection and Vaccine Screening Plan</h4>
<p>[First-pass listing of required screening and vaccinations based on proposed therapy intensity. 
Reference uploaded guideline for pre-treatment requirements.]</p>

<h3>ITERATION 2 — SELF-CRITIQUE AND GUIDELINE VERIFICATION</h3>
<h4>Guideline Alignment Check</h4>
<table>
  <tr><th>Check</th><th>Status</th><th>Correction or Comment</th></tr>
  <tr><td>Treatment naivety correctly assessed</td><td>[✅ Confirmed or ⚠️ Corrected]</td><td>[Comment on prior therapies: ${patient.priorFailed ?? 'None documented'}]</td></tr>
  <tr><td>5-ASA-first approach appropriate?</td><td>[Yes/No]</td><td>[Reason based on severity and biologic history]</td></tr>
  <tr><td>STRIDE-II targets specified with timelines?</td><td>[✅ Included / ⚠️ Needs addition]</td><td>[Comment]</td></tr>
  <tr><td>TB screening before immunosuppression?</td><td>[Status: ${patient.tbStatus ?? 'Not documented'}]</td><td>[Required action]</td></tr>
  <tr><td>Hep B serology complete?</td><td>[HBsAg: ${patient.hbsAg ?? 'Not tested'} | Anti-HBs: ${patient.antiHBs ?? 'Not tested'} | Anti-HBc: ${patient.antiHBc ?? 'Not tested'}]</td><td>[Action if incomplete]</td></tr>
  <tr><td>Live vaccines before immunosuppression?</td><td>[Status based on vaccination history]</td><td>[Timing check — ≥4 weeks required]</td></tr>
  <tr><td>Biologic class selection rationale documented?</td><td>[✅ Justified / ⚠️ Needs justification]</td><td>[Comment]</td></tr>
  <tr><td>High-risk patient getting appropriately aggressive therapy?</td><td>[Yes/No]</td><td>[Step-up vs top-down decision and reason]</td></tr>
</table>

<h4>Self-Critique Summary</h4>
<p>[What was corrected or refined from Iteration 1. Note any discrepancies between guidelines 
and how they were resolved. Flag any red flags for physician review.]</p>

<h3>ITERATION 3 — FINAL RECOMMENDATIONS</h3>

<h4>🎯 P1: RISK STRATIFICATION (Final)</h4>
<table>
  <tr><th>Parameter</th><th>Finding</th></tr>
  <tr><td>RISK LEVEL</td><td>[⚠️ HIGH RISK or MODERATE RISK or LOW RISK]</td></tr>
  <tr><td>Key Risk Factors</td><td>[Top 3–4 specific risk factors for this patient]</td></tr>
  <tr><td>Disease Trajectory</td><td>[1–2 sentences on expected course if undertreated]</td></tr>
  <tr><td>Treatment Approach</td><td>[Accelerated step-up / Top-down / Standard step-up]</td></tr>
  <tr><td>Evidence Basis</td><td>[Reference uploaded guideline section]</td></tr>
</table>

<h4>🎯 STRIDE-II THERAPEUTIC TARGETS (Treat-to-Target)</h4>
<table>
  <tr><th>Target Domain</th><th>Specific Measure</th><th>Timeline</th><th>Success Criteria</th></tr>
  <tr><td>Clinical (Short-term)</td><td>[Symptom score — HBI &lt;5 for CD, Mayo ≤2 for UC]</td><td>Weeks 8–12</td><td>[Define remission criteria for this patient]</td></tr>
  <tr><td>Biochemical (Intermediate)</td><td>[CRP &lt;5 mg/L, Fecal calprotectin &lt;150 µg/g]</td><td>Weeks 12–24</td><td>[Normal range targets]</td></tr>
  <tr><td>Endoscopic (Long-term)</td><td>[Mayo 0–1 for UC / SES-CD &lt;3 for CD]</td><td>Month 6–12</td><td>[Endoscopic remission definition]</td></tr>
  <tr><td>Quality of Life</td><td>[IBDQ &gt;170 or equivalent PRO]</td><td>Month 3, 6, 12</td><td>[Patient-reported remission]</td></tr>
</table>
<p><b>Assessment Schedule:</b> Week 4 (safety) → Week 12–16 (clinical + biochemical) → Month 6–12 (endoscopy + imaging)</p>
<p><b>Escalation Strategy if Targets Not Met:</b></p>
<ul>
  <li>[Strategy at Month 3: partial response — dose optimisation or TDM]</li>
  <li>[Strategy at Month 6: no biochemical response — consider mechanism switch]</li>
  <li>[Strategy at Month 12: no endoscopic remission — escalate or surgical review]</li>
</ul>

<h4>🛡️ P2: INFECTION PREVENTION PROTOCOL (Final)</h4>
<h5>Pre-Treatment Screening Status</h5>
<table>
  <tr><th>Screening Test</th><th>Current Status</th><th>Required Action</th></tr>
  <tr><td>TB Screening (IGRA / TST + CXR)</td><td>${patient.tbStatus ?? 'Not documented'}</td><td>[Action — must clear before immunosuppression]</td></tr>
  <tr><td>HBsAg</td><td>${patient.hbsAg ?? 'Not tested'}</td><td>[Action if positive: hepatology consult; if not tested: order urgently]</td></tr>
  <tr><td>Anti-HBs</td><td>${patient.antiHBs ?? 'Not tested'}</td><td>[Action if non-immune: vaccinate]</td></tr>
  <tr><td>Anti-HBc</td><td>${patient.antiHBc ?? 'Not tested'}</td><td>[Action if positive with negative HBsAg: monitor for reactivation]</td></tr>
  <tr><td>Anti-HCV</td><td>${patient.antiHCV ?? 'Not tested'}</td><td>[Action]</td></tr>
  <tr><td>HIV</td><td>${patient.antiHIV ?? 'Not tested'}</td><td>[Action]</td></tr>
</table>

<h5>Vaccination Status and Required Actions</h5>
<table>
  <tr><th>Vaccine</th><th>Status</th><th>Action Required</th></tr>
  <tr><td>Influenza (inactivated)</td><td>${patient.vaccineInfluenza ?? patient.vaccines?.influenza ?? 'Unknown'}</td><td>[Annual — give before or during treatment]</td></tr>
  <tr><td>COVID-19</td><td>${patient.vaccineCovid ?? patient.vaccines?.covid19 ?? 'Unknown'}</td><td>[Update per current schedule]</td></tr>
  <tr><td>Pneumococcal (PCV20 or PCV15→PPSV23)</td><td>${patient.vaccinePneumococcal ?? patient.vaccines?.pneumococcal ?? 'Unknown'}</td><td>[Give before immunosuppression if not done]</td></tr>
  <tr><td>Hepatitis B (3-dose series)</td><td>${patient.vaccineHepB ?? patient.vaccines?.hepatitisB ?? 'Unknown'}</td><td>[Complete series if non-immune]</td></tr>
  <tr><td>Hepatitis A</td><td>${patient.vaccineHepA ?? patient.vaccines?.hepatitisA ?? 'Unknown'}</td><td>[2-dose series if not immune]</td></tr>
  <tr><td>Hepatitis E</td><td>${patient.vaccineHepE ?? 'Unknown'}</td><td>[Per local guideline if indicated]</td></tr>
  <tr><td>Zoster (Shingrix — recombinant, non-live)</td><td>${patient.vaccineZoster ?? patient.vaccines?.zoster ?? 'Unknown'}</td><td>[2 doses, 2–6 months apart — preferred even in younger patients on immunosuppression]</td></tr>
  <tr><td>MMR / Varicella (LIVE — give BEFORE immunosuppression only)</td><td>${patient.vaccineMmr ?? patient.vaccines?.mmr ?? 'Unknown'}</td><td>[If non-immune: give ≥4 weeks before starting immunosuppression. CONTRAINDICATED once on immunosuppression.]</td></tr>
  <tr><td>Tetanus / Tdap</td><td>${patient.vaccineTetanus ?? patient.vaccines?.tdap ?? 'Unknown'}</td><td>[Update if due]</td></tr>
</table>

<h4>💊 P3: TREATMENT AND MONITORING PROTOCOL (Final)</h4>
<h5>Primary Treatment Strategy</h5>
<table>
  <tr><th>Component</th><th>Specification</th></tr>
  <tr><td>Recommended Agent</td><td>[Specific biologic or small molecule, citing the uploaded guideline]</td></tr>
  <tr><td>Rationale</td><td>[Why this agent for this patient — prior failures: ${patient.priorFailed ?? 'None'}, current disease severity, risk level]</td></tr>
  <tr><td>Induction Dose</td><td>[Specific dose and schedule per guideline]</td></tr>
  <tr><td>Maintenance Dose</td><td>[Specific dose and frequency]</td></tr>
  <tr><td>Adjunct Therapy</td><td>[5-ASA / steroids / immunomodulator if applicable, with doses]</td></tr>
</table>
<p><b>Alternative Options:</b></p>
<ul>
  <li>[Alternative 1 — if primary fails or is contraindicated, per uploaded guideline]</li>
  <li>[Alternative 2]</li>
</ul>

<h5>Laboratory Monitoring Schedule</h5>
<table>
  <tr><th>Timepoint</th><th>Tests Required</th><th>Rationale</th></tr>
  <tr><td>Baseline</td><td>[CBC, CMP, LFTs, CRP, fecal calprotectin, drug-specific tests]</td><td>[Establish baseline before immunosuppression]</td></tr>
  <tr><td>Week 4</td><td>[CBC, LFTs, CRP]</td><td>[Early safety and tolerability check]</td></tr>
  <tr><td>Week 12–16</td><td>[CBC, LFTs, CRP, fecal calprotectin, TDM if biologic]</td><td>[First treat-to-target assessment per STRIDE-II]</td></tr>
  <tr><td>Month 6</td><td>[Full panel + endoscopy]</td><td>[Intermediate target assessment — endoscopic healing]</td></tr>
  <tr><td>Ongoing (every 3–6 months)</td><td>[CBC, LFTs, CRP, fecal calprotectin]</td><td>[Remission maintenance monitoring]</td></tr>
</table>

<h5>Therapeutic Drug Monitoring (TDM)</h5>
<ul>
  <li><b>First TDM:</b> [Week 14 trough level — before 4th infusion for infliximab / Week 26 for subcutaneous agents]</li>
  <li><b>Subsequent TDM:</b> [Reactive TDM if loss of response — check drug level + anti-drug antibodies; Proactive TDM at 12 months if in remission]</li>
  <li><b>Target trough levels:</b> [Infliximab: ≥5 µg/mL maintenance; Adalimumab: ≥7.5 µg/mL; Vedolizumab: ≥18–20 µg/mL — adjust per guideline]</li>
</ul>

<h5>Drug-Specific Safety Monitoring</h5>
<ul>
  <li>[Risk 1 — specific to recommended agent, e.g. demyelination risk with anti-TNF, reactivation risk with JAK inhibitors]</li>
  <li>[Risk 2 — infection vigilance: annual TB re-screening if high endemic risk; HBV reactivation monitoring if anti-HBc positive]</li>
  <li>[Risk 3 — any drug-specific lab monitoring e.g. TPMT/NUDT15 if thiopurine added]</li>
</ul>

<h5>Cancer Surveillance Protocol</h5>
<table>
  <tr><th>Cancer Type</th><th>Surveillance Plan</th></tr>
  <tr><td>Colorectal Cancer</td><td>[Begin surveillance colonoscopy 8 years after IBD diagnosis. Frequency based on dysplasia history, PSC, extent of disease, family history — per uploaded guideline]</td></tr>
  <tr><td>Skin Cancer</td><td>[Annual dermatology review if on thiopurines or biologics. Patient education on sun protection and self-examination.]</td></tr>
  <tr><td>Lymphoma</td><td>[Educate about symptoms. Avoid combination thiopurine + biologic for extended duration if risk outweighs benefit.]</td></tr>
  <tr><td>Cervical Cancer</td><td>[Age-appropriate screening; more frequent if on immunosuppression]</td></tr>
</table>

<h3>ITERATION 4 — FINAL QUALITY CHECK</h3>
<table>
  <tr><th>Quality Criterion</th><th>Status</th></tr>
  <tr><td>KP-3P all components addressed (K, P1, P2, P3)</td><td>[✅ Complete or ⚠️ Note gap]</td></tr>
  <tr><td>STRIDE-II targets specified with timelines</td><td>[✅ Complete]</td></tr>
  <tr><td>TB screening confirmed before immunosuppression</td><td>[✅ Confirmed or ⚠️ Pending]</td></tr>
  <tr><td>Live vaccines confirmed before immunosuppression</td><td>[✅ Confirmed or ⚠️ Pending]</td></tr>
  <tr><td>TDM protocol documented</td><td>[✅ Complete]</td></tr>
  <tr><td>Cancer surveillance plan in place</td><td>[✅ Complete]</td></tr>
  <tr><td>No contraindications overlooked</td><td>[✅ Verified or ⚠️ Note]</td></tr>
</table>

<h4>Guidelines Referenced</h4>
<ul>
  <li>[Primary: uploaded IBD guideline document — cite specific section if possible]</li>
  <li>[STRIDE-II Consensus — Turner et al. Gastroenterology 2021]</li>
  <li>[ECCO / ACG guideline sections used]</li>
</ul>

<h4>🚩 Physician Flags</h4>
<ul>
  <li>[⚠️ Flag any complex features, multidisciplinary input needed, or urgent safety concerns — or state "None"]</li>
</ul>

<br><hr><br>

<h2>KP-3P IBD MANAGEMENT SYSTEM</h2>
<h3>PART 2: PATIENT CARE PLAN</h3>
<p><b>Prepared for: ${patient.name} | Date: ${new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</b></p>

<h3>Dear ${patient.name},</h3>
<p>Thank you for trusting me with your care. This document explains your condition 
and sets out your personalised plan so you always know what to do and when.</p>

<h3>Understanding Your Condition</h3>
<p><b>What is ${patient.diagnosis}?</b><br>
[Explain the diagnosis in warm, simple language. 
For UC: describe inflammation in the colon lining in plain words, explain the affected 
area using simple anatomical terms (e.g. "the left side of your large intestine").
For CD: describe patchy inflammation that can occur anywhere in the digestive tract.
Avoid the words "incurable", "chronic autoimmune", or "lifelong disease".]</p>

<p><b>What causes it?</b><br>
It develops from a combination of your genetic makeup, how your immune system responds, 
and environmental triggers. It is not caused by stress or diet, and it is not contagious. 
With the right treatment, most people achieve excellent control and live completely 
normal, active lives.</p>

<p><b>Why treatment matters:</b><br>
Without treatment, inflammation can silently damage your intestine even when you feel 
reasonably well. With proper treatment, your symptoms improve, your intestine can 
heal completely, and your long-term risk of complications drops significantly.</p>

<h3>Your Personalised Treatment Plan</h3>
<p><b>Your risk level:</b> [Low / Moderate / High — state in patient-friendly terms, 
e.g. "Your condition is currently at a stage where we need to act decisively to 
prevent complications."]</p>

<p><b>Your recommended treatment: [Medication Name]</b><br>
[Explain in 2–3 sentences why this specific treatment was chosen for this patient, 
in language they will understand. Mention what it does to the immune system in simple 
terms. Do not use jargon.]</p>

<p><b>How to take it:</b></p>
<ul>
  <li>Dose: [Specific dose in plain language]</li>
  <li>How: [Tablet / injection / infusion — explain the practical steps]</li>
  <li>When: [Timing instructions]</li>
  <li><b>Important: Keep taking it even when you feel better</b> — symptoms improve 
  before the inflammation has fully healed. Stopping early allows inflammation to 
  return, often worse than before.</li>
</ul>

<p><b>What to expect:</b></p>
<ul>
  <li>First improvement: usually within [2–4 weeks / 4–8 weeks] — you should notice 
  fewer symptoms and more energy</li>
  <li>Full benefit: typically at [3–6 months], confirmed by a follow-up scope</li>
  <li>Side effects to watch for: [List 2–3 most common and manageable ones]</li>
</ul>

<h3>Before We Start: Safety Steps</h3>
<p>Your treatment works by adjusting your immune system. Before we begin, 
we need to check for hidden infections and make sure your vaccines are up to date 
— this keeps you safe during treatment.</p>

<p><b>Tests needed:</b></p>
<ul>
  <li>[ ] Blood test for TB (tuberculosis)</li>
  <li>[ ] Blood tests for Hepatitis B and C</li>
  <li>[ ] General health blood tests (full count, liver, kidney)</li>
  <li>[[ ] Any additional tests listed in your clinical protocol]</li>
</ul>

<p><b>Vaccines needed before starting treatment:</b></p>
<ul>
  <li>[ ] [List the 3–4 most relevant vaccines for this patient from the clinical protocol]</li>
  <li><b>Note:</b> Some vaccines (MMR, Varicella) cannot be given once treatment 
  has started — these must be completed at least 4 weeks beforehand if you need them.</li>
</ul>

<h3>Your Treatment Goals — What Success Looks Like</h3>
<table>
  <tr><th>When</th><th>Our Goal</th><th>How We Measure It</th></tr>
  <tr><td>Month 1</td><td>Fewer symptoms, better energy</td><td>How you feel day to day</td></tr>
  <tr><td>Month 3–4</td><td>Significant improvement</td><td>Symptom score + blood and stool tests</td></tr>
  <tr><td>Month 6–12</td><td>Complete healing of the intestine</td><td>Colonoscopy / flexible sigmoidoscopy</td></tr>
  <tr><td>Ongoing</td><td>Stay well, live fully</td><td>Regular checks every 3–6 months</td></tr>
</table>
<p>If we are not hitting these milestones, we will adjust your treatment — we will 
not accept partial improvement as the endpoint.</p>

<h3>Diet and Lifestyle</h3>
<p><b>Foods that tend to help</b> (especially during a flare):</p>
<ul>
  <li>Well-cooked vegetables, lean proteins (chicken, fish, eggs, lentils)</li>
  <li>White rice, refined grains, ripe bananas</li>
  <li>Plenty of water — aim for 8–10 glasses daily</li>
</ul>
<p><b>Foods to limit</b> (especially during active symptoms):</p>
<ul>
  <li>Raw vegetables and salads, spicy foods, fried or fatty foods</li>
  <li>Alcohol and carbonated drinks</li>
  <li>Dairy if it worsens your symptoms — some people tolerate it fine</li>
</ul>
<p><b>Lifestyle recommendations:</b></p>
<ul>
  <li>Manage stress — relaxation, adequate sleep, and light exercise all help</li>
  <li>Gentle regular activity: walking, swimming, or yoga are ideal</li>
  <li>${patient.smoking === 'Never smoked' ? '' : 'If you smoke: quitting significantly improves outcomes — ask me for support.'}</li>
  <li>Keep a simple food and symptom diary — notice what works for you</li>
</ul>

<h3>Your Follow-Up Schedule</h3>
<table>
  <tr><th>When</th><th>What Happens</th><th>Purpose</th></tr>
  <tr><td>Week 2–4</td><td>Check-in visit or call</td><td>Make sure you are tolerating the medication</td></tr>
  <tr><td>Month 3–4</td><td>Visit + blood and stool tests</td><td>First treatment assessment — is it working?</td></tr>
  <tr><td>Month 6–12</td><td>Visit + colonoscopy or imaging</td><td>Confirm complete intestinal healing</td></tr>
  <tr><td>Every 3–6 months</td><td>Regular monitoring visit</td><td>Keep you in remission long-term</td></tr>
</table>
<p><b>Please mark these appointments in your calendar now. 
Missing appointments means missing the chance to catch problems early.</b></p>

<h3>When to Contact Your Doctor Immediately</h3>
<p>Call right away if you experience:</p>
<ul>
  <li>High fever (above 38.3°C / 101°F)</li>
  <li>Severe abdominal pain, different from your usual</li>
  <li>Significant blood in your stool or a sudden increase in diarrhoea</li>
  <li>Persistent vomiting</li>
  <li>Any signs of infection: chills, severe fatigue, confusion</li>
  <li>Any allergic reaction: rash, swelling, difficulty breathing</li>
</ul>
<p>Also contact before: any surgical procedure, dental work, starting a new medication 
(including over-the-counter), or if you are planning a pregnancy.</p>
<p><b>No question is too small. I would rather you call about something minor 
than wait until it becomes serious.</b></p>

<h3>Your Action Steps — Starting Today</h3>
<ul>
  <li>✓ Complete all safety blood tests and screening before treatment begins</li>
  <li>✓ Get any outstanding vaccines — especially live vaccines if needed (tell me immediately)</li>
  <li>✓ Fill your prescription and read the patient information leaflet</li>
  <li>✓ Take your medication exactly as prescribed — every dose matters</li>
  <li>✓ Attend every scheduled appointment — these are not optional</li>
  <li>✓ Never stop your medication without speaking to me first</li>
</ul>

<h3>Contact Information</h3>
<p>
<b>Office Phone:</b> [Your clinic number]<br>
<b>Emergency / After Hours:</b> [Your emergency number]<br>
<b>Best times to reach us:</b> [Office hours]<br>
<b>For emergencies outside hours:</b> Go to the nearest emergency department
</p>

<p><b>Many of my patients with your condition go on to live completely normal lives — 
working, travelling, raising families, pursuing their goals. With the right treatment 
and regular monitoring, you can too.</b></p>

<p><i>The KP-3P Model™ — Know Your Patient • Predict Risk • Prevent Infections • Protect Long-term Health</i></p>

---END TEMPLATE---

PATIENT DATA:
Name: ${patient.name} | ID: ${patient.id} | Age: ${patient.age}y${patient.dateOfBirth ? ` | DOB: ${patient.dateOfBirth}` : ''} | Age at Dx: ${patient.ageAtDiagnosis != null ? patient.ageAtDiagnosis : patient.ageAtDx > 0 ? patient.ageAtDx : 'N/A'}y | Sex: ${patient.sex}
Occupation: ${patient.occupation ?? 'N/A'} | Location: ${patient.location ?? 'N/A'} | Smoking: ${patient.smoking ?? 'N/A'}
Diagnosis: ${patient.diagnosis} | Montreal: ${patient.montreal} | Duration: ${patient.duration ?? 'N/A'}
Prior Surgeries: ${patient.priorSurgeries ?? 'None'}
Severity: ${patient.severity} | Bowel Freq: ${patient.bowelFreq ?? 'N/A'} | Blood: ${patient.bloodInStool ?? 'N/A'}
Pain: ${patient.abdPain ?? 'N/A'} | Weight Loss: ${patient.weightLoss ?? 'N/A'}
Labs: ${[patient.hb, patient.tlc, patient.platelets, patient.crp, patient.albumin].some((x) => String(x ?? '').trim()) ? ('Hb ' + patient.hb + ', TLC ' + patient.tlc + ', Plt ' + patient.platelets + ', CRP ' + patient.crp + ', Alb ' + patient.albumin) : 'Not provided'}
Endoscopy: ${patient.endoscopyFindings ?? 'Not provided'}
Imaging: ${patient.imagingFindings ?? 'None'}
Current Meds: ${patient.currentMeds ?? 'None'} | Response: ${patient.treatmentResponse ?? 'N/A'} | TDM: ${patient.tdm ?? 'N/A'}
Prior Failed: ${patient.priorFailed ?? 'None'}
TB: ${patient.tbStatus ?? 'Not documented'} | HBsAg: ${patient.hbsAg ?? 'Not tested'} | Anti-HBs: ${patient.antiHBs ?? 'Not tested'} | Anti-HBc: ${patient.antiHBc ?? 'Not tested'}
Anti-HCV: ${patient.antiHCV ?? 'Not tested'} | Anti-HIV: ${patient.antiHIV ?? 'Not tested'}
Vaccines — Influenza: ${patient.vaccineInfluenza ?? patient.vaccines?.influenza ?? 'Unknown'} | COVID: ${patient.vaccineCovid ?? patient.vaccines?.covid19 ?? 'Unknown'} | Pneumococcal: ${patient.vaccinePneumococcal ?? patient.vaccines?.pneumococcal ?? 'Unknown'}
Hep B: ${patient.vaccineHepB ?? patient.vaccines?.hepatitisB ?? 'Unknown'} | Hep A: ${patient.vaccineHepA ?? patient.vaccines?.hepatitisA ?? 'Unknown'} | Hep E: ${patient.vaccineHepE ?? 'Unknown'} | Zoster: ${patient.vaccineZoster ?? patient.vaccines?.zoster ?? 'Unknown'} | MMR/Varicella: ${patient.vaccineMmr ?? patient.vaccines?.mmr ?? 'Unknown'} | Tetanus/Tdap: ${patient.vaccineTetanus ?? patient.vaccines?.tdap ?? 'Unknown'}
Comorbidities: ${patient.comorbidities?.join(', ') ?? 'None'} | EIM: ${patient.eim ?? 'None'}
Special: ${patient.specialConsiderations ?? patient.specialNotes?.join('; ') ?? 'None'}
`;
  return prompt;
}
