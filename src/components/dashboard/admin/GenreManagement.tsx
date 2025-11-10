'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardBody,
  Button,
  Input,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Textarea,
} from '@heroui/react';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

interface Genre {
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
  createdAt: Date;
  updatedAt: Date;
}

export default function GenreManagement() {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Genre | null>(null);
  const [form, setForm] = useState<Partial<Genre>>({
    name: '',
    slug: '',
    description: '',
    isActive: true,
    order: 0,
    colorHex: '',
    icon: '',
    aliases: [],
  });
  const [aliasesInput, setAliasesInput] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchGenres();
  }, []);

  const fetchGenres = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/genres');
      if (res.ok) {
        const data = await res.json();
        setGenres(data.genres || []);
      }
    } catch (error) {
      console.error('Error fetching genres:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const openCreate = async () => {
    setEditing(null);

    // Get the max order from existing genres
    const maxOrder =
      genres.length > 0 ? Math.max(...genres.map(g => g.order), 0) : -1;
    const nextOrder = maxOrder + 10;

    setForm({
      name: '',
      slug: '',
      description: '',
      isActive: true,
      order: nextOrder,
      colorHex: '',
      icon: '',
      aliases: [],
    });
    setAliasesInput('');
    setShowModal(true);
  };

  const openEdit = (genre: Genre) => {
    setEditing(genre);
    setForm({ ...genre });
    setAliasesInput((genre.aliases || []).join(', '));
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.slug) {
      return;
    }

    setSaving(true);
    try {
      const method = editing ? 'PATCH' : 'POST';
      const url = editing
        ? `/api/admin/genres/${editing.id}`
        : '/api/admin/genres';

      // Parse aliases from the input string
      const aliases = aliasesInput
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          slug: form.slug,
          description: form.description || null,
          isActive: form.isActive ?? true,
          order: form.order ?? 0,
          colorHex: form.colorHex || null,
          icon: form.icon || null,
          aliases: aliases,
          parentId: form.parentId || null,
        }),
      });

      if (res.ok) {
        setShowModal(false);
        await fetchGenres();
      } else {
        const error = await res.json();
        console.error('Error saving genre:', error);
        alert('Failed to save genre. Please try again.');
      }
    } catch (error) {
      console.error('Error saving genre:', error);
      alert('An error occurred while saving the genre.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this genre?')) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/genres/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        await fetchGenres();
      } else {
        const error = await res.json();
        console.error('Error deleting genre:', error);
        alert('Failed to delete genre. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting genre:', error);
      alert('An error occurred while deleting the genre.');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredGenres = genres.filter(
    genre =>
      genre.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      genre.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      genre.aliases?.some(alias =>
        alias.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  const sortedGenres = [...filteredGenres].sort(
    (a, b) => a.order - b.order || a.name.localeCompare(b.name)
  );

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold text-gray-900 dark:text-white'>
            Genre Management
          </h2>
          <p className='text-sm text-gray-500 dark:text-gray-400 mt-1'>
            Manage music genres and their properties
          </p>
        </div>
        <Button
          color='primary'
          startContent={<PlusIcon className='w-4 h-4' />}
          onPress={openCreate}
        >
          Add Genre
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardBody>
          <div className='flex items-center gap-4'>
            <div className='flex-1'>
              <Input
                placeholder='Search genres by name, slug, or alias...'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                startContent={
                  <MagnifyingGlassIcon className='w-4 h-4 text-gray-400' />
                }
              />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Genres Table */}
      <Card>
        <CardBody>
          {loading ? (
            <div className='flex justify-center items-center py-12'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
            </div>
          ) : sortedGenres.length === 0 ? (
            <div className='text-center py-12'>
              <p className='text-gray-500 dark:text-gray-400'>
                {searchTerm
                  ? 'No genres found matching your search'
                  : 'No genres found. Create your first genre to get started.'}
              </p>
            </div>
          ) : (
            <Table aria-label='Genres table'>
              <TableHeader>
                <TableColumn>NAME</TableColumn>
                <TableColumn>SLUG</TableColumn>
                <TableColumn>STATUS</TableColumn>
                <TableColumn>ORDER</TableColumn>
                <TableColumn>ALIASES</TableColumn>
                <TableColumn>ACTIONS</TableColumn>
              </TableHeader>
              <TableBody>
                {sortedGenres.map(genre => (
                  <TableRow key={genre.id}>
                    <TableCell>
                      <div className='flex items-center gap-2'>
                        {genre.colorHex && (
                          <div
                            className='w-4 h-4 rounded-full'
                            style={{ backgroundColor: genre.colorHex }}
                          />
                        )}
                        <span className='font-medium text-gray-900 dark:text-white'>
                          {genre.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className='text-gray-500 dark:text-gray-400'>
                        {genre.slug}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          genre.isActive
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                        }`}
                      >
                        {genre.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className='text-gray-500 dark:text-gray-400'>
                        {genre.order}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className='text-gray-500 dark:text-gray-400 text-sm'>
                        {genre.aliases?.length > 0
                          ? genre.aliases.join(', ')
                          : '—'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className='flex items-center gap-2'>
                        <Button
                          size='sm'
                          variant='light'
                          startContent={<PencilIcon className='w-4 h-4' />}
                          onPress={() => openEdit(genre)}
                        >
                          Edit
                        </Button>
                        <Button
                          size='sm'
                          color='danger'
                          variant='light'
                          startContent={<TrashIcon className='w-4 h-4' />}
                          onPress={() => handleDelete(genre.id)}
                          isLoading={deletingId === genre.id}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        size='2xl'
        scrollBehavior='inside'
      >
        <ModalContent>
          <ModalHeader>
            {editing ? 'Edit Genre' : 'Create New Genre'}
          </ModalHeader>
          <ModalBody>
            <div className='space-y-4'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <Input
                  label='Name'
                  placeholder='e.g., Amapiano'
                  value={form.name || ''}
                  onValueChange={value => {
                    const slug = generateSlug(value);
                    setForm(prev => ({
                      ...prev,
                      name: value,
                      slug: slug,
                    }));
                  }}
                  isRequired
                />
                <Input
                  label='Slug'
                  placeholder='e.g., amapiano'
                  value={form.slug || ''}
                  isDisabled
                  isRequired
                  description='Auto-generated from name'
                />
              </div>

              <Textarea
                label='Description'
                placeholder='Genre description...'
                value={form.description || ''}
                onValueChange={value =>
                  setForm(prev => ({ ...prev, description: value }))
                }
                minRows={2}
              />

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <Input
                  label='Color (Hex)'
                  placeholder='#FF5733'
                  value={form.colorHex || ''}
                  onValueChange={value =>
                    setForm(prev => ({ ...prev, colorHex: value }))
                  }
                />
                <Input
                  label='Icon'
                  placeholder='Icon name or URL'
                  value={form.icon || ''}
                  onValueChange={value =>
                    setForm(prev => ({ ...prev, icon: value }))
                  }
                />
              </div>

              <Input
                label='Order'
                type='number'
                value={String(form.order ?? 0)}
                onValueChange={value =>
                  setForm(prev => ({
                    ...prev,
                    order: parseInt(value || '0', 10),
                  }))
                }
              />

              <Input
                label='Aliases (comma-separated)'
                placeholder='e.g., Piano, Amapiano Music'
                value={aliasesInput}
                onValueChange={setAliasesInput}
                description='Alternative names or spellings for this genre'
              />

              <div className='flex items-center gap-3'>
                <Switch
                  isSelected={form.isActive ?? true}
                  onValueChange={value =>
                    setForm(prev => ({ ...prev, isActive: value }))
                  }
                >
                  Active
                </Switch>
                <span className='text-sm text-gray-500 dark:text-gray-400'>
                  Inactive genres won&apos;t appear in public listings
                </span>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant='light'
              onPress={() => setShowModal(false)}
              isDisabled={saving}
            >
              Cancel
            </Button>
            <Button
              color='primary'
              onPress={handleSave}
              isLoading={saving}
              isDisabled={!form.name || !form.slug}
            >
              {editing ? 'Save Changes' : 'Create Genre'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
