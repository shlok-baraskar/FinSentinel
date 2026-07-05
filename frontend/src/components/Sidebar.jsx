import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  ArrowLeftRight,
  Bell,
  BarChart3,
  Shield,
  Activity,
  LogOut,
  Users,
} from 'lucide-react'
import { useAuth } from '../AuthContext'

const navItems = [
  { to: '/',            icon: LayoutDashboard, label: 'Dashboard'   },
  { to: '/transactions', icon: ArrowLeftRight,  label: 'Transactions' },
  { to: '/alerts',      icon: Bell,            label: 'Alerts'      },
  { to: '/analytics',   icon: BarChart3,        label: 'Analytics'   },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-dark-900 border-r border-dark-700 flex flex-col z-50 transition-colors duration-200 dark:bg-dark-900 dark:border-dark-700 [html:not(.dark)_&]:bg-white [html:not(.dark)_&]:border-gray-200">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-dark-700">
        <div className="w-9 h-9 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-dark-950 dark:text-white font-bold text-lg leading-none">FinSentinel</h1>
          <p className="text-dark-500 dark:text-dark-400 text-xs mt-0.5">Fraud Detection AI</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-primary-600/15 text-primary-600 dark:text-primary-400 border border-primary-500/20'
                  : 'text-dark-600 dark:text-dark-400 hover:bg-dark-100 dark:hover:bg-dark-800 hover:text-dark-900 dark:hover:text-dark-100'
              }`
            }
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            {label}
          </NavLink>
        ))}

        {(user?.role === 'admin' || user?.role === 'super_admin') && (
          <>
            <div className="pt-3 pb-1 px-3">
              <p className="text-xs font-semibold text-dark-500 dark:text-dark-500 uppercase tracking-wider">Admin</p>
            </div>
            <NavLink
              to="/team"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-purple-600/15 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                    : 'text-dark-600 dark:text-dark-400 hover:bg-dark-100 dark:hover:bg-dark-800 hover:text-dark-900 dark:hover:text-dark-100'
                }`
              }
            >
              <Users className="w-5 h-5 flex-shrink-0" />
              Team Management
            </NavLink>
          </>
        )}
      </nav>

      {/* User + Logout */}
      <div className="px-4 py-4 border-t border-dark-700 space-y-3">
        <div className="flex items-center gap-2.5 px-3 py-2.5 bg-dark-100 dark:bg-dark-800 rounded-lg">
          <Activity className="w-4 h-4 text-green-500 dark:text-green-400 flex-shrink-0" />
          <div>
            <p className="text-xs font-medium text-dark-800 dark:text-dark-200">System Status</p>
            <p className="text-xs text-green-600 dark:text-green-400">All systems operational</p>
          </div>
          <div className="ml-auto w-2 h-2 bg-green-400 rounded-full animate-pulse" />
        </div>

        {user && (
          <div className="flex items-center gap-3 px-1">
            <div className="w-8 h-8 rounded-full bg-primary-600/20 border border-primary-500/30 flex items-center justify-center text-primary-400 text-xs font-semibold flex-shrink-0">
              {user.full_name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-dark-900 dark:text-dark-100 truncate">{user.full_name}</p>
              <p className="text-xs text-dark-500 capitalize">{user.role}</p>
            </div>
            <button
              onClick={logout}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-dark-100 dark:hover:bg-dark-800 text-dark-500 dark:text-dark-400 hover:text-red-500 dark:hover:text-red-400 transition-all flex-shrink-0"
              title="Log out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}