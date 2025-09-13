# Phase 12: Admin Dashboard

## 🎯 Objective

Implement a comprehensive admin dashboard that provides system administrators with tools to manage users, moderate content, monitor platform performance, configure system settings, and oversee the entire music streaming platform.

## 📋 Prerequisites

- Phase 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, & 11 completed successfully
- Premium analytics system functional
- User roles and permissions working
- Database with comprehensive data available

## 🔐 Admin Account Setup

### Quick Setup (Development)

#### **Default Admin Credentials**

- **Email**: `dev@dev.com`
- **Password**: `dev`
- **Name**: `Dev`
- **Role**: `ADMIN`

#### **Setup Commands**

```bash
# Option 1: Create admin account
yarn create-admin

# Option 2: Use seed script
yarn db:seed

# Option 3: Full database setup
yarn setup-db
```

#### **Custom Admin Creation**

```bash
# Interactive mode - prompts for details
yarn create-admin

# Command line mode - specify details
yarn create-admin --email admin@yourdomain.com --password securepassword --name "Your Name"
```

### Admin Login Flow

#### **Automatic Redirect System**

When an admin logs in, they are automatically redirected to the admin dashboard:

1. **Login**: Go to `http://localhost:3000/login`
2. **Enter credentials**: `dev@dev.com` / `dev`
3. **Automatic redirect**: System detects admin role and redirects to `/admin/dashboard`
4. **No profile creation**: Admin users skip the profile selection screen entirely

#### **Role-Based Access Control**

- **Admin users**: Automatically redirected to admin dashboard
- **Regular users**: Continue to normal profile creation flow
- **Artists**: Access artist-specific dashboard features

### Security Considerations

#### **Development vs Production**

- **Development**: Use default credentials for quick setup
- **Production**: Create secure admin accounts with strong passwords
- **Never use default credentials in production**

#### **Admin Account Features**

Once created, admin accounts have:

- **Full platform access** to all features
- **Admin dashboard** at `/admin/dashboard`
- **User management** capabilities
- **Content moderation** tools
- **System analytics** and monitoring
- **Premium features** enabled by default

### Troubleshooting Admin Setup

#### **"Admin account already exists"**

- Use the existing admin account
- Create a new admin with different email
- Delete the existing admin and recreate

#### **"Database connection failed"**

- Verify `DATABASE_URL` in `.env.local`
- Ensure database is running
- Check database permissions

#### **Admin not redirecting to dashboard**

- Check that user has `role: 'ADMIN'` in database
- Verify session includes role information
- Check browser console for errors

## 🚀 Step-by-Step Implementation

### 1. Admin Dashboard Layout

#### `src/app/(dashboard)/admin/dashboard/page.tsx`

```typescript
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import AdminDashboard from '@/components/admin/AdminDashboard'
import SystemStats from '@/components/admin/SystemStats'
import QuickActions from '@/components/admin/QuickActions'
import RecentActivity from '@/components/admin/RecentActivity'

async function getAdminData() {
  // Get system-wide statistics
  const totalUsers = await prisma.user.count()
  const totalTracks = await prisma.track.count()
  const totalPlays = await prisma.playEvent.count()
  const totalSmartLinks = await prisma.smartLink.count()

  // Get user statistics by role
  const usersByRole = await prisma.user.groupBy({
    by: ['role'],
    _count: {
      id: true
    }
  })

  // Get recent activity
  const recentUsers = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    }
  })

  const recentTracks = await prisma.track.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      artist: {
        select: {
          name: true,
        }
      }
    }
  })

  // Get pending moderation items
  const pendingReports = await prisma.report.findMany({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      reporter: {
        select: {
          name: true,
        }
      }
    }
  })

  // Get system performance metrics
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const todayPlays = await prisma.playEvent.count({
    where: {
      timestamp: {
        gte: today
      }
    }
  })

  const todayUsers = await prisma.user.count({
    where: {
      createdAt: {
        gte: today
      }
    }
  })

  const todayTracks = await prisma.track.count({
    where: {
      createdAt: {
        gte: today
      }
    }
  })

  return {
    stats: {
      totalUsers,
      totalTracks,
      totalPlays,
      totalSmartLinks,
      todayPlays,
      todayUsers,
      todayTracks,
    },
    usersByRole,
    recentUsers,
    recentTracks,
    pendingReports,
  }
}

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/login')
  }

  const adminData = await getAdminData()

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Dashboard Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Admin Dashboard
              </h1>
              <p className="mt-2 text-gray-600">
                System administration and platform oversight
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                Admin Access
              </span>
            </div>
          </div>
        </div>

        {/* System Statistics */}
        <SystemStats stats={adminData.stats} usersByRole={adminData.usersByRole} />

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
          <QuickActions />
        </div>

        {/* Recent Activity */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <RecentActivity
              recentUsers={adminData.recentUsers}
              recentTracks={adminData.recentTracks}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pending Reports */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Pending Reports ({adminData.pendingReports.length})
              </h3>
              <div className="space-y-3">
                {adminData.pendingReports.map((report) => (
                  <div key={report.id} className="text-sm">
                    <p className="font-medium text-gray-900">
                      {report.reporter.name}
                    </p>
                    <p className="text-gray-600">{report.reason}</p>
                    <p className="text-gray-400 text-xs">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
              <a
                href="/admin/reports"
                className="mt-4 inline-block text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                View All Reports →
              </a>
            </div>

            {/* System Health */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                System Health
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Database</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Healthy
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Storage</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    67% Used
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">API Status</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Operational
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
```

### 2. System Stats Component

#### `src/components/admin/SystemStats.tsx`

```typescript
'use client'

import { motion } from 'framer-motion'
import {
  UsersIcon,
  MusicalNoteIcon,
  PlayIcon,
  LinkIcon,
  TrendingUpIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

interface SystemStatsProps {
  stats: {
    totalUsers: number
    totalTracks: number
    totalPlays: number
    totalSmartLinks: number
    todayPlays: number
    todayUsers: number
    todayTracks: number
  }
  usersByRole: Array<{
    role: string
    _count: { id: number }
  }>
}

export default function SystemStats({ stats, usersByRole }: SystemStatsProps) {
  const statItems = [
    {
      label: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      icon: UsersIcon,
      color: 'bg-blue-500',
      change: `+${stats.todayUsers} today`,
      changeType: 'positive'
    },
    {
      label: 'Total Tracks',
      value: stats.totalTracks.toLocaleString(),
      icon: MusicalNoteIcon,
      color: 'bg-green-500',
      change: `+${stats.todayTracks} today`,
      changeType: 'positive'
    },
    {
      label: 'Total Plays',
      value: stats.totalPlays.toLocaleString(),
      icon: PlayIcon,
      color: 'bg-purple-500',
      change: `+${stats.todayPlays} today`,
      changeType: 'positive'
    },
    {
      label: 'Smart Links',
      value: stats.totalSmartLinks.toLocaleString(),
      icon: LinkIcon,
      color: 'bg-orange-500',
      change: 'Active',
      changeType: 'neutral'
    }
  ]

  const userRoleData = usersByRole.map(item => ({
    role: item.role,
    count: item._count.id,
    percentage: Math.round((item._count.id / stats.totalUsers) * 100)
  }))

  return (
    <div className="space-y-8">
      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statItems.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -5 }}
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${item.color}`}>
                <item.icon className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-600">{item.label}</p>
                <p className="text-2xl font-semibold text-gray-900">{item.value}</p>
              </div>
            </div>

            <div className="mt-4">
              <span className={`text-sm font-medium ${
                item.changeType === 'positive' ? 'text-green-600' :
                item.changeType === 'negative' ? 'text-red-600' :
                'text-gray-600'
              }`}>
                {item.change}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* User Role Distribution */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">User Distribution</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {userRoleData.map((roleData, index) => (
            <motion.div
              key={roleData.role}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="text-center"
            >
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {roleData.count}
              </div>
              <div className="text-sm text-gray-600 mb-1">
                {roleData.role.charAt(0).toUpperCase() + roleData.role.slice(1).toLowerCase()}s
              </div>
              <div className="text-xs text-gray-500">
                {roleData.percentage}% of total users
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

### 3. User Management Page

#### `src/app/(dashboard)/admin/users/page.tsx`

```typescript
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import UserManagement from '@/components/admin/UserManagement'

async function getUsersData() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: {
          tracks: true,
          playlists: true,
          followers: true,
          following: true,
        }
      },
      subscription: {
        select: {
          status: true,
        }
      }
    }
  })

  return users
}

export default async function UsersPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/login')
  }

  const users = await getUsersData()

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            User Management
          </h1>
          <p className="mt-2 text-gray-600">
            Manage users, roles, and platform access
          </p>
        </div>

        <UserManagement users={users} />
      </div>
    </div>
  )
}
```

### 4. User Management Component

#### `src/components/admin/UserManagement.tsx`

