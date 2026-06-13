/**
 * @vitest-environment jsdom
 *
 * Unit test for the application error boundary (DK-850).
 *
 * The dashboard audit (DASHBOARD #4) flagged that a single uncaught render
 * error blanked the entire app to a white screen. ErrorBoundary is the fix: it
 * catches render errors in its subtree and shows a recoverable fallback while
 * the rest of the app keeps running. These tests prove the boundary actually
 * catches a thrown error (not merely that it renders children), that the retry
 * button resets it, and that chunk-load failures get the reload-specific UI.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

// Translations resolve to the inline English default each t() call passes as
// its second arg, so assertions can match the fallback copy directly.
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (_key, fallback) => fallback }),
}));

// Silence the boundary's own error log and let us assert it fired.
vi.mock("../../utils/logger", () => ({
  default: { error: vi.fn() },
}));

import ErrorBoundary from "./ErrorBoundary";
import logger from "../../utils/logger";

function Boom({ message = "kaboom" }) {
  throw new Error(message);
}

describe("ErrorBoundary", () => {
  let consoleErrorSpy;

  beforeEach(() => {
    // React logs caught render errors to console.error; keep test output clean.
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    consoleErrorSpy.mockRestore();
    vi.clearAllMocks();
  });

  it("renders children when no error is thrown", () => {
    render(
      <ErrorBoundary>
        <div>healthy child</div>
      </ErrorBoundary>
    );
    expect(screen.getByText("healthy child")).toBeTruthy();
    expect(screen.queryByTestId("error-boundary")).toBeNull();
  });

  it("catches a render error and shows the fallback instead of crashing", () => {
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    );
    expect(screen.getByTestId("error-boundary")).toBeTruthy();
    expect(screen.getByText("Something went wrong")).toBeTruthy();
    expect(logger.error).toHaveBeenCalled();
  });

  it("renders the section-specific message when one is provided", () => {
    render(
      <ErrorBoundary message="The top bar encountered an error.">
        <Boom />
      </ErrorBoundary>
    );
    expect(screen.getByText("The top bar encountered an error.")).toBeTruthy();
  });

  it("recovers when the retry button is clicked", () => {
    // Flip whether the child throws so the post-reset re-render succeeds.
    let shouldThrow = true;
    function MaybeBoom() {
      if (shouldThrow) throw new Error("first render fails");
      return <div>recovered child</div>;
    }

    render(
      <ErrorBoundary>
        <MaybeBoom />
      </ErrorBoundary>
    );
    expect(screen.getByTestId("error-boundary")).toBeTruthy();

    shouldThrow = false;
    fireEvent.click(screen.getByText("Try again"));

    expect(screen.getByText("recovered child")).toBeTruthy();
    expect(screen.queryByTestId("error-boundary")).toBeNull();
  });

  it("shows the reload-specific fallback for chunk-load errors", () => {
    function ChunkBoom() {
      throw new Error(
        "Failed to fetch dynamically imported module: /assets/page-abc123.js"
      );
    }
    render(
      <ErrorBoundary>
        <ChunkBoom />
      </ErrorBoundary>
    );
    expect(screen.getByText("Page failed to load")).toBeTruthy();
    expect(screen.getByText("Reload page")).toBeTruthy();
  });
});
