/** App-owned patient/user types (no Prisma runtime dependency). */

export type UserRecord = {
  id: number;
  email: string;
  name: string;
  role: string;
  password: string;
  phone?: string | null;
  authUserId?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
};

export type PatientRecord = {
  id: number;
  userId: number | null;
  authUserId?: string | null;
  name: string;
  email: string;
  mrn: string;
  contactPhone: string;
  placeOfLiving: string;
  referredBy: string;
  dateOfBirth: string;
  currentAge: number;
  ageAtDiagnosis: number;
  sex: string;
  smokingStatus: string;
  smokingDetails: string;
  primaryDiagnosis: string;
  diseaseDuration: string;
  perianalDiseaseAssessment: string;
  montrealAgeAtDiagnosis: string;
  ucExtent: string;
  diseaseLocation: string;
  diseaseBehavior: string;
  perianalDisease: string;
  montrealClass: string;
  sesCdScoring: string;
  hbiScoring: string;
  partialMayoScoring: string;
  sesCdClinicalNotes: string;
  upperGiFindings: string;
  ucEndoscopicScoring: string;
  previousSurgeries: string;
  currentDiseaseActivity: string;
  stoolFrequency: string;
  bloodInStool: string;
  abdominalPain: string;
  impactOnQoL: string;
  weightLoss: string;
  activityScore: string;
  dateMostRecentLabs: string;
  ibdInvestigations: string;
  radiologyInvestigations: string;
  currentIbdMedicationsRows: string;
  failedTreatments: string;
  responseToTreatment: string;
  infectionScreening: string;
  influenza: string;
  covid19: string;
  pneumococcal: string;
  hepatitisB: string;
  hepatitisA: string;
  hepatitisE: string;
  zoster: string;
  mmr: string;
  varicella: string;
  tetanusTdap: string;
  comorbidities: string;
  extraintestinalManif: string;
  pregnancyPlanning: string;
  preferredLanguage: string;
  occupation: string;
  specialConsiderations: string;
  assessmentComplete: boolean;
  assessmentCurrentStep: number;
  createdAt: string | Date;
  updatedAt: string | Date;
};

export type PatientCreateInput = Omit<
  PatientRecord,
  'id' | 'createdAt' | 'updatedAt' | 'authUserId' | 'userId'
> & {
  userId?: number | null;
};

export type PatientUpdateInput = Partial<PatientCreateInput>;

/** Includes optional id/timestamps for one-off imports (e.g. submissions.json migrate). */
export type PatientInsertInput = PatientCreateInput & {
  id?: number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
};

export type PatientWithUser = PatientRecord & {
  user: UserRecord | null;
};
