export default function StatsCard({ title, value, subtitle, icon: Icon, color, trend }) {
  const colorMap = {
    blue:   'bg-primary-500/10 text-primary-400 border-primary-500/20',
    red:    'bg-red-500/10 text-red-400 border-red-500/20',
    green:  'bg-green-500/10 text-green-400 border-green-500/20',
    yellow: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  }

  return (
    <div className="card hover:border-dark-600 transition-all duration-200 animate-fade-in">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-dark-600 dark:text-dark-400 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-dark-950 dark:text-white mt-2">{value}</p>
          {subtitle && (
            <p className="text-dark-500 dark:text-dark-400 text-xs mt-1">{subtitle}</p>
          )}
          {trend && (
            <p className={`text-xs mt-2 font-medium ${
              trend.positive ? 'text-green-400' : 'text-red-400'
            }`}>
              {trend.positive ? '↑' : '↓'} {trend.text}
            </p>
          )}
        </div>
        <div className={`w-11 h-11 rounded-xl border flex items-center justify-center flex-shrink-0 ml-4 ${colorMap[color] || colorMap.blue}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  )
}