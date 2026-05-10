'use client';

import { saveAs } from 'file-saver';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import jsPDF from 'jspdf';
import { formatVaccineForDocExport } from '@/lib/formatVaccineExport';
import { carePlanPrimaryPatientLanguage } from '@/lib/preferredLanguagePrompt';
import type { PatientData } from '@/lib/kp3p-prompt';
import { CaresheetButton } from '@/components/CaresheetButton';
import type { PatientWithUser } from '@/types/assessment-form';
import { getErrorMessage } from '@/lib/get-error-message';

/** Full vaccine line(s) for Gemini prompt — includes dose dates when stored as structured JSON. */
function vaccineForKP3Prompt(raw: unknown): string {
  const s = formatVaccineForDocExport(raw);
  if (!s || s === '—') return 'Unknown';
  return s.replace(/\s*\n\s*/g, ' | ').trim();
}

function parseJsonStringArray(raw: unknown): string[] {
  if (raw == null || raw === '') return [];
  if (typeof raw !== 'string') return [];
  const t = raw.trim();
  if (!t) return [];
  try {
    const p = JSON.parse(t);
    if (Array.isArray(p)) return p.map((x) => String(x).trim()).filter(Boolean);
  } catch {
    return [t];
  }
  return [];
}

function toKP3PPatient(patient: PatientWithUser): PatientData {
  const labs = { hb: '', tlc: '', platelets: '', crp: '', albumin: '' };
  const comorbidities = parseJsonStringArray(patient.comorbidities);
  const specialConsiderationsRaw = patient.specialConsiderations?.trim()
    ? String(patient.specialConsiderations).trim()
    : undefined;
  const specialNotes = specialConsiderationsRaw ? [specialConsiderationsRaw] : undefined;
  const surg = parseJsonStringArray(patient.previousSurgeries);
  return {
    name: patient.name || '',
    id: String(patient.id ?? ''),
    age: Number(patient.currentAge) || 0,
    sex: patient.sex || '',
    occupation: patient.occupation || '',
    location: patient.placeOfLiving || '',
    smoking: [patient.smokingStatus, patient.smokingDetails].filter(Boolean).join('; ') || '',
    diagnosis: patient.primaryDiagnosis || '',
    montreal: patient.montrealClass || '',
    severity: patient.currentDiseaseActivity || '',
    duration: patient.diseaseDuration || '',
    ageAtDx: patient.ageAtDiagnosis == null ? 0 : Number(patient.ageAtDiagnosis),
    ageAtDiagnosis:
      patient.ageAtDiagnosis == null || String(patient.ageAtDiagnosis).trim() === ''
        ? undefined
        : Number(patient.ageAtDiagnosis),
    priorSurgeries: surg.length ? surg.join(', ') : undefined,
    bowelFreq: patient.stoolFrequency || '',
    bloodInStool: patient.bloodInStool || '',
    abdPain: patient.abdominalPain || '',
    weightLoss: patient.weightLoss || '',
    ...labs,
    mayoScore: '',
    endoscopyFindings: '',
    imagingFindings: '',
    dexa: '',
    currentMeds: patient.currentIbdMedications || '',
    treatmentResponse: patient.responseToTreatment || '',
    tdm: patient.tdmResults || '',
    priorFailed: patient.failedTreatments || '',
    tbStatus: patient.tbScreening || '',
    hbsAg: patient.hepBSurfaceAg || '',
    antiHBs: patient.hepBSurfaceAb || '',
    antiHBc: patient.hepBCoreAb || '',
    antiHCV: patient.antiHcv || '',
    antiHIV: patient.antiHiv || '',
    comorbidities: comorbidities.length ? comorbidities : undefined,
    eim: patient.extraintestinalManif || undefined,
    specialNotes,
    specialConsiderations: specialConsiderationsRaw,
    patientLanguage: carePlanPrimaryPatientLanguage(patient.preferredLanguage),
    dateOfBirth: patient.dateOfBirth?.trim() || undefined,
    vaccineInfluenza: vaccineForKP3Prompt(patient.influenza),
    vaccineCovid: vaccineForKP3Prompt(patient.covid19),
    vaccinePneumococcal: vaccineForKP3Prompt(patient.pneumococcal),
    vaccineHepB: vaccineForKP3Prompt(patient.hepatitisB),
    vaccineHepA: vaccineForKP3Prompt(patient.hepatitisA),
    vaccineHepE: vaccineForKP3Prompt(patient.hepatitisE),
    vaccineZoster: vaccineForKP3Prompt(patient.zoster),
    vaccineTetanus: vaccineForKP3Prompt(patient.tetanusTdap),
    vaccineMmr: vaccineForKP3Prompt(patient.mmrVaricella),
    vaccines: {
      influenza: vaccineForKP3Prompt(patient.influenza),
      covid19: vaccineForKP3Prompt(patient.covid19),
      pneumococcal: vaccineForKP3Prompt(patient.pneumococcal),
      hepatitisA: vaccineForKP3Prompt(patient.hepatitisA),
      hepatitisB: vaccineForKP3Prompt(patient.hepatitisB),
      zoster: vaccineForKP3Prompt(patient.zoster),
      mmr: vaccineForKP3Prompt(patient.mmrVaricella),
      tdap: vaccineForKP3Prompt(patient.tetanusTdap),
    },
  };
}

