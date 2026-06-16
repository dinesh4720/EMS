import './config/environment'
import './utils/bootstrapLogging'
import { initGlobalErrorHandlers } from './lib/globalErrorHandlers'
initGlobalErrorHandlers()
import './i18n'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { lazy, Suspense } from 'react'
import App from './App'
import Providers from './Providers'
import { queryClient } from './lib/queryClient'
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import './index.css'
import { CONFIG_ERROR } from './config/api'
import { bg, fg, shadow } from './theme/printPalette'

// Guard: if API config is invalid (placeholder or missing), render a friendly
// error page via plain DOM before React mounts. Throwing at module eval time
// causes a blank white screen — this approach avoids that entirely.
if (CONFIG_ERROR) {
  // DS-15: Hex colors come from the shared print palette so the
  // pre-React error page renders with the same neutrals every other
  // printable surface in the app uses.
  document.getElementById('root').innerHTML = `
    <div style="
      display:flex;align-items:center;justify-content:center;
      min-height:100vh;background:${bg.base};font-family:system-ui,sans-serif;
    ">
      <div style="
        max-width:480px;padding:2rem 2.5rem;background:${bg.paper};border-radius:12px;
        box-shadow:0 4px 24px ${shadow.soft};text-align:center;
      ">
        <div style="font-size:2.5rem;margin-bottom:1rem;">⚙️</div>
        <h1 style="margin:0 0 .75rem;font-size:1.25rem;color:${fg.body};">
          Configuration Required
        </h1>
        <p style="margin:0 0 1.5rem;font-size:.9375rem;color:${fg.secondary};line-height:1.6;">
          ${CONFIG_ERROR}
        </p>
        <p style="margin:0;font-size:.8125rem;color:${fg.disabled};">
          Set the correct environment variable in your hosting dashboard or CI/CD
          pipeline and redeploy.
        </p>
      </div>
    </div>
  `;
} else {
  // Lazy load devtools — excluded from production bundle entirely
  const ReactQueryDevtools = import.meta.env.DEV
    ? lazy(() =>
        import('@tanstack/react-query-devtools').then((m) => ({
          default: m.ReactQueryDevtools,
        }))
      )
    : () => null;

  // Register minimal service worker for offline shell caching
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Silent fail — offline shell caching is optional
    });
  }

  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <Providers>
        <App />
        <Suspense fallback={null}>
          <ReactQueryDevtools initialIsOpen={false} />
        </Suspense>
      </Providers>
    </React.StrictMode>,
  )
}

