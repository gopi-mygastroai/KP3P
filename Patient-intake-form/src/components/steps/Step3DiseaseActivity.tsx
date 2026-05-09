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

export default function Step3DiseaseActivity({ formData: d, onChange, errors: e }: Props) {
  return (
    <div className="form-grid">
      <div className="span-2">
        <Fg id="currentDiseaseActivity" label="Disease Activity Level" required error={e.currentDiseaseActivity}>
          <div className="radio-group">
            {['Remission','Mild','Moderate','Severe','Unknown'].map(opt => (
              <Radio key={opt} name="currentDiseaseActivity" value={opt} label={opt}
                checked={d.currentDiseaseActivity === opt} onChange={() => onChange('currentDiseaseActivity', opt)} />
            ))}
          </div>
        </Fg>
      </div>

      <Fg id="activityScore" label="Activity Score (optional)">
        <input id="activityScore" type="text" className="fi"
          value={d.activityScore} onChange={x => onChange('activityScore', x.target.value)}
          placeholder="e.g. Mayo 4, CDAI 220, HBI 8" />
      </Fg>

      <Fg id="stoolFrequency" label="Frequency of Stools" required error={e.stoolFrequency}>
        <select id="stoolFrequency" className={`fi${e.stoolFrequency?' err':''}`}
          value={d.stoolFrequency} onChange={x => onChange('stoolFrequency', x.target.value)}>
          <option value="">Select…</option>
          {['Normal','1–3 extra/day','4–6 extra/day','>6/day','Continuous'].map(o => <option key={o}>{o}</option>)}
        </select>
      </Fg>

      <Fg id="bloodInStool" label="Blood in Stool" required error={e.bloodInStool}>
        <div className="radio-group">
          {['None','Occasional','Frequent','Mostly blood'].map(opt => (
            <Radio key={opt} name="bloodInStool" value={opt} label={opt}
              checked={d.bloodInStool === opt} onChange={() => onChange('bloodInStool', opt)} />
          ))}
        </div>
      </Fg>

      <Fg id="abdominalPain" label="Abdominal Pain" required error={e.abdominalPain}>
        <div className="radio-group">
          {['None','Mild','Moderate','Severe'].map(opt => (
            <Radio key={opt} name="abdominalPain" value={opt} label={opt}
              checked={d.abdominalPain === opt} onChange={() => onChange('abdominalPain', opt)} />
          ))}
        </div>
      </Fg>

      <Fg id="impactOnQoL" label="Impact on Quality of Life" required error={e.impactOnQoL}>
        <div className="radio-group">
          {['None','Mild','Moderate','Severe'].map(opt => (
            <Radio key={opt} name="impactOnQoL" value={opt} label={opt}
              checked={d.impactOnQoL === opt} onChange={() => onChange('impactOnQoL', opt)} />
          ))}
        </div>
      </Fg>

      <Fg id="weightLoss" label="Weight Loss" required error={e.weightLoss}>
        <div className="radio-group">
          {['Yes','No'].map(opt => (
            <Radio key={opt} name="weightLoss" value={opt} label={opt}
              checked={d.weightLoss === opt} onChange={() => onChange('weightLoss', opt)} />
          ))}
        </div>
      </Fg>
    </div>
  );
}
