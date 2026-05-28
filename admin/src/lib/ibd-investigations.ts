export const IBD_INVESTIGATION_GROUPS = [
  {
    id: 'cbc',
    title: 'COMPLETE BLOOD COUNT (CBC)',
    fields: [
      { id: 'hemoglobin', label: 'Hemoglobin (Hb)' },
      { id: 'wbc', label: 'Total White Blood Cell Count (WBC)' },
      { id: 'neutrophilsPct', label: 'Neutrophils (%)' },
      { id: 'lymphocytesPct', label: 'Lymphocytes (%)' },
      { id: 'plateletCount', label: 'Platelet Count' },
      { id: 'mcv', label: 'Mean Corpuscular Volume (MCV)' },
      { id: 'hematocrit', label: 'Hematocrit (HCT)' },
    ],
  },
  {
    id: 'inflammatoryMarkers',
    title: 'INFLAMMATORY MARKERS',
    fields: [
      { id: 'esr', label: 'Erythrocyte Sedimentation Rate (ESR)' },
      { id: 'crp', label: 'C-Reactive Protein (CRP)' },
      { id: 'fecalCalprotectin', label: 'Fecal Calprotectin' },
    ],
  },
  {
    id: 'ironStudies',
    title: 'IRON STUDIES',
    fields: [
      { id: 'serumIron', label: 'Serum Iron' },
      { id: 'ferritin', label: 'Ferritin' },
      { id: 'tibc', label: 'Total Iron Binding Capacity (TIBC)' },
      { id: 'transferrinSaturation', label: 'Transferrin Saturation (%)' },
    ],
  },
  {
    id: 'vitaminsMicronutrients',
    title: 'VITAMINS & MICRONUTRIENTS',
    fields: [
      { id: 'vitaminB12', label: 'Vitamin B12' },
      { id: 'folate', label: 'Folate' },
      { id: 'vitaminD', label: 'Vitamin D (25-OH)' },
      { id: 'zinc', label: 'Zinc' },
      { id: 'magnesium', label: 'Magnesium' },
      { id: 'calcium', label: 'Calcium' },
    ],
  },
  {
    id: 'lft',
    title: 'LIVER FUNCTION TESTS (LFT)',
    fields: [
      { id: 'totalBilirubin', label: 'Total Bilirubin' },
      { id: 'directBilirubin', label: 'Direct Bilirubin' },
      { id: 'ast', label: 'AST (SGOT)' },
      { id: 'alt', label: 'ALT (SGPT)' },
      { id: 'alp', label: 'Alkaline Phosphatase (ALP)' },
      { id: 'ggt', label: 'GGT' },
      { id: 'serumAlbumin', label: 'Serum Albumin' },
      { id: 'totalProtein', label: 'Total Protein' },
    ],
  },
  {
    id: 'rft',
    title: 'RENAL FUNCTION TESTS (RFT)',
    fields: [
      { id: 'serumCreatinine', label: 'Serum Creatinine' },
      { id: 'bun', label: 'Blood Urea Nitrogen (BUN)' },
    ],
  },
  {
    id: 'electrolytes',
    title: 'ELECTROLYTES',
    fields: [
      { id: 'sodium', label: 'Sodium (Na+)' },
      { id: 'potassium', label: 'Potassium (K+)' },
      { id: 'chloride', label: 'Chloride (Cl-)' },
    ],
  },
  {
    id: 'stoolInvestigations',
    title: 'STOOL INVESTIGATIONS',
    fields: [
      { id: 'stoolRoutineExam', label: 'Stool Routine Examination' },
      { id: 'stoolCulture', label: 'Stool Culture & Sensitivity' },
      { id: 'cDiffToxin', label: 'Clostridium difficile Toxin (A/B)' },
      { id: 'fobt', label: 'Fecal Occult Blood Test (FOBT)' },
    ],
  },
  {
    id: 'serologicalMarkers',
    title: 'SEROLOGICAL MARKERS',
    fields: [
      { id: 'asca', label: 'ASCA (Anti-Saccharomyces cerevisiae Antibody)' },
      { id: 'panca', label: 'pANCA (Perinuclear Anti-Neutrophil Cytoplasmic Ab)' },
    ],
  },
  {
    id: 'drugMonitoringThiopurines',
    title: 'DRUG MONITORING (Thiopurines)',
    fields: [
      { id: 'tpmt', label: 'TPMT Level / Activity' },
      { id: 'nudt', label: 'NUDT Level / Activity' },
      { id: 'tgn6', label: '6-Thioguanine Nucleotides (6-TGN)' },
      { id: 'mmp6', label: '6-Methylmercaptopurine (6-MMP)' },
    ],
  },
  {
    id: 'drugMonitoringBiologics',
    title: 'DRUG MONITORING (Biologics)',
    fields: [
      { id: 'drugTroughLevel', label: 'Drug Trough Level' },
      { id: 'antiDrugAntibodies', label: 'Anti-Drug Antibodies (ADA)' },
    ],
  },
] as const;

export type IbdInvestigationFieldId =
  (typeof IBD_INVESTIGATION_GROUPS)[number]['fields'][number]['id'];

export type IbdInvestigationsData = {
  investigationDiagnosis: string;
  values: Record<IbdInvestigationFieldId, string>;
};

const FIELD_IDS = IBD_INVESTIGATION_GROUPS.flatMap((group) =>
  group.fields.map((field) => field.id),
) as IbdInvestigationFieldId[];

function emptyValues(): Record<IbdInvestigationFieldId, string> {
  const values = {} as Record<IbdInvestigationFieldId, string>;
  for (const id of FIELD_IDS) values[id] = '';
  return values;
}

export function emptyIbdInvestigations(): IbdInvestigationsData {
  return {
    investigationDiagnosis: '',
    values: emptyValues(),
  };
}

export function normalizeIbdInvestigations(
  input: Partial<IbdInvestigationsData> | null | undefined,
): IbdInvestigationsData {
  const base = emptyIbdInvestigations();
  if (!input) return base;

  const values = { ...base.values };
  if (input.values && typeof input.values === 'object') {
    for (const id of FIELD_IDS) {
      const raw = input.values[id];
      values[id] = typeof raw === 'string' ? raw : raw == null ? '' : String(raw);
    }
  }

  return {
    investigationDiagnosis:
      typeof input.investigationDiagnosis === 'string' ? input.investigationDiagnosis : '',
    values,
  };
}

export function parseIbdInvestigations(raw: unknown): IbdInvestigationsData {
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return emptyIbdInvestigations();
    try {
      return normalizeIbdInvestigations(JSON.parse(trimmed) as Partial<IbdInvestigationsData>);
    } catch {
      return emptyIbdInvestigations();
    }
  }
  if (raw && typeof raw === 'object') {
    return normalizeIbdInvestigations(raw as Partial<IbdInvestigationsData>);
  }
  return emptyIbdInvestigations();
}

export function serializeIbdInvestigations(data: IbdInvestigationsData): string {
  return JSON.stringify(normalizeIbdInvestigations(data));
}

export function filledInvestigationEntries(data: IbdInvestigationsData): Array<{
  groupTitle: string;
  label: string;
  value: string;
}> {
  const entries: Array<{ groupTitle: string; label: string; value: string }> = [];
  for (const group of IBD_INVESTIGATION_GROUPS) {
    for (const field of group.fields) {
      const value = data.values[field.id]?.trim() ?? '';
      if (value) {
        entries.push({ groupTitle: group.title, label: field.label, value });
      }
    }
  }
  return entries;
}
