'use client'

import React, { useState, useEffect } from 'react'
import { Users, Plus, Search, Filter, Mail, Phone, MapPin, Calendar, UserPlus, Edit, Trash2, Crown, Shield, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { useAuth } from '@/app/providers'
import { dataService } from '@/lib/data-service'
import { toast } from 'sonner'

interface TeamMember {
  id: string
  name: string
  email: string
  role: 'admin' | 'manager' | 'member'
  department?: string
  position?: string
  phone?: string
  location?: string
  avatar_url?: string
  status: 'active' | 'inactive' | 'pending'
  joined_at: string
  last_active?: string
  skills: string[]
  projects_count: number
  tasks_count: number
  completion_rate: number
}

interface InviteMemberModalProps {
  onClose: () => void
  onInvite: (inviteData: { email: string; role: string; department?: string; message?: string }) => void
}

const InviteMemberModal: React.FC<InviteMemberModalProps> = ({ onClose, onInvite }) => {
  const [formData, setFormData] = useState({
    email: '',
    role: 'member',
    department: '',
    message: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onInvite(formData)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Invite Team Member</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="member">Member</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Department (Optional)</label>
            <input
              type="text"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Engineering, Design, Marketing..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Personal Message (Optional)</label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="Welcome to our team! Looking forward to working with you."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Send Invite
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const TeamMemberCard: React.FC<{ member: TeamMember; onEdit: (member: TeamMember) => void; onDelete: (memberId: string) => void }> = ({ member, onEdit, onDelete }) => {
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800'
      case 'manager': return 'bg-blue-100 text-blue-800'
      case 'member': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="h-4 w-4" />
      case 'manager': return <Shield className="h-4 w-4" />
      case 'member': return <Users className="h-4 w-4" />
      default: return <Users className="h-4 w-4" />
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
            {member.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{member.name}</h3>
            <p className="text-sm text-gray-600">{member.email}</p>
            {member.position && <p className="text-sm text-gray-500">{member.position}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(member.role)} flex items-center gap-1`}>
            {getRoleIcon(member.role)}
            {member.role}
          </span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(member.status)}`}>
            {member.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div className="flex items-center gap-2 text-gray-600">
          <Users className="h-4 w-4" />
          <span>{member.projects_count} projects</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <CheckCircle className="h-4 w-4" />
          <span>{member.tasks_count} tasks</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <span>Completion: {member.completion_rate}%</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <Calendar className="h-4 w-4" />
          <span>{new Date(member.joined_at).toLocaleDateString()}</span>
        </div>
      </div>

      {member.skills.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {member.skills.slice(0, 3).map((skill, index) => (
              <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                {skill}
              </span>
            ))}
            {member.skills.length > 3 && (
              <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs">
                +{member.skills.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2">
        <button
          onClick={() => onEdit(member)}
          className="p-2 text-gray-400 hover:text-blue-600"
        >
          <Edit className="h-4 w-4" />
        </button>
        <button
          onClick={() => onDelete(member.id)}
          className="p-2 text-gray-400 hover:text-red-600"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export default function EnhancedTeamPage() {
  const { user } = useAuth()
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    loadTeamMembers()
  }, [])

  const loadTeamMembers = async () => {
    try {
      setLoading(true)
      
      // Show current user as team owner
      if (user) {
        const currentUser: TeamMember = {
          id: user.id,
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
          email: user.email || '',
          role: 'admin',
          department: 'General',
          position: 'Project Owner',
          status: 'active',
          joined_at: user.created_at || new Date().toISOString(),
          skills: [],
          projects_count: 0,
          tasks_count: 0,
          completion_rate: 0
        }
        
        setMembers([currentUser])
      }
      
      // TODO: Load real team members from database when team feature is implemented
    } catch (error) {
      console.error('Error loading team members:', error)
      toast.error('Failed to load team members')
    } finally {
      setLoading(false)
    }
  }

  const handleInviteMember = async (inviteData: { email: string; role: string; department?: string; message?: string }) => {
    try {
      // Mock invite functionality
      toast.success(`Invitation sent to ${inviteData.email}`)
      
      // Add pending member to the list
      const newMember: TeamMember = {
        id: Date.now().toString(),
        name: inviteData.email.split('@')[0],
        email: inviteData.email,
        role: inviteData.role as any,
        department: inviteData.department,
        status: 'pending',
        joined_at: new Date().toISOString(),
        skills: [],
        projects_count: 0,
        tasks_count: 0,
        completion_rate: 0
      }
      
      setMembers(prev => [newMember, ...prev])
    } catch (error) {
      console.error('Error inviting member:', error)
      toast.error('Failed to send invitation')
    }
  }

  const handleEditMember = (member: TeamMember) => {
    // TODO: Implement edit functionality
    toast.info('Edit functionality coming soon')
  }

  const handleDeleteMember = (memberId: string) => {
    setMembers(prev => prev.filter(m => m.id !== memberId))
    toast.success('Team member removed')
  }

  const filteredMembers = members.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.position?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === 'all' || member.role === roleFilter
    const matchesStatus = statusFilter === 'all' || member.status === statusFilter
    return matchesSearch && matchesRole && matchesStatus
  })

  const teamStats = {
    total: members.length,
    active: members.filter(m => m.status === 'active').length,
    pending: members.filter(m => m.status === 'pending').length,
    averageCompletion: Math.round(members.reduce((acc, m) => acc + m.completion_rate, 0) / members.length) || 0
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Team Management</h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-2">Manage your team members and their roles</p>
          </div>
          <button
            onClick={() => setShowInviteModal(true)}
            className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 flex items-center justify-center gap-2 touch-manipulation w-full sm:w-auto"
          >
            <UserPlus className="h-5 w-5" />
            Invite Member
          </button>
        </div>

        {/* Team Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Members</p>
                <p className="text-2xl font-bold text-gray-900">{teamStats.total}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">{teamStats.active}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{teamStats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. Completion</p>
                <p className="text-2xl font-bold text-purple-600">{teamStats.averageCompletion}%</p>
              </div>
              <AlertCircle className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search team members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="member">Member</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>

        {/* Team Members Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMembers.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No team members found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || roleFilter !== 'all' || statusFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Get started by inviting your first team member'
                }
              </p>
              {(!searchTerm && roleFilter === 'all' && statusFilter === 'all') && (
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Invite Member
                </button>
              )}
            </div>
          ) : (
            filteredMembers.map((member) => (
              <TeamMemberCard
                key={member.id}
                member={member}
                onEdit={handleEditMember}
                onDelete={handleDeleteMember}
              />
            ))
          )}
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <InviteMemberModal
          onClose={() => setShowInviteModal(false)}
          onInvite={handleInviteMember}
        />
      )}
    </div>
  )
}














