import { useState, useEffect } from 'react'
import { Shield, Wifi, WifiOff, Sun, Moon } from 'lucide-react'
import { healthCheck } from '../services/api'
import { useTheme } from '../ThemeContext'

export default function Header({ title, subtitle }) {
  const { theme, toggleTheme } = useTheme()
  const [online,  setOnline]  = useState(true)
  const [time,    setTime]    = useState(new Date())

  useEffect(() => {
    // Update clock every second
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    // Check backend health every 30 seconds
    const checkHealth = async () => {
      try {
        await healthCheck()
        setOnline(true)
      } catch {
        setOnline(false)
      }
    }
    checkHealth()
    const interval = setInterval(checkHealth, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <header className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-2xl font-bold text-dark-950 dark:text-white">{title}</h1>
        {subtitle && (
          <p className="text-dark-600 dark:text-dark-400 text-sm mt-1">{subtitle}</p>
        )}
      </div>

     <div className="flex items-center gap-4">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="w-9 h-9 flex items-center justify-center rounded-lg bg-dark-800 hover:bg-dark-700 text-dark-300 hover:text-white transition-all border border-dark-700"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Live clock */}
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-dark-800 dark:text-dark-200">
            {time.toLocaleTimeString('en-US', {
              hour:   '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })}
          </p>
          <p className="text-xs text-dark-600 dark:text-dark-400">
            {time.toLocaleDateString('en-US', {
              weekday: 'short',
              month:   'short',
              day:     'numeric',
            })}
          </p>
        </div>

        {/* Backend status */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border ${
          online
            ? 'bg-green-500/10 text-green-400 border-green-500/20'
            : 'bg-red-500/10 text-red-400 border-red-500/20'
        }`}>
          {online
            ? <Wifi className="w-3.5 h-3.5" />
            : <WifiOff className="w-3.5 h-3.5" />
          }
          {online ? 'API Online' : 'API Offline'}
        </div>
      </div>
    </header>
  )
}