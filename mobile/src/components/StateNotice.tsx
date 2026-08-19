import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  onRetry?: () => void;
};

/**
 * Error/empty state used by read-only CMS screens (About, Gallery, Contact).
 * Mirrors ComingSoonScreen's visual language but adds an optional retry action.
 */
export default function StateNotice({ icon, title, description, onRetry }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={28} color={colors.textMuted} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {!!description && <Text style={styles.description}>{description}</Text>}
      {!!onRetry && (
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <Text style={styles.retryText}>Try again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    color: colors.textDark,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  description: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  retryButton: {
    marginTop: 14,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.navy,
  },
  retryText: {
    color: colors.gold,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
