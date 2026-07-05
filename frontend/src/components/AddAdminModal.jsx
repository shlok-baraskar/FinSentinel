import { useState } from 'react'
import { X, UserPlus, Mail, Lock, User, Loader2, ShieldCheck } from 'lucide-react'
import { createAdminUser } from '../services/api'

export default function AddAdminModal({ onClose, onSuccess }) {
  const [fullName, setFullName] = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)
  const [success,  setSuccess]  = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    setLoading(true)
    try {
      await createAdminUser({ full_name: fullName, email, password, role: 'admin' })
      setSuccess(true)
      onSuccess?.()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create admin account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-2xl w-full max-w-sm shadow-2xl animate-slide-up">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-dark-700">
          <div>
            <h2 className="text-lg font-semibold text-dark-950 dark:text-white">
              Add New Admin
            </h2>
            <p className="text-dark-600 dark:text-dark-400 text-sm mt-0.5">
              Super Admin privilege
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-dark-800 text-dark-500 dark:text-dark-400 hover:text-dark-900 dark:hover:text-white transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success state */}
        {success ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-14 h-14 bg-green-500/10 border border-green-500/30 rounded-full flex items-center justify-center mx-auto">
              <ShieldCheck className="w-7 h-7 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-dark-950 dark:text-white font-semibold">
                Admin Account Created
              </p>
              <p className="text-dark-600 dark:text-dark-400 text-sm mt-1">
                {fullName} can now log in with the credentials you provided
              </p>
            </div>
            <button onClick={onClose} className="btn-primary w-full justify-center">
              Done
            </button>
          </div>

        ) : (
          /* Form */
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-dark-500 dark:text-dark-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="Jane Doe"
                  className="input pl-10"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-dark-500 dark:text-dark-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="admin@company.com"
                  className="input pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">
                Temporary Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-dark-500 dark:text-dark-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="At least 6 characters"
                  className="input pl-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <p className="text-dark-500 text-xs mt-1">
                Share this with the new admin securely
              </p>
            </div>

            {error && (
              <p className="text-red-500 dark:text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex-1 justify-center disabled:opacity-50"
              >
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</>
                  : <><UserPlus className="w-4 h-4" /> Create Admin</>
                }
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}