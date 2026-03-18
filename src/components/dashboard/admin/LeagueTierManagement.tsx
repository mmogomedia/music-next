'use client';

import { useState, useEffect } from 'react';
import FlemojiModal, {
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '@/components/shared/FlemojiModal';
import {
  Card,
  CardBody,
  Button,
  Input,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/react';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  TrophyIcon,
} from '@heroicons/react/24/outline';

interface LeagueTier {
  id: string;
  code: string;
  name: string;
  targetSize: number;
  minScore: number;
  maxScore: number | null;
  refreshIntervalHours: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export default function LeagueTierManagement() {
  const [tiers, setTiers] = useState<LeagueTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<LeagueTier | null>(null);
  const [form, setForm] = useState<Partial<LeagueTier>>({
    code: '',
    name: '',
    targetSize: 50,
    minScore: 0,
    maxScore: null,
    refreshIntervalHours: 24,
    isActive: true,
    sortOrder: 0,
  });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchTiers();
  }, []);

  const fetchTiers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/league/tiers');
      if (res.ok) {
        const data = await res.json();
        setTiers(data.tiers || []);
      }
    } catch (error) {
      console.error('Error fetching league tiers:', error);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    const maxSortOrder =
      tiers.length > 0 ? Math.max(...tiers.map(t => t.sortOrder), 0) : -1;
    setForm({
      code: '',
      name: '',
      targetSize: 50,
      minScore: 0,
      maxScore: null,
      refreshIntervalHours: 24,
      isActive: true,
      sortOrder: maxSortOrder + 1,
    });
    setShowModal(true);
  };

  const openEdit = (tier: LeagueTier) => {
    setEditing(tier);
    setForm({
      code: tier.code,
      name: tier.name,
      targetSize: tier.targetSize,
      minScore: tier.minScore,
      maxScore: tier.maxScore,
      refreshIntervalHours: tier.refreshIntervalHours,
      isActive: tier.isActive,
      sortOrder: tier.sortOrder,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const url = editing
        ? `/api/admin/league/tiers/${editing.id}`
        : '/api/admin/league/tiers';
      const method = editing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setShowModal(false);
        fetchTiers();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to save tier');
      }
    } catch (error) {
      console.error('Error saving tier:', error);
      alert('Failed to save tier');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tier?')) {
      return;
    }

    try {
      setDeletingId(id);
      const res = await fetch(`/api/admin/league/tiers/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchTiers();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to delete tier');
      }
    } catch (error) {
      console.error('Error deleting tier:', error);
      alert('Failed to delete tier');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardBody>
          <p className='text-center py-8 text-gray-500 dark:text-gray-400'>
            Loading...
          </p>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-xl font-semibold text-gray-900 dark:text-white'>
            League Tiers
          </h2>
          <p className='text-sm text-gray-500 dark:text-gray-400 mt-1'>
            Configure league tier settings, sizes, and refresh intervals
          </p>
        </div>
        <Button
          color='primary'
          startContent={<PlusIcon className='w-4 h-4' />}
          onPress={openCreate}
        >
          Create Tier
        </Button>
      </div>

      <Card>
        <CardBody className='p-0'>
          <Table aria-label='League tiers table' removeWrapper>
            <TableHeader>
              <TableColumn>CODE</TableColumn>
              <TableColumn>NAME</TableColumn>
              <TableColumn>TARGET SIZE</TableColumn>
              <TableColumn>SCORE RANGE</TableColumn>
              <TableColumn>REFRESH</TableColumn>
              <TableColumn>ORDER</TableColumn>
              <TableColumn>STATUS</TableColumn>
              <TableColumn>ACTIONS</TableColumn>
            </TableHeader>
            <TableBody>
              {tiers.map(tier => (
                <TableRow key={tier.id}>
                  <TableCell>
                    <code className='text-xs bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded'>
                      {tier.code}
                    </code>
                  </TableCell>
                  <TableCell>
                    <div className='flex items-center gap-2'>
                      <TrophyIcon className='w-4 h-4 text-gray-400' />
                      <span className='font-medium'>{tier.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{tier.targetSize}</TableCell>
                  <TableCell>
                    {tier.minScore}
                    {tier.maxScore !== null ? ` - ${tier.maxScore}` : '+'}
                  </TableCell>
                  <TableCell>{tier.refreshIntervalHours}h</TableCell>
                  <TableCell>{tier.sortOrder}</TableCell>
                  <TableCell>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        tier.isActive
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-gray-400'
                      }`}
                    >
                      {tier.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className='flex items-center gap-2'>
                      <Button
                        size='sm'
                        variant='light'
                        isIconOnly
                        onPress={() => openEdit(tier)}
                      >
                        <PencilIcon className='w-4 h-4' />
                      </Button>
                      <Button
                        size='sm'
                        variant='light'
                        color='danger'
                        isIconOnly
                        isLoading={deletingId === tier.id}
                        onPress={() => handleDelete(tier.id)}
                      >
                        <TrashIcon className='w-4 h-4' />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      <FlemojiModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        size='2xl'
      >
        <ModalContent>
          <ModalHeader>
            {editing ? 'Edit League Tier' : 'Create League Tier'}
          </ModalHeader>
          <ModalBody>
            <div className='space-y-4'>
              <Input
                label='Code'
                placeholder='TIER1'
                value={form.code || ''}
                onChange={e =>
                  setForm({ ...form, code: e.target.value.toUpperCase() })
                }
                description='Unique identifier (e.g., TIER1, TIER2)'
                isRequired
                isDisabled={!!editing}
              />
              <Input
                label='Name'
                placeholder='Top 50'
                value={form.name || ''}
                onChange={e => setForm({ ...form, name: e.target.value })}
                description='Display name for the tier'
                isRequired
              />
              <Input
                label='Target Size'
                type='number'
                value={form.targetSize?.toString() || ''}
                onChange={e =>
                  setForm({
                    ...form,
                    targetSize: parseInt(e.target.value) || 0,
                  })
                }
                description='Number of artists to show in this tier'
                isRequired
              />
              <div className='grid grid-cols-2 gap-4'>
                <Input
                  label='Min Score'
                  type='number'
                  step='0.1'
                  value={form.minScore?.toString() || ''}
                  onChange={e =>
                    setForm({
                      ...form,
                      minScore: parseFloat(e.target.value) || 0,
                    })
                  }
                  description='Minimum eligibility score'
                  isRequired
                />
                <Input
                  label='Max Score'
                  type='number'
                  step='0.1'
                  value={form.maxScore?.toString() || ''}
                  onChange={e =>
                    setForm({
                      ...form,
                      maxScore: e.target.value
                        ? parseFloat(e.target.value)
                        : null,
                    })
                  }
                  description='Maximum score (leave empty for no max)'
                />
              </div>
              <Input
                label='Refresh Interval (hours)'
                type='number'
                value={form.refreshIntervalHours?.toString() || ''}
                onChange={e =>
                  setForm({
                    ...form,
                    refreshIntervalHours: parseInt(e.target.value) || 24,
                  })
                }
                description='How often this tier refreshes'
                isRequired
              />
              <Input
                label='Sort Order'
                type='number'
                value={form.sortOrder?.toString() || ''}
                onChange={e =>
                  setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })
                }
                description='Display order (lower = first)'
                isRequired
              />
              <Switch
                isSelected={form.isActive ?? true}
                onValueChange={value => setForm({ ...form, isActive: value })}
              >
                Active
              </Switch>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant='light' onPress={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button color='primary' onPress={handleSave} isLoading={saving}>
              {editing ? 'Update' : 'Create'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </FlemojiModal>
    </div>
  );
}
