import type { FormData } from './formData';
import { useRef, useState } from 'react';

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
        {textInput('mmrVaricella', 'MMR / Varicella', 'text', data, updateData)}
        {textInput('tetanusTdap', 'Tetanus / Tdap', 'text', data, updateData)}
      </div>
    </div>
  );
}

export function Step3({ data, updateData }: StepProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('patientName', String((data as any).name || ''));
      formData.append('mrn', String((data as any).mrn || ''));
      
      const res = await fetch('/api/drive/upload', {
        method: 'POST',
        body: formData,
      });
      
      const responseData = await res.json();
      
      if (!res.ok) {
        throw new Error(responseData.error || 'Failed to upload to Google Drive');
      }

      const newDoc = {
        name: responseData.driveFileName || file.name,
        originalName: file.name,
        type: file.type,
        url: responseData.webViewLink,
        fileId: responseData.fileId,
      };
      
      const currentDocs = Array.isArray((data as any).documents) ? (data as any).documents : [];
      updateData({ documents: [...currentDocs, newDoc] } as any);
    } catch (err: any) {
      alert("Upload failed: " + err.message + "\n\nMake sure your .env has Google Drive credentials configured.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <h2 className="text-xl mb-4 text-white font-bold">Health Records & Documents</h2>
      
      <h3 className="text-lg mt-2 mb-2 text-primary-color">Health Records</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {textInput('dateMostRecentLabs', 'Date of Most Recent Labs', 'date', data, updateData)}
      </div>

      <h3 className="text-lg mt-6 mb-4 text-primary-color border-t border-slate-700 pt-4">Documents (Upload / Camera)</h3>
      <div className="form-group bg-slate-800/50 p-6 rounded-xl border border-dashed border-teal-500/30">
        <div className="flex flex-col items-center justify-center gap-4">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload}
            className="hidden" 
            accept="image/*,application/pdf"
            capture="environment"
          />
          <button 
            type="button" 
            onClick={() => fileInputRef.current?.click()}
            className="btn btn-secondary w-full max-w-xs flex gap-2 items-center justify-center"
            disabled={uploading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
            {uploading ? 'Uploading...' : 'Upload Image or PDF'}
          </button>
          
          {(data as any).documents && (data as any).documents.length > 0 && (
            <div className="w-full mt-4 text-left">
              <p className="text-sm font-semibold text-gray-400 mb-2">Attached Documents:</p>
              <ul className="space-y-2">
                {(data as any).documents.map((doc: any, i: number) => (
                  <li key={i} className="flex justify-between items-center bg-slate-800 px-3 py-2 rounded-lg text-sm text-gray-200">
                    <span className="truncate max-w-[200px]">{doc.name}</span>
                    <button 
                      type="button"
                      className="text-red-400 hover:text-red-300"
                      onClick={() => {
                        const newDocs = [...(data as any).documents];
                        newDocs.splice(i, 1);
                        updateData({ documents: newDocs } as any);
                      }}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