export default function PatientActions({ patient }: { patient: PatientWithUser }) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const patientEmailForExport = (p: PatientWithUser): string => {
    const fromUser = p?.user?.email?.trim?.();
    if (fromUser) return fromUser;
    const fromPatient = typeof p?.email === 'string' ? p.email.trim() : '';
    return fromPatient || 'N/A';
  };

  const escapeHtmlForWord = (text: string) =>
    text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const parseArray = (str: unknown) => {
    try {
      if (typeof str !== 'string') return 'None';
      const arr = JSON.parse(str || '[]') as unknown;
      return Array.isArray(arr) && arr.length > 0 ? arr.join(', ') : 'None';
    } catch {
      return typeof str === 'string' && str ? str : 'None';
    }
  };

  const docContent = `Generate KP-3P protocol.
[PATIENT]
Name:${patient.name||''} ID:${patient.id||''} DOB:${patient.dateOfBirth||''} Age:${patient.currentAge||''}y Sex:${patient.sex||''}
Email:${patientEmailForExport(patient)} Phone:${patient.contactPhone||''} Location:${patient.placeOfLiving||''} Occupation:${patient.occupation||''} ReferredBy:${patient.referredBy||''}
SmokingStatus:${patient.smokingStatus||''} SmokingDetails:${patient.smokingDetails||''}
[DISEASE]
Diagnosis:${patient.primaryDiagnosis||''} Montreal:${patient.montrealClass||''} Duration:${patient.diseaseDuration||''} AgeAtDx:${patient.ageAtDiagnosis||''}y PriorSurgeries:${parseArray(patient.previousSurgeries)}
[ACTIVITY]
Level:${patient.currentDiseaseActivity||''} BowelFreq:${patient.stoolFrequency||''} BloodInStool:${patient.bloodInStool||''} AbdPain:${patient.abdominalPain||''} QoL:${patient.impactOnQoL||''} WeightLoss:${patient.weightLoss||''}
[LABS]
MostRecentLabsDate:${patient.dateMostRecentLabs||'None'}
[TREATMENT]
CurrentMeds:${patient.currentIbdMedications||'None'} Response:${patient.responseToTreatment||''} TDM:${patient.tdmResults||''} Steroids:${patient.steroidUse||''} Supplements:${patient.currentSupplements||''}
PriorTx:${parseArray(patient.previousTreatmentsTried)} FailedTx:${patient.failedTreatments||''}
[SCREENING]
TB:${patient.tbScreening||''} HBsAg:${patient.hepBSurfaceAg||''} AntiHBs:${patient.hepBSurfaceAb||''} AntiHBc:${patient.hepBCoreAb||''} AntiHCV:${patient.antiHcv||''} AntiHIV:${patient.antiHiv||''}
[VACCINES]
Influenza:${formatVaccineForDocExport(patient.influenza)} COVID19:${formatVaccineForDocExport(patient.covid19)} Pneumococcal:${formatVaccineForDocExport(patient.pneumococcal)} HepB:${formatVaccineForDocExport(patient.hepatitisB)} HepA:${formatVaccineForDocExport(patient.hepatitisA)} HepE:${formatVaccineForDocExport(patient.hepatitisE)} Zoster:${formatVaccineForDocExport(patient.zoster)} MMR/Varicella:${formatVaccineForDocExport(patient.mmrVaricella)} Tdap:${formatVaccineForDocExport(patient.tetanusTdap)}
[OTHER]
Comorbidities:${parseArray(patient.comorbidities)} EIM:${patient.extraintestinalManif||'None'} Pregnancy:${patient.pregnancyPlanning||''} SpecialNotes:${patient.specialConsiderations||''}
Format: 3-page concise care plan. Part1(Clinical Protocol):English. Part2(Patient Care Plan):${carePlanPrimaryPatientLanguage(patient.preferredLanguage)}`;

  const generatePdf = () => {
    const doc = new jsPDF();
    const margin = 14;
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 20;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(docContent, pageWidth - margin * 2);
    for (let i = 0; i < lines.length; i++) {
      if (y > pageHeight - 20) { doc.addPage(); y = 20; }
      const line = lines[i];
      if (line.includes('═════')) { doc.setTextColor(150, 150, 150); }
      else if (line === line.toUpperCase() && !line.includes(':') && line.length > 3) { doc.setFont('helvetica', 'bold'); doc.setTextColor(0, 0, 0); y += 2; }
      else if (line.includes(':')) {
        const [label] = line.split(':');
        if (label === label.toUpperCase()) { doc.setFont('helvetica', 'bold'); doc.setTextColor(0, 0, 0); }
        else { doc.setFont('helvetica', 'normal'); doc.setTextColor(0, 0, 0); }
      } else { doc.setFont('helvetica', 'normal'); doc.setTextColor(0, 0, 0); }
      doc.text(line, margin, y);
      y += 5;
    }
    doc.save(`KP-3P_Protocol_${patient.name?.replace(/\s+/g, '_') || 'Patient'}_${patient.id}.pdf`);
  };

  const generateDocx = () => {
    const htmlContent = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>Export DOC</title></head>
      <body style="font-family: Arial, sans-serif;">${escapeHtmlForWord(docContent).replace(/\n/g, '<br>')}</body></html>`;
    const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
    saveAs(blob, `KP-3P_Protocol_${patient.name?.replace(/\s+/g, '_') || 'Patient'}_${patient.id}.doc`);
  };

  const handleExportDrive = async () => {
    setUploading(true);
    try {
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text('Patient Structured Report', 14, 20);
      doc.setFontSize(12);
      doc.text(`Patient Name: ${patient.name || 'Unknown'}`, 14, 30);
      doc.text(`MRN: ${patient.mrn || 'N/A'}`, 14, 38);
      doc.text(`Date of Birth: ${patient.dateOfBirth || 'N/A'}`, 14, 46);
      doc.text(`Diagnosis: ${patient.primaryDiagnosis || 'N/A'}`, 14, 54);
      doc.text(`Disease Activity: ${patient.currentDiseaseActivity || 'N/A'}`, 14, 62);
      const pdfBlob = doc.output('blob');
      const file = new File([pdfBlob], `${patient.name?.replace(/\s+/g, '_') || 'Patient'}_${patient.id}.pdf`, { type: 'application/pdf' });
      const formData = new FormData();
      formData.append('file', file);
      formData.append('isExport', 'true');
      formData.append('patientName', String(patient.name || ''));
      formData.append('mrn', String(patient.mrn || ''));
      const res = await fetch('/api/drive/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to upload to Google Drive');
      if (data.webViewLink) { alert('Successfully exported to Google Drive!\nLink: ' + data.webViewLink); window.open(data.webViewLink, '_blank'); }
      else { alert('Export successful, but no link was returned.'); }
    } catch (err: unknown) {
      alert('Error exporting: ' + getErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <div
        style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
          flexWrap: 'wrap',
          justifyContent: 'flex-end',
          maxWidth: '100%',
        }}
      >

        {patient.assessmentComplete ? (
          <>
            <CaresheetButton patient={toKP3PPatient(patient)} label="📋 Download KP-3P Care Sheet" />

            <div style={{ position: 'relative' }} ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setShowDropdown(!showDropdown)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  fontSize: 12, padding: '6px 14px', borderRadius: 7,
                  border: '1px solid rgba(255,255,255,0.35)',
                  background: 'rgba(255,255,255,0.08)',
                  color: '#fff', cursor: 'pointer',
                  fontWeight: 500, fontFamily: 'Inter, sans-serif', transition: 'all 0.2s',
                }}
              >
                Export ▼
              </button>
              {showDropdown && (
                <div style={{
                  position: 'absolute', right: 0, top: '100%', marginTop: '6px',
                  background: '#ffffff', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                  overflow: 'hidden', zIndex: 50, minWidth: 160, display: 'flex', flexDirection: 'column'
                }}>
                  <button type="button" onClick={() => { setShowDropdown(false); generatePdf(); }} style={{ padding: '10px 16px', fontSize: 13, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', color: '#334155' }} onMouseOver={(e) => (e.currentTarget.style.background = '#f8fafc')} onMouseOut={(e) => (e.currentTarget.style.background = 'none')}>Export as PDF</button>
                  <button type="button" onClick={() => { setShowDropdown(false); generateDocx(); }} style={{ padding: '10px 16px', fontSize: 13, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', color: '#334155' }} onMouseOver={(e) => (e.currentTarget.style.background = '#f8fafc')} onMouseOut={(e) => (e.currentTarget.style.background = 'none')}>Export as DOCX</button>
                  <button type="button" onClick={() => { setShowDropdown(false); handleExportDrive(); }} disabled={uploading} style={{ padding: '10px 16px', fontSize: 13, textAlign: 'left', background: 'none', border: 'none', cursor: uploading ? 'not-allowed' : 'pointer', color: '#334155', opacity: uploading ? 0.6 : 1 }} onMouseOver={(e) => (e.currentTarget.style.background = '#f8fafc')} onMouseOut={(e) => (e.currentTarget.style.background = 'none')}>{uploading ? 'Exporting to Drive...' : 'Export PDF to Drive'}</button>
                </div>
              )}
            </div>
          </>
        ) : null}

        {/* ── EDIT DETAILS BUTTON ── */}
        <button
          onClick={() => router.push(`/admin/patient/${patient.id}/edit`)}
          style={{
            fontSize: 12, padding: '6px 14px', borderRadius: 7,
            border: 'none', background: '#fff', color: '#0f766e',
            cursor: 'pointer', fontWeight: 700,
            fontFamily: 'Inter, sans-serif', transition: 'all 0.2s',
          }}
        >
          Edit Details
        </button>
      </div>

    </>
  );
}