import { NavLink } from 'react-router-dom'

const analyticsItems = [
  { path: '/', label: 'Dashboard', icon: '📊' },
  { path: '/events', label: 'Events', icon: '📋' },
  { path: '/errors', label: 'Errors', icon: '🔴' },
  { path: '/sessions', label: 'Sessions', icon: '🔗' },
  { path: '/users', label: 'Users', icon: '👥' },
  { path: '/page-usage', label: 'Page Usage', icon: '📈' },
  { path: '/live', label: 'Live View', icon: '⚡' },
]

const adminItems = [
  { path: '/projects', label: 'Projects', icon: '🔑' },
  { path: '/access-logs', label: 'Access Logs', icon: '📜' },
]

function NavSection({ title, items }: { title?: string; items: typeof analyticsItems }) {
  return (
    <>
      {title && (
        <li className="px-3 pt-5 pb-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-white/30">
            {title}
          </span>
        </li>
      )}
      {items.map((item) => (
        <li key={item.path}>
          <NavLink
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-[7px] rounded-lg text-[13px] transition-all duration-150 ${
                isActive
                  ? 'bg-white/15 text-white font-medium shadow-[inset_0_0.5px_0_rgba(255,255,255,0.1)]'
                  : 'text-white/60 hover:bg-white/8 hover:text-white/90'
              }`
            }
          >
            <span className="text-base w-5 text-center">{item.icon}</span>
            {item.label}
          </NavLink>
        </li>
      ))}
    </>
  )
}

export default function Sidebar() {
  return (
    <aside
      className="sidebar-glass w-60 min-h-screen flex flex-col select-none"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {/* Drag region spacer for traffic lights */}
      <div className="h-[52px] flex-shrink-0" />

      {/* Logo */}
      <div className="px-4 pb-3">
        <h1 className="text-[15px] font-semibold text-white/90 flex items-center gap-2">
          <span className="text-xl">🦉</span>
          Owlin
        </h1>
        <p className="text-[10px] text-white/30 mt-0.5 ml-[30px]">Analytics Platform</p>
      </div>

      {/* Navigation */}
      <nav
        className="flex-1 px-2 overflow-y-auto"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <ul className="space-y-0.5">
          <NavSection items={analyticsItems} />
          <NavSection title="Admin" items={adminItems} />
        </ul>
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-white/5">
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-white/20">v2.0.0</p>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/80 animate-pulse" />
            <span className="text-[10px] text-white/30">Connected</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
