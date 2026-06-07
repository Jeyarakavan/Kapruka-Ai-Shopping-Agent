'use client';

import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '24px',
          background: 'var(--bg-primary)',
          color: 'var(--text-primary)',
          textAlign: 'center',
          fontFamily: 'Inter, sans-serif'
        }}>
          <span style={{ fontSize: '64px', marginBottom: '24px' }}>🧞⚠️</span>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '32px', marginBottom: '16px', background: 'var(--gradient-accent)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Something went wrong
          </h1>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '480px', marginBottom: '32px', lineHeight: '1.6' }}>
            Kapruka Genie encountered an unexpected rendering error. Let's restart the conversation.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="btn btn-gold btn-lg"
          >
            🔄 Reload Assistant
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
