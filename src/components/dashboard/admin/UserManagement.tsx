'use client';

import { useState, useEffect } from 'react';
import {
  Button,
  Chip,
  Avatar,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Input,
  Select,
  SelectItem,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Pagination,
} from '@heroui/react';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  EllipsisVerticalIcon,
  UserGroupIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { UserRole } from '@prisma/client';

interface User {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: UserRole;
  isActive: boolean;
  isPremium: boolean;
  createdAt: Date;
  updatedAt: Date;
  artistProfile?: {
    id: string;
    artistName: string;
    isVerified: boolean;
  } | null;
  _count?: {
    tracks: number;
    playEvents: number;
  };
}

interface UserManagementProps {
  onUserAction?: (_action: string, _user: User) => void;
}

export default function UserManagement({ onUserAction }: UserManagementProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionType, setActionType] = useState<
    'view' | 'edit' | 'deactivate' | 'activate' | 'delete'
  >('view');

  const usersPerPage = 10;

  useEffect(() => {
    fetchUsers();
  }, [currentPage, searchTerm, roleFilter, statusFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: usersPerPage.toString(),
        search: searchTerm,
        role: roleFilter,
        status: statusFilter,
      });

      const response = await fetch(`/api/admin/users?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.users);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (action: string, user: User) => {
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} user`);
      }

      // Refresh users list
      await fetchUsers();
      onUserAction?.(action, user);
    } catch (err) {
      console.error(`Error ${action}ing user:`, err);
      setError(err instanceof Error ? err.message : `Failed to ${action} user`);
    }
  };

  const openModal = (
    user: User,
    action: 'view' | 'edit' | 'deactivate' | 'activate' | 'delete'
  ) => {
    setSelectedUser(user);
    setActionType(action);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  const confirmAction = () => {
    if (!selectedUser) return;

    if (actionType === 'deactivate' || actionType === 'activate') {
      handleUserAction(actionType, selectedUser);
    } else if (actionType === 'delete') {
      handleUserAction('delete', selectedUser);
    }

    closeModal();
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return 'danger';
      case 'ARTIST':
        return 'primary';
      case 'USER':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'success' : 'danger';
  };

  const getStatusText = (isActive: boolean) => {
    return isActive ? 'Active' : 'Inactive';
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.artistProfile?.artistName
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && user.isActive) ||
      (statusFilter === 'inactive' && !user.isActive);

    return matchesSearch && matchesRole && matchesStatus;
  });

  if (loading) {
    return (
      <div className='space-y-6'>
        <div className='bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700'>
          <div className='p-8 text-center'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto'></div>
            <p className='mt-4 text-gray-500 dark:text-gray-400'>
              Loading users...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700'>
        <div className='px-6 py-4 border-b border-gray-200 dark:border-slate-700'>
          <div className='flex items-center justify-between'>
            <div>
              <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
                User Management
              </h3>
              <p className='text-sm text-gray-500 dark:text-gray-400'>
                Manage all platform users and artists
              </p>
            </div>
            <div className='flex items-center gap-4'>
              <div className='text-sm text-gray-500 dark:text-gray-400'>
                {users.length} users
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className='p-6 border-b border-gray-200 dark:border-slate-700'>
          <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
            <Input
              placeholder='Search users...'
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              startContent={
                <MagnifyingGlassIcon className='w-4 h-4 text-gray-400' />
              }
              className='max-w-sm'
            />

            <Select
              placeholder='Filter by role'
              selectedKeys={[roleFilter]}
              onSelectionChange={keys =>
                setRoleFilter(Array.from(keys)[0] as string)
              }
            >
              <SelectItem key='all'>All Roles</SelectItem>
              <SelectItem key='USER'>Users</SelectItem>
              <SelectItem key='ARTIST'>Artists</SelectItem>
              <SelectItem key='ADMIN'>Admins</SelectItem>
            </Select>

            <Select
              placeholder='Filter by status'
              selectedKeys={[statusFilter]}
              onSelectionChange={keys =>
                setStatusFilter(Array.from(keys)[0] as string)
              }
            >
              <SelectItem key='all'>All Status</SelectItem>
              <SelectItem key='active'>Active</SelectItem>
              <SelectItem key='inactive'>Inactive</SelectItem>
            </Select>

            <Button
              color='primary'
              startContent={<FunnelIcon className='w-4 h-4' />}
              onPress={fetchUsers}
            >
              Apply Filters
            </Button>
          </div>
        </div>

        {/* Users Table */}
        <div className='p-6'>
          {error && (
            <div className='mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg'>
              <p className='text-red-600 dark:text-red-400'>{error}</p>
            </div>
          )}

          <Table aria-label='Users table'>
            <TableHeader>
              <TableColumn>USER</TableColumn>
              <TableColumn>ROLE</TableColumn>
              <TableColumn>STATUS</TableColumn>
              <TableColumn>JOINED</TableColumn>
              <TableColumn>ACTIONS</TableColumn>
            </TableHeader>
            <TableBody>
              {filteredUsers.map(user => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className='flex items-center gap-3'>
                      <Avatar
                        src={user.image || undefined}
                        name={user.name || user.email}
                        size='sm'
                      />
                      <div>
                        <div className='font-medium text-gray-900 dark:text-white'>
                          {user.name || 'No Name'}
                        </div>
                        <div className='text-sm text-gray-500 dark:text-gray-400'>
                          {user.email}
                        </div>
                        {user.artistProfile && (
                          <div className='text-xs text-blue-600 dark:text-blue-400'>
                            @{user.artistProfile.artistName}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Chip
                      color={getRoleColor(user.role)}
                      size='sm'
                      variant='flat'
                    >
                      {user.role}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <Chip
                      color={getStatusColor(user.isActive)}
                      size='sm'
                      variant='flat'
                    >
                      {getStatusText(user.isActive)}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <div className='text-sm text-gray-500 dark:text-gray-400'>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Dropdown>
                      <DropdownTrigger>
                        <Button isIconOnly size='sm' variant='light'>
                          <EllipsisVerticalIcon className='w-4 h-4' />
                        </Button>
                      </DropdownTrigger>
                      <DropdownMenu aria-label='User actions'>
                        <DropdownItem
                          key='view'
                          startContent={<EyeIcon className='w-4 h-4' />}
                          onPress={() => openModal(user, 'view')}
                        >
                          View Details
                        </DropdownItem>
                        <DropdownItem
                          key='edit'
                          startContent={<PencilIcon className='w-4 h-4' />}
                          onPress={() => openModal(user, 'edit')}
                        >
                          Edit User
                        </DropdownItem>
                        {user.isActive ? (
                          <DropdownItem
                            key='deactivate'
                            startContent={<XCircleIcon className='w-4 h-4' />}
                            className='text-danger'
                            onPress={() => openModal(user, 'deactivate')}
                          >
                            Deactivate
                          </DropdownItem>
                        ) : (
                          <DropdownItem
                            key='activate'
                            startContent={
                              <CheckCircleIcon className='w-4 h-4' />
                            }
                            className='text-success'
                            onPress={() => openModal(user, 'activate')}
                          >
                            Activate
                          </DropdownItem>
                        )}
                        <DropdownItem
                          key='delete'
                          startContent={<TrashIcon className='w-4 h-4' />}
                          className='text-danger'
                          onPress={() => openModal(user, 'delete')}
                        >
                          Delete User
                        </DropdownItem>
                      </DropdownMenu>
                    </Dropdown>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredUsers.length === 0 && (
            <div className='text-center py-8'>
              <UserGroupIcon className='w-12 h-12 text-gray-400 mx-auto mb-4' />
              <p className='text-gray-500 dark:text-gray-400'>No users found</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className='flex justify-center mt-6'>
              <Pagination
                total={totalPages}
                page={currentPage}
                onChange={setCurrentPage}
                showControls
              />
            </div>
          )}
        </div>
      </div>

      {/* User Details Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        size={actionType === 'view' ? '2xl' : 'md'}
      >
        <ModalContent>
          <ModalHeader>
            {actionType === 'view' && 'User Details'}
            {actionType === 'edit' && 'Edit User'}
            {actionType === 'deactivate' && 'Deactivate User'}
            {actionType === 'activate' && 'Activate User'}
            {actionType === 'delete' && 'Delete User'}
          </ModalHeader>
          <ModalBody>
            {selectedUser && (
              <div className='space-y-4'>
                {actionType === 'view' && (
                  <div className='space-y-4'>
                    <div className='flex items-center gap-4'>
                      <Avatar
                        src={selectedUser.image || undefined}
                        name={selectedUser.name || selectedUser.email}
                        size='lg'
                      />
                      <div>
                        <h3 className='text-lg font-semibold'>
                          {selectedUser.name || 'No Name'}
                        </h3>
                        <p className='text-gray-500'>{selectedUser.email}</p>
                        <div className='flex gap-2 mt-2'>
                          <Chip
                            color={getRoleColor(selectedUser.role)}
                            size='sm'
                          >
                            {selectedUser.role}
                          </Chip>
                          <Chip
                            color={getStatusColor(selectedUser.isActive)}
                            size='sm'
                          >
                            {getStatusText(selectedUser.isActive)}
                          </Chip>
                          {selectedUser.isPremium && (
                            <Chip color='warning' size='sm'>
                              Premium
                            </Chip>
                          )}
                        </div>
                      </div>
                    </div>

                    {selectedUser.artistProfile && (
                      <div className='bg-gray-50 dark:bg-slate-700 p-4 rounded-lg'>
                        <h4 className='font-medium mb-2'>Artist Profile</h4>
                        <p>
                          <strong>Name:</strong>{' '}
                          {selectedUser.artistProfile.artistName}
                        </p>
                        <p>
                          <strong>Verified:</strong>{' '}
                          {selectedUser.artistProfile.isVerified ? 'Yes' : 'No'}
                        </p>
                      </div>
                    )}

                    <div className='grid grid-cols-2 gap-4 text-sm'>
                      <div>
                        <strong>Joined:</strong>{' '}
                        {new Date(selectedUser.createdAt).toLocaleDateString()}
                      </div>
                      <div>
                        <strong>Last Updated:</strong>{' '}
                        {new Date(selectedUser.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                )}

                {(actionType === 'deactivate' || actionType === 'activate') && (
                  <div className='text-center'>
                    <p className='text-lg mb-4'>
                      Are you sure you want to {actionType} this user?
                    </p>
                    <p className='text-gray-500'>
                      {selectedUser.name || selectedUser.email}
                    </p>
                  </div>
                )}

                {actionType === 'delete' && (
                  <div className='text-center'>
                    <p className='text-lg mb-4 text-red-600'>
                      Are you sure you want to delete this user?
                    </p>
                    <p className='text-gray-500 mb-4'>
                      This action cannot be undone. All user data will be
                      permanently removed.
                    </p>
                    <p className='font-medium'>
                      {selectedUser.name || selectedUser.email}
                    </p>
                  </div>
                )}
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant='light' onPress={closeModal}>
              Cancel
            </Button>
            {(actionType === 'deactivate' ||
              actionType === 'activate' ||
              actionType === 'delete') && (
              <Button
                color={actionType === 'delete' ? 'danger' : 'primary'}
                onPress={confirmAction}
              >
                {actionType === 'deactivate' && 'Deactivate'}
                {actionType === 'activate' && 'Activate'}
                {actionType === 'delete' && 'Delete'}
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
