import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('IndigoMart ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="grid min-h-dvh place-items-center bg-canvas px-6">
          <div className="max-w-md text-center">
            <div className="flex justify-center">
              <span className="font-display text-2xl tracking-tight text-indigo">
                Indigo<span className="text-accent">Mart</span>
              </span>
            </div>
            <h1 className="mt-8 font-display text-4xl text-indigo">Something went wrong.</h1>
            <p className="mt-4 text-sm leading-6 text-muted">
              An unexpected error occurred while rendering this page. Refresh to try again.
            </p>
            <button
              type="button"
              className="button-primary mt-8"
              onClick={() => window.location.reload()}
            >
              Refresh page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;