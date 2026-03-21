import { usersApi } from '../services/api'
import { useEffect, useState } from 'react'
import { User } from '../types'
import { formatRelativeTime } from '../utils'

export default function Users() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await usersApi.getUsers()
        // Handle { success: true, users: [...] } format
        const data = response.users || []
        setUsers(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error('Failed to fetch users:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUsers()
  }, [])

  return (
    <div className="p-6">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Users</h1>
        <p className="text-gray-500 mt-1">All tracked users</p>
      </header>

      {isLoading ? (
        <p className="text-gray-500">Loading users...</p>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Login</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{user.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{user.role}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {user.loginTime ? formatRelativeTime(user.loginTime) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <div className="p-8 text-center text-gray-500">No users found. Events will appear when users interact with school-dashboard.</div>
          )}
        </div>
      )}
    </div>
  )
}
