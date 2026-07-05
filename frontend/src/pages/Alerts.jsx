import { useState, useEffect, useCallback } from 'react'
import { Mail, CheckCircle2, AlertTriangle } from 'lucide-react'
import Header from '../components/Header'
import RiskBadge from '../components/RiskBadge'
import { getAlerts } from '../services/api'
import { format } from 'date-fns'

export default function Alerts() {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    try {
      const res = await getAlerts(0, 100)
      setAlerts(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 10000)
    return () => clearInterval(interval)
  }, [loadData])

  return (
    <div className="animate-fade-in">
      <Header
        title="Alerts"
        subtitle={`${alerts.length} fraud alerts triggered`}
      />

      {loading ? (
        <div className="py-16 text-center text-dark-600 dark:text-dark-400">
          Loading alerts...
        </div>
      ) : alerts.length === 0 ? (
        <div className="card text-center py-16">
          <CheckCircle2 className="w-10 h-10 text-green-500 dark:text-green-400 mx-auto mb-3" />
          <p className="text-dark-950 dark:text-white font-medium">
            No fraud alerts yet
          </p>
          <p className="text-dark-600 dark:text-dark-400 text-sm mt-1">
            Alerts will appear here automatically when fraud is detected
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="card-sm flex items-center gap-4 hover:border-gray-300 dark:hover:border-dark-600 transition-all"
            >
              {/* Icon */}
              <div className="w-11 h-11 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-500 dark:text-red-400" />
              </div>

              {/* Merchant + transaction info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-dark-900 dark:text-white font-medium">
                    {alert.merchant}
                  </p>
                  <RiskBadge level={alert.risk_level} />
                </div>
                <p className="text-dark-600 dark:text-dark-400 text-sm mt-0.5">
                  ${alert.amount.toLocaleString()} · Transaction{' '}
                  {alert.transaction_id.slice(0, 8).toUpperCase()}
                </p>
              </div>

              {/* Score + time */}
              <div className="text-right flex-shrink-0">
                <p className="text-red-500 dark:text-red-400 font-bold text-lg">
                  {alert.fraud_score}%
                </p>
                <p className="text-dark-500 dark:text-dark-400 text-xs">
                  {format(new Date(alert.created_at), 'MMM d, h:mm a')}
                </p>
              </div>

              {/* Email status badge */}
              <div
                className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 border ${
                  alert.email_sent
                    ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20'
                    : 'bg-gray-100 dark:bg-dark-700 text-dark-500 dark:text-dark-400 border-gray-300 dark:border-dark-600'
                }`}
              >
                <Mail className="w-3 h-3" />
                {alert.email_sent ? 'Email Sent' : 'Pending'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}