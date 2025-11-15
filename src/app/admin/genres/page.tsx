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
  Switch,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/react';

interface GenreDto {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  isActive: boolean;
  order: number;
  colorHex?: string | null;
  icon?: string | null;
  aliases: string[];
  parentId?: string | null;
}

export default function AdminGenresPage() {
  const [genres, setGenres] = useState<GenreDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<GenreDto | null>(null);
  const [form, setForm] = useState<Partial<GenreDto>>({
    isActive: true,
    order: 0,
    aliases: [],
  });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchGenres = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/genres');
      const data = await res.json();
      setGenres(data.genres || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGenres();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({
      name: '',
      slug: '',
      description: '',
      isActive: true,
      order: 0,
      colorHex: '',
      icon: '',
      aliases: [],
    });
    setShowModal(true);
  };

  const openEdit = (g: GenreDto) => {
    setEditing(g);
    setForm({ ...g });
    setShowModal(true);
  };

  const saveGenre = async () => {
    if (!form.name || !form.slug) return;
    setSaving(true);
    try {
      const method = editing ? 'PATCH' : 'POST';
      const url = editing
        ? `/api/admin/genres/${editing.id}`
        : '/api/admin/genres';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          slug: form.slug,
          description: form.description,
          isActive: form.isActive,
          order: form.order,
          colorHex: form.colorHex,
          icon: form.icon,
          aliases: form.aliases || [],
          parentId: form.parentId || null,
        }),
      });
      if (res.ok) {
        setShowModal(false);
        await fetchGenres();
      }
    } finally {
      setSaving(false);
    }
  };

  const deleteGenre = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/genres/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchGenres();
      }
    } finally {
      setDeletingId(null);
    }
  };

  const sorted = useMemo(
    () =>
      genres
        .slice()
        .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name)),
    [genres]
  );

  return (
    <div className='min-h-screen bg-gray-50 dark:bg-slate-900'>
      <div className='bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 sticky top-0 z-40'>
        <div className='max-w-6xl mx-auto px-4 py-4 flex items-center justify-between'>
          <h1 className='text-lg font-semibold text-gray-900 dark:text-white'>
            Genres
          </h1>
          <Button color='primary' onPress={openCreate}>
            New Genre
          </Button>
        </div>
      </div>

      <div className='max-w-6xl mx-auto px-4 py-6'>
        <Table aria-label='Genres table'>
          <TableHeader>
            <TableColumn>Name</TableColumn>
            <TableColumn>Slug</TableColumn>
            <TableColumn>Active</TableColumn>
            <TableColumn>Order</TableColumn>
            <TableColumn>Aliases</TableColumn>
            <TableColumn>Actions</TableColumn>
          </TableHeader>
          <TableBody emptyContent={loading ? 'Loading…' : 'No genres'}>
            {sorted.map(g => (
              <TableRow key={g.id}>
                <TableCell className='font-medium'>{g.name}</TableCell>
                <TableCell className='text-gray-500'>{g.slug}</TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-0.5 text-xs rounded ${g.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}
                  >
                    {g.isActive ? 'Active' : 'Inactive'}
                  </span>
                </TableCell>
                <TableCell>{g.order}</TableCell>
                <TableCell className='text-gray-500'>
                  {g.aliases?.join(', ')}
                </TableCell>
                <TableCell className='text-right'>
                  <div className='flex gap-2 justify-end'>
                    <Button
                      size='sm'
                      variant='bordered'
                      onPress={() => openEdit(g)}
                    >
                      Edit
                    </Button>
                    <Button
                      size='sm'
                      color='danger'
                      variant='flat'
                      onPress={() => deleteGenre(g.id)}
                      isLoading={deletingId === g.id}
                    >
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} size='lg'>
        <ModalContent>
          <ModalHeader>{editing ? 'Edit Genre' : 'New Genre'}</ModalHeader>
          <ModalBody>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <Input
                label='Name'
                value={form.name || ''}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
              <Input
                label='Slug'
                value={form.slug || ''}
                onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
              />
              <Input
                label='Description'
                value={form.description || ''}
                onChange={e =>
                  setForm(f => ({ ...f, description: e.target.value }))
                }
                className='md:col-span-2'
              />
              <Input
                label='Color Hex'
                value={form.colorHex || ''}
                onChange={e =>
                  setForm(f => ({ ...f, colorHex: e.target.value }))
                }
              />
              <Input
                label='Icon'
                value={form.icon || ''}
                onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}
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
              />
              <Input
                label='Aliases (comma separated)'
                value={(form.aliases || []).join(', ')}
                onChange={e =>
                  setForm(f => ({
                    ...f,
                    aliases: e.target.value
                      .split(',')
                      .map(s => s.trim())
                      .filter(Boolean),
                  }))
                }
                className='md:col-span-2'
              />
              <div className='flex items-center gap-3 md:col-span-2'>
                <Switch
                  isSelected={!!form.isActive}
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
            <Button color='primary' onPress={saveGenre} isLoading={saving}>
              {editing ? 'Save Changes' : 'Create Genre'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
