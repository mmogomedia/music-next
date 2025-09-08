import { useSession } from 'next-auth/react';
import { useArtistProfile } from './useArtistProfile';

export function useProfileCheck() {
  const { data: session } = useSession();
  const { profile, loading } = useArtistProfile();

  return {
    hasProfile: !!profile,
    isLoading: loading,
    profileType: profile ? 'artist' : null,
    isAuthenticated: !!session,
  };
}
