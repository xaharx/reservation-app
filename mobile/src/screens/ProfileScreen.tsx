import React from 'react';
import ComingSoonScreen from '../components/ComingSoonScreen';
import type { MainDrawerScreenProps } from '../navigation/types';

type Props = MainDrawerScreenProps<'Profile'>;

export default function ProfileScreen(_props: Props) {
  return (
    <ComingSoonScreen
      title="Profile"
      icon="person-outline"
      description="Manage your details, saved addresses, and payment methods — coming next."
    />
  );
}
