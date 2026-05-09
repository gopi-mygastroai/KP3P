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
  contactPhone?: string;
  dateOfBirth?: string;
}

export function buildKP3PPrompt(patient: PatientData): string {
  const today = new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  const dobStr = patient.dateOfBirth || '';

  return `You are a world-class IBD specialist. Generate a customized patient clinical protocol using EXACTLY the HTML template provided below. 

RULES:
1. Output ONLY pure HTML without Markdown fences (\`\`\`).
2. Use standard tags: <h2>, <h3>, <h4>, <h5>, <table>, <tr>, <th>, <td>, <ul>, <li>, <b>, <p>, <br>.
3. Do not add any custom CSS classes or inline styles.
4. Replace all bracketed [PLACEHOLDERS] with highly specific, clinical data derived from the patient's record.
5. Provide actionable insights, especially around biologic failure, TB, Hepatitis, and vaccines.
6. Only output English.

---BEGIN TEMPLATE---
<h2>KP-3P IBD MANAGEMENT SYSTEM</h2>
<h3>CLINICAL PROTOCOL — PHYSICIAN RECORD</h3>
<p>Know Your Patient • Predict Risk • Prevent Infections • Protect Long-term Health</p>

<h3>PATIENT IDENTIFICATION</h3>
<table>
  <tr><th>Field</th><th>Details</th></tr>
  <tr><td>Patient Name</td><td>${patient.name || 'Unknown'}</td></tr>
  <tr><td>Patient ID</td><td>${patient.id || 'N/A'}</td></tr>
  <tr><td>Date of Birth</td><td>${dobStr} | Age: ${patient.age} years</td></tr>
  <tr><td>Sex</td><td>${patient.sex}</td></tr>
  <tr><td>Occupation</td><td>${patient.occupation}</td></tr>
  <tr><td>Contact</td><td>${patient.contactPhone || 'N/A'} | ${patient.location}</td></tr>
  <tr><td>Protocol Date</td><td>${today} | KP-3P v1.0</td></tr>
</table>

<h3>⚠️ CRITICAL PHYSICIAN ALERTS</h3>
<p><b>⚠️ ALERT 1: [TITLE OF MOST URGENT RISK/FAILURE]</b><br>[Detailed explanation of risk and immediate clinical action required]</p>
<p><b>⚠️ ALERT 2: [DATA INCONSISTENCY OR INFECTION RISK]</b><br>[Explanation of missing data or urgent infection risk (e.g. pending Hep B serology or TB)]</p>

<h3>ITERATION 1 — INITIAL ASSESSMENT (Know Your Patient)</h3>
<h4>A. Disease Classification & Severity</h4>
<table>
  <tr><th>Parameter</th><th>Finding</th></tr>
  <tr><td>Diagnosis</td><td>${patient.diagnosis}</td></tr>
  <tr><td>Montreal Classification</td><td>${patient.montreal} — [Brief clinical interpretation]</td></tr>
  <tr><td>Disease Duration</td><td>${patient.duration}</td></tr>
  <tr><td>Endoscopic Severity</td><td>Mayo Score ${patient.mayoScore || 'Unknown'} — [Brief interpretation based on ${patient.endoscopyFindings}]</td></tr>
  <tr><td>Clinical Activity</td><td>${patient.severity} — [Symptoms: Bowel freq: ${patient.bowelFreq}, Bleeding: ${patient.bloodInStool}]</td></tr>
  <tr><td>Biochemical Markers</td><td>[List key labs or write 'Required' if missing: CRP ${patient.crp}, Albumin ${patient.albumin}]</td></tr>
  <tr><td>Overall Severity</td><td>[Clinically X / Endoscopically Y] — [Risk Phenotype]</td></tr>
</table>

<h3>ITERATION 2 — SELF-CRITIQUE & GUIDELINE VERIFICATION</h3>
<h4>Guideline Alignment Check</h4>
<table>
  <tr><th>Check</th><th>Status</th></tr>
  <tr><td>Treatment naivety assumed</td><td>[✅ CORRECTED or ⚠️ FLAGGED] — [Comment on prior therapies]</td></tr>
  <tr><td>5-ASA-first approach appropriate?</td><td>[Yes/No] — [Reason based on biologic history or severity]</td></tr>
  <tr><td>STRIDE-II targets specified with timelines?</td><td>✅ Included below with specific measures</td></tr>
  <tr><td>TB screening before immunosuppression?</td><td>[Status based on ${patient.tbStatus}]</td></tr>
  <tr><td>Hep B serology complete?</td><td>[Status based on HBsAg/Anti-HBs]</td></tr>
  <tr><td>Live vaccine status before immunosuppression?</td><td>[Status based on MMR/Varicella]</td></tr>
  <tr><td>Biologic class selection rationale?</td><td>[✅ Justification for next class]</td></tr>
</table>

<h3>ITERATION 3 — FINAL RECOMMENDATIONS</h3>
<h4>🎯 P1: RISK STRATIFICATION (Final)</h4>
<table>
  <tr><th>Parameter</th><th>Finding</th></tr>
  <tr><td>RISK LEVEL</td><td>[⚠️ HIGH RISK or MODERATE RISK or LOW RISK]</td></tr>
  <tr><td>Key Risk Factors</td><td>[Bullet points of top 4 risk factors]</td></tr>
  <tr><td>Disease Trajectory</td><td>[1-2 sentences on expected course if untreated]</td></tr>
  <tr><td>Treatment Approach</td><td>[Accelerated step-up, Top-down, etc.]</td></tr>
</table>

<h4>🎯 STRIDE-II THERAPEUTIC TARGETS (Treat-to-Target)</h4>
<table>
  <tr><th>Target Domain</th><th>Specific Measure</th><th>Timeline</th><th>Success Criteria</th></tr>
  <tr><td>Clinical (Short-term)</td><td>[Symptoms]</td><td>[e.g. Weeks 8–12]</td><td>[Criteria]</td></tr>
  <tr><td>Biochemical (Intermediate)</td><td>[CRP / Calprotectin]</td><td>[e.g. Weeks 12–24]</td><td>[Criteria]</td></tr>
  <tr><td>Endoscopic (Long-term)</td><td>[Mayo/SES-CD score]</td><td>[e.g. Month 6–12]</td><td>[Criteria]</td></tr>
  <tr><td>Quality of Life</td><td>[IBDQ/SCCAI]</td><td>[Timeline]</td><td>[Criteria]</td></tr>
</table>
<p><b>Assessment Schedule:</b> [Summary timeline]</p>
<p><b>Escalation Strategy if Targets Not Met:</b><br>
<ul>
  <li>[Strategy at Month 3/6]</li>
  <li>[Strategy at Month 12]</li>
</ul></p>

<h4>🛡️ P2: INFECTION PREVENTION PROTOCOL (Final)</h4>
<h5>Pre-Treatment Screening Status</h5>
<table>
  <tr><th>Screening Test</th><th>Current Status</th><th>Required Action</th></tr>
  <tr><td>TB Screening</td><td>${patient.tbStatus || 'Unknown'}</td><td>[Action]</td></tr>
  <tr><td>HBsAg</td><td>${patient.hbsAg || 'Unknown'}</td><td>[Action]</td></tr>
  <tr><td>Anti-HBs</td><td>${patient.antiHBs || 'Unknown'}</td><td>[Action]</td></tr>
  <tr><td>Anti-HBc</td><td>${patient.antiHBc || 'Unknown'}</td><td>[Action]</td></tr>
  <tr><td>Anti-HCV</td><td>${patient.antiHCV || 'Unknown'}</td><td>[Action]</td></tr>
  <tr><td>HIV</td><td>${patient.antiHIV || 'Unknown'}</td><td>[Action]</td></tr>
</table>

<h5>Vaccination Status & Required Actions</h5>
<table>
  <tr><th>Vaccine</th><th>Status</th><th>Action Required</th></tr>
  <tr><td>Influenza</td><td>${patient.vaccines?.influenza || 'Unknown'}</td><td>[Action]</td></tr>
  <tr><td>COVID-19</td><td>${patient.vaccines?.covid19 || 'Unknown'}</td><td>[Action]</td></tr>
  <tr><td>Pneumococcal</td><td>${patient.vaccines?.pneumococcal || 'Unknown'}</td><td>[Action]</td></tr>
  <tr><td>Hepatitis B</td><td>${patient.vaccines?.hepatitisB || 'Unknown'}</td><td>[Action]</td></tr>
  <tr><td>Zoster</td><td>${patient.vaccines?.zoster || 'Unknown'}</td><td>[Action]</td></tr>
  <tr><td>MMR/Varicella (LIVE)</td><td>${patient.vaccines?.mmr || 'Unknown'}</td><td>[Action]</td></tr>
</table>

<h4>💊 P3: TREATMENT & MONITORING PROTOCOL (Final)</h4>
<h5>Primary Treatment Strategy</h5>
<table>
  <tr><th>Component</th><th>Specification</th></tr>
  <tr><td>Recommended Agent</td><td>[Specific biologic or small molecule]</td></tr>
  <tr><td>Rationale</td><td>[Why this agent based on prior failures: ${patient.priorFailed}]</td></tr>
  <tr><td>Induction Dose</td><td>[Dose]</td></tr>
  <tr><td>Maintenance Dose</td><td>[Dose]</td></tr>
  <tr><td>Adjunct Therapy</td><td>[5-ASA, steroids, etc.]</td></tr>
</table>

<p><b>Alternative Options:</b><br>
<ul>
  <li>[Option 1]</li>
  <li>[Option 2]</li>
</ul></p>

<h5>Laboratory Monitoring Schedule</h5>
<table>
  <tr><th>Timepoint</th><th>Tests Required</th><th>Action/Rationale</th></tr>
  <tr><td>BASELINE</td><td>[Tests]</td><td>[Rationale]</td></tr>
  <tr><td>Week 4/14</td><td>[Tests]</td><td>[Rationale]</td></tr>
  <tr><td>Month 6</td><td>[Tests]</td><td>[Rationale]</td></tr>
</table>

<h5>Therapeutic Drug Monitoring (TDM)</h5>
<ul>
  <li><b>First TDM:</b> [When to check]</li>
  <li><b>Subsequent:</b> [Reactive vs Proactive]</li>
</ul>

<h5>Drug-Specific Safety Monitoring</h5>
<ul>
  <li>[Risk 1]</li>
  <li>[Risk 2]</li>
</ul>

<h5>Cancer Surveillance Protocol</h5>
<table>
  <tr><th>Cancer Type</th><th>Surveillance Plan</th></tr>
  <tr><td>Colorectal Cancer</td><td>[Plan]</td></tr>
  <tr><td>Skin Cancer</td><td>[Plan]</td></tr>
</table>

<h3>ITERATION 4 — FINAL QUALITY CHECK</h3>
<table>
  <tr><th>Quality Criterion</th><th>Status</th></tr>
  <tr><td>KP-3P all components addressed</td><td>✅ Complete</td></tr>
  <tr><td>STRIDE-II targets specified</td><td>✅ Complete</td></tr>
  <tr><td>Infection screening verified</td><td>[Status]</td></tr>
  <tr><td>Treatment monitoring in place</td><td>✅ Complete</td></tr>
</table>

<h4>Guidelines Referenced</h4>
<ul>
  <li>[Guideline 1]</li>
  <li>[Guideline 2]</li>
</ul>
---END TEMPLATE---

PATIENT DATA:
Name: ${patient.name} | ID: ${patient.id} | Age: ${patient.age}y | Sex: ${patient.sex}
Occupation: ${patient.occupation} | Location: ${patient.location} | Smoking: ${patient.smoking}
Diagnosis: ${patient.diagnosis} | Montreal: ${patient.montreal} | Duration: ${patient.duration}
Age at Dx: ${patient.ageAtDx}y | Prior Surgeries: ${patient.priorSurgeries||'None'}
Severity: ${patient.severity} | Bowel Freq: ${patient.bowelFreq} | Blood: ${patient.bloodInStool}
Pain: ${patient.abdPain} | Weight Loss: ${patient.weightLoss}
Hb: ${patient.hb} | TLC: ${patient.tlc} | Platelets: ${patient.platelets} | CRP: ${patient.crp} | Albumin: ${patient.albumin}
Endoscopy: Mayo ${patient.mayoScore} | ${patient.endoscopyFindings}
Imaging: ${patient.imagingFindings} | DEXA: ${patient.dexa}
Current Meds: ${patient.currentMeds} | Response: ${patient.treatmentResponse} | TDM: ${patient.tdm}
Prior Failed: ${patient.priorFailed}
TB: ${patient.tbStatus} | HBsAg: ${patient.hbsAg} | Anti-HBs: ${patient.antiHBs} | Anti-HBc: ${patient.antiHBc}
Anti-HCV: ${patient.antiHCV} | Anti-HIV: ${patient.antiHIV}
Comorbidities: ${patient.comorbidities?.join(', ')||'None'} | EIM: ${patient.eim||'None'}
Special: ${patient.specialNotes?.join('; ')||'None'}
`;
}
