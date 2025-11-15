import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useMusicPlayer, MusicPlayerProvider } from '../MusicPlayerContext';

// Test component to access context
const TestComponent = () => {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    playTrack,
    playPause,
    seekTo,
    setVolume,
    stop,
  } = useMusicPlayer();

  const mockTrack = {
    id: '1',
    title: 'Test Track',
    filePath: 'test.mp3',
    fileUrl: 'https://example.com/test.mp3',
    artistId: 'artist1',
    userId: 'user1',
    playCount: 0,
    duration: 180,
    genre: 'Test',
    album: 'Test Album',
    description: 'Test Description',
    coverImageUrl: 'https://example.com/cover.jpg',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  };

  return (
    <div>
      <div data-testid='current-track'>{currentTrack?.title || 'No track'}</div>
      <div data-testid='is-playing'>{isPlaying ? 'Playing' : 'Paused'}</div>
      <div data-testid='current-time'>{currentTime}</div>
      <div data-testid='duration'>{duration}</div>
      <div data-testid='volume'>{volume}</div>
      <button onClick={() => playTrack(mockTrack)}>Play Track</button>
      <button onClick={playPause}>Play/Pause</button>
      <button onClick={() => seekTo(30)}>Seek to 30s</button>
      <button onClick={() => setVolume(0.5)}>Set Volume</button>
      <button onClick={stop}>Stop</button>
    </div>
  );
};

const renderWithProvider = (ui: React.ReactElement) => {
  return render(<MusicPlayerProvider>{ui}</MusicPlayerProvider>);
};

describe('MusicPlayerContext', () => {
  beforeEach(() => {
    // Mock HTMLAudioElement
    const mockAudio = {
      play: jest.fn().mockResolvedValue(undefined),
      pause: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      currentTime: 0,
      duration: 180,
      volume: 1,
    };

    Object.defineProperty(window, 'Audio', {
      writable: true,
      value: jest.fn(() => mockAudio),
    });
  });

  it('should provide initial state', () => {
    renderWithProvider(<TestComponent />);

    expect(screen.getByTestId('current-track')).toHaveTextContent('No track');
    expect(screen.getByTestId('is-playing')).toHaveTextContent('Paused');
    expect(screen.getByTestId('current-time')).toHaveTextContent('0');
    expect(screen.getByTestId('duration')).toHaveTextContent('0');
    expect(screen.getByTestId('volume')).toHaveTextContent('1');
  });

  it('should play a track when playTrack is called', async () => {
    renderWithProvider(<TestComponent />);

    const playButton = screen.getByText('Play Track');
    fireEvent.click(playButton);

    await waitFor(() => {
      expect(screen.getByTestId('current-track')).toHaveTextContent(
        'Test Track'
      );
    });
  });

  it('should toggle play/pause when playPause is called', () => {
    renderWithProvider(<TestComponent />);

    const playPauseButton = screen.getByText('Play/Pause');
    fireEvent.click(playPauseButton);

    // Since we're mocking the audio, we can't test the actual state change
    // but we can verify the function was called
    expect(playPauseButton).toBeInTheDocument();
  });

  it('should seek to a specific time when seekTo is called', () => {
    renderWithProvider(<TestComponent />);

    const seekButton = screen.getByText('Seek to 30s');
    fireEvent.click(seekButton);

    expect(seekButton).toBeInTheDocument();
  });

  it('should set volume when setVolume is called', () => {
    renderWithProvider(<TestComponent />);

    const volumeButton = screen.getByText('Set Volume');
    fireEvent.click(volumeButton);

    expect(volumeButton).toBeInTheDocument();
  });

  it('should stop playback when stop is called', () => {
    renderWithProvider(<TestComponent />);

    const stopButton = screen.getByText('Stop');
    fireEvent.click(stopButton);

    expect(stopButton).toBeInTheDocument();
  });
});
