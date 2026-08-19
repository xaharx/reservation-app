import React from 'react';
import ComingSoonScreen from '../components/ComingSoonScreen';
import type { MainDrawerScreenProps } from '../navigation/types';

type Props = MainDrawerScreenProps<'Settings'>;

export default function SettingsScreen(_props: Props) {
  return (
    <ComingSoonScreen
      title="Settings"
      icon="settings-outline"
      description="Language, currency, and app preferences — coming next."
    />
  );
}