```typescript
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ShieldCheckIcon,
  UserIcon
} from '@heroicons/react/24/outline'

interface User {
  id: string
  name: string
  email: string
  role: string
  isPremium: boolean
  createdAt: string
  _count: {
    tracks: number
    playlists: number
    followers: number
    following: number
  }
  subscription?: {
    status: string
  }
}

interface UserManagementProps {
  users: User[]
}

export default function UserManagement({ users }: UserManagementProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const router = useRouter()

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === 'all' || user.role === roleFilter.toUpperCase()
    return matchesSearch && matchesRole
  })

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      })

      if (response.ok) {
        router.refresh()
        setIsEditing(false)
      } else {
        const error = await response.json()
        alert(error.message || 'Failed to update user role')
      }
    } catch (error) {
      console.error('Error updating user role:', error)
      alert('An error occurred while updating user role')
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.refresh()
      } else {
        const error = await response.json()
        alert(error.message || 'Failed to delete user')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('An error occurred while deleting user')
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-100 text-red-800'
      case 'ARTIST':
        return 'bg-blue-100 text-blue-800'
      case 'USER':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Search and Filter */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <FunnelIcon className="w-5 h-5 text-gray-400" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Roles</option>
              <option value="user">Users</option>
              <option value="artist">Artists</option>
              <option value="admin">Admins</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stats
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Joined
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <motion.tr
                key={user.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="hover:bg-gray-50"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                        <UserIcon className="w-6 h-6 text-gray-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {user.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {user.email}
                      </div>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                    {user.role}
                  </span>
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    {user.isPremium && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Premium
                      </span>
                    )}
                    {user.subscription && (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.subscription.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.subscription.status}
                      </span>
                    )}
                  </div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="space-y-1">
                    <div>{user._count.tracks} tracks</div>
                    <div>{user._count.followers} followers</div>
                  </div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>

                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-2">
                    <button
                      onClick={() => setSelectedUser(user)}
                      className="text-blue-600 hover:text-blue-900"
                      title="View details"
                    >
                      <EyeIcon className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        setSelectedUser(user)
                        setIsEditing(true)
                      }}
                      className="text-indigo-600 hover:text-indigo-900"
                      title="Edit user"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>

                    {user.role !== 'ADMIN' && (
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete user"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* User Details Modal */}
      <AnimatePresence>
        {selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">
                  {isEditing ? 'Edit User' : 'User Details'}
                </h3>
                <button
                  onClick={() => {
                    setSelectedUser(null)
                    setIsEditing(false)
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role
                    </label>
                    <select
                      value={selectedUser.role}
                      onChange={(e) => handleRoleChange(selectedUser.id, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="USER">User</option>
                      <option value="ARTIST">Artist</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isPremium"
                      checked={selectedUser.isPremium}
                      onChange={(e) => {
                        // Handle premium status change
                      }}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <label htmlFor="isPremium" className="text-sm text-gray-700">
                      Premium User
                    </label>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900">{selectedUser.name}</h4>
                    <p className="text-gray-600">{selectedUser.email}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Role</p>
                      <p className="text-sm text-gray-900">{selectedUser.role}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Status</p>
                      <p className="text-sm text-gray-900">
                        {selectedUser.isPremium ? 'Premium' : 'Basic'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Tracks</p>
                      <p className="text-sm text-gray-900">{selectedUser._count.tracks}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Followers</p>
                      <p className="text-sm text-gray-900">{selectedUser._count.followers}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700">Joined</p>
                    <p className="text-sm text-gray-900">
                      {new Date(selectedUser.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setSelectedUser(null)
                    setIsEditing(false)
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
```

### 5. Admin API Routes

#### `src/app/api/admin/users/[id]/role/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { role } = body;

    if (!role || !['USER', 'ARTIST', 'ADMIN'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Prevent admin from changing their own role
    if (params.id === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot change your own role' },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    return NextResponse.json({
      message: 'User role updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

#### `src/app/api/admin/users/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Prevent admin from deleting themselves
    if (params.id === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Check if user exists and is not an admin
    const user = await prisma.user.findUnique({
      where: { id: params.id },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.role === 'ADMIN') {
      return NextResponse.json(
        { error: 'Cannot delete admin users' },
        { status: 400 }
      );
    }

    // Delete user and all associated data
    await prisma.user.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## ✅ Testing Requirements

### Before Moving to Next Phase:

1. **Admin access control works** - Only admins can access admin features
2. **User management functional** - Can view, edit, and delete users
3. **System stats display** - Dashboard shows accurate platform metrics
4. **Role management works** - Can change user roles and permissions
5. **Quick actions functional** - All admin action buttons work correctly
6. **Responsive design** - Admin dashboard works on all device sizes

### Test Commands:

```bash
# Test admin access control
# 1. Try accessing as non-admin user
# 2. Verify admin-only features are protected
# 3. Test role-based access control

# Test user management
# 1. View user list and details
# 2. Change user roles
# 3. Delete users (non-admin)
# 4. Verify data integrity
```

## 🚨 Common Issues & Solutions

### Issue: Admin access not working

**Solution**: Check user role in database, verify session data, check middleware configuration

### Issue: User management failing

**Solution**: Check API routes, verify permissions, check database constraints

### Issue: System stats not accurate

**Solution**: Verify database queries, check data relationships, validate aggregation logic

### Issue: Role changes not persisting

**Solution**: Check database transactions, verify API responses, check for validation errors

## 📝 Notes

- Implement proper audit logging for admin actions
- Add confirmation dialogs for destructive actions
- Consider implementing admin activity tracking
- Add bulk user management features
- Implement admin notification system

## 🔗 Next Phase

Once this phase is complete and tested, proceed to [Phase 13: Content Moderation](./13-content-moderation.md)
