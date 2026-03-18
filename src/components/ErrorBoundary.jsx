import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[ErrorBoundary]', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <h3 className="text-lg font-semibold text-white mb-2">
            Something went wrong
          </h3>
          <p className="text-gray-400 text-sm mb-4">
            This section failed to load. Please try refreshing the page.
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 bg-accent text-white rounded-lg text-sm hover:bg-accent/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
