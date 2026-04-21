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
          <NextThemesProvider attribute="class" defaultTheme="light">
            <BrowserRouter>
              {children}
              <ToastLimiter />
              <Toaster
                position="top-center"
                toastOptions={{
                  duration: 3000,
                  style: { background: '#363636', color: '#fff', zIndex: 999999 },
                  success: { duration: 3000, iconTheme: { primary: '#10b981', secondary: '#fff' } },
                  error: { duration: 4000, iconTheme: { primary: '#ef4444', secondary: '#fff' } },
                }}
                containerStyle={{ zIndex: 999999 }}
              />
            </BrowserRouter>
          </NextThemesProvider>
        </HeroUIProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}
