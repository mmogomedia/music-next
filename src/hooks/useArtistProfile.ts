'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  ArtistProfile,
  CreateArtistProfileData,
  UpdateArtistProfileData,
  SocialLinks,
  StreamingLinks,
} from '@/types/artist-profile';

export function useArtistProfile() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<ArtistProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch artist profile
  const fetchProfile = async () => {
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/artist-profile?t=${Date.now()}`);

      if (response.ok) {
        const data = await response.json();
        setProfile(data.artistProfile);
      } else if (response.status === 404) {
        setProfile(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch profile');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  // Create artist profile
  const createProfile = async (
    data: CreateArtistProfileData
  ): Promise<boolean> => {
    try {
      setError(null);
      const response = await fetch('/api/artist-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
        setProfile(result.artistProfile);
        return true;
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create profile');
        return false;
      }
    } catch (error) {
      console.error('Error creating profile:', error);
      setError('Failed to create profile');
      return false;
    }
  };

  // Update artist profile
  const updateProfile = async (
    data: UpdateArtistProfileData
  ): Promise<boolean> => {
    try {
      setError(null);
      const response = await fetch('/api/artist-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
        setProfile(result.artistProfile);
        return true;
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update profile');
        return false;
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile');
      return false;
    }
  };

  // Update social links
  const updateSocialLinks = async (
    socialLinks: SocialLinks
  ): Promise<boolean> => {
    try {
      setError(null);
      const response = await fetch('/api/artist-profile/social-links', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ socialLinks }),
      });

      if (response.ok) {
        const result = await response.json();
        setProfile(result.artistProfile);
        return true;
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update social links');
        return false;
      }
    } catch (error) {
      console.error('Error updating social links:', error);
      setError('Failed to update social links');
      return false;
    }
  };

  // Update streaming links
  const updateStreamingLinks = async (
    streamingLinks: StreamingLinks
  ): Promise<boolean> => {
    try {
      setError(null);
      const response = await fetch('/api/artist-profile/streaming-links', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ streamingLinks }),
      });

      if (response.ok) {
        const result = await response.json();
        setProfile(result.artistProfile);
        return true;
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update streaming links');
        return false;
      }
    } catch (error) {
      console.error('Error updating streaming links:', error);
      setError('Failed to update streaming links');
      return false;
    }
  };

  // Delete artist profile
  const deleteProfile = async (): Promise<boolean> => {
    try {
      setError(null);
      const response = await fetch('/api/artist-profile', {
        method: 'DELETE',
      });

      if (response.ok) {
        setProfile(null);
        return true;
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to delete profile');
        return false;
      }
    } catch (error) {
      console.error('Error deleting profile:', error);
      setError('Failed to delete profile');
      return false;
    }
  };

  // Refresh profile data
  const refreshProfile = () => {
    fetchProfile();
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  useEffect(() => {
    fetchProfile();
  }, [session?.user?.id]);

  return {
    profile,
    loading,
    error,
    createProfile,
    updateProfile,
    updateSocialLinks,
    updateStreamingLinks,
    deleteProfile,
    refreshProfile,
    clearError,
  };
}
