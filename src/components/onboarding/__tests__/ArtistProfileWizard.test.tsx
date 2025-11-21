import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Mock HeroUI ripple and dom-animation before any other imports to prevent dynamic import issues
jest.mock('@heroui/dom-animation', () => ({
  __esModule: true,
  default: () => ({}),
}));

jest.mock('@heroui/ripple', () => ({
  useRipple: () => ({
    ripples: [],
    onMouseDown: jest.fn(),
    onMouseUp: jest.fn(),
    onTouchStart: jest.fn(),
    onTouchEnd: jest.fn(),
  }),
  Ripple: () => null,
}));

// Mock Next.js Image before importing component
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} {...props} />;
  },
}));

import ArtistProfileWizard from '../ArtistProfileWizard';

// Mock Next.js navigation
const mockPush = jest.fn();
const mockRouter = {
  push: mockPush,
  replace: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
};

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}));

// Mock NextAuth
const mockSession = {
  data: {
    user: { id: 'test-user-id', email: 'test@example.com' },
  },
  status: 'authenticated',
};

jest.mock('next-auth/react', () => ({
  useSession: () => mockSession,
}));

// Mock fetch
global.fetch = jest.fn();

// Mock the step components
jest.mock('../steps/ClaimProfileStep', () => {
  return function MockClaimProfileStep({
    _formData,
    updateFormData,
    onClaimed,
  }: any) {
    return (
      <div data-testid='claim-profile-step'>
        <input
          data-testid='claim-search'
          onChange={e => updateFormData({ claimedProfileId: e.target.value })}
        />
        <button
          data-testid='claim-button'
          onClick={() => onClaimed && onClaimed()}
        >
          Claim Profile
        </button>
      </div>
    );
  };
});

jest.mock('../steps/BasicInfoStep', () => {
  return function MockBasicInfoStep({ formData, updateFormData }: any) {
    return (
      <div data-testid='basic-info-step'>
        <input
          data-testid='artist-name-input'
          value={formData.artistName}
          onChange={e => updateFormData({ artistName: e.target.value })}
        />
        <input
          data-testid='genre-input'
          value={formData.genreId}
          onChange={e => updateFormData({ genreId: e.target.value })}
        />
      </div>
    );
  };
});

jest.mock('../steps/DetailsStep', () => {
  return function MockDetailsStep({ formData, updateFormData }: any) {
    return (
      <div data-testid='details-step'>
        <textarea
          data-testid='bio-input'
          value={formData.bio}
          onChange={e => updateFormData({ bio: e.target.value })}
        />
      </div>
    );
  };
});

jest.mock('../steps/ReviewStep', () => {
  return function MockReviewStep({ formData, isSubmitting }: any) {
    return (
      <div data-testid='review-step'>
        <div data-testid='review-content'>
          {formData.artistName} - {formData.genreId}
        </div>
        {isSubmitting && <div data-testid='submitting'>Submitting...</div>}
      </div>
    );
  };
});

