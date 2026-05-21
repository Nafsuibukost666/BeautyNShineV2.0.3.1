import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '40px 20px',
          textAlign: 'center',
          color: '#6B4A4A',
          fontFamily: 'system-ui, sans-serif',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>⚠️</div>
          <h2 style={{ margin: '0 0 8px', fontSize: '18px', color: '#3D2B2B' }}>
            Ada yang error nih
          </h2>
          <p style={{ margin: '0 0 4px', fontSize: '14px', color: '#8A7A7A' }}>
            {this.state.error?.message || 'Terjadi kesalahan yang tidak terduga'}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '16px',
              padding: '10px 24px',
              background: '#D48989',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            🔄 Refresh Halaman
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
