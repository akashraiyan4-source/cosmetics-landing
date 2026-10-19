'use client';

import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Isolates a render crash so the rest of the landing page stays usable.
 * The fallback is visually quiet on purpose: it must not compete with the approved design.
 */
export default class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    if (process.env.NODE_ENV !== 'production') console.error('[cosmetics] render error', error.message);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '48px 24px', textAlign: 'center', fontFamily: 'Montserrat, sans-serif', color: '#141316', backgroundColor: '#FAF8F5', minHeight: '100vh' }}>
          <p style={{ fontSize: '0.95rem', marginBottom: 12 }}>Something interrupted this view. Please refresh to continue.</p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false })}
            style={{
              background: 'linear-gradient(90deg, #E0BDC2 0%, #E33F6C 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '12px 22px',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
