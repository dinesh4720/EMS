import './utils/bootstrapLogging'
import ReactDOM from 'react-dom/client'
import { HeroUIProvider } from '@heroui/react'
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import { installApiFetchDefaults } from './utils/apiFetch'
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import './index.css'

installApiFetchDefaults()

ReactDOM.createRoot(document.getElementById('root')).render(
  <HeroUIProvider>
    <NextThemesProvider attribute="class" defaultTheme="light">
      <BrowserRouter>
        <App />
        <Toaster 
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#363636',
              color: '#fff',
              zIndex: 999999,
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
          containerStyle={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 999999,
          }}
        />
      </BrowserRouter>
    </NextThemesProvider>
  </HeroUIProvider>,
)

