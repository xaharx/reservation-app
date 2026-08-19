import React from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { MainDrawerScreenProps } from '../navigation/types';
import { colors } from '../theme/colors';
import { getAbout, type AboutSection } from '../api/cms';
import { useFetchOnMount } from '../hooks/useFetchOnMount';
import StateNotice from '../components/StateNotice';

type Props = MainDrawerScreenProps<'About'>;

export default function AboutScreen(_props: Props) {
  const { data, loading, refreshing, error, refetch } = useFetchOnMount(getAbout);

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
          title="Couldn't load this section"
          description={error}
          onRetry={refetch}
        />
      </View>
    );
  }

  const sections = data ?? [];

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refetch} />}
    >
      {sections.length === 0 ? (
        <StateNotice icon="information-circle-outline" title="Nothing here yet" />
      ) : (
        sections.map((section: AboutSection) => (
          <View key={section.id} style={styles.card}>
            {!!section.imageUrl && (
              <Image source={{ uri: section.imageUrl }} style={styles.image} resizeMode="cover" />
            )}
            <Text style={styles.title}>{section.title}</Text>
            <Text style={styles.content}>{section.content}</Text>
          </View>
        ))
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
    gap: 16,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: colors.inputBackground,
  },
  title: {
    color: colors.navy,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  content: {
    color: colors.textDark,
    fontSize: 13,
    lineHeight: 20,
  },
});
