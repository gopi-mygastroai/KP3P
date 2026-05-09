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

export default function Step5CurrentTreatment({ formData: d, onChange, errors: e }: Props) {
  return (
    <div className="form-grid">
      <div className="span-2">
        <Fg id="currentIbdMedications" label="Current IBD Medications with Duration">
          <textarea id="currentIbdMedications" className="fi"
            value={d.currentIbdMedications} onChange={x => onChange('currentIbdMedications', x.target.value)}
            placeholder="e.g. Vedolizumab 300mg IV — 18 months, Azathioprine 100mg — 2 years" />
        </Fg>
      </div>

      <div className="span-2">
        <Fg id="responseToTreatment" label="Response to Treatment" required error={e.responseToTreatment}>
          <div className="radio-group">
            {['Excellent (Remission)','Partial','No response','Secondary loss','Not applicable'].map(opt => (
              <Radio key={opt} name="responseToTreatment" value={opt} label={opt}
                checked={d.responseToTreatment === opt} onChange={() => onChange('responseToTreatment', opt)} />
            ))}
          </div>
        </Fg>
      </div>

      <div className="span-2">
        <Fg id="tdmResults" label="Therapeutic Drug Monitoring (TDM) Results">
          <textarea id="tdmResults" className="fi"
            value={d.tdmResults} onChange={x => onChange('tdmResults', x.target.value)}
            placeholder="e.g. Infliximab trough 4.2 µg/mL, ADA negative" />
        </Fg>
      </div>

      <div className="span-2">
        <Fg id="steroidUse" label="Steroid Use" required error={e.steroidUse}>
          <div className="radio-group">
            {['Not on steroids','<3 months','>3 months','Recently stopped','Steroid dependent'].map(opt => (
              <Radio key={opt} name="steroidUse" value={opt} label={opt}
                checked={d.steroidUse === opt} onChange={() => onChange('steroidUse', opt)} />
            ))}
          </div>
        </Fg>
      </div>

      <div className="span-2">
        <Fg id="currentSupplements" label="Vitamin D / Calcium Supplementation">
          <input id="currentSupplements" type="text" className="fi"
            value={d.currentSupplements} onChange={x => onChange('currentSupplements', x.target.value)}
            placeholder="e.g. Vitamin D3 2000 IU/day, Calcium 500mg BD" />
        </Fg>
      </div>
    </div>
  );
}
