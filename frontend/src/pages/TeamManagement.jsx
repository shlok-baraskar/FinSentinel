import { useState, useEffect, useCallback } from 'react'
import { Users, Shield, ShieldOff, UserCheck, UserX, UserPlus } from 'lucide-react'
import AddAdminModal from '../components/AddAdminModal'
import Header from '../components/Header'
import { useAuth } from '../AuthContext'
import { getAllUsers, updateUserRole, toggleUserStatus } from '../services/api'
import { format } from 'date-fns'

export default function TeamManagement() {
  const [users, setUsers]               = useState([])
  const [loading, setLoading]           = useState(true)
  const [actionLoading, setActionLoading] = useState(null)
  const [showAddAdmin, setShowAddAdmin] = useState(false)
  const { user: currentUser }           = useAuth()

  const loadUsers = useCallback(async () => {
    try {
      const res = await getAllUsers()
      setUsers(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const handleRoleToggle = async (user) => {
    const newRole = user.role === 'admin' ? 'analyst' : 'admin'
    setActionLoading(user.id)
    try {
      await updateUserRole(user.id, newRole)
      await loadUsers()
    } catch (e) {
      alert(e.response?.data?.detail || 'Failed to update role')
    } finally {
      setActionLoading(null)
    }
  }

  const handleStatusToggle = async (user) => {
    setActionLoading(user.id)
    try {
      await toggleUserStatus(user.id)
      await loadUsers()
    } catch (e) {
      alert(e.response?.data?.detail || 'Failed to update status')
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="animate-fade-in">
      <Header
        title="Team Management"
        subtitle={`${users.length} team members · Admin access`}
      />

      {currentUser?.role === 'super_admin' && (
        <div className="flex justify-end mb-4">
          <button onClick={() => setShowAddAdmin(true)} className="btn-primary">
            <UserPlus className="w-4 h-4" /> Add New Admin
          </button>
        </div>
      )}

      <div className="card !p-0 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-dark-600 dark:text-dark-400">
            Loading team...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-dark-700 bg-gray-100 dark:bg-dark-800/50">
                  <th className="table-header text-dark-700 dark:text-dark-400">Name</th>
                  <th className="table-header text-dark-700 dark:text-dark-400">Email</th>
                  <th className="table-header text-dark-700 dark:text-dark-400">Role</th>
                  <th className="table-header text-dark-700 dark:text-dark-400">Status</th>
                  <th className="table-header text-dark-700 dark:text-dark-400">Joined</th>
                  <th className="table-header text-dark-700 dark:text-dark-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-gray-100 dark:border-dark-800 hover:bg-gray-50 dark:hover:bg-dark-800/50 transition-colors"
                  >
                    {/* Name */}
                    <td className="table-cell font-medium text-dark-900 dark:text-dark-100">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-primary-600/20 border border-primary-500/30 flex items-center justify-center text-primary-600 dark:text-primary-400 text-xs font-semibold flex-shrink-0">
                          {u.full_name.charAt(0).toUpperCase()}
                        </div>
                        {u.full_name}
                        {u.id === currentUser?.id && (
                          <span className="text-xs text-dark-400 dark:text-dark-500">(you)</span>
                        )}
                      </div>
                    </td>

                    {/* Email */}
                    <td className="table-cell text-dark-600 dark:text-dark-400">
                      {u.email}
                    </td>

                    {/* Role badge */}
                    <td className="table-cell">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${
                        u.role === 'super_admin'
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                          : u.role === 'admin'
                          ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
                          : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                      }`}>
                        {u.role === 'super_admin' || u.role === 'admin'
                          ? <Shield className="w-3 h-3" />
                          : <Users className="w-3 h-3" />
                        }
                        {u.role === 'super_admin' ? 'Super Admin' : u.role}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="table-cell">
                      <span className={`text-xs font-medium ${
                        u.is_active
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-dark-400 dark:text-dark-500'
                      }`}>
                        {u.is_active ? 'Active' : 'Deactivated'}
                      </span>
                    </td>

                    {/* Joined date */}
                    <td className="table-cell text-dark-600 dark:text-dark-400 text-xs">
                      {format(new Date(u.created_at), 'MMM d, yyyy')}
                    </td>

                    {/* Actions */}
                    <td className="table-cell">
                      {u.role === 'super_admin' ? (
                        <p className="text-xs text-dark-400 dark:text-dark-500 text-right italic">
                          Protected account
                        </p>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleRoleToggle(u)}
                            disabled={actionLoading === u.id || u.id === currentUser?.id}
                            title={u.role === 'admin' ? 'Demote to Analyst' : 'Promote to Admin'}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 text-dark-500 dark:text-dark-400 hover:text-primary-600 dark:hover:text-primary-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            {u.role === 'admin'
                              ? <ShieldOff className="w-4 h-4" />
                              : <Shield className="w-4 h-4" />
                            }
                          </button>
                          <button
                            onClick={() => handleStatusToggle(u)}
                            disabled={actionLoading === u.id || u.id === currentUser?.id}
                            title={u.is_active ? 'Deactivate' : 'Activate'}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 text-dark-500 dark:text-dark-400 hover:text-red-500 dark:hover:text-red-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            {u.is_active
                              ? <UserX className="w-4 h-4" />
                              : <UserCheck className="w-4 h-4" />
                            }
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAddAdmin && (
        <AddAdminModal
          onClose={() => setShowAddAdmin(false)}
          onSuccess={loadUsers}
        />
      )}
    </div>
  )
}