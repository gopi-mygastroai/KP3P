import type { FormData } from './formData';

interface StepProps {
  data: FormData;
  updateData: (fields: Partial<FormData>) => void;
}

const requiredStar = () => <span className="text-red-500 ml-0.5" aria-hidden>*</span>;

const radioGroup = (
  name: keyof FormData,
  label: string,
  options: string[],
  data: FormData,
  updateData: StepProps['updateData'],
  required = false,
) => (
  <div className="form-group">
    <label className="form-label">
      {label}
      {required && requiredStar()}
    </label>
    <div className="form-radio-group">
      {options.map((opt, i) => (
        <label key={opt} className="form-radio-label">
          <input
            type="radio"
            name={name as string}
            value={opt}
            checked={data[name] === opt}
            required={required && i === 0}
            onChange={(e) => updateData({ [name]: e.target.value })}
          />
          {opt}
        </label>
      ))}
    </div>
  </div>
);

const textInput = (
  name: keyof FormData,
  label: string,
  type: string = 'text',
  data: FormData,
  updateData: StepProps['updateData'],
  required = false,
) => (
  <div className="form-group">
    <label className="form-label">
      {label}
      {required && requiredStar()}
    </label>
    <input
      type={type}
      className="form-input"
      required={required}
      value={
        type === 'number' && (data[name] === '' || data[name] == null)
          ? ''
          : (data[name] as string | number)
      }
      onChange={(e) => {
        const raw = e.target.value;
        if (type === 'number') {
          updateData({ [name]: raw === '' ? '' : Number(raw) } as Partial<FormData>);
        } else {
          updateData({ [name]: raw });
        }
      }}
    />
  </div>
);

const textArea = (
  name: keyof FormData,
  label: string,
  data: FormData,
  updateData: StepProps['updateData'],
  required = false,
) => (
  <div className="form-group">
    <label className="form-label">
      {label}
      {required && requiredStar()}
    </label>
    <textarea
      className="form-textarea"
      rows={3}
      required={required}
      value={data[name] as string}
      onChange={(e) => updateData({ [name]: e.target.value })}
    />
  </div>
);

export function Step1({ data, updateData }: StepProps) {
  return (
    <div className="animate-fade-in">
      <h2 className="text-xl mb-4 text-white font-bold">Patient Characteristics</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {textInput('name', 'Name', 'text', data, updateData, true)}
        {textInput('mrn', 'ID / MRN', 'text', data, updateData, true)}
        {textInput('contactPhone', 'Contact Phone', 'text', data, updateData, true)}
        {textInput('placeOfLiving', 'Place of Living', 'text', data, updateData, true)}
        {textInput('referredBy', 'Referred By', 'text', data, updateData, true)}
        {textInput('dateOfBirth', 'Date of Birth', 'date', data, updateData, true)}
        {textInput('currentAge', 'Current Age', 'number', data, updateData, true)}
        {textInput('ageAtDiagnosis', 'Age at Diagnosis', 'number', data, updateData, true)}
      </div>
      {radioGroup('sex', 'Sex', ['Male', 'Female', 'Other'], data, updateData, true)}
      {radioGroup('smokingStatus', 'Smoking Status', ['Current smoker', 'Ex smoker', 'Never smoked'], data, updateData, true)}
      {(data.smokingStatus === 'Current smoker' || data.smokingStatus === 'Ex smoker' || data.smokingStatus === 'Current' || data.smokingStatus === 'Former') &&
        textArea(
          'smokingDetails',
          'Smoking amount (e.g. packs per day, cigarettes/day, pack-years)',
          data,
          updateData,
          true,
        )}
    </div>
  );
}

export function Step2({ data, updateData }: StepProps) {
  return (
    <div className="animate-fade-in">
      <h2 className="text-xl mb-4 text-white font-bold">Medical Profile & Vaccines</h2>
      
      <h3 className="text-lg mt-2 mb-2 text-primary-color">Basic Health Info</h3>
      {radioGroup('primaryDiagnosis', 'Primary Diagnosis', ['Ulcerative Colitis', 'Crohns Disease', 'IBD-U'], data, updateData)}
      {radioGroup('diseaseDuration', 'Disease Duration', ['< 1 year', '1-5 years', '5-10 years', '> 10 years'], data, updateData)}
      
      <h3 className="text-lg mt-6 mb-2 text-primary-color">Vaccination History</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {textInput('influenza', 'Influenza', 'text', data, updateData)}
        {textInput('covid19', 'COVID-19', 'text', data, updateData)}
        {textInput('pneumococcal', 'Pneumococcal', 'text', data, updateData)}
        {textInput('hepatitisB', 'Hepatitis B', 'text', data, updateData)}
        {textInput('hepatitisA', 'Hepatitis A', 'text', data, updateData)}
        {textInput('hepatitisE', 'Hepatitis E', 'text', data, updateData)}
        {textInput('zoster', 'Zoster', 'text', data, updateData)}
        {textInput('mmr', 'MMR', 'text', data, updateData)}
        {textInput('varicella', 'Varicella', 'text', data, updateData)}
        {textInput('tetanusTdap', 'Tetanus / Tdap', 'text', data, updateData)}
      </div>
    </div>
  );
}

export function Step3({ data, updateData }: StepProps) {
  return (
    <div className="animate-fade-in">
      <h2 className="text-xl mb-4 text-white font-bold">Health Records</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {textInput('dateMostRecentLabs', 'Date of Most Recent Labs', 'date', data, updateData)}
      </div>
    </div>
  );
}
