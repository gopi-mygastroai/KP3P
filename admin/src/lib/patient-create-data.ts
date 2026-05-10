/** Build Prisma Patient.create `data` from intake JSON (handles MultiStepForm pre-stringified arrays). */

import type { Prisma } from '@prisma/client';

function normalizeJsonArray(val: unknown): string {
  if (Array.isArray(val)) return JSON.stringify(val);
  if (typeof val === 'string' && val.trim() !== '') {
    try {
      const p = JSON.parse(val);
      return JSON.stringify(Array.isArray(p) ? p : []);
    } catch {
      return JSON.stringify([]);
    }
  }
  return JSON.stringify([]);
}

/** Scalar or checkbox-array → stable string for DB (matches legacy intake + assessment forms). */
function normalizeExtrinsicManifestations(val: unknown): string {
  if (Array.isArray(val)) return JSON.stringify(val);
  if (typeof val === 'string') {
    const t = val.trim();
    if (!t) return '';
    try {
      const p = JSON.parse(t);
      if (Array.isArray(p)) return JSON.stringify(p);
    } catch {
      /* plain label e.g. "Joints" */
    }
    return val.trim();
  }
  return '';
}

function normalizeJsonObject(val: unknown): string {
  if (val && typeof val === 'object' && !Array.isArray(val)) return JSON.stringify(val);
  if (typeof val === 'string' && val.trim() !== '') {
    try {
      const p = JSON.parse(val);
      return JSON.stringify(p && typeof p === 'object' && !Array.isArray(p) ? p : {});
    } catch {
      return JSON.stringify({});
    }
  }
  return JSON.stringify({});
}

/** Plain string from radio; still accepts JSON array / array for older submissions. */
function normalizePreferredLanguage(val: unknown): string {
  if (Array.isArray(val)) return JSON.stringify(val);
  if (typeof val === 'string') return val;
  return '';
}

/** Patient Health Records step: rows of { date, document } → scalar date + documents JSON with labDate on each. */
function labsAndDocumentsFromBody(b: Record<string, unknown>): {
  dateMostRecentLabs: string;
  documents: unknown;
} {
  if (Array.isArray(b.labReportRows) && b.labReportRows.length > 0) {
    const rows = b.labReportRows as Array<{ date?: string; document?: Record<string, unknown> | null }>;
    const completed = rows.filter((r) => String(r.date || '').trim() && r.document);
    let dateMostRecentLabs = '';
    if (completed.length > 0) {
      dateMostRecentLabs = completed.reduce(
        (max, r) => (String(r.date) > max ? String(r.date) : max),
        '',
      );
    }
    const documents = completed.map((r) => ({
      ...r.document,
      labDate: r.date,
    }));
    return { dateMostRecentLabs, documents };
  }
  return {
    dateMostRecentLabs: typeof b.dateMostRecentLabs === 'string' ? b.dateMostRecentLabs : '',
    documents: b.documents,
  };
}

