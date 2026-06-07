'use client';

export default function LoadingScreen() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{
        position: 'relative',
        width: '100px',
        height: '100px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          border: '4px solid rgba(139, 92, 246, 0.1)',
          borderTopColor: 'var(--accent-violet)',
          borderRadius: '50%',
          animation: 'spin 1.2s linear infinite'
        }} />
        <span style={{ fontSize: '36px', animation: 'pulse 1.8s ease-in-out infinite' }}>🧞</span>
      </div>
      <h2 style={{
        marginTop: '24px',
        fontSize: '18px',
        fontWeight: '600',
        color: 'var(--text-secondary)',
        letterSpacing: '0.04em'
      }}>
        Summoning Kapruka Genie...
      </h2>
    </div>
  );
}
