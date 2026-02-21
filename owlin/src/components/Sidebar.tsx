import { NavLink } from 'react-router-dom'

const navItems = [
  { path: '/', label: 'Dashboard', icon: '📊' },
  { path: '/events', label: 'Events', icon: '📋' },
  { path: '/sessions', label: 'Sessions', icon: '🔗' },
  { path: '/users', label: 'Users', icon: '👥' },
  { path: '/page-usage', label: 'Page Usage', icon: '📈' },
  { path: '/live', label: 'Live View', icon: '🔴' },
]

export default function Sidebar() {
  return (
    <aside className="w-64 min-h-screen bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <span className="text-2xl">🦉</span>
          Owlin
        </h1>
        <p className="text-xs text-gray-500 mt-1">Activity Tracker</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded text-sm transition-colors ${
                    isActive
                      ? 'bg-gray-100 text-gray-900 font-medium'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <p className="text-xs text-gray-400">v0.0.1</p>
      </div>
    </aside>
  )
}
