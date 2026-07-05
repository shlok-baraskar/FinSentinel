import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, Filter, Upload } from 'lucide-react'
import BatchUploadModal from '../components/BatchUploadModal'
import Header from '../components/Header'
import RiskBadge from '../components/RiskBadge'
import FraudScoreBar from '../components/FraudScoreBar'
import AnalyzeModal from '../components/AnalyzeModal'
import { getTransactions } from '../services/api'
import { format } from 'date-fns'

export default function Transactions() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading]           = useState(true)
  const [showModal, setShowModal]       = useState(false)
  const [showBatchModal, setShowBatchModal] = useState(false)
  const [search, setSearch]             = useState('')
  const [riskFilter, setRiskFilter]     = useState('ALL')

  const loadData = useCallback(async () => {
    try {
      const res = await getTransactions(0, 100)
      setTransactions(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const filtered = transactions.filter(tx => {
    const matchesSearch =
      tx.merchant.toLowerCase().includes(search.toLowerCase()) ||
      tx.location.toLowerCase().includes(search.toLowerCase())
    const matchesRisk = riskFilter === 'ALL' || tx.risk_level === riskFilter
    return matchesSearch && matchesRisk
  })

  return (
    <div className="animate-fade-in">
      <Header
        title="Transactions"
        subtitle={`${transactions.length} total transactions analyzed`}
      />

      {/* Filters bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-dark-500 dark:text-dark-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by merchant or location..."
            className="input pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input sm:w-48"
          value={riskFilter}
          onChange={(e) => setRiskFilter(e.target.value)}
        >
          <option value="ALL">All Risk Levels</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
          <option value="SAFE">Safe</option>
        </select>
        <button onClick={() => setShowBatchModal(true)} className="btn-secondary sm:w-auto justify-center">
          <Upload className="w-4 h-4" /> Batch Upload
        </button>
        <button onClick={() => setShowModal(true)} className="btn-primary sm:w-auto justify-center">
          <Plus className="w-4 h-4" /> New
        </button>
      </div>

      {/* Table */}
      <div className="card !p-0 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-dark-600 dark:text-dark-400">
            Loading transactions...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Filter className="w-8 h-8 mx-auto mb-3 opacity-40 text-dark-500 dark:text-dark-400" />
            <span className="text-dark-700 dark:text-dark-400">
              No transactions match your filters
            </span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-dark-700 bg-gray-100 dark:bg-dark-800/50">
                  <th className="table-header text-dark-700 dark:text-dark-400">Transaction ID</th>
                  <th className="table-header text-dark-700 dark:text-dark-400">Merchant</th>
                  <th className="table-header text-dark-700 dark:text-dark-400">Amount</th>
                  <th className="table-header text-dark-700 dark:text-dark-400">Location</th>
                  <th className="table-header text-dark-700 dark:text-dark-400">Card</th>
                  <th className="table-header text-dark-700 dark:text-dark-400">Fraud Score</th>
                  <th className="table-header text-dark-700 dark:text-dark-400">Risk</th>
                  <th className="table-header text-dark-700 dark:text-dark-400">Status</th>
                  <th className="table-header text-dark-700 dark:text-dark-400">Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((tx) => (
                  <tr
                    key={tx.id}
                    className="border-b border-gray-100 dark:border-dark-800 hover:bg-gray-50 dark:hover:bg-dark-800/50 transition-colors"
                  >
                    <td className="table-cell font-mono text-xs text-dark-500 dark:text-dark-400">
                      {tx.transaction_id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="table-cell font-medium text-dark-900 dark:text-dark-100">
                      {tx.merchant}
                    </td>
                    <td className="table-cell text-dark-800 dark:text-dark-200">
                      ${tx.amount.toLocaleString()}
                    </td>
                    <td className="table-cell text-dark-600 dark:text-dark-400">
                      {tx.location}
                    </td>
                    <td className="table-cell text-dark-600 dark:text-dark-400 font-mono text-xs">
                      **** {tx.card_last4}
                    </td>
                    <td className="table-cell w-40">
                      <FraudScoreBar score={tx.fraud_score} />
                    </td>
                    <td className="table-cell">
                      <RiskBadge level={tx.risk_level} />
                    </td>
                    <td className="table-cell">
                      <span className={`text-xs font-medium ${
                        tx.status === 'flagged'
                          ? 'text-red-500 dark:text-red-400'
                          : 'text-green-600 dark:text-green-400'
                      }`}>
                        {tx.status === 'flagged' ? 'Flagged' : 'Clear'}
                      </span>
                    </td>
                    <td className="table-cell text-dark-600 dark:text-dark-400 text-xs">
                      {format(new Date(tx.created_at), 'MMM d, h:mm a')}
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

      {showBatchModal && (
        <BatchUploadModal
          onClose={() => setShowBatchModal(false)}
          onSuccess={loadData}
        />
      )}
    </div>
  )
}