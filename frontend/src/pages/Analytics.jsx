import { useState, useEffect } from 'react'
import {
  Target, TrendingUp, AlertCircle, CheckCircle2
} from 'lucide-react'
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts'
import Header from '../components/Header'
import StatsCard from '../components/StatsCard'
import { getModelMetrics, getTransactions } from '../services/api'

const COLORS = {
  CRITICAL: '#f87171',
  HIGH:     '#fb923c',
  MEDIUM:   '#facc15',
  LOW:      '#60a5fa',
  SAFE:     '#4ade80',
}

export default function Analytics() {
  const [metrics, setMetrics]           = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading]           = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [metricsRes, txRes] = await Promise.all([
          getModelMetrics(),
          getTransactions(0, 200),
        ])
        setMetrics(metricsRes.data)
        setTransactions(txRes.data)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const riskCounts = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'SAFE'].map(level => ({
    name:  level,
    value: transactions.filter(t => t.risk_level === level).length,
  })).filter(d => d.value > 0)

  const merchantTotals = {}
  transactions.forEach(t => {
    merchantTotals[t.merchant] = (merchantTotals[t.merchant] || 0) + t.amount
  })
  const merchantData = Object.entries(merchantTotals)
    .map(([name, value]) => ({ name, value: Math.round(value) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6)

  return (
    <div className="animate-fade-in">
      <Header
        title="Analytics"
        subtitle="ML model performance and transaction insights"
      />

      {/* Model metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard
          title="AUC-ROC Score"
          value={loading ? '—' : metrics?.auc_roc?.toFixed(4) ?? '—'}
          subtitle="Overall model accuracy"
          icon={Target}
          color="blue"
        />
        <StatsCard
          title="Precision"
          value={loading ? '—' : metrics?.precision?.toFixed(4) ?? '—'}
          subtitle="Correct fraud flags"
          icon={CheckCircle2}
          color="green"
        />
        <StatsCard
          title="Recall"
          value={loading ? '—' : metrics?.recall?.toFixed(4) ?? '—'}
          subtitle="Fraud cases caught"
          icon={AlertCircle}
          color="red"
        />
        <StatsCard
          title="F1 Score"
          value={loading ? '—' : metrics?.f1_score?.toFixed(4) ?? '—'}
          subtitle="Balanced performance"
          icon={TrendingUp}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        {/* Risk distribution pie chart */}
        <div className="card">
          <h3 className="text-dark-950 dark:text-white font-semibold mb-1">
            Risk Distribution
          </h3>
          <p className="text-dark-600 dark:text-dark-400 text-sm mb-4">
            Breakdown of analyzed transactions by risk level
          </p>

          {riskCounts.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-dark-600 dark:text-dark-400 text-sm">
              No data yet — analyze some transactions
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={riskCounts}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                >
                  {riskCounts.map((entry) => (
                    <Cell key={entry.name} fill={COLORS[entry.name]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background:   '#1e293b',
                    border:       '1px solid #334155',
                    borderRadius: '8px',
                    color:        '#f1f5f9',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}

          {riskCounts.length > 0 && (
            <div className="flex flex-wrap gap-3 justify-center mt-2">
              {riskCounts.map((entry) => (
                <div key={entry.name} className="flex items-center gap-1.5 text-xs">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ background: COLORS[entry.name] }}
                  />
                  <span className="text-dark-700 dark:text-dark-300">{entry.name}</span>
                  <span className="text-dark-500 dark:text-dark-500">({entry.value})</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Merchant spend bar chart */}
        <div className="card">
          <h3 className="text-dark-950 dark:text-white font-semibold mb-1">
            Top Merchants by Volume
          </h3>
          <p className="text-dark-600 dark:text-dark-400 text-sm mb-4">
            Total transaction amount per merchant
          </p>

          {merchantData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-dark-600 dark:text-dark-400 text-sm">
              No data yet — analyze some transactions
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={merchantData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                <XAxis type="number" stroke="#64748b" fontSize={12} />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="#64748b"
                  fontSize={11}
                  width={110}
                />
                <Tooltip
                  contentStyle={{
                    background:   '#1e293b',
                    border:       '1px solid #334155',
                    borderRadius: '8px',
                    color:        '#f1f5f9',
                  }}
                  formatter={(value) => [`$${value.toLocaleString()}`, 'Total']}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Model info card */}
      <div className="card">
        <h3 className="text-dark-950 dark:text-white font-semibold mb-4">
          Model Information
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-dark-600 dark:text-dark-400 text-xs uppercase tracking-wide">
              Algorithm
            </p>
            <p className="text-dark-900 dark:text-white font-medium mt-1">
              XGBoost Classifier
            </p>
          </div>
          <div>
            <p className="text-dark-600 dark:text-dark-400 text-xs uppercase tracking-wide">
              Training Data
            </p>
            <p className="text-dark-900 dark:text-white font-medium mt-1">
              {metrics?.total_transactions?.toLocaleString() ?? '—'} records
            </p>
          </div>
          <div>
            <p className="text-dark-600 dark:text-dark-400 text-xs uppercase tracking-wide">
              Fraud Cases
            </p>
            <p className="text-dark-900 dark:text-white font-medium mt-1">
              {metrics?.fraud_cases ?? '—'} cases
            </p>
          </div>
          <div>
            <p className="text-dark-600 dark:text-dark-400 text-xs uppercase tracking-wide">
              Balancing
            </p>
            <p className="text-dark-900 dark:text-white font-medium mt-1">
              SMOTE Oversampling
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}