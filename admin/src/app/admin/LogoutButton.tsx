'use client';

export default function LogoutButton() {
  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
  };

  return (
    <>
      <style>{`
        .logout-btn {
          font-family: 'Inter', -apple-system, sans-serif;
          font-size: 13px;
          font-weight: 600;
          color: #475569;
          background: #ffffff;
          border: 1px solid #cbd5e1;
          padding: 8px 16px;
          min-height: 44px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .logout-btn:hover {
          color: #b91c1c;
          border-color: #fecaca;
          background: #fff1f2;
        }
      `}</style>
      <button className="logout-btn" onClick={handleLogout}>
        Log out
      </button>
    </>
  );
}