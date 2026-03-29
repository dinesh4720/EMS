import { Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Events from './pages/Events'
import Users from './pages/Users'
import LiveView from './pages/LiveView'
import PageUsage from './pages/PageUsage'
import Sessions from './pages/Sessions'
import Projects from './pages/Projects'
import AccessLogs from './pages/AccessLogs'
import Errors from './pages/Errors'

function App() {
  return (
    <div className="flex min-h-screen bg-[#1a1a1e]">
      <Sidebar />
      <main className="flex-1 overflow-auto min-h-screen bg-[#1e1e22] rounded-tl-xl">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/events" element={<Events />} />
          <Route path="/errors" element={<Errors />} />
          <Route path="/users" element={<Users />} />
          <Route path="/live" element={<LiveView />} />
          <Route path="/page-usage" element={<PageUsage />} />
          <Route path="/sessions" element={<Sessions />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/access-logs" element={<AccessLogs />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
