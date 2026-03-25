import './utils/bootstrapLogging'
import { initGlobalErrorHandlers } from './lib/globalErrorHandlers'
initGlobalErrorHandlers()
import './i18n'
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

// Lazy load devtools — excluded from production bundle entirely
const ReactQueryDevtools = import.meta.env.DEV
  ? lazy(() =>
      import('@tanstack/react-query-devtools').then((m) => ({
        default: m.ReactQueryDevtools,
      }))
    )
  : () => null;

ReactDOM.createRoot(document.getElementById('root')).render(
  <Providers>
    <App />
    <Suspense fallback={null}>
      <ReactQueryDevtools initialIsOpen={false} />
    </Suspense>
  </Providers>,
)