export function patientCreateDataFromBody(body: Record<string, unknown>): Prisma.PatientCreateInput {
  const b = body;
  const { dateMostRecentLabs, documents } = labsAndDocumentsFromBody(b);
  return {
    name: typeof b.name === 'string' ? b.name : '',
    email: typeof b.email === 'string' ? b.email.trim() : '',
    mrn: typeof b.mrn === 'string' ? b.mrn : '',
    contactPhone: typeof b.contactPhone === 'string' ? b.contactPhone : '',
    placeOfLiving: typeof b.placeOfLiving === 'string' ? b.placeOfLiving : '',
    referredBy: typeof b.referredBy === 'string' ? b.referredBy : '',
    dateOfBirth: typeof b.dateOfBirth === 'string' ? b.dateOfBirth : '',
    currentAge: parseInt(String(b.currentAge), 10) || 0,
    ageAtDiagnosis: parseInt(String(b.ageAtDiagnosis), 10) || 0,
    sex: typeof b.sex === 'string' ? b.sex : '',
    smokingStatus: typeof b.smokingStatus === 'string' ? b.smokingStatus : '',
    smokingDetails: typeof b.smokingDetails === 'string' ? b.smokingDetails.trim() : '',
    primaryDiagnosis: typeof b.primaryDiagnosis === 'string' ? b.primaryDiagnosis : '',
    diseaseDuration: typeof b.diseaseDuration === 'string' ? b.diseaseDuration : '',
    perianalDiseaseAssessment:
      typeof b.perianalDiseaseAssessment === 'string' ? b.perianalDiseaseAssessment.trim() : '',
    montrealClass: typeof b.montrealClass === 'string' ? b.montrealClass : '',
    previousSurgeries: normalizeJsonArray(b.previousSurgeries),
    currentDiseaseActivity: typeof b.currentDiseaseActivity === 'string' ? b.currentDiseaseActivity : '',
    stoolFrequency: typeof b.stoolFrequency === 'string' ? b.stoolFrequency : '',
    bloodInStool: typeof b.bloodInStool === 'string' ? b.bloodInStool : '',
    abdominalPain: typeof b.abdominalPain === 'string' ? b.abdominalPain : '',
    impactOnQoL: typeof b.impactOnQoL === 'string' ? b.impactOnQoL : '',
    weightLoss: typeof b.weightLoss === 'string' ? b.weightLoss : '',
    activityScore: typeof b.activityScore === 'string' ? b.activityScore : '',
    dateMostRecentLabs,
    recentLabValues: typeof b.recentLabValues === 'string' ? b.recentLabValues : '',
    dateMostRecentColonoscopy: typeof b.dateMostRecentColonoscopy === 'string' ? b.dateMostRecentColonoscopy : '',
    colonoscopyFindings: typeof b.colonoscopyFindings === 'string' ? b.colonoscopyFindings : '',
    recentImaging: typeof b.recentImaging === 'string' ? b.recentImaging : '',
    mostRecentDexaScan: typeof b.mostRecentDexaScan === 'string' ? b.mostRecentDexaScan : '',
    currentIbdMedications: typeof b.currentIbdMedications === 'string' ? b.currentIbdMedications : '',
    failedTreatments: typeof b.failedTreatments === 'string' ? b.failedTreatments : '',
    tdmResults: typeof b.tdmResults === 'string' ? b.tdmResults : '',
    currentSupplements: typeof b.currentSupplements === 'string' ? b.currentSupplements : '',
    responseToTreatment: typeof b.responseToTreatment === 'string' ? b.responseToTreatment : '',
    steroidUse: typeof b.steroidUse === 'string' ? b.steroidUse : '',
    previousTreatmentsTried: normalizeJsonArray(b.previousTreatmentsTried),
    tbScreening: typeof b.tbScreening === 'string' ? b.tbScreening : '',
    hepBSurfaceAg: typeof b.hepBSurfaceAg === 'string' ? b.hepBSurfaceAg : '',
    hepBSurfaceAb: typeof b.hepBSurfaceAb === 'string' ? b.hepBSurfaceAb : '',
    hepBCoreAb: typeof b.hepBCoreAb === 'string' ? b.hepBCoreAb : '',
    antiHcv: typeof b.antiHcv === 'string' ? b.antiHcv : '',
    antiHiv: typeof b.antiHiv === 'string' ? b.antiHiv : '',
    influenza: normalizeJsonObject(b.influenza),
    covid19: normalizeJsonObject(b.covid19),
    pneumococcal: normalizeJsonObject(b.pneumococcal),
    hepatitisB: normalizeJsonObject(b.hepatitisB),
    hepatitisA: normalizeJsonObject(b.hepatitisA),
    hepatitisE: normalizeJsonObject(b.hepatitisE),
    zoster: normalizeJsonObject(b.zoster),
    mmrVaricella: normalizeJsonObject(b.mmrVaricella),
    tetanusTdap: normalizeJsonObject(b.tetanusTdap),
    comorbidities: normalizeJsonArray(b.comorbidities),
    extraintestinalManif: normalizeExtrinsicManifestations(b.extraintestinalManif),
    pregnancyPlanning: typeof b.pregnancyPlanning === 'string' ? b.pregnancyPlanning : '',
    preferredLanguage: normalizePreferredLanguage(b.preferredLanguage),
    occupation: typeof b.occupation === 'string' ? b.occupation : '',
    specialConsiderations: typeof b.specialConsiderations === 'string' ? b.specialConsiderations : '',
    documents: normalizeJsonArray(documents),
  };
}
