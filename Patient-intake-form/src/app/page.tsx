'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  isValidContactPhone,
  isValidEmail,
  normalizeContactPhoneInput,
} from '@/lib/formSchema';
import { INTAKE_SUBMITTED_KEY, PATIENT_ENTRY_KEY, type PatientEntry } from '@/lib/intakeSession';

export default function Home() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [error, setError] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setAlreadySubmitted(sessionStorage.getItem(INTAKE_SUBMITTED_KEY) === '1');
  }, []);

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== 'undefined' && sessionStorage.getItem(INTAKE_SUBMITTED_KEY) === '1') {
      setError('You have already submitted your intake for this session. Close the browser or open a private window if you need to submit again.');
      return;
    }

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = contactPhone.trim();

    if (!trimmedName || !trimmedEmail || !trimmedPhone) {
      setError('Full name, email, and phone number are required.');
      return;
    }
    if (!isValidEmail(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!isValidContactPhone(trimmedPhone)) {
      setError('Phone number must be exactly 10 digits and start with 6, 7, 8, or 9.');
      return;
    }

    setError('');
    setIsChecking(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://admin-xi-three-76.vercel.app';
      const res = await fetch(`${apiUrl}/api/patients/check-duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail, contactPhone: trimmedPhone }),
      });

      let resData: { error?: string } = {};
      try {
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
          resData = await res.json();
        }
      } catch {
        // ignore parse failures
      }

      if (!res.ok) {
        setError(resData.error || `Unable to start intake (error ${res.status}). Please try again.`);
        return;
      }

      const entry: PatientEntry = {
        name: trimmedName,
        email: trimmedEmail,
        contactPhone: trimmedPhone,
      };
      sessionStorage.setItem(PATIENT_ENTRY_KEY, JSON.stringify(entry));
      router.push('/form');
    } catch {
      setError('Network error occurred. Please check your connection and try again.');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <>
      <style>{`
        .landing-card-head { text-align: center; padding: 8px 24px 6px; }
        .landing-card-head .step-title { margin: 0; font-size: 18px; }
        .home-landing .step-body.landing-card-body { padding: 16px 28px 28px; }
        @media (max-width: 480px) {
          .landing-card-head { padding: 6px 20px 4px; }
          .home-landing .step-body.landing-card-body { padding: 16px 20px 24px; }
        }
        /* Light shell so the logo’s white background blends with the header */
        .home-landing.page-root {
          background: linear-gradient(180deg, #ffffff 0%, #f4f8fa 32%, #eef3f6 100%);
        }
        .home-landing .page-header {
          background: #ffffff;
          border-bottom: 1px solid #e2e8f0;
          box-shadow: 0 1px 0 rgba(15, 23, 42, 0.04);
        }
        .home-landing .header-tag {
          color: #0e7490;
          background: rgba(8, 145, 178, 0.1);
          border: 1px solid rgba(8, 145, 178, 0.22);
        }
      `}</style>
      <div className="page-root home-landing" style={{ justifyContent: 'center' }}>
      <header className="page-header" style={{ position: 'absolute', width: '100%', top: 0 }}>
        <div className="header-brand" style={{ display: 'flex', alignItems: 'center' }}>
          <img
            src="/mygastro-logo.png"
            alt="myGastro.AI"
            style={{ height: 28, width: 'auto', display: 'block' }}
          />
        </div>
        <div className="header-tag">Patient Portal</div>
      </header>

      <main className="page-main" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 80 }}>
        <div className="step-card" style={{ maxWidth: 440, width: '100%' }}>
          <div className="step-card-head landing-card-head">
            <h1 className="step-title">Welcome!</h1>
          </div>

          <div className="step-body landing-card-body">
            {alreadySubmitted && (
              <div className="ferr" style={{ marginBottom: 16, padding: '10px 12px', background: 'var(--error-bg)', borderRadius: 'var(--radius-sm)' }}>
                You have already submitted your intake for this browser session. To use the intake form again, close all tabs for this site or use a private/incognito window.
              </div>
            )}
            {error && (
              <div className="ferr" style={{ marginBottom: 16, padding: '10px 12px', background: 'var(--error-bg)', borderRadius: 'var(--radius-sm)' }}>
                {error}
              </div>
            )}
            
            <form onSubmit={handleStart} className="fg" style={{ gap: 16 }}>
              <div className="fg">
                <label htmlFor="name">Full Name<span className="req">*</span></label>
                <input
                  id="name"
                  type="text"
                  className="fi"
                  placeholder="e.g. Jane Doe"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  autoComplete="name"
                />
              </div>

              <div className="fg">
                <label htmlFor="email">Email Address<span className="req">*</span></label>
                <input
                  id="email"
                  type="email"
                  className="fi"
                  placeholder="patient@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="fg">
                <label htmlFor="contactPhone">Phone Number<span className="req">*</span></label>
                <input
                  id="contactPhone"
                  type="tel"
                  className="fi"
                  placeholder="e.g. 9876543210"
                  value={contactPhone}
                  onChange={e => setContactPhone(normalizeContactPhoneInput(e.target.value))}
                  maxLength={10}
                  inputMode="numeric"
                  pattern="[6-9][0-9]{9}"
                  required
                  autoComplete="tel"
                />
              </div>

              <button
                type="submit"
                className="btn-submit"
                style={{ width: '100%', justifyContent: 'center', marginTop: 8, padding: '12px 24px' }}
                disabled={alreadySubmitted || isChecking}
              >
                {isChecking ? 'Checking…' : 'Begin Intake Form'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
    </>
  );
}
