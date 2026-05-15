import React from "react";
import { useTranslation } from "react-i18next";
import { isChunkError } from "../utils/lazyWithRetry";
import logger from "../utils/logger";

function SettingsErrorFallback({ error, onRetry }) {
  const { t } = useTranslation();
  const isChunk = isChunkError(error);

  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center min-h-[300px] p-8 text-center bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-lg"
    >
      <div className="text-4xl mb-4" aria-hidden="true">
        {isChunk ? "📡" : "⚠️"}
      </div>
      <h2 className="text-lg font-semibold text-gray-800 dark:text-zinc-200 mb-2">
        {isChunk
          ? t("common.pageFailedToLoad", "Page failed to load")
          : t("common.somethingWentWrong", "Something went wrong")}
      </h2>
      <p className="text-sm text-gray-500 dark:text-zinc-400 mb-4 max-w-sm">
        {isChunk
          ? t(
              "common.chunkErrorDesc",
              "A new version may be available, or your connection was interrupted. Please reload to try again."
            )
          : t(
              "settings.somethingWentWrongLoading",
              "Something went wrong loading this settings page."
            )}
      </p>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-gray-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg text-sm font-medium hover:bg-gray-800 dark:hover:bg-zinc-200 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 dark:focus-visible:ring-zinc-100 focus-visible:ring-offset-2"
      >
        {isChunk
          ? t("common.reloadPage", "Reload page")
          : t("common.tryAgain", "Try again")}
      </button>
    </div>
  );
}

class SettingsErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    const displayError =
      error instanceof Error
        ? error
        : new Error(
            typeof error === "string"
              ? error
              : JSON.stringify(error) || "Unknown error"
          );
    logger.error(
      "[SettingsErrorBoundary] Caught error:",
      displayError.message,
      info.componentStack
    );
  }

  handleRetry = () => {
    if (isChunkError(this.state.error)) {
      window.location.reload();
      return;
    }
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <SettingsErrorFallback
          error={this.state.error}
          onRetry={this.handleRetry}
        />
      );
    }
    return this.props.children;
  }
}

export default SettingsErrorBoundary;
