import React from 'react';
import { useTranslation } from 'react-i18next';
import { isChunkError } from '../../utils/lazyWithRetry';
import logger from '../../utils/logger';
import { Sentry } from '../../lib/sentry';

function ChunkErrorFallback({ onReload }) {
  const { t } = useTranslation();
  return (
    <div role="alert" className="flex flex-col items-center justify-center min-h-[200px] p-8 text-center">
      <div className="text-4xl mb-4" aria-hidden="true">📡</div>
      <h2 className="text-lg font-semibold text-fg mb-2">
        {t('common.pageFailedToLoad', 'Page failed to load')}
      </h2>
      <p className="text-sm text-fg-muted mb-4">
        {t('common.chunkErrorDesc', 'A new version may be available, or your connection was interrupted. Please reload to try again.')}
      </p>
      <button
        onClick={onReload}
        className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm hover:bg-teal-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
      >
        {t('common.reloadPage', 'Reload page')}
      </button>
    </div>
  );
}

function GenericErrorFallback({ message, onReset }) {
  const { t } = useTranslation();
  return (
    <div role="alert" className="flex flex-col items-center justify-center min-h-[200px] p-8 text-center">
      <div className="text-4xl mb-4" aria-hidden="true">⚠️</div>
      <h2 className="text-lg font-semibold text-fg mb-2">
        {t('common.somethingWentWrong', 'Something went wrong')}
      </h2>
      <p className="text-sm text-fg-muted mb-4">
        {message || t('common.sectionError', 'This section encountered an error. The rest of the app is still working.')}
      </p>
      <button
        onClick={onReset}
        className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm hover:bg-teal-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
      >
        {t('common.tryAgain', 'Try again')}
      </button>
    </div>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Normalize non-Error objects so they don't log as "[object Object]"
    const displayError =
      error instanceof Error
        ? error
        : new Error(typeof error === 'string' ? error : JSON.stringify(error) || 'Unknown error');
    logger.error('[ErrorBoundary] Caught error:', displayError.message, info.componentStack);

    if (Sentry?.captureException) {
      Sentry.captureException(displayError, {
        tags: { mechanism: 'errorboundary' },
        contexts: { react: { componentStack: info.componentStack } },
      });
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      if (isChunkError(this.state.error)) {
        return <ChunkErrorFallback onReload={this.handleReload} />;
      }

      return (
        <GenericErrorFallback
          message={this.props.message}
          onReset={this.handleReset}
        />
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
