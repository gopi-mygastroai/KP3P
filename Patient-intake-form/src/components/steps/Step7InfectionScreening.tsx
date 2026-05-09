import { FormData } from '@/lib/formSchema';

interface Props { formData: FormData; onChange: (f: string, v: any) => void; errors: Record<string,string>; }

const Fg = ({ id, label, required, error, children }: { id:string;label:string;required?:boolean;error?:string;children:React.ReactNode }) => (
  <div className="fg">
    <label htmlFor={id}>{label}{required && <span className="req">*</span>}</label>
    {children}
    {error && <span className="ferr">{error}</span>}
  </div>
);

const Radio = ({ name, value, label, checked, onChange }: { name:string;value:string;label:string;checked:boolean;onChange:()=>void }) => (
  <label className={`radio-opt${checked?' selected':''}`}>
    <input type="radio" name={name} value={value} checked={checked} onChange={onChange} />{label}
  </label>
);

function RadioGroup({ name, options, value, onChange, required, label, error }: {
  name:string; options:string[]; value:string; onChange:(v:string)=>void;
  required?:boolean; label:string; error?:string;
}) {
  return (
    <div className="span-2">
      <Fg id={name} label={label} required={required} error={error}>
        <div className="radio-group">
          {options.map(opt => (
            <Radio key={opt} name={name} value={opt} label={opt}
              checked={value === opt} onChange={() => onChange(opt)} />
          ))}
        </div>
      </Fg>
    </div>
  );
}

export default function Step7InfectionScreening({ formData: d, onChange, errors: e }: Props) {
  return (
    <div className="form-grid">
      <RadioGroup name="tbScreening" label="TB Screening Status" required error={e.tbScreening}
        value={d.tbScreening} onChange={v => onChange('tbScreening', v)}
        options={['Not done','Done – Negative (IGRA or TST)','Done – Positive, treated','Done – Positive, not treated','Unknown']} />

      <RadioGroup name="hepBSurfaceAg" label="Hepatitis B Surface Antigen (HBsAg)" required error={e.hepBSurfaceAg}
        value={d.hepBSurfaceAg} onChange={v => onChange('hepBSurfaceAg', v)}
        options={['Not tested','Negative','Positive','Unknown']} />

      <RadioGroup name="hepBSurfaceAb" label="Hepatitis B Surface Antibody (Anti-HBs)"
        value={d.hepBSurfaceAb} onChange={v => onChange('hepBSurfaceAb', v)}
        options={['Not tested','Positive (Immune)','Negative (Not immune)','Unknown']} />

      <RadioGroup name="hepBCoreAb" label="Hepatitis B Core Antibody (Anti-HBc total)"
        value={d.hepBCoreAb} onChange={v => onChange('hepBCoreAb', v)}
        options={['Not tested','Negative','Positive (Past infection)','Unknown']} />

      <RadioGroup name="antiHcv" label="Anti HCV"
        value={d.antiHcv} onChange={v => onChange('antiHcv', v)}
        options={['Not tested','Negative','Positive','Unknown']} />

      <RadioGroup name="antiHiv" label="Anti HIV"
        value={d.antiHiv} onChange={v => onChange('antiHiv', v)}
        options={['Not tested','Negative','Positive','Unknown']} />
    </div>
  );
}
