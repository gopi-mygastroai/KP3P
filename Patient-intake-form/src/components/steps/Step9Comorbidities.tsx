import { FormData } from '@/lib/formSchema';

interface Props { formData: FormData; onChange: (f: string, v: any) => void; errors: Record<string,string>; }

const Fg = ({ id, label, required, error, hint, children }: { id:string;label:string;required?:boolean;error?:string;hint?:string;children:React.ReactNode }) => (
  <div className="fg">
    <label htmlFor={id}>{label}{required && <span className="req">*</span>}</label>
    {children}
    {hint && <span className="field-hint">{hint}</span>}
    {error && <span className="ferr">{error}</span>}
  </div>
);

const Radio = ({ name, value, label, checked, onChange }: { name:string;value:string;label:string;checked:boolean;onChange:()=>void }) => (
  <label className={`radio-opt${checked?' selected':''}`}>
    <input type="radio" name={name} value={value} checked={checked} onChange={onChange} />{label}
  </label>
);

const Check = ({ value, label, checked, onChange }: { value:string;label:string;checked:boolean;onChange:()=>void }) => (
  <label className={`check-opt${checked?' checked':''}`}>
    <input type="checkbox" value={value} checked={checked} onChange={onChange} />{label}
  </label>
);

const COMORBIDITIES = [
  'None','Type 2 Diabetes','Hypertension','Heart disease','CKD',
  'Liver disease','Osteoporosis / Osteopenia','Hypothyroidism',
  'History of cancer (specify in notes)','Depression / Anxiety','Other',
];

const EIM = [
  'None','Uveitis / eye problems','Arthralgia / Arthritis',
  'Erythema nodosum','Pyoderma Gangrenosum','Primary Sclerosing Cholangitis',
];

const LANGUAGES = ['English','Telugu','Hindi','Tamil','Kannada','Bengali','Malayalam','Marathi','Punjabi'];

export default function Step9Comorbidities({ formData: d, onChange, errors: e }: Props) {
  const toggleArr = (arr: string[], val: string) =>
    arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];

  return (
    <div className="form-grid-1">
      <Fg id="comorbidities" label="Comorbidities (select all that apply)" required error={e.comorbidities}>
        <div className="check-group">
          {COMORBIDITIES.map(opt => (
            <Check key={opt} value={opt} label={opt}
              checked={d.comorbidities.includes(opt)}
              onChange={() => onChange('comorbidities', toggleArr(d.comorbidities, opt))} />
          ))}
        </div>
      </Fg>

      <Fg id="extraintestinalManif" label="Extraintestinal Manifestations (select all that apply)" required error={e.extraintestinalManif}>
        <div className="check-group">
          {EIM.map(opt => (
            <Check key={opt} value={opt} label={opt}
              checked={d.extraintestinalManif.includes(opt)}
              onChange={() => onChange('extraintestinalManif', toggleArr(d.extraintestinalManif, opt))} />
          ))}
        </div>
      </Fg>

      <Fg id="pregnancyPlanning" label="Pregnancy / Family Planning Status" required error={e.pregnancyPlanning}>
        <div className="radio-group">
          {['Not applicable (male/post-menopausal)','Not planning for pregnancy','Planning pregnancy within next year','Currently pregnant','Currently breast feeding'].map(opt => (
            <Radio key={opt} name="pregnancyPlanning" value={opt} label={opt}
              checked={d.pregnancyPlanning === opt} onChange={() => onChange('pregnancyPlanning', opt)} />
          ))}
        </div>
      </Fg>

      <Fg id="preferredLanguage" label="Preferred Language for Care Plan">
        <div className="radio-group">
          {LANGUAGES.map(opt => (
            <Radio key={opt} name="preferredLanguage" value={opt} label={opt}
              checked={d.preferredLanguage === opt} onChange={() => onChange('preferredLanguage', opt)} />
          ))}
        </div>
      </Fg>

      <Fg id="occupation" label="Occupation (optional)" hint='e.g. Farmer, Teacher, Engineer'>
        <input id="occupation" type="text" className="fi"
          value={d.occupation} onChange={x => onChange('occupation', x.target.value)}
          placeholder="e.g. Software Engineer" />
      </Fg>

      <Fg id="specialConsiderations" label="Special Considerations (optional)"
        hint="Travel plans, specific concerns, dietary restrictions, cultural considerations, anything else important for care planning">
        <textarea id="specialConsiderations" className="fi"
          value={d.specialConsiderations} onChange={x => onChange('specialConsiderations', x.target.value)}
          placeholder="Any special notes for the care team…" style={{ minHeight: 88 }} />
      </Fg>
    </div>
  );
}
