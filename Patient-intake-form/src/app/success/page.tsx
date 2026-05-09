import Link from 'next/link';

export default function SuccessPage() {
  return (
    <div className="page-root" style={{ justifyContent: 'center' }}>
      <header className="page-header" style={{ position: 'absolute', width: '100%' }}>
        <div className="header-brand">MyGastro<span>.Ai</span></div>
        <div className="header-tag">Patient Intake</div>
      </header>

      <main className="page-main" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 100 }}>
        <div className="step-card" style={{ maxWidth: 500, width: '100%', textAlign: 'center' }}>
          <div className="step-body" style={{ padding: '48px 32px' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%', background: 'rgba(34,197,94,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px', color: '#22c55e', fontSize: 32
            }}>
              ✓
            </div>
            
            <h1 className="step-title" style={{ fontSize: 24, marginBottom: 12 }}>Submission Successful</h1>
            <p className="step-subtitle" style={{ fontSize: 15, lineHeight: 1.6, marginBottom: 32 }}>
              Your intake form has been securely submitted to the clinical team. Thank you for providing this detailed information to help us prepare for your care.
            </p>

            <Link href="/" className="btn-back" style={{ display: 'inline-flex' }}>
              Return to home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
