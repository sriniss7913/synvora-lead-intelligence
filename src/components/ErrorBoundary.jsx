import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Synvora caught render error:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center',
          justifyContent: 'center', flexDirection: 'column', gap: 20,
          padding: 40, textAlign: 'center',
          background: 'var(--bg-base, #0f172a)'
        }}>
          <div style={{ fontSize: '3rem' }}>⚠️</div>
          <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#f87171' }}>
            Something went wrong displaying this page
          </div>
          <div style={{
            fontSize: '0.82rem', color: '#94a3b8', maxWidth: 480,
            background: 'rgba(255,255,255,0.04)', padding: '12px 16px',
            borderRadius: 8, fontFamily: 'monospace', textAlign: 'left'
          }}>
            {this.state.error?.message || 'Unknown error'}
          </div>
          <button
            onClick={() => { this.setState({ error: null }); window.location.reload(); }}
            style={{
              padding: '10px 24px', borderRadius: 8, border: 'none',
              background: '#06b6d4', color: '#0f172a', fontWeight: 700,
              cursor: 'pointer', fontSize: '0.9rem'
            }}
          >
            🔄 Reload App
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
