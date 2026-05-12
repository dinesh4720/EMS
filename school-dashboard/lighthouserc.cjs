/**
 * Lighthouse CI configuration — REVAMP-111.
 *
 * Runs `lhci autorun` against a `vite preview` build of the dashboard and
 * fails the run if any of the four core categories drop below 0.90 on the
 * listed routes. Only public routes are listed (login + signup + privacy
 * + reset-password + the publicly reachable form-submission shell) because
 * all authenticated routes redirect to /login when there is no session, so
 * Lighthouse would otherwise score the redirect target.
 *
 * Usage: `npm run lighthouse:ci` (boots preview server, audits, tears down).
 */
module.exports = {
  ci: {
    collect: {
      startServerCommand: "npm run preview -- --port=4173",
      startServerReadyPattern: "Local:",
      url: [
        "http://localhost:4173/login",
        "http://localhost:4173/signup",
        "http://localhost:4173/privacy",
        "http://localhost:4173/reset-password",
        "http://localhost:4173/form/preview",
      ],
      numberOfRuns: 1,
      settings: {
        preset: "desktop",
        chromeFlags: "--no-sandbox --headless=new",
      },
    },
    assert: {
      assertions: {
        "categories:performance": ["error", { minScore: 0.9 }],
        "categories:accessibility": ["error", { minScore: 0.9 }],
        "categories:best-practices": ["error", { minScore: 0.9 }],
        "categories:seo": ["error", { minScore: 0.9 }],
      },
    },
    upload: {
      target: "filesystem",
      outputDir: "./lighthouse-reports",
    },
  },
};
