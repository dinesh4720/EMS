/**
 * Providers.jsx
 *
 * Single root-level provider tree for the app.
 * Consolidates all infrastructure providers (Helmet, React Query,
 * HeroUI, themes, router) into one component.
 *
 * Usage in main.jsx:
 *   <Providers><App /></Providers>
 */
import { HelmetProvider } from 'react-helmet-async';
import { QueryClientProvider } from '@tanstack/react-query';
import { HeroUIProvider } from '@heroui/react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { BrowserRouter } from 'react-router-dom';
import toast, { Toaster, useToasterStore } from 'react-hot-toast';
import { useEffect } from 'react';
import { queryClient } from './lib/queryClient';

const TOAST_LIMIT = 3;

function ToastLimiter() {
  const { toasts } = useToasterStore();
  useEffect(() => {
    toasts
      .filter(t => t.visible)
      .slice(TOAST_LIMIT)
      .forEach(t => toast.dismiss(t.id));
  }, [toasts]);
  return null;
}

export default function Providers({ children }) {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <HeroUIProvider>
          {/* Dark mode (Phase 4d, shipped): next-themes is the single source of
           * truth — it toggles `.dark` on <html>, which flips every design token
           * in tokens.css. `defaultTheme="system"` respects the OS preference on
           * first load; the topbar Sun/Moon toggle still wins and persists.
           * `disableTransitionOnChange` avoids a token-transition flash on switch. */}
          <NextThemesProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <BrowserRouter>
              {children}
              <ToastLimiter />
              <Toaster
                position="top-center"
                containerStyle={{ zIndex: 999999 }}
                containerAriaLabel="Notifications"
                toastOptions={{
                  /* REVAMP-05: frosted-glass toasts. Per-variant border lives
                   * in .ds-toast--{success|error|info|warning} (feedback-primitives.css).
                   * react-hot-toast renders toasts with role="status" (info/loading)
                   * and role="alert" (error) — both announce via the ARIA live region. */
                  duration: 3000,
                  className: 'ds-toast',
                  ariaProps: { role: 'status', 'aria-live': 'polite' },
                  success: {
                    duration: 3000,
                    className: 'ds-toast ds-toast--success',
                    iconTheme: { primary: 'var(--ok)', secondary: 'var(--bg)' },
                  },
                  error: {
                    duration: 4500,
                    className: 'ds-toast ds-toast--error',
                    ariaProps: { role: 'alert', 'aria-live': 'assertive' },
                    iconTheme: { primary: 'var(--danger)', secondary: 'var(--bg)' },
                  },
                  loading: { className: 'ds-toast ds-toast--info' },
                }}
              />
            </BrowserRouter>
          </NextThemesProvider>
        </HeroUIProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}
