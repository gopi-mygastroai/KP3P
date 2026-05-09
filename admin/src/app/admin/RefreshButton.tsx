'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function RefreshButton() {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => {
      setIsRefreshing(false);
    }, 500);
  };

  return (
    <button
      onClick={handleRefresh}
      disabled={isRefreshing}
      style={{
        background: '#0f766e',
        color: 'white',
        padding: '10px 20px',
        borderRadius: '8px',
        border: 'none',
        fontSize: '14px',
        fontWeight: 500,
        cursor: isRefreshing ? 'not-allowed' : 'pointer',
        opacity: isRefreshing ? 0.7 : 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        minHeight: 44,
        boxSizing: 'border-box',
      }}
    >
      <svg
        style={{
          width: '16px',
          height: '16px',
          animation: isRefreshing ? 'spin 0.6s linear infinite' : 'none',
          flexShrink: 0,
        }}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      {isRefreshing ? 'Refreshing...' : 'Refresh'}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </button>
  );
}
