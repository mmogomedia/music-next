'use client';

import ProfileTypeSelection from '@/components/profile/ProfileTypeSelection';
import RoleBasedRedirect from '@/components/auth/RoleBasedRedirect';

export default function ProfileSelectPage() {
  return (
    <RoleBasedRedirect>
      <ProfileTypeSelection />
    </RoleBasedRedirect>
  );
}
