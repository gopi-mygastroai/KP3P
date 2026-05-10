/**
 * Validates the same mandatory “basic info” fields as admin assessment step 1.
 * Used by POST /api/admin/patients and can be reused by the add-patient UI.
 */

function isNonEmpty(v: unknown): boolean {
  return String(v ?? '').trim() !== '';
}

export type BasicInfoValidationResult = { ok: true } | { ok: false; error: string };

export function validateAdminPatientBasicInfo(body: Record<string, unknown>): BasicInfoValidationResult {
  const requiredFields: { key: string; label: string }[] = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'mrn', label: 'ID / MRN' },
    { key: 'contactPhone', label: 'Contact Phone' },
    { key: 'placeOfLiving', label: 'Place of Living' },
    { key: 'referredBy', label: 'Referred By' },
    { key: 'dateOfBirth', label: 'Date of Birth' },
  ];
  const missing = requiredFields.filter(({ key }) => !isNonEmpty(body[key])).map(({ label }) => label);

  if (!isNonEmpty(body.sex)) missing.push('Sex');
  if (!isNonEmpty(body.smokingStatus)) missing.push('Smoking Status');

  const smokingStatus = String(body.smokingStatus ?? '');
  const needsSmokingDetails =
    smokingStatus === 'Current smoker' ||
    smokingStatus === 'Ex smoker' ||
    smokingStatus === 'Current' ||
    smokingStatus === 'Former';
  if (needsSmokingDetails && !isNonEmpty(body.smokingDetails)) {
    missing.push('Smoking amount');
  }

  const caRaw = body.currentAge;
  const caNum = typeof caRaw === 'number' ? caRaw : typeof caRaw === 'string' ? Number(caRaw) : NaN;
  if (!Number.isFinite(caNum)) missing.push('Current Age');

  const adRaw = body.ageAtDiagnosis;
  const adNum = typeof adRaw === 'number' ? adRaw : typeof adRaw === 'string' ? Number(adRaw) : NaN;
  if (!Number.isFinite(adNum)) missing.push('Age at Diagnosis');

  const email = String(body.email ?? '').trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: 'Please enter a valid email address.' };
  }

  if (missing.length > 0) {
    return {
      ok: false,
      error: `Complete patient basic information before continuing: ${missing.join(', ')}`,
    };
  }

  return { ok: true };
}
