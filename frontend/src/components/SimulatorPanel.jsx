import { useState, useEffect } from 'react'
import {
  Play, Square, Zap, Users, Clock, AlertTriangle
} from 'lucide-react'
import { startSimulator, stopSimulator, simulatorStatus } from '../services/api'

export default function SimulatorPanel({ onStatusChange }) {
  const [running,   setRunning]   = useState(false)
  const [clients,   setClients]   = useState(0)
  const [interval,  setInterval_] = useState(3)
  const [loading,   setLoading]   = useState(false)
  const [txCount,   setTxCount]   = useState(0)

  // Poll status every 5 seconds
  useEffect(() => {
    const check = async () => {
      try {
        const res = await simulatorStatus()
        setRunning(res.data.running)
        setClients(res.data.connected_clients)
      } catch (e) {}
    }
    check()
    const poll = setInterval(check, 5000)
    return () => clearInterval(poll)
  }, [])

  const handleStart = async () => {
    setLoading(true)
    try {
      await startSimulator(interval)
      setRunning(true)
      setTxCount(0)
      onStatusChange?.(true)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleStop = async () => {
    setLoading(true)
    try {
      await stopSimulator()
      setRunning(false)
      onStatusChange?.(false)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  // Count incoming transactions from parent
  useEffect(() => {
    if (running) {
      const timer = setInterval(() => {
        setTxCount(prev => prev + 1)
      }, interval * 1000)
      return () => clearInterval(timer)
    }
  }, [running, interval])

  return (
    <div className={`card mb-6 border-2 transition-all duration-300 ${
      running
        ? 'border-primary-500/40 bg-primary-500/5 dark:bg-primary-500/5'
        : 'border-gray-200 dark:border-dark-700'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            running
              ? 'bg-primary-500/20 border border-primary-500/30'
              : 'bg-gray-100 dark:bg-dark-800 border border-gray-200 dark:border-dark-700'
          }`}>
            <Zap className={`w-5 h-5 ${running ? 'text-primary-500' : 'text-dark-500'}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-dark-950 dark:text-white font-semibold">
                Demo Simulation Mode
              </h3>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                DEMO
              </span>
            </div>
            <p className="text-dark-600 dark:text-dark-400 text-xs mt-0.5">
              Auto-generates realistic transactions through the live ML pipeline
            </p>
          </div>
        </div>

        {/* Live indicator */}
        {running && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-primary-500/10 border border-primary-500/20 rounded-full">
            <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
            <span className="text-xs font-medium text-primary-600 dark:text-primary-400">
              LIVE — generating every {interval}s
            </span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4 mt-5">
        {/* Interval selector */}
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-dark-500 flex-shrink-0" />
          <label className="text-sm text-dark-700 dark:text-dark-300 whitespace-nowrap">
            Interval:
          </label>
          <select
            value={interval}
            onChange={(e) => setInterval_(Number(e.target.value))}
            disabled={running}
            className="input !py-1.5 !px-3 w-28 text-sm disabled:opacity-50"
          >
            <option value={2}>2 seconds</option>
            <option value={3}>3 seconds</option>
            <option value={5}>5 seconds</option>
            <option value={10}>10 seconds</option>
          </select>
        </div>

        {/* Start / Stop */}
        {running ? (
          <button
            onClick={handleStop}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
          >
            <Square className="w-4 h-4" />
            Stop Simulation
          </button>
        ) : (
          <button
            onClick={handleStart}
            disabled={loading}
            className="btn-primary disabled:opacity-50"
          >
            <Play className="w-4 h-4" />
            Start Simulation
          </button>
        )}

        {/* Stats */}
        {running && (
          <div className="flex items-center gap-4 ml-auto">
            <div className="flex items-center gap-1.5 text-xs text-dark-600 dark:text-dark-400">
              <Users className="w-3.5 h-3.5" />
              {clients} viewer{clients !== 1 ? 's' : ''}
            </div>
          </div>
        )}
      </div>

      {/* Warning note */}
      <div className="flex items-start gap-2 mt-4 p-3 bg-amber-500/5 border border-amber-500/15 rounded-lg">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-dark-600 dark:text-dark-400">
          Simulated transactions are clearly marked as demo data and run through the same
          real AI pipeline. Fraud alerts are sent for high-risk simulated transactions.
          This mode is designed to demonstrate the system's live detection capabilities.
        </p>
      </div>
    </div>
  )
}