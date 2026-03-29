import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.css'
import { socketService } from './services/socket'

// Connect socket on app start
socketService.connect()

// Use HashRouter for Electron (file:// protocol), BrowserRouter for web
const isElectron = !!(window as any).owlinElectron
const Router = isElectron ? HashRouter : BrowserRouter

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router>
      <App />
    </Router>
  </StrictMode>,
)
