import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import ClaimProfileStep from '../ClaimProfileStep';

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} {...props} />;
  },
}));

// Mock fetch
global.fetch = jest.fn();

const mockFormData = {
  claimedProfileId: null,
  artistName: '',
  genreId: '',
  bio: '',
  country: '',
  province: '',
  city: '',
  website: '',
  skillIds: [],
  profileImage: '',
  coverImage: '',
};

const mockUpdateFormData = jest.fn();
const mockOnClaimed = jest.fn();

const defaultProps = {
  formData: mockFormData,
  updateFormData: mockUpdateFormData,
  errors: {},
  onClaimed: mockOnClaimed,
};

describe('ClaimProfileStep', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();
  });

  it('should render search input and description', () => {
    render(<ClaimProfileStep {...defaultProps} />);

    expect(
      screen.getByPlaceholderText('Search by artist name...')
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Already have music on Flemoji/)
    ).toBeInTheDocument();
  });

  it('should perform debounced search when typing', async () => {
    const user = userEvent.setup();

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          profiles: [
            {
              id: 'profile-1',
              name: 'Test Artist',
              slug: 'test-artist',
              profileImage: null,
              coverImage: null,
              stats: { tracks: 5, plays: 1000, likes: 50, followers: 10 },
              tracks: [],
              createdAt: '2023-01-01',
            },
          ],
        }),
    });

    render(<ClaimProfileStep {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText('Search by artist name...');
    await user.type(searchInput, 'Test');

    await waitFor(
      () => {
        expect(fetch).toHaveBeenCalled();
      },
      { timeout: 1000 }
    );
  });

  it('should display search results when profiles are found', async () => {
    const user = userEvent.setup();

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          profiles: [
            {
              id: 'profile-1',
              name: 'Test Artist',
              slug: 'test-artist',
              profileImage: null,
              coverImage: null,
              stats: { tracks: 5, plays: 1000, likes: 50, followers: 10 },
              tracks: [
                {
                  id: 'track-1',
                  title: 'Test Track',
                  coverImage: 'https://example.com/cover.jpg',
                  playCount: 500,
                  likeCount: 25,
                },
              ],
              createdAt: '2023-01-01',
            },
          ],
        }),
    });

    render(<ClaimProfileStep {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText('Search by artist name...');
    await user.type(searchInput, 'Test');

    await waitFor(() => {
      expect(screen.getByText('Test Artist')).toBeInTheDocument();
    });

    expect(screen.getByText('5 tracks')).toBeInTheDocument();
    expect(screen.getByText('1,000 plays')).toBeInTheDocument();
  });

  it('should handle claim profile action', async () => {
    const user = userEvent.setup();

    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            profiles: [
              {
                id: 'profile-1',
                name: 'Test Artist',
                slug: 'test-artist',
                profileImage: null,
                coverImage: null,
                stats: { tracks: 5, plays: 1000, likes: 50, followers: 10 },
                tracks: [],
                createdAt: '2023-01-01',
              },
            ],
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

    render(<ClaimProfileStep {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText('Search by artist name...');
    await user.type(searchInput, 'Test');

    await waitFor(() => {
      expect(screen.getByText('Test Artist')).toBeInTheDocument();
    });

    const claimButton = screen.getByText('Claim');
    await user.click(claimButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/artists/claim',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });
  });

  it('should show success message when profile is claimed', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            profiles: [
              {
                id: 'profile-1',
                name: 'Test Artist',
                slug: 'test-artist',
                profileImage: null,
                coverImage: null,
                stats: { tracks: 5, plays: 1000, likes: 50, followers: 10 },
                tracks: [],
                createdAt: '2023-01-01',
              },
            ],
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

    const propsWithClaimed = {
      ...defaultProps,
      formData: { ...mockFormData, claimedProfileId: 'profile-1' },
    };

    render(<ClaimProfileStep {...propsWithClaimed} />);

    expect(
      screen.getByText(/Profile claimed successfully/)
    ).toBeInTheDocument();
  });

  it('should display error message when search fails', async () => {
    const user = userEvent.setup();

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Search failed' }),
    });

    render(<ClaimProfileStep {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText('Search by artist name...');
    await user.type(searchInput, 'Test');

    await waitFor(() => {
      expect(screen.getByText('Search failed')).toBeInTheDocument();
    });
  });

  it('should display "no profiles found" message when search returns empty', async () => {
    const user = userEvent.setup();

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ profiles: [] }),
    });

    render(<ClaimProfileStep {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText('Search by artist name...');
    await user.type(searchInput, 'Nonexistent');

    await waitFor(() => {
      expect(
        screen.getByText(/No unclaimed profiles found/)
      ).toBeInTheDocument();
    });
  });

  it('should display track artwork in search results', async () => {
    const user = userEvent.setup();

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          profiles: [
            {
              id: 'profile-1',
              name: 'Test Artist',
              slug: 'test-artist',
              profileImage: null,
              coverImage: null,
              stats: { tracks: 3, plays: 1000, likes: 50, followers: 10 },
              tracks: [
                {
                  id: 'track-1',
                  title: 'Track 1',
                  coverImage: 'https://example.com/cover1.jpg',
                  playCount: 500,
                  likeCount: 25,
                },
                {
                  id: 'track-2',
                  title: 'Track 2',
                  coverImage: 'https://example.com/cover2.jpg',
                  playCount: 300,
                  likeCount: 15,
                },
              ],
              createdAt: '2023-01-01',
            },
          ],
        }),
    });

    render(<ClaimProfileStep {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText('Search by artist name...');
    await user.type(searchInput, 'Test');

    await waitFor(() => {
      const trackImages = screen.getAllByAltText(/Track/);
      expect(trackImages.length).toBeGreaterThan(0);
    });
  });
});
