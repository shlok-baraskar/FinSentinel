import { useState, useRef } from 'react'
import {
  X, Upload, FileSpreadsheet, CheckCircle2,
  AlertTriangle, Loader2, Download, ChevronDown, ChevronUp
} from 'lucide-react'
import { uploadBatchFile } from '../services/api'
import RiskBadge from './RiskBadge'
import FraudScoreBar from './FraudScoreBar'

export default function BatchUploadModal({ onClose, onSuccess }) {
  const [file,        setFile]        = useState(null)
  const [loading,     setLoading]     = useState(false)
  const [result,      setResult]      = useState(null)
  const [error,       setError]       = useState(null)
  const [dragOver,    setDragOver]    = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [filterView,  setFilterView]  = useState('all')
  const fileInputRef = useRef(null)

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return
    const validTypes = ['.csv', '.xlsx', '.xls']
    const isValid = validTypes.some(ext => selectedFile.name.toLowerCase().endsWith(ext))
    if (!isValid) {
      setError('Please upload a .csv or .xlsx file')
      return
    }
    setError(null)
    setFile(selectedFile)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    handleFileSelect(e.dataTransfer.files[0])
  }

  const handleUpload = async () => {
    if (!file) return
    setLoading(true)
    setError(null)
    try {
      const res = await uploadBatchFile(file)
      setResult(res.data)
      onSuccess?.()
    } catch (e) {
      setError(e.response?.data?.detail || 'Upload failed. Please check your file format.')
    } finally {
      setLoading(false)
    }
  }

  const downloadSampleCSV = () => {
    const content = `amount,merchant,location,card_last4
45.50,Amazon,"Mumbai, India",1234
12500.00,Unknown Online Store,"Lagos, Nigeria",9999
89.99,Netflix,"New York, USA",4521`
    const blob = new Blob([content], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = 'finsentinel_sample.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-2xl w-full max-w-lg shadow-2xl animate-slide-up">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-dark-700">
          <div>
            <h2 className="text-lg font-semibold text-dark-950 dark:text-white">
              Batch Upload
            </h2>
            <p className="text-dark-600 dark:text-dark-400 text-sm mt-0.5">
              Analyze multiple transactions from a file
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
          <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-5 text-center">
              <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400 mx-auto mb-2" />
              <p className="text-xl font-bold text-dark-950 dark:text-white">
                Batch Processed Successfully
              </p>
              <p className="text-dark-600 dark:text-dark-400 text-sm mt-1">
                {result.total_processed} transactions analyzed
              </p>
            </div>

            {/* Summary stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="card-sm text-center">
                <p className="text-2xl font-bold text-dark-950 dark:text-white">
                  {result.total_processed}
                </p>
                <p className="text-dark-600 dark:text-dark-400 text-xs mt-1">Processed</p>
              </div>
              <div className="card-sm text-center">
                <p className="text-2xl font-bold text-red-500 dark:text-red-400">
                  {result.fraud_detected}
                </p>
                <p className="text-dark-600 dark:text-dark-400 text-xs mt-1">Fraud Found</p>
              </div>
              <div className="card-sm text-center">
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {result.alerts_sent}
                </p>
                <p className="text-dark-600 dark:text-dark-400 text-xs mt-1">Alerts Sent</p>
              </div>
            </div>

            {/* Details toggle */}
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 rounded-lg transition-all text-sm font-medium text-dark-800 dark:text-dark-200"
            >
              <span>View Detailed Breakdown</span>
              {showDetails
                ? <ChevronUp className="w-4 h-4" />
                : <ChevronDown className="w-4 h-4" />
              }
            </button>

            {showDetails && (
              <div className="space-y-3 animate-fade-in">
                {/* Filter tabs */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setFilterView('all')}
                    className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${
                      filterView === 'all'
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 dark:bg-dark-800 text-dark-600 dark:text-dark-400 hover:text-dark-900 dark:hover:text-dark-200'
                    }`}
                  >
                    All ({result.transactions.length})
                  </button>
                  <button
                    onClick={() => setFilterView('fraud')}
                    className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${
                      filterView === 'fraud'
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-100 dark:bg-dark-800 text-dark-600 dark:text-dark-400 hover:text-dark-900 dark:hover:text-dark-200'
                    }`}
                  >
                    Flagged Only ({result.fraud_detected})
                  </button>
                </div>

                {/* Transaction list */}
                <div className="space-y-2">
                  {result.transactions
                    .filter(tx =>
                      filterView === 'all' ||
                      tx.risk_level === 'CRITICAL' ||
                      tx.risk_level === 'HIGH'
                    )
                    .map((tx, idx) => (
                      <div key={idx} className="card-sm">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-dark-900 dark:text-white font-medium text-sm">
                            {tx.merchant}
                          </p>
                          <RiskBadge level={tx.risk_level} />
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-dark-600 dark:text-dark-400 text-xs">
                            ${tx.amount.toLocaleString()}
                          </p>
                          <div className="flex-1 max-w-[140px]">
                            <FraudScoreBar score={tx.fraud_score} />
                          </div>
                        </div>
                      </div>
                    ))
                  }
                </div>

                {/* Extra stats */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-gray-100 dark:bg-dark-800 rounded-lg p-3">
                    <p className="text-dark-600 dark:text-dark-400 text-xs">Avg Fraud Score</p>
                    <p className="text-dark-900 dark:text-white font-semibold mt-0.5">
                      {(result.transactions.reduce((s, t) => s + t.fraud_score, 0) / result.transactions.length).toFixed(2)}%
                    </p>
                  </div>
                  <div className="bg-gray-100 dark:bg-dark-800 rounded-lg p-3">
                    <p className="text-dark-600 dark:text-dark-400 text-xs">Highest Risk</p>
                    <p className="text-dark-900 dark:text-white font-semibold mt-0.5">
                      {Math.max(...result.transactions.map(t => t.fraud_score)).toFixed(2)}%
                    </p>
                  </div>
                  <div className="bg-gray-100 dark:bg-dark-800 rounded-lg p-3">
                    <p className="text-dark-600 dark:text-dark-400 text-xs">Total Volume</p>
                    <p className="text-dark-900 dark:text-white font-semibold mt-0.5">
                      ${result.transactions.reduce((s, t) => s + t.amount, 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-gray-100 dark:bg-dark-800 rounded-lg p-3">
                    <p className="text-dark-600 dark:text-dark-400 text-xs">Errors Skipped</p>
                    <p className="text-dark-900 dark:text-white font-semibold mt-0.5">
                      {result.errors}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <button onClick={onClose} className="btn-primary w-full justify-center">
              View Results in Dashboard
            </button>
          </div>

        ) : (
          /* Upload form */
          <div className="p-6 space-y-4">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                dragOver
                  ? 'border-primary-500 bg-primary-500/5'
                  : file
                  ? 'border-green-500/50 bg-green-500/5'
                  : 'border-gray-300 dark:border-dark-600 hover:border-gray-400 dark:hover:border-dark-500 bg-gray-50 dark:bg-transparent'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files[0])}
              />
              {file ? (
                <>
                  <FileSpreadsheet className="w-10 h-10 text-green-600 dark:text-green-400 mx-auto mb-3" />
                  <p className="text-dark-950 dark:text-white font-medium">{file.name}</p>
                  <p className="text-dark-600 dark:text-dark-400 text-sm mt-1">
                    {(file.size / 1024).toFixed(1)} KB · Click to change
                  </p>
                </>
              ) : (
                <>
                  <Upload className="w-10 h-10 text-dark-400 dark:text-dark-500 mx-auto mb-3" />
                  <p className="text-dark-950 dark:text-white font-medium">
                    Drop your file here or click to browse
                  </p>
                  <p className="text-dark-600 dark:text-dark-400 text-sm mt-1">
                    Supports .csv, .xlsx, .xls — max 500 rows
                  </p>
                </>
              )}
            </div>

            {/* Required columns info */}
            <div className="bg-gray-100 dark:bg-dark-800 rounded-lg p-4">
              <p className="text-dark-700 dark:text-dark-300 text-sm font-medium mb-2">
                Required columns:
              </p>
              <div className="flex flex-wrap gap-2">
                {['amount', 'merchant', 'location', 'card_last4'].map(col => (
                  <span
                    key={col}
                    className="text-xs font-mono bg-gray-200 dark:bg-dark-700 text-dark-700 dark:text-dark-300 px-2 py-1 rounded"
                  >
                    {col}
                  </span>
                ))}
              </div>
              <button
                onClick={downloadSampleCSV}
                className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-xs font-medium mt-3 flex items-center gap-1"
              >
                <Download className="w-3 h-3" /> Download sample CSV
              </button>
            </div>

            {error && (
              <p className="text-red-500 dark:text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                {error}
              </p>
            )}

            <div className="flex gap-3 pt-2">
              <button onClick={onClose} className="btn-secondary flex-1 justify-center">
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={!file || loading}
                className="btn-primary flex-1 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                  : <><Upload className="w-4 h-4" /> Upload & Analyze</>
                }
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}