'use client';

import { useState, useEffect } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Card,
  CardBody,
  Checkbox,
  Textarea,
} from '@heroui/react';
import { MusicalNoteIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { Playlist } from '@/types/playlist';
import { Track } from '@/types/track';
import { api } from '@/lib/api-client';
import { constructFileUrl } from '@/lib/url-utils';
import ArtistDisplay from '@/components/track/ArtistDisplay';

interface QuickSubmitModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: Track | null;
  playlist?: Playlist | null;
  availableTracks?: Track[]; // For playlist-based submissions
  onSuccess?: () => void;
}

export default function QuickSubmitModal({
  isOpen,
  onClose,
  track,
  playlist: preselectedPlaylist,
  availableTracks,
  onSuccess,
}: QuickSubmitModalProps) {
  const [availablePlaylists, setAvailablePlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylists, setSelectedPlaylists] = useState<string[]>([]);
  const [selectedTracks, setSelectedTracks] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submissionValidation, setSubmissionValidation] = useState<
    Record<
      string,
      {
        canSubmit: boolean;
        reason?: string;
        existingSubmissions?: number;
        maxSubmissions?: number;
        alreadySubmittedTracks?: string[];
      }
    >
  >({});

  // Determine if this is a track-based or playlist-based submission
  const isTrackBasedSubmission = !!track;
  const isPlaylistBasedSubmission =
    !track && (availableTracks || preselectedPlaylist);

  useEffect(() => {
    if (isOpen) {
      if (isTrackBasedSubmission) {
        // For track-based submissions, fetch available playlists
        fetchAvailablePlaylists();
      } else if (isPlaylistBasedSubmission) {
        // For playlist-based submissions, also fetch available playlists to show validation
        fetchAvailablePlaylists();
        // Pre-select the specific playlist
        if (preselectedPlaylist) {
          setSelectedPlaylists([preselectedPlaylist.id]);
        }
      }
    } else {
      // Reset state when modal closes
      setSelectedPlaylists([]);
      setSelectedTracks([]);
      setComment('');
    }
  }, [
    isOpen,
    preselectedPlaylist,
    isTrackBasedSubmission,
    isPlaylistBasedSubmission,
  ]);

  const fetchAvailablePlaylists = async () => {
    try {
      setLoading(true);
      const response = await api.playlists.getAvailable();
      const playlists = response.data.playlists || [];
      setAvailablePlaylists(playlists);

      // Validate submissions for each playlist
      await validateSubmissions(playlists);
    } catch (error) {
      console.error('Error fetching playlists:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateSubmissions = async (playlists: Playlist[]) => {
    try {
      const validation: Record<
        string,
        {
          canSubmit: boolean;
          reason?: string;
          existingSubmissions?: number;
          maxSubmissions?: number;
          alreadySubmittedTracks?: string[];
        }
      > = {};

      // Get user's existing submissions
      const submissionsResponse = await api.playlists.getSubmissions();
      const existingSubmissions = submissionsResponse.data.submissions || [];

      for (const playlist of playlists) {
        const playlistSubmissions = existingSubmissions.filter(
          (sub: any) => sub.playlistId === playlist.id
        );

        const pendingSubmissions = playlistSubmissions.filter(
          (sub: any) => sub.status === 'PENDING'
        );

        const currentTrackIds =
          isTrackBasedSubmission && track ? [track.id] : selectedTracks;

        const alreadySubmittedTrackIds = playlistSubmissions
          .filter((sub: any) => currentTrackIds.includes(sub.trackId))
          .map((sub: any) => sub.trackId);

        let canSubmit = true;
        let reason = '';

        // Check if submission limit reached
        if (pendingSubmissions.length >= playlist.maxSubmissionsPerArtist) {
          canSubmit = false;
          reason = `Submission limit reached (${pendingSubmissions.length}/${playlist.maxSubmissionsPerArtist})`;
        }
        // Check if tracks already submitted
        else if (alreadySubmittedTrackIds.length > 0) {
          canSubmit = false;
          reason = `${alreadySubmittedTrackIds.length} track(s) already submitted`;
        }

        validation[playlist.id] = {
          canSubmit,
          reason,
          existingSubmissions: pendingSubmissions.length,
          maxSubmissions: playlist.maxSubmissionsPerArtist,
          alreadySubmittedTracks: alreadySubmittedTrackIds,
        };
      }

      setSubmissionValidation(validation);
    } catch (error) {
      console.error('Error validating submissions:', error);
    }
  };

  const handlePlaylistToggle = (playlistId: string) => {
    const validation = submissionValidation[playlistId];
    if (validation && !validation.canSubmit) {
      // Don't allow selection of playlists that can't be submitted to
      return;
    }

    setSelectedPlaylists(prev =>
      prev.includes(playlistId)
        ? prev.filter(id => id !== playlistId)
        : [...prev, playlistId]
    );
  };

  const handleTrackToggle = (trackId: string) => {
    setSelectedTracks(prev => {
      const newTracks = prev.includes(trackId)
        ? prev.filter(id => id !== trackId)
        : [...prev, trackId];

      // Re-validate submissions when tracks change
      if (availablePlaylists.length > 0) {
        validateSubmissions(availablePlaylists);
      }

      return newTracks;
    });
  };

  // Re-validate when selected tracks change
  useEffect(() => {
    if (availablePlaylists.length > 0 && selectedTracks.length > 0) {
      validateSubmissions(availablePlaylists);
    }
  }, [selectedTracks, track]);

  const handleSubmit = async () => {
    // Validate based on submission type
    if (isTrackBasedSubmission) {
      if (!track || selectedPlaylists.length === 0) return;
    } else {
      if (selectedTracks.length === 0 || selectedPlaylists.length === 0) return;
    }

    setIsSubmitting(true);
    try {
      const trackIds = isTrackBasedSubmission ? [track!.id] : selectedTracks;

      // Submit to each selected playlist
      const submitPromises = selectedPlaylists.map(playlistId =>
        api.playlists.submitTracks(playlistId, {
          trackIds,
          message: comment.trim() || undefined,
        })
      );

      await Promise.all(submitPromises);

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error submitting tracks:', error);
      // You might want to show an error message to the user here
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPlaylistStatus = (playlist: Playlist) => {
    // This would need to be enhanced with actual user submission data
    // For now, we'll show basic availability
    if (playlist.submissionStatus !== 'OPEN') {
      return 'closed';
    }
    if (playlist.currentTracks >= playlist.maxTracks) {
      return 'full';
    }
    return 'available';
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size='2xl' scrollBehavior='inside'>
      <ModalContent>
        <ModalHeader className='flex flex-col gap-1'>
          <div className='flex items-center gap-3'>
            <div className='w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center'>
              <MusicalNoteIcon className='w-5 h-5 text-white' />
            </div>
            <div>
              <h3 className='text-lg font-semibold'>
                {isTrackBasedSubmission
                  ? 'Submit Track to Playlists'
                  : 'Submit Tracks to Playlist'}
              </h3>
              {track && (
                <p className='text-sm text-gray-500 dark:text-gray-400'>
                  {track.title}
                </p>
              )}
              {preselectedPlaylist && (
                <p className='text-sm text-gray-500 dark:text-gray-400'>
                  {preselectedPlaylist.name}
                </p>
              )}
            </div>
          </div>
        </ModalHeader>

        <ModalBody>
          {loading ? (
            <div className='text-center py-8'>
              <div className='w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4'>
                <MusicalNoteIcon className='w-5 h-5 text-white' />
              </div>
              <p className='text-gray-600 dark:text-gray-400'>
                Loading playlists...
              </p>
            </div>
          ) : (
            <div className='space-y-4'>
              {/* Available Playlists */}
              <div>
                <h4 className='text-md font-semibold text-gray-900 dark:text-white mb-3'>
                  Select Playlists
                </h4>

                {availablePlaylists.length === 0 ? (
                  <Card>
                    <CardBody className='p-6 text-center'>
                      <div className='w-12 h-12 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-3'>
                        <MusicalNoteIcon className='w-6 h-6 text-gray-400' />
                      </div>
                      <p className='text-gray-500 dark:text-gray-400'>
                        No playlists are currently accepting submissions.
                      </p>
                    </CardBody>
                  </Card>
                ) : (
                  <div className='space-y-3 max-h-64 overflow-y-auto'>
                    {availablePlaylists.map(playlist => {
                      const validation = submissionValidation[playlist.id];
                      const canSubmit = validation?.canSubmit ?? true;
                      const isSelected = selectedPlaylists.includes(
                        playlist.id
                      );
                      const status = getPlaylistStatus(playlist);

                      return (
                        <Card
                          key={playlist.id}
                          className={`cursor-pointer transition-all ${
                            isSelected
                              ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : ''
                          } ${!canSubmit ? 'opacity-50' : ''}`}
                          isPressable={canSubmit}
                          onPress={() =>
                            canSubmit && handlePlaylistToggle(playlist.id)
                          }
                        >
                          <CardBody className='p-4'>
                            <div className='flex items-start gap-3'>
                              <div className='flex-shrink-0 mt-1'>
                                {canSubmit ? (
                                  <Checkbox
                                    isSelected={isSelected}
                                    onChange={() =>
                                      handlePlaylistToggle(playlist.id)
                                    }
                                    color='primary'
                                  />
                                ) : (
                                  <div className='w-4 h-4 border-2 border-gray-300 rounded' />
                                )}
                              </div>

                              <img
                                src={constructFileUrl(playlist.coverImage)}
                                alt={playlist.name}
                                className='w-12 h-12 rounded-lg object-cover flex-shrink-0'
                              />

                              <div className='flex-1 min-w-0'>
                                <div className='flex items-start justify-between mb-1'>
                                  <h5 className='font-medium text-gray-900 dark:text-white truncate'>
                                    {playlist.name}
                                  </h5>
                                  <div className='flex items-center gap-1 ml-2'>
                                    <span
                                      className={`text-xs px-2 py-1 rounded-full ${
                                        status === 'available'
                                          ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                                          : status === 'closed'
                                            ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                                            : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                                      }`}
                                    >
                                      {status === 'available'
                                        ? 'Open'
                                        : status === 'closed'
                                          ? 'Closed'
                                          : 'Full'}
                                    </span>
                                  </div>
                                </div>

                                <p className='text-sm text-gray-500 dark:text-gray-400 mb-2 line-clamp-2'>
                                  {playlist.description}
                                </p>

                                <div className='flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-2'>
                                  <span>
                                    {playlist.currentTracks}/
                                    {playlist.maxTracks} tracks
                                  </span>
                                  <span>•</span>
                                  <span>
                                    Max {playlist.maxSubmissionsPerArtist} per
                                    artist
                                  </span>
                                  <span>•</span>
                                  <span>
                                    {playlist.playlistType?.name ||
                                      'Unknown Type'}
                                  </span>
                                </div>

                                {/* Validation Status */}
                                {validation && (
                                  <div className='mt-2'>
                                    {!validation.canSubmit ? (
                                      <div className='flex items-center gap-2 text-xs'>
                                        <div className='w-2 h-2 bg-red-500 rounded-full'></div>
                                        <span className='text-red-600 dark:text-red-400 font-medium'>
                                          {validation.reason}
                                        </span>
                                        {validation.existingSubmissions !==
                                          undefined && (
                                          <span className='text-gray-500 dark:text-gray-400'>
                                            ({validation.existingSubmissions}/
                                            {validation.maxSubmissions} used)
                                          </span>
                                        )}
                                      </div>
                                    ) : (
                                      <div className='flex items-center gap-2 text-xs'>
                                        <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                                        <span className='text-green-600 dark:text-green-400 font-medium'>
                                          Ready to submit
                                        </span>
                                        {validation.existingSubmissions !==
                                          undefined && (
                                          <span className='text-gray-500 dark:text-gray-400'>
                                            ({validation.existingSubmissions}/
                                            {validation.maxSubmissions} used)
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardBody>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Track Selection - Only for playlist-based submissions */}
              {isPlaylistBasedSubmission && availableTracks && (
                <div>
                  <h4 className='text-md font-semibold text-gray-900 dark:text-white mb-3'>
                    Select Tracks to Submit
                  </h4>

                  {availableTracks.length === 0 ? (
                    <Card>
                      <CardBody className='p-6 text-center'>
                        <div className='w-12 h-12 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-3'>
                          <MusicalNoteIcon className='w-6 h-6 text-gray-400' />
                        </div>
                        <p className='text-gray-500 dark:text-gray-400'>
                          No tracks available for submission.
                        </p>
                      </CardBody>
                    </Card>
                  ) : (
                    <div className='space-y-3 max-h-64 overflow-y-auto'>
                      {availableTracks.map(track => {
                        const isSelected = selectedTracks.includes(track.id);

                        return (
                          <Card
                            key={track.id}
                            className={`cursor-pointer transition-all ${
                              isSelected
                                ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                : ''
                            }`}
                            isPressable
                            onPress={() => handleTrackToggle(track.id)}
                          >
                            <CardBody className='p-4'>
                              <div className='flex items-start gap-3'>
                                <div className='flex-shrink-0 mt-1'>
                                  <Checkbox
                                    isSelected={isSelected}
                                    onChange={() => handleTrackToggle(track.id)}
                                    color='primary'
                                  />
                                </div>

                                <img
                                  src={constructFileUrl(
                                    track.albumArtwork ||
                                      track.coverImageUrl ||
                                      ''
                                  )}
                                  alt={track.title}
                                  className='w-12 h-12 rounded-lg object-cover flex-shrink-0'
                                />

                                <div className='flex-1 min-w-0'>
                                  <h5 className='font-medium text-gray-900 dark:text-white truncate'>
                                    {track.title}
                                  </h5>
                                  <p className='text-sm text-gray-500 dark:text-gray-400 truncate'>
                                    <ArtistDisplay track={track} />
                                  </p>
                                  <p className='text-xs text-gray-400 dark:text-gray-500'>
                                    {track.genre} • {track.duration}
                                  </p>
                                </div>
                              </div>
                            </CardBody>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Comment Section */}
              <div>
                <h4 className='text-md font-semibold text-gray-900 dark:text-white mb-3'>
                  Message to Curators (Optional)
                </h4>
                <Textarea
                  placeholder='Tell the playlist curators why your track would be a good fit...'
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  maxRows={3}
                  className='w-full'
                />
              </div>

              {/* Selection Summary */}
              {selectedPlaylists.length > 0 && (
                <div className='p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg'>
                  <div className='flex items-center gap-2 mb-2'>
                    <CheckCircleIcon className='w-5 h-5 text-blue-600' />
                    <span className='font-medium text-blue-900 dark:text-blue-300'>
                      Ready to Submit
                    </span>
                  </div>
                  <p className='text-sm text-blue-700 dark:text-blue-400'>
                    {isTrackBasedSubmission ? (
                      <>
                        {track?.title} will be submitted to{' '}
                        {selectedPlaylists.length} playlist
                        {selectedPlaylists.length !== 1 ? 's' : ''}.
                      </>
                    ) : (
                      <>
                        {selectedTracks.length} track
                        {selectedTracks.length !== 1 ? 's' : ''} will be
                        submitted to {selectedPlaylists.length} playlist
                        {selectedPlaylists.length !== 1 ? 's' : ''}.
                      </>
                    )}
                  </p>
                </div>
              )}
            </div>
          )}
        </ModalBody>

        <ModalFooter>
          <Button variant='light' onPress={onClose}>
            Cancel
          </Button>
          <Button
            color='primary'
            onPress={handleSubmit}
            isDisabled={
              selectedPlaylists.length === 0 ||
              (isPlaylistBasedSubmission && selectedTracks.length === 0) ||
              selectedPlaylists.some(playlistId => {
                const validation = submissionValidation[playlistId];
                return validation && !validation.canSubmit;
              }) ||
              isSubmitting
            }
            isLoading={isSubmitting}
          >
            Submit to {selectedPlaylists.length} Playlist
            {selectedPlaylists.length !== 1 ? 's' : ''}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
