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

const Check = ({ value, label, checked, onChange }: { value:string;label:string;checked:boolean;onChange:()=>void }) => (
  <label className={`check-opt${checked?' checked':''}`}>
    <input type="checkbox" value={value} checked={checked} onChange={onChange} />{label}
  </label>
);

const TREATMENTS = [
  'None (treatment-naive)',
  '5-ASA (mesalamine, sulfasalazine)',
  'Corticosteroids (prednisone, budesonide)',
  'Azathioprine / 6-Mercaptopurine',
  'Methotrexate',
  'Infliximab (Remicade / Infimab / Inflixirel)',
  'Adalimumab (Exemptia / Adfrar / Plamimumab / Mabura)',
  'Vedolizumab',
  'Ustekinumab',
  'Tofacitinib',
  'Upadacitinib',
  'Other',
];

export default function Step6TreatmentHistory({ formData: d, onChange, errors: e }: Props) {
  const toggle = (arr: string[], val: string) =>
    arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];

  return (
    <div className="form-grid-1">
      <Fg id="previousTreatmentsTried" label="Previous IBD Treatments Tried (select all that apply)" required error={e.previousTreatmentsTried}>
        <div className="check-group">
          {TREATMENTS.map(opt => (
            <Check key={opt} value={opt} label={opt}
              checked={d.previousTreatmentsTried.includes(opt)}
              onChange={() => onChange('previousTreatmentsTried', toggle(d.previousTreatmentsTried, opt))} />
          ))}
        </div>
      </Fg>

      <Fg id="failedTreatments" label="Details of Failed Treatments (optional)" hint="For each failed medication — drug name, duration tried, reason for failure.">
        <textarea id="failedTreatments" className="fi"
          value={d.failedTreatments} onChange={x => onChange('failedTreatments', x.target.value)}
          placeholder="Example — Infliximab 18 months, secondary loss of response. Adalimumab 3 months, injection site reactions."
          style={{ minHeight: 100 }} />
      </Fg>
    </div>
  );
}
