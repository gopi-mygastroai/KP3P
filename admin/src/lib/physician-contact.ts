/** Practice contact details — injected into care sheets at PDF time, never sent to LLMs. */

export const PHYSICIAN_CONTACT = {
  name: 'Dr. Kiran Peddi',
  title: 'Gastroenterologist & IBD Specialist',
  locations:
    'Center for IBD, Yashoda Hospital, Somajiguda | Gastro Care Clinics, Gachibowli',
  clinicPhone: '9390150150',
  emergencyPhone: '9581000505',
  website: 'www.drkiranpeddi.com',
  officeHours: 'Mon–Fri 9 AM–5 PM | Sat 9 AM–4 PM',
  afterHoursEmergency: 'Emergency Department, Yashoda Hospital, Somajiguda',
  tagline: 'The KP-3P Model™ — Know • Predict • Prevent • Protect',
} as const;

export function buildPhysicianContactPatientSheetHtml(): string {
  const c = PHYSICIAN_CONTACT;
  return `<h3>Contact Information</h3>
<p><b>${c.name}</b><br>
${c.title}<br>
${c.locations}</p>
<p><b>Clinic:</b> ${c.clinicPhone}<br>
<b>Emergency / WhatsApp:</b> ${c.emergencyPhone}<br>
<b>Website:</b> ${c.website}<br>
<b>Office Hours:</b> ${c.officeHours}<br>
<b>After-hours emergencies:</b> ${c.afterHoursEmergency}</p>
<p><i>${c.tagline}</i></p>
<p><b>${c.name}</b> | ${c.title}</p>`;
}

export function buildPhysicianPrescriptionHeaderHtml(): string {
  const c = PHYSICIAN_CONTACT;
  return `<p><b>${c.name}</b><br>
${c.title} | Reg. No.: ________________<br>
${c.locations}<br>
${c.clinicPhone} | ${c.website}</p>`;
}