describe('ArtistProfileWizard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();
    mockPush.mockClear();
  });

  it('should render wizard with logo and header', () => {
    render(<ArtistProfileWizard />);

    expect(screen.getByAltText('Flemoji')).toBeInTheDocument();
    expect(screen.getByText('Create Your Artist Profile')).toBeInTheDocument();
    expect(screen.getByText(/Step 1 of 4/)).toBeInTheDocument();
  });

  it('should show claim profile step initially', () => {
    render(<ArtistProfileWizard />);

    expect(screen.getByTestId('claim-profile-step')).toBeInTheDocument();
    expect(screen.getByText('Create New Profile')).toBeInTheDocument();
  });

  it('should navigate to next step when Continue is clicked', async () => {
    const user = userEvent.setup();
    render(<ArtistProfileWizard />);

    const continueButton = screen.getByText('Create New Profile');
    await user.click(continueButton);

    await waitFor(() => {
      expect(screen.getByTestId('basic-info-step')).toBeInTheDocument();
    });
    expect(screen.getByText(/Step 2 of 4/)).toBeInTheDocument();
  });

  it('should show Back button on steps after first', async () => {
    const user = userEvent.setup();
    render(<ArtistProfileWizard />);

    // Go to step 2
    const continueButton = screen.getByText('Create New Profile');
    await user.click(continueButton);

    await waitFor(() => {
      expect(screen.getByText('Back')).toBeInTheDocument();
    });
  });

  it('should navigate back when Back button is clicked', async () => {
    const user = userEvent.setup();
    render(<ArtistProfileWizard />);

    // Go to step 2
    const continueButton = screen.getByText('Create New Profile');
    await user.click(continueButton);

    await waitFor(() => {
      expect(screen.getByText('Back')).toBeInTheDocument();
    });

    const backButton = screen.getByText('Back');
    await user.click(backButton);

    await waitFor(() => {
      expect(screen.getByTestId('claim-profile-step')).toBeInTheDocument();
    });
  });

  it('should update progress indicator when step changes', async () => {
    const user = userEvent.setup();
    render(<ArtistProfileWizard />);

    // Check initial step indicator
    const step1 = screen.getByText('1');
    expect(step1).toBeInTheDocument();

    // Go to step 2
    const continueButton = screen.getByText('Create New Profile');
    await user.click(continueButton);

    await waitFor(() => {
      const step2 = screen.getByText('2');
      expect(step2).toBeInTheDocument();
    });
  });

  it('should show "Complete Profile" button on last step', async () => {
    const user = userEvent.setup();
    render(<ArtistProfileWizard />);

    // Navigate through all steps
    let continueButton = screen.getByText('Create New Profile');
    await user.click(continueButton);

    await waitFor(() => {
      continueButton = screen.getByText('Continue');
      expect(continueButton).toBeInTheDocument();
    });

    // Fill required fields and continue
    const artistNameInput = screen.getByTestId('artist-name-input');
    await user.type(artistNameInput, 'Test Artist');
    const genreInput = screen.getByTestId('genre-input');
    await user.type(genreInput, 'test-genre-id');

    await user.click(continueButton);

    await waitFor(() => {
      continueButton = screen.getByText('Continue');
      expect(continueButton).toBeInTheDocument();
    });

    await user.click(continueButton);

    await waitFor(() => {
      expect(screen.getByText('Complete Profile')).toBeInTheDocument();
    });
  });

  it('should validate required fields before proceeding', async () => {
    const user = userEvent.setup();
    render(<ArtistProfileWizard />);

    // Go to step 2
    const continueButton = screen.getByText('Create New Profile');
    await user.click(continueButton);

    await waitFor(() => {
      const nextButton = screen.getByText('Continue');
      expect(nextButton).toBeInTheDocument();
    });

    // Try to continue without filling required fields
    const nextButton = screen.getByText('Continue');
    await user.click(nextButton);

    // Should still be on step 2 (validation failed)
    expect(screen.getByTestId('basic-info-step')).toBeInTheDocument();
  });

  it('should submit profile when Complete Profile is clicked', async () => {
    const user = userEvent.setup();

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ artistProfile: { id: 'test-id' } }),
    });

    render(<ArtistProfileWizard />);

    // Navigate to last step
    let continueButton = screen.getByText('Create New Profile');
    await user.click(continueButton);

    await waitFor(() => {
      continueButton = screen.getByText('Continue');
    });

    // Fill required fields
    const artistNameInput = screen.getByTestId('artist-name-input');
    await user.type(artistNameInput, 'Test Artist');
    const genreInput = screen.getByTestId('genre-input');
    await user.type(genreInput, 'test-genre-id');

    await user.click(continueButton);

    await waitFor(() => {
      continueButton = screen.getByText('Continue');
    });

    await user.click(continueButton);

    await waitFor(() => {
      const completeButton = screen.getByText('Complete Profile');
      expect(completeButton).toBeInTheDocument();
    });

    const completeButton = screen.getByText('Complete Profile');
    await user.click(completeButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/artist-profile',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });
  });

  it('should redirect to dashboard after successful submission', async () => {
    const user = userEvent.setup();

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ artistProfile: { id: 'test-id' } }),
    });

    render(<ArtistProfileWizard />);

    // Navigate and fill form
    let continueButton = screen.getByText('Create New Profile');
    await user.click(continueButton);

    await waitFor(() => {
      continueButton = screen.getByText('Continue');
    });

    const artistNameInput = screen.getByTestId('artist-name-input');
    await user.type(artistNameInput, 'Test Artist');
    const genreInput = screen.getByTestId('genre-input');
    await user.type(genreInput, 'test-genre-id');

    await user.click(continueButton);

    await waitFor(() => {
      continueButton = screen.getByText('Continue');
    });

    await user.click(continueButton);

    await waitFor(() => {
      const completeButton = screen.getByText('Complete Profile');
      expect(completeButton).toBeInTheDocument();
    });

    const completeButton = screen.getByText('Complete Profile');
    await user.click(completeButton);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('should show error message on submission failure', async () => {
    const user = userEvent.setup();

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Failed to create profile' }),
    });

    render(<ArtistProfileWizard />);

    // Navigate to last step
    let continueButton = screen.getByText('Create New Profile');
    await user.click(continueButton);

    await waitFor(() => {
      continueButton = screen.getByText('Continue');
    });

    const artistNameInput = screen.getByTestId('artist-name-input');
    await user.type(artistNameInput, 'Test Artist');
    const genreInput = screen.getByTestId('genre-input');
    await user.type(genreInput, 'test-genre-id');

    await user.click(continueButton);

    await waitFor(() => {
      continueButton = screen.getByText('Continue');
    });

    await user.click(continueButton);

    await waitFor(() => {
      const completeButton = screen.getByText('Complete Profile');
      expect(completeButton).toBeInTheDocument();
    });

    const completeButton = screen.getByText('Complete Profile');
    await user.click(completeButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to create profile')).toBeInTheDocument();
    });
  });
});
