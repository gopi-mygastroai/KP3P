import { FormData } from '@/lib/formSchema';

interface Props {
  formData: FormData;
  onChange: (field: string, value: any) => void;
  errors: Record<string, string>;
}

const Fg = ({ id, label, required, error, children }: {
  id: string; label: string; required?: boolean; error?: string; children: React.ReactNode;
}) => (
  <div className="fg">
    <label htmlFor={id}>{label}{required && <span className="req">*</span>}</label>
    {children}
    {error && <span className="ferr">{error}</span>}
  </div>
);

const Radio = ({ name, value, label, checked, onChange }: {
  name: string; value: string; label: string; checked: boolean; onChange: () => void;
}) => (
  <label className={`radio-opt${checked ? ' selected' : ''}`}>
    <input type="radio" name={name} value={value} checked={checked} onChange={onChange} />
    {label}
  </label>
);

export default function Step1PatientInfo({ formData: d, onChange, errors: e }: Props) {
  const showSmokingDetails = d.smokingStatus === 'Ex smoker' || d.smokingStatus === 'Current smoker';

  const handleDateOfBirthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dobValue = e.target.value;
    onChange('dateOfBirth', dobValue);

    if (dobValue) {
      const dob = new Date(dobValue);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
      // Ensure age is not negative
      onChange('currentAge', Math.max(0, age).toString());
    }
  };

  return (
    <div className="form-grid">
      {/* Email */}
      <Fg id="email" label="Email" required error={e.email}>
        <input id="email" type="email" className={`fi${e.email ? ' err' : ''}`}
          value={d.email} onChange={x => onChange('email', x.target.value)}
          placeholder="patient@example.com" autoComplete="email" />
      </Fg>

      {/* Full Name */}
      <Fg id="name" label="Patient Full Name" required error={e.name}>
        <input id="name" type="text" className={`fi${e.name ? ' err' : ''}`}
          value={d.name} onChange={x => onChange('name', x.target.value.replace(/[^a-zA-Z\s.'-]/g, ''))}
          placeholder="Full name as per records" />
      </Fg>

      {/* Patient ID / MRN / ABHA ID (optional) */}
      <Fg id="mrn" label="Patient ID / MRN / ABHA ID" error={e.mrn}>
        <input id="mrn" type="text" className={`fi${e.mrn ? ' err' : ''}`}
          value={d.mrn} onChange={x => onChange('mrn', x.target.value.replace(/[^a-zA-Z0-9-]/g, ''))}
          placeholder="e.g. MRN-00123 or ABHA ID" />
      </Fg>

      {/* Contact Phone */}
      <Fg id="contactPhone" label="Contact Phone" required error={e.contactPhone}>
        <input id="contactPhone" type="tel" className={`fi${e.contactPhone ? ' err' : ''}`}
          maxLength={10}
          value={d.contactPhone} onChange={x => onChange('contactPhone', x.target.value.replace(/\D/g, ''))}
          placeholder="e.g. 9876543210" />
      </Fg>

      {/* Date of Birth */}
      <Fg id="dateOfBirth" label="Date of Birth" required error={e.dateOfBirth}>
        <input id="dateOfBirth" type="date" className={`fi${e.dateOfBirth ? ' err' : ''}`}
          max={new Date().toISOString().split('T')[0]}
          value={d.dateOfBirth} onChange={handleDateOfBirthChange} />
      </Fg>

      {/* Current Age */}
      <Fg id="currentAge" label="Current Age (years)" required error={e.currentAge}>
        <input id="currentAge" type="number" min="0" max="120" className={`fi${e.currentAge ? ' err' : ''}`}
          value={d.currentAge} onChange={x => onChange('currentAge', x.target.value)}
          placeholder="e.g. 34" />
      </Fg>

      {/* Age at Diagnosis */}
      <Fg id="ageAtDiagnosis" label="Age at IBD Diagnosis" required error={e.ageAtDiagnosis}>
        <input id="ageAtDiagnosis" type="number" min="0" max="120" className={`fi${e.ageAtDiagnosis ? ' err' : ''}`}
          value={d.ageAtDiagnosis} onChange={x => onChange('ageAtDiagnosis', x.target.value)}
          placeholder="e.g. 28" />
      </Fg>

      {/* Place of Living */}
      <Fg id="placeOfLiving" label="Place of Living" required error={e.placeOfLiving}>
        <input id="placeOfLiving" type="text" className={`fi${e.placeOfLiving ? ' err' : ''}`}
          value={d.placeOfLiving} onChange={x => onChange('placeOfLiving', x.target.value.replace(/[^a-zA-Z\s.'-,]/g, ''))}
          placeholder="City, State" />
      </Fg>

      {/* Referred By */}
      <Fg id="referredBy" label="Referred By" required error={e.referredBy}>
        <input id="referredBy" type="text" className={`fi${e.referredBy ? ' err' : ''}`}
          value={d.referredBy} onChange={x => onChange('referredBy', x.target.value.replace(/[^a-zA-Z\s.'-]/g, ''))}
          placeholder="Doctor name / Hospital" />
      </Fg>

      {/* Sex */}
      <Fg id="sex" label="Sex" required error={e.sex}>
        <div className="radio-group">
          {['Male','Female','Other'].map(opt => (
            <Radio key={opt} name="sex" value={opt} label={opt}
              checked={d.sex === opt} onChange={() => onChange('sex', opt)} />
          ))}
        </div>
      </Fg>

      {/* Smoking Status */}
      <div className="span-2">
        <Fg id="smokingStatus" label="Smoking Status" required error={e.smokingStatus}>
          <div className="radio-group">
            {['Never smoked','Ex smoker','Current smoker'].map(opt => (
              <Radio key={opt} name="smokingStatus" value={opt} label={opt}
                checked={d.smokingStatus === opt} onChange={() => onChange('smokingStatus', opt)} />
            ))}
          </div>
        </Fg>
        {showSmokingDetails && (
          <div className="conditional-field" style={{ marginTop: 10 }}>
            <Fg id="smokingDetails" label="Smoking Details">
              <input id="smokingDetails" type="text" className="fi"
                value={d.smokingDetails} onChange={x => onChange('smokingDetails', x.target.value)}
                placeholder="e.g. 10 pack-years, quit 5 years ago" />
            </Fg>
          </div>
        )}
      </div>
    </div>
  );
}
