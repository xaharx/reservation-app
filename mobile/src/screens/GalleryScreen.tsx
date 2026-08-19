import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { MainDrawerScreenProps } from '../navigation/types';
import { colors } from '../theme/colors';
import { getGallery, type GalleryImage } from '../api/cms';
import { useFetchOnMount } from '../hooks/useFetchOnMount';
import StateNotice from '../components/StateNotice';

type Props = MainDrawerScreenProps<'Gallery'>;

const NUM_COLUMNS = 2;

export default function GalleryScreen(_props: Props) {
  const { data, loading, refreshing, error, refetch } = useFetchOnMount(getGallery);

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
          title="Couldn't load the gallery"
          description={error}
          onRetry={refetch}
        />
      </View>
    );
  }

  const images = data ?? [];

  return (
    <FlatList
      style={styles.flex}
      data={images}
      keyExtractor={(item: GalleryImage) => item.id}
      numColumns={NUM_COLUMNS}
      contentContainerStyle={styles.listContent}
      columnWrapperStyle={styles.row}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refetch} />}
      ListEmptyComponent={
        <StateNotice icon="images-outline" title="No photos published yet" />
      }
      renderItem={({ item }: { item: GalleryImage }) => (
        <View style={styles.tile}>
          <Image source={{ uri: item.imageUrl }} style={styles.image} resizeMode="cover" />
          {!!item.title && (
            <Text style={styles.caption} numberOfLines={1}>
              {item.title}
            </Text>
          )}
        </View>
      )}
    />
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
  listContent: {
    padding: 16,
  },
  row: {
    gap: 12,
  },
  tile: {
    flex: 1,
    marginBottom: 12,
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 130,
    backgroundColor: colors.inputBackground,
  },
  caption: {
    color: colors.textDark,
    fontSize: 11,
    fontWeight: '600',
    padding: 8,
  },
});
