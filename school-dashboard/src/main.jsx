import React from 'react'
import ReactDOM from 'react-dom/client'
import { HeroUIProvider } from '@heroui/react'
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HeroUIProvider>
      <NextThemesProvider attribute="class" defaultTheme="system">
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </NextThemesProvider>
    </HeroUIProvider>
  </React.StrictMode>,
)
