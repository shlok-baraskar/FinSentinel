import { useState } from 'react'
import { X, Send, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react'
import { analyzeTransaction } from '../services/api'
import RiskBadge from './RiskBadge'

const MERCHANTS = [
  'Amazon', 'Netflix', 'Unknown Online Store', 'Walmart',
  'Apple Store', 'Foreign Exchange', 'Crypto Exchange',
  'Local Restaurant', 'Shell Gas Station', 'Uber',
  'Zara', 'H&M', 'Spotify', 'Google Play', 'Steam',
  'Airbnb', 'Booking.com', 'Swiggy', 'Zomato', 'Flipkart',
  'eBay', 'Aliexpress', 'PayPal Transfer', 'Western Union',
  'Unknown Merchant'
]

const LOCATIONS = [
  'Mumbai, India', 'New York, USA', 'Lagos, Nigeria',
  'London, UK', 'Dubai, UAE', 'Singapore',
  'Unknown Location', 'Moscow, Russia', 'Bangalore, India',
  'Delhi, India', 'Paris, France', 'Tokyo, Japan',
  'Sydney, Australia', 'Toronto, Canada', 'Nairobi, Kenya',
  'São Paulo, Brazil', 'Shanghai, China', 'Berlin, Germany'
]

export default function AnalyzeModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    amount:     '',
    merchant:   '',
    location:   '',
    card_last4: '',
  })
  const [loading, setLoading] = useState(false)
  const [result,  setResult]  = useState(null)
  const [error,   setError]   = useState(null)

  const handleSubmit = async () => {
    if (!form.amount || !form.merchant || !form.location || !form.card_last4) {
      setError('Please fill in all fields')
      return
    }
    if (form.card_last4.length !== 4 || isNaN(form.card_last4)) {
      setError('Card last 4 digits must be exactly 4 numbers')
      return
    }
    setError(null)
    setLoading(true)
    try {
      const res = await analyzeTransaction({
        ...form,
        amount: parseFloat(form.amount),
      })
      setResult(res.data)
      onSuccess?.()
    } catch (e) {
      setError('Failed to analyze transaction. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-2xl w-full max-w-md shadow-2xl animate-slide-up">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-dark-700">
          <div>
            <h2 className="text-lg font-semibold text-dark-950 dark:text-white">
              Analyze Transaction
            </h2>
            <p className="text-dark-600 dark:text-dark-400 text-sm mt-0.5">
              Run AI fraud detection
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-dark-800 text-dark-500 dark:text-dark-400 hover:text-dark-900 dark:hover:text-white transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Result view */}
        {result ? (
          <div className="p-6 space-y-4">
            <div className={`rounded-xl p-5 border text-center ${
              result.is_fraud
                ? 'bg-red-500/10 border-red-500/30'
                : 'bg-green-500/10 border-green-500/30'
            }`}>
              {result.is_fraud
                ? <AlertTriangle className="w-10 h-10 text-red-500 dark:text-red-400 mx-auto mb-2" />
                : <CheckCircle  className="w-10 h-10 text-green-600 dark:text-green-400 mx-auto mb-2" />
              }
              <p className={`text-2xl font-bold ${
                result.is_fraud
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-green-700 dark:text-green-400'
              }`}>
                {result.is_fraud ? 'FRAUD DETECTED' : 'TRANSACTION SAFE'}
              </p>
              <p className="text-dark-600 dark:text-dark-400 text-sm mt-1">
                {result.is_fraud
                  ? 'Alert email has been sent automatically'
                  : 'No suspicious activity found'
                }
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-dark-700">
                <span className="text-dark-600 dark:text-dark-400 text-sm">Fraud Score</span>
                <span className="text-dark-950 dark:text-white font-semibold">{result.fraud_score}%</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-dark-700">
                <span className="text-dark-600 dark:text-dark-400 text-sm">Risk Level</span>
                <RiskBadge level={result.risk_level} />
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-dark-700">
                <span className="text-dark-600 dark:text-dark-400 text-sm">Confidence</span>
                <span className="text-dark-950 dark:text-white font-semibold">{result.confidence}%</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-dark-600 dark:text-dark-400 text-sm">Amount</span>
                <span className="text-dark-950 dark:text-white font-semibold">
                  ${parseFloat(form.amount).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setResult(null)} className="btn-secondary flex-1 justify-center">
                Analyze Another
              </button>
              <button onClick={onClose} className="btn-primary flex-1 justify-center">
                Done
              </button>
            </div>
          </div>

        ) : (
          /* Form view */
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">
                Transaction Amount ($)
              </label>
              <input
                type="number"
                placeholder="e.g. 9500.00"
                className="input"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">
                Merchant
              </label>
              <select
                className="input"
                value={form.merchant}
                onChange={(e) => setForm({ ...form, merchant: e.target.value })}
              >
                <option value="">Select merchant...</option>
                {MERCHANTS.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">
                Location
              </label>
              <select
                className="input"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              >
                <option value="">Select location...</option>
                {LOCATIONS.map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">
                Card Last 4 Digits
              </label>
              <input
                type="text"
                placeholder="e.g. 4821"
                maxLength={4}
                className="input"
                value={form.card_last4}
                onChange={(e) => setForm({ ...form, card_last4: e.target.value })}
              />
            </div>

            {error && (
              <p className="text-red-500 dark:text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <div className="flex gap-3 pt-2">
              <button onClick={onClose} className="btn-secondary flex-1 justify-center">
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="btn-primary flex-1 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</>
                  : <><Send className="w-4 h-4" /> Analyze</>
                }
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}