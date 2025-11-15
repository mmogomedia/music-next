'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardBody,
  Button,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Checkbox,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from '@heroui/react';
import {
  MusicalNoteIcon,
  PlayIcon,
  PauseIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { Track } from '@/types/track';
import { Playlist } from '@/types/playlist';
import { api } from '@/lib/api-client';
import { constructFileUrl } from '@/lib/url-utils';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';
import { SourceType } from '@/types/stats';
import ArtistDisplay from '@/components/track/ArtistDisplay';
import CompletionBadge from '@/components/track/CompletionBadge';

interface TrackManagementProps {
  onTrackPlay?: (_track: Track) => void;
}

export default function TrackManagement({ onTrackPlay }: TrackManagementProps) {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedTracks, setSelectedTracks] = useState<string[]>([]);
  const [showAddToPlaylistModal, setShowAddToPlaylistModal] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<string>('');
  const [selectedTrackDetails, setSelectedTrackDetails] =
    useState<Track | null>(null);
  const [showTrackDetailsModal, setShowTrackDetailsModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [tracksPerPage] = useState(20);

  const { playTrack, currentTrack, isPlaying } = useMusicPlayer();

  const genres = [
    'Afro Pop',
    'Hip Hop',
    'R&B',
    'Gospel',
    'Jazz',
    'Classical',
    'Rock',
    'Electronic',
    'Reggae',
    'Traditional',
    'Pop',
    'Alternative',
    'Country',
    'Blues',
    'Folk',
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch all tracks (admin endpoint)
      const tracksResponse = await api.adminTracks.getAll();
      const tracksData = tracksResponse.data.data.tracks || [];
      setTracks(tracksData);

      // Fetch all playlists for assignment
      const playlistsResponse = await api.admin.getPlaylists();
      const playlistsData = playlistsResponse.data.playlists || [];
      setPlaylists(playlistsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayTrack = (track: Track) => {
    playTrack(track, 'admin' as SourceType);
    onTrackPlay?.(track);
  };

  const handleSelectTrack = (trackId: string) => {
    setSelectedTracks(prev =>
      prev.includes(trackId)
        ? prev.filter(id => id !== trackId)
        : [...prev, trackId]
    );
  };

  const handleSelectAll = () => {
    if (selectedTracks.length === filteredTracks.length) {
      setSelectedTracks([]);
    } else {
      setSelectedTracks(filteredTracks.map(track => track.id));
    }
  };

  const handleAddToPlaylist = async () => {
    if (!selectedPlaylist || selectedTracks.length === 0) return;

    try {
      // Add selected tracks to the chosen playlist
      const response = await api.admin.addTracksToPlaylist(
        selectedPlaylist,
        selectedTracks
      );

      if (response.success) {
        // Reset selections
        setSelectedTracks([]);
        setSelectedPlaylist('');
        setShowAddToPlaylistModal(false);

        // Refresh playlists to update track counts
        const playlistsResponse = await api.admin.getPlaylists();
        setPlaylists(playlistsResponse.data.playlists || []);
      }
    } catch (error) {
      console.error('Error adding tracks to playlist:', error);
    }
  };

  const handleViewTrackDetails = (track: Track) => {
    setSelectedTrackDetails(track);
    setShowTrackDetailsModal(true);
  };

  const filteredTracks = tracks.filter(track => {
    const matchesSearch =
      track.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (track.artist || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGenre = !selectedGenre || track.genre === selectedGenre;
    return matchesSearch && matchesGenre;
  });

  const paginatedTracks = filteredTracks.slice(
    (currentPage - 1) * tracksPerPage,
    currentPage * tracksPerPage
  );

  const totalPages = Math.ceil(filteredTracks.length / tracksPerPage);

  if (loading) {
    return (
      <Card>
        <CardBody className='p-8 text-center'>
          <div className='w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4'>
            <MusicalNoteIcon className='w-5 h-5 text-white' />
          </div>
          <p className='text-gray-600 dark:text-gray-400'>Loading tracks...</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h3 className='text-2xl font-bold text-gray-900 dark:text-white'>
            Track Management
          </h3>
          <p className='text-gray-500 dark:text-gray-400'>
            Manage all tracks on the platform
          </p>
        </div>
        <div className='flex items-center gap-3'>
          <Chip color='primary' variant='flat'>
            {tracks.length} total tracks
          </Chip>
          {selectedTracks.length > 0 && (
            <Button
              color='primary'
              startContent={<PlusIcon className='w-4 h-4' />}
              onPress={() => setShowAddToPlaylistModal(true)}
            >
              Add to Playlist ({selectedTracks.length})
            </Button>
          )}
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardBody className='p-6'>
          <div className='flex flex-col sm:flex-row gap-4'>
            <div className='flex-1'>
              <div className='relative'>
                <MagnifyingGlassIcon className='w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' />
                <input
                  type='text'
                  placeholder='Search tracks or artists...'
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className='w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                />
              </div>
            </div>
            <div className='flex gap-2'>
              <Dropdown>
                <DropdownTrigger>
                  <Button
                    variant='bordered'
                    startContent={<FunnelIcon className='w-4 h-4' />}
                  >
                    {selectedGenre || 'All Genres'}
                  </Button>
                </DropdownTrigger>
                <DropdownMenu
                  selectedKeys={
                    selectedGenre ? new Set([selectedGenre]) : new Set(['all'])
                  }
                  onSelectionChange={keys => {
                    const selected = Array.from(keys)[0] as string;
                    setSelectedGenre(selected === 'all' ? '' : selected);
                  }}
                  selectionMode='single'
                  aria-label='Genre filter'
                >
                  {[<DropdownItem key='all'>All Genres</DropdownItem>].concat(
                    genres.map(genre => (
                      <DropdownItem key={genre}>{genre}</DropdownItem>
                    ))
                  )}
                </DropdownMenu>
              </Dropdown>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Track List */}
      <Card>
        <CardBody className='p-0'>
          {/* Table Header */}
          <div className='px-6 py-4 border-b border-gray-200 dark:border-slate-700'>
            <div className='grid grid-cols-12 gap-4 items-center text-sm font-semibold text-gray-500 dark:text-gray-400'>
              <div className='col-span-1'>
                <Checkbox
                  isSelected={
                    selectedTracks.length === filteredTracks.length &&
                    filteredTracks.length > 0
                  }
                  onValueChange={handleSelectAll}
                />
              </div>
              <div className='col-span-1'>#</div>
              <div className='col-span-4'>Track</div>
              <div className='col-span-2'>Artist</div>
              <div className='col-span-1'>Genre</div>
              <div className='col-span-1'>Duration</div>
              <div className='col-span-1'>Plays</div>
              <div className='col-span-1'>Actions</div>
            </div>
          </div>

          {/* Track Rows */}
          <div className='divide-y divide-gray-200 dark:divide-slate-700'>
            {paginatedTracks.map((track, index) => (
              <div
                key={track.id}
                className='px-6 py-4 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors'
              >
                <div className='grid grid-cols-12 gap-4 items-center'>
                  {/* Checkbox */}
                  <div className='col-span-1'>
                    <Checkbox
                      isSelected={selectedTracks.includes(track.id)}
                      onValueChange={() => handleSelectTrack(track.id)}
                    />
                  </div>

                  {/* Track Number */}
                  <div className='col-span-1 text-gray-500 dark:text-gray-400 text-sm'>
                    {(currentPage - 1) * tracksPerPage + index + 1}
                  </div>

                  {/* Track Info */}
                  <div className='col-span-4 flex items-center gap-3'>
                    <div className='w-12 h-12 bg-gray-200 dark:bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0'>
                      {track.coverImageUrl ? (
                        <img
                          src={constructFileUrl(track.coverImageUrl)}
                          alt={track.title}
                          className='w-full h-full object-cover rounded-lg'
                        />
                      ) : (
                        <MusicalNoteIcon className='w-6 h-6 text-gray-400' />
                      )}
                    </div>
                    <div className='min-w-0 flex-1'>
                      <div className='flex items-center gap-2'>
                        <h4 className='font-medium text-gray-900 dark:text-white truncate flex-1'>
                          {track.title}
                        </h4>
                        {track.completionPercentage !== undefined && (
                          <CompletionBadge
                            percentage={track.completionPercentage}
                            size='sm'
                            variant='flat'
                          />
                        )}
                      </div>
                      <p className='text-sm text-gray-500 dark:text-gray-400 truncate'>
                        <ArtistDisplay track={track} />
                      </p>
                    </div>
                  </div>

                  {/* Artist */}
                  <div className='col-span-2 text-sm text-gray-900 dark:text-white'>
                    {track.artist || 'Unknown Artist'}
                  </div>

                  {/* Genre */}
                  <div className='col-span-1'>
                    <Chip size='sm' variant='flat' color='primary'>
                      {track.genre}
                    </Chip>
                  </div>

                  {/* Duration */}
                  <div className='col-span-1 text-sm text-gray-500 dark:text-gray-400'>
                    {Math.floor((track.duration || 0) / 60)}:
                    {(track.duration || 0) % 60 < 10 ? '0' : ''}
                    {(track.duration || 0) % 60}
                  </div>

                  {/* Plays */}
                  <div className='col-span-1 text-sm text-gray-500 dark:text-gray-400'>
                    {track.playCount || 0}
                  </div>

                  {/* Actions */}
                  <div className='col-span-1 flex items-center gap-2'>
                    <Button
                      size='sm'
                      variant='light'
                      onPress={() => handlePlayTrack(track)}
                      isIconOnly
                    >
                      {currentTrack?.id === track.id && isPlaying ? (
                        <PauseIcon className='w-4 h-4' />
                      ) : (
                        <PlayIcon className='w-4 h-4' />
                      )}
                    </Button>
                    <Button
                      size='sm'
                      variant='light'
                      onPress={() => handleViewTrackDetails(track)}
                      isIconOnly
                    >
                      <EyeIcon className='w-4 h-4' />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className='px-6 py-4 border-t border-gray-200 dark:border-slate-700'>
              <div className='flex items-center justify-between'>
                <p className='text-sm text-gray-500 dark:text-gray-400'>
                  Showing {(currentPage - 1) * tracksPerPage + 1} to{' '}
                  {Math.min(currentPage * tracksPerPage, filteredTracks.length)}{' '}
                  of {filteredTracks.length} tracks
                </p>
                <div className='flex gap-2'>
                  <Button
                    size='sm'
                    variant='bordered'
                    onPress={() =>
                      setCurrentPage(prev => Math.max(1, prev - 1))
                    }
                    isDisabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    size='sm'
                    variant='bordered'
                    onPress={() =>
                      setCurrentPage(prev => Math.min(totalPages, prev + 1))
                    }
                    isDisabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Add to Playlist Modal */}
      <Modal
        isOpen={showAddToPlaylistModal}
        onOpenChange={setShowAddToPlaylistModal}
        size='md'
      >
        <ModalContent>
          {onClose => (
            <>
              <ModalHeader className='flex flex-col gap-1'>
                Add Tracks to Playlist
              </ModalHeader>
              <ModalBody>
                <p className='text-gray-600 dark:text-gray-400'>
                  Add {selectedTracks.length} selected track(s) to a playlist:
                </p>
                <select
                  value={selectedPlaylist || ''}
                  onChange={e => setSelectedPlaylist(e.target.value)}
                  className='w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
                >
                  <option value=''>Select Playlist</option>
                  {playlists.map(playlist => (
                    <option key={playlist.id} value={playlist.id}>
                      {playlist.name} ({playlist.currentTracks}/
                      {playlist.maxTracks})
                    </option>
                  ))}
                </select>
              </ModalBody>
              <ModalFooter>
                <Button variant='light' onPress={onClose}>
                  Cancel
                </Button>
                <Button
                  color='primary'
                  onPress={handleAddToPlaylist}
                  isDisabled={!selectedPlaylist}
                >
                  Add to Playlist
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Track Details Modal */}
      <Modal
        isOpen={showTrackDetailsModal}
        onOpenChange={setShowTrackDetailsModal}
        size='2xl'
      >
        <ModalContent>
          {onClose => (
            <>
              <ModalHeader className='flex flex-col gap-1'>
                Track Details
              </ModalHeader>
              <ModalBody>
                {selectedTrackDetails && (
                  <div className='space-y-6'>
                    {/* Track Header */}
                    <div className='flex gap-4'>
                      <div className='w-24 h-24 bg-gray-200 dark:bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0'>
                        {selectedTrackDetails.coverImageUrl ? (
                          <img
                            src={constructFileUrl(
                              selectedTrackDetails.coverImageUrl
                            )}
                            alt={selectedTrackDetails.title}
                            className='w-full h-full object-cover rounded-lg'
                          />
                        ) : (
                          <MusicalNoteIcon className='w-12 h-12 text-gray-400' />
                        )}
                      </div>
                      <div className='flex-1'>
                        <h3 className='text-xl font-bold text-gray-900 dark:text-white'>
                          {selectedTrackDetails.title}
                        </h3>
                        <p className='text-lg text-gray-600 dark:text-gray-400'>
                          {selectedTrackDetails.artist}
                        </p>
                        <div className='flex gap-2 mt-2'>
                          <Chip size='sm' variant='flat' color='primary'>
                            {selectedTrackDetails.genre}
                          </Chip>
                          <Chip size='sm' variant='flat' color='secondary'>
                            {Math.floor(
                              (selectedTrackDetails.duration || 0) / 60
                            )}
                            :
                            {(selectedTrackDetails.duration || 0) % 60 < 10
                              ? '0'
                              : ''}
                            {(selectedTrackDetails.duration || 0) % 60}
                          </Chip>
                        </div>
                      </div>
                    </div>

                    {/* Track Stats */}
                    <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                      <div className='text-center p-3 bg-gray-50 dark:bg-slate-800 rounded-lg'>
                        <div className='text-2xl font-bold text-blue-600 dark:text-blue-400'>
                          {selectedTrackDetails.playCount || 0}
                        </div>
                        <div className='text-sm text-gray-500 dark:text-gray-400'>
                          Total Plays
                        </div>
                      </div>
                      <div className='text-center p-3 bg-gray-50 dark:bg-slate-800 rounded-lg'>
                        <div className='text-2xl font-bold text-green-600 dark:text-green-400'>
                          {selectedTrackDetails.likeCount || 0}
                        </div>
                        <div className='text-sm text-gray-500 dark:text-gray-400'>
                          Likes
                        </div>
                      </div>
                      <div className='text-center p-3 bg-gray-50 dark:bg-slate-800 rounded-lg'>
                        <div className='text-2xl font-bold text-purple-600 dark:text-purple-400'>
                          {selectedTrackDetails.shareCount || 0}
                        </div>
                        <div className='text-sm text-gray-500 dark:text-gray-400'>
                          Shares
                        </div>
                      </div>
                      <div className='text-center p-3 bg-gray-50 dark:bg-slate-800 rounded-lg'>
                        <div className='text-2xl font-bold text-orange-600 dark:text-orange-400'>
                          {selectedTrackDetails.downloadCount || 0}
                        </div>
                        <div className='text-sm text-gray-500 dark:text-gray-400'>
                          Downloads
                        </div>
                      </div>
                    </div>

                    {/* Additional Details */}
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      <div>
                        <h4 className='font-semibold text-gray-900 dark:text-white mb-2'>
                          File Information
                        </h4>
                        <div className='space-y-1 text-sm text-gray-600 dark:text-gray-400'>
                          <div>
                            Duration:{' '}
                            {Math.floor(
                              (selectedTrackDetails.duration || 0) / 60
                            )}
                            :
                            {(selectedTrackDetails.duration || 0) % 60 < 10
                              ? '0'
                              : ''}
                            {(selectedTrackDetails.duration || 0) % 60}
                          </div>
                          <div>
                            Genre: {selectedTrackDetails.genre || 'Unknown'}
                          </div>
                          <div>
                            Year: {selectedTrackDetails.year || 'Unknown'}
                          </div>
                          <div>
                            ISRC: {selectedTrackDetails.isrc || 'Not provided'}
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className='font-semibold text-gray-900 dark:text-white mb-2'>
                          Metadata
                        </h4>
                        <div className='space-y-1 text-sm text-gray-600 dark:text-gray-400'>
                          <div>
                            Album: {selectedTrackDetails.album || 'Single'}
                          </div>
                          <div>
                            Year: {selectedTrackDetails.year || 'Unknown'}
                          </div>
                          <div>
                            ISRC: {selectedTrackDetails.isrc || 'Not provided'}
                          </div>
                          <div>
                            Explicit:{' '}
                            {selectedTrackDetails.isExplicit ? 'Yes' : 'No'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    {selectedTrackDetails.description && (
                      <div>
                        <h4 className='font-semibold text-gray-900 dark:text-white mb-2'>
                          Description
                        </h4>
                        <p className='text-sm text-gray-600 dark:text-gray-400'>
                          {selectedTrackDetails.description}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button variant='light' onPress={onClose}>
                  Close
                </Button>
                <Button
                  color='primary'
                  onPress={() => {
                    if (selectedTrackDetails) {
                      handlePlayTrack(selectedTrackDetails);
                    }
                    onClose();
                  }}
                >
                  Play Track
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
