'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Chip,
  Card,
  CardBody,
} from '@heroui/react';
import { PlusIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline';

interface TrackCompletionRule {
  id: string;
  field: string;
  label: string;
  category: 'required' | 'high' | 'medium' | 'low';
  weight: number;
  description?: string | null;
  group?: string | null;
  isRequired: boolean;
  isActive: boolean;
  order: number;
}

const CATEGORY_COLORS = {
  required: 'danger',
  high: 'secondary',
  medium: 'primary',
  low: 'default',
} as const;

export default function TrackCompletionPage() {
  const [rules, setRules] = useState<TrackCompletionRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<TrackCompletionRule | null>(null);
  const [form, setForm] = useState<Partial<TrackCompletionRule>>({
    category: 'medium',
    weight: 5,
    isRequired: false,
    isActive: true,
    order: 0,
  });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [totalWeight, setTotalWeight] = useState(0);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/track-completion-rules');
      const data = await res.json();
      setRules(data.rules || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  useEffect(() => {
    const total = rules.reduce(
      (sum, r) => sum + (r.isActive ? r.weight : 0),
      0
    );
    setTotalWeight(total);
  }, [rules]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      field: '',
      label: '',
      category: 'medium',
      weight: 5,
      description: '',
      group: '',
      isRequired: false,
      isActive: true,
      order: rules.length,
    });
    setShowModal(true);
  };

  const openEdit = (rule: TrackCompletionRule) => {
    setEditing(rule);
    setForm({ ...rule });
    setShowModal(true);
  };

  const saveRule = async () => {
    if (!form.field || !form.label || form.weight === undefined) return;
    setSaving(true);
    try {
      if (editing) {
        const res = await fetch(
          `/api/admin/track-completion-rules/${editing.id}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form),
          }
        );
        if (res.ok) {
          setShowModal(false);
          await fetchRules();
        } else {
          const error = await res.json();
          alert(error.error || 'Failed to save rule');
        }
      } else {
        const res = await fetch('/api/admin/track-completion-rules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        if (res.ok) {
          setShowModal(false);
          await fetchRules();
        } else {
          const error = await res.json();
          alert(error.error || 'Failed to create rule');
        }
      }
    } finally {
      setSaving(false);
    }
  };

  const deleteRule = async (id: string) => {
    if (!confirm('Are you sure you want to delete this rule?')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/track-completion-rules/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await fetchRules();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to delete rule');
      }
    } finally {
      setDeletingId(null);
    }
  };

  const sorted = useMemo(
    () =>
      rules
        .slice()
        .sort((a, b) => a.order - b.order || a.field.localeCompare(b.field)),
    [rules]
  );

  const groupedRules = useMemo(() => {
    const groups: Record<string, TrackCompletionRule[]> = {};
    sorted.forEach(rule => {
      const group = rule.group || 'Other';
      if (!groups[group]) groups[group] = [];
      groups[group].push(rule);
    });
    return groups;
  }, [sorted]);

  return (
    <div className='min-h-screen bg-gray-50 dark:bg-slate-900'>
      <div className='bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 sticky top-0 z-40'>
        <div className='max-w-7xl mx-auto px-4 py-4 flex items-center justify-between'>
          <div>
            <h1 className='text-lg font-semibold text-gray-900 dark:text-white'>
              Track Completion Rules
            </h1>
            <p className='text-sm text-gray-500 dark:text-gray-400 mt-1'>
              Manage gamification fields and weights for track completion
            </p>
          </div>
          <Button
            color='primary'
            onPress={openCreate}
            startContent={<PlusIcon className='w-4 h-4' />}
          >
            New Rule
          </Button>
        </div>
      </div>

      <div className='max-w-7xl mx-auto px-4 py-6 space-y-6'>
        {/* Total Weight Warning */}
        <Card>
          <CardBody>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                  Total Weight (Active Rules)
                </p>
                <p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
                  Should equal 100 for proper completion calculation
                </p>
              </div>
              <Chip
                color={
                  totalWeight === 100
                    ? 'success'
                    : totalWeight > 100
                      ? 'warning'
                      : 'danger'
                }
                variant='flat'
                size='lg'
              >
                {totalWeight}%
              </Chip>
            </div>
            {totalWeight !== 100 && (
              <p className='text-xs text-red-600 dark:text-red-400 mt-2'>
                {totalWeight < 100
                  ? `Missing ${100 - totalWeight}% - Add more weight to reach 100%`
                  : `Over by ${totalWeight - 100}% - Reduce weights to reach 100%`}
              </p>
            )}
          </CardBody>
        </Card>

        {/* Rules Table */}
        <div className='space-y-4'>
          {Object.entries(groupedRules).map(([group, groupRules]) => (
            <Card key={group}>
              <CardBody>
                <h2 className='text-md font-semibold text-gray-900 dark:text-white mb-4'>
                  {group}
                </h2>
                <Table aria-label={`Rules for ${group}`}>
                  <TableHeader>
                    <TableColumn>Field</TableColumn>
                    <TableColumn>Label</TableColumn>
                    <TableColumn>Category</TableColumn>
                    <TableColumn>Weight</TableColumn>
                    <TableColumn>Required</TableColumn>
                    <TableColumn>Active</TableColumn>
                    <TableColumn>Order</TableColumn>
                    <TableColumn>Actions</TableColumn>
                  </TableHeader>
                  <TableBody emptyContent={loading ? 'Loading…' : 'No rules'}>
                    {groupRules.map(rule => (
                      <TableRow key={rule.id}>
                        <TableCell className='font-mono text-xs'>
                          {rule.field}
                        </TableCell>
                        <TableCell className='font-medium'>
                          {rule.label}
                        </TableCell>
                        <TableCell>
                          <Chip
                            color={CATEGORY_COLORS[rule.category]}
                            variant='flat'
                            size='sm'
                          >
                            {rule.category}
                          </Chip>
                        </TableCell>
                        <TableCell>{rule.weight}%</TableCell>
                        <TableCell>
                          {rule.isRequired ? (
                            <Chip color='danger' variant='flat' size='sm'>
                              Required
                            </Chip>
                          ) : (
                            <span className='text-gray-400'>Optional</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            color={rule.isActive ? 'success' : 'default'}
                            variant='flat'
                            size='sm'
                          >
                            {rule.isActive ? 'Active' : 'Inactive'}
                          </Chip>
                        </TableCell>
                        <TableCell>{rule.order}</TableCell>
                        <TableCell>
                          <div className='flex gap-2'>
                            <Button
                              size='sm'
                              variant='light'
                              isIconOnly
                              onPress={() => openEdit(rule)}
                            >
                              <PencilIcon className='w-4 h-4' />
                            </Button>
                            <Button
                              size='sm'
                              variant='light'
                              color='danger'
                              isIconOnly
                              onPress={() => deleteRule(rule.id)}
                              isLoading={deletingId === rule.id}
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
          ))}
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} size='2xl'>
        <ModalContent>
          <ModalHeader>
            {editing ? 'Edit Completion Rule' : 'New Completion Rule'}
          </ModalHeader>
          <ModalBody>
            <div className='space-y-4'>
              <Input
                label='Field Name'
                placeholder='e.g. title, lyrics, description'
                value={form.field || ''}
                onChange={e => setForm(f => ({ ...f, field: e.target.value }))}
                isDisabled={!!editing}
                description='Must match the field name in TrackEditorValues'
              />
              <Input
                label='Display Label'
                placeholder='e.g. Track Title, Song Lyrics'
                value={form.label || ''}
                onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
              />
              <Select
                label='Category'
                selectedKeys={form.category ? [form.category] : []}
                onSelectionChange={keys => {
                  const category = Array.from(keys)[0] as
                    | 'required'
                    | 'high'
                    | 'medium'
                    | 'low'
                    | undefined;
                  setForm(f => ({ ...f, category }));
                }}
              >
                <SelectItem key='required'>Required</SelectItem>
                <SelectItem key='high'>High Priority</SelectItem>
                <SelectItem key='medium'>Medium Priority</SelectItem>
                <SelectItem key='low'>Low Priority</SelectItem>
              </Select>
              <Input
                label='Weight (%)'
                type='number'
                min={0}
                max={100}
                value={String(form.weight ?? 0)}
                onChange={e =>
                  setForm(f => ({
                    ...f,
                    weight: parseInt(e.target.value || '0', 10),
                  }))
                }
                description='Percentage points (0-100). Total should equal 100.'
              />
              <Input
                label='Group (Optional)'
                placeholder='e.g. Meta, Legal, Audio'
                value={form.group || ''}
                onChange={e =>
                  setForm(f => ({ ...f, group: e.target.value || null }))
                }
                description='Group rules together in the UI'
              />
              <Input
                label='Description (Optional)'
                placeholder='Help text for users'
                value={form.description || ''}
                onChange={e =>
                  setForm(f => ({ ...f, description: e.target.value || null }))
                }
              />
              <Input
                label='Order'
                type='number'
                value={String(form.order ?? 0)}
                onChange={e =>
                  setForm(f => ({
                    ...f,
                    order: parseInt(e.target.value || '0', 10),
                  }))
                }
                description='Display order (lower numbers appear first)'
              />
              <div className='flex items-center gap-4'>
                <Switch
                  isSelected={!!form.isRequired}
                  onValueChange={v => setForm(f => ({ ...f, isRequired: v }))}
                >
                  Required Field
                </Switch>
                <Switch
                  isSelected={form.isActive !== false}
                  onValueChange={v => setForm(f => ({ ...f, isActive: v }))}
                >
                  Active
                </Switch>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant='light' onPress={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button color='primary' onPress={saveRule} isLoading={saving}>
              {editing ? 'Save Changes' : 'Create Rule'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
