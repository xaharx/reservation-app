import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

type Props = {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  description?: string;
};

/**
 * Placeholder for sections that are reachable from the drawer today but whose
 * real screen (API-backed, with its own validation/loading/empty/error states)
 * hasn't been built yet. Keeps navigation fully functional in the meantime.
 */
export default function ComingSoonScreen({ title, icon, description }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={32} color={colors.gold} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>
        {description ?? 'This section is coming soon.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 32,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    color: colors.gold,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
  },
  description: {
    color: colors.mutedOnDark,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
});
