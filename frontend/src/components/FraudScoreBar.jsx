export default function FraudScoreBar({ score }) {
  const getColor = (s) => {
    if (s >= 80) return 'bg-red-500'
    if (s >= 60) return 'bg-orange-500'
    if (s >= 40) return 'bg-yellow-500'
    if (s >= 20) return 'bg-blue-500'
    return 'bg-green-500'
  }

  const getTextColor = (s) => {
    if (s >= 80) return 'text-red-400'
    if (s >= 60) return 'text-orange-400'
    if (s >= 40) return 'text-yellow-400'
    if (s >= 20) return 'text-blue-400'
    return 'text-green-400'
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 bg-dark-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${getColor(score)}`}
          style={{ width: `${Math.min(score, 100)}%` }}
        />
      </div>
      <span className={`text-xs font-semibold w-12 text-right ${getTextColor(score)}`}>
        {score.toFixed(1)}%
      </span>
    </div>
  )
}