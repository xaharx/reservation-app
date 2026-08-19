import React from 'react';
import ComingSoonScreen from '../components/ComingSoonScreen';
import type { MainDrawerScreenProps } from '../navigation/types';

type Props = MainDrawerScreenProps<'Notifications'>;

export default function NotificationsScreen(_props: Props) {
  return (
    <ComingSoonScreen
      title="Notifications"
      icon="notifications-outline"
      description="Order updates, offers, and reservation reminders will show up here."
    />
  );
}
