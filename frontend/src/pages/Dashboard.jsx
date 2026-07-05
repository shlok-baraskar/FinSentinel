import { useState, useEffect, useCallback } from 'react'
import {
  ShieldAlert, ArrowLeftRight, Bell, TrendingUp,
  Plus, RefreshCw, ArrowUpRight
} from 'lucide-react'
import Header from '../components/Header'
import StatsCard from '../components/StatsCard'
import RiskBadge from '../components/RiskBadge'
import FraudScoreBar from '../components/FraudScoreBar'
import AnalyzeModal from '../components/AnalyzeModal'
import SimulatorPanel from '../components/SimulatorPanel'
import { useLiveFeed } from '../components/LiveFeed'
import { getDashboardStats, getTransactions } from '../services/api'
import { formatDistanceToNow } from 'date-fns'
import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const [stats,        setStats]      = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading,      setLoading]    = useState(true)
  const [showModal,    setShowModal]  = useState(false)
  const [simRunning,   setSimRunning] = useState(false)
  const [liveCount,    setLiveCount]  = useState(0)

  const loadData = useCallback(async () => {
    try {
      const [statsRes, txRes] = await Promise.all([
        getDashboardStats(),
        getTransactions(0, 10),
      ])
      setStats(statsRes.data)
      setTransactions(txRes.data)
    } catch (e) {
      console.error('Failed to load dashboard data', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 15000)
    return () => clearInterval(interval)
  }, [loadData])

  const handleLiveTransaction = useCallback((data) => {
    setLiveCount(prev => prev + 1)
    setTransactions(prev => [data, ...prev].slice(0, 10))
    getDashboardStats().then(res => setStats(res.data)).catch(() => {})
  }, [])

  useLiveFeed(handleLiveTransaction)
  const navigate = useNavigate()

  return (
    <div className="animate-fade-in">
      <Header
        title="Dashboard"
        subtitle="Real-time fraud detection overview"
      />

      <SimulatorPanel onStatusChange={setSimRunning} />

      {/* Action bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <p className="text-dark-600 dark:text-dark-400 text-sm">
            {simRunning ? (
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-pulse inline-block" />
                Live simulation active
              </span>
            ) : (
              'Auto-refreshes every 15 seconds'
            )}
          </p>
          {liveCount > 0 && (
            <span className="text-xs font-medium px-2 py-0.5 bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/20 rounded-full">
              +{liveCount} live
            </span>
          )}
        </div>
        <div className="flex gap-3">
          <button onClick={loadData} className="btn-secondary">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus className="w-4 h-4" />
            Analyze Transaction
          </button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard
          title="Total Transactions"
          value={loading ? '—' : stats?.total_transactions?.toLocaleString() ?? 0}
          subtitle="All time"
          icon={ArrowLeftRight}
          color="blue"
        />
        <StatsCard
          title="Fraud Detected"
          value={loading ? '—' : stats?.fraud_detected ?? 0}
          subtitle={`${stats?.fraud_rate ?? 0}% fraud rate`}
          icon={ShieldAlert}
          color="red"
        />
        <StatsCard
          title="Alerts Sent"
          value={loading ? '—' : stats?.total_alerts ?? 0}
          subtitle="Email notifications"
          icon={Bell}
          color="yellow"
        />
        <StatsCard
          title="Model Accuracy"
          value={loading ? '—' : `${((stats?.model_auc ?? 0) * 100).toFixed(1)}%`}
          subtitle="AUC-ROC score"
          icon={TrendingUp}
          color="green"
        />
      </div>

      {/* Live transaction feed */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-dark-950 dark:text-white font-semibold text-lg">
                {simRunning ? 'Live Transaction Feed' : 'Recent Transactions'}
              </h2>
              {simRunning && (
                <span className="flex items-center gap-1 text-xs font-medium text-primary-600 dark:text-primary-400">
                  <span className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-pulse" />
                  LIVE
                </span>
              )}
            </div>
            <p className="text-dark-600 dark:text-dark-400 text-sm mt-0.5">
              {simRunning
                ? 'Transactions are being analyzed in real time by the AI'
                : 'Latest activity from the system'
              }
            </p>
          </div>
          
            <button
            onClick={() => navigate('/transactions')}
            className="text-primary-600 dark:text-primary-400 text-sm font-medium flex items-center gap-1 hover:text-primary-700 dark:hover:text-primary-300 transition-all"
          >
            View all
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-dark-600 dark:text-dark-400">
            Loading transactions...
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-dark-600 dark:text-dark-400">No transactions yet</p>
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary mt-4 mx-auto"
            >
              <Plus className="w-4 h-4" /> Analyze your first transaction
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-6">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-dark-700">
                  <th className="table-header text-dark-700 dark:text-dark-400">Merchant</th>
                  <th className="table-header text-dark-700 dark:text-dark-400">Amount</th>
                  <th className="table-header text-dark-700 dark:text-dark-400">Location</th>
                  <th className="table-header text-dark-700 dark:text-dark-400">Fraud Score</th>
                  <th className="table-header text-dark-700 dark:text-dark-400">Risk</th>
                  <th className="table-header text-dark-700 dark:text-dark-400">Type</th>
                  <th className="table-header text-dark-700 dark:text-dark-400">Time</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx, idx) => (
                  <tr
                    key={tx.transaction_id || tx.id || idx}
                    className={`border-b border-gray-100 dark:border-dark-800 transition-colors ${
                      idx === 0 && simRunning
                        ? 'bg-primary-500/5'
                        : 'hover:bg-gray-50 dark:hover:bg-dark-800/50'
                    }`}
                  >
                    <td className="table-cell font-medium text-dark-900 dark:text-dark-100">
                      {tx.merchant}
                    </td>
                    <td className="table-cell text-dark-800 dark:text-dark-200">
                      ${tx.amount?.toLocaleString()}
                    </td>
                    <td className="table-cell text-dark-600 dark:text-dark-400">
                      {tx.location}
                    </td>
                    <td className="table-cell w-40">
                      <FraudScoreBar score={tx.fraud_score} />
                    </td>
                    <td className="table-cell">
                      <RiskBadge level={tx.risk_level} />
                    </td>
                    <td className="table-cell">
                      {tx.is_demo ? (
                        <span className="text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                          Demo
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">
                          Real
                        </span>
                      )}
                    </td>
                    <td className="table-cell text-dark-600 dark:text-dark-400 text-xs">
                      {tx.created_at
                        ? formatDistanceToNow(new Date(tx.created_at), { addSuffix: true })
                        : 'Just now'
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <AnalyzeModal
          onClose={() => setShowModal(false)}
          onSuccess={loadData}
        />
      )}
    </div>
  )
}