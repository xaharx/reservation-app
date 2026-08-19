import React from 'react';
import {
  ActivityIndicator,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { MainDrawerScreenProps } from '../navigation/types';
import { colors } from '../theme/colors';
import { getContact, type ContactEntry } from '../api/cms';
import { useFetchOnMount } from '../hooks/useFetchOnMount';
import StateNotice from '../components/StateNotice';

type Props = MainDrawerScreenProps<'Contact'>;

function formatAddress(entry: ContactEntry): string | null {
  const parts = [
    entry.addressLine1,
    entry.addressLine2,
    [entry.city, entry.postalCode].filter(Boolean).join(' '),
    entry.country,
  ].filter((part): part is string => !!part && part.trim().length > 0);

  return parts.length > 0 ? parts.join(', ') : null;
}

export default function ContactScreen(_props: Props) {
  const { data, loading, refreshing, error, refetch } = useFetchOnMount(getContact);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.navy} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <StateNotice
          icon="alert-circle-outline"
          title="Couldn't load contact info"
          description={error}
          onRetry={refetch}
        />
      </View>
    );
  }

  const entries = data ?? [];

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refetch} />}
    >
      {entries.length === 0 ? (
        <StateNotice icon="call-outline" title="No contact details published yet" />
      ) : (
        entries.map((entry) => {
          const address = formatAddress(entry);
          const hours = entry.openingHours;

          return (
            <View key={entry.id} style={styles.card}>
              <Text style={styles.label}>{entry.label}</Text>

              {!!entry.phone && (
                <TouchableOpacity
                  style={styles.row}
                  onPress={() => Linking.openURL(`tel:${entry.phone}`)}
                >
                  <Ionicons name="call-outline" size={16} color={colors.textMuted} />
                  <Text style={styles.rowText}>{entry.phone}</Text>
                </TouchableOpacity>
              )}

              {!!entry.email && (
                <TouchableOpacity
                  style={styles.row}
                  onPress={() => Linking.openURL(`mailto:${entry.email}`)}
                >
                  <Ionicons name="mail-outline" size={16} color={colors.textMuted} />
                  <Text style={styles.rowText}>{entry.email}</Text>
                </TouchableOpacity>
              )}

              {!!address && (
                <View style={styles.row}>
                  <Ionicons name="location-outline" size={16} color={colors.textMuted} />
                  <Text style={styles.rowText}>{address}</Text>
                </View>
              )}

              {!!hours && Object.keys(hours).length > 0 && (
                <View style={styles.hoursBlock}>
                  <View style={styles.row}>
                    <Ionicons name="time-outline" size={16} color={colors.textMuted} />
                    <Text style={styles.rowText}>Opening hours</Text>
                  </View>
                  {Object.entries(hours).map(([day, hoursValue]) => (
                    <View key={day} style={styles.hoursRow}>
                      <Text style={styles.hoursDay}>{day}</Text>
                      <Text style={styles.hoursValue}>{String(hoursValue)}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 20,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 16,
    marginBottom: 16,
  },
  label: {
    color: colors.navy,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  rowText: {
    flex: 1,
    color: colors.textDark,
    fontSize: 13,
  },
  hoursBlock: {
    marginTop: 6,
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
    paddingLeft: 24,
  },
  hoursDay: {
    color: colors.textMuted,
    fontSize: 12,
    textTransform: 'capitalize',
  },
  hoursValue: {
    color: colors.textDark,
    fontSize: 12,
    fontWeight: '600',
  },
});
