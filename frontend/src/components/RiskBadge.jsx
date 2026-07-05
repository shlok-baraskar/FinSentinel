export default function RiskBadge({ level }) {
  const map = {
    CRITICAL: 'badge-critical',
    HIGH:     'badge-high',
    MEDIUM:   'badge-medium',
    LOW:      'badge-low',
    SAFE:     'badge-safe',
  }
  return (
    <span className={map[level] || 'badge-safe'}>
      {level}
    </span>
  )
}