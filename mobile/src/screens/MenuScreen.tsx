import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
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
import { getMenu, type MenuCategory, type MenuItem } from '../api/menu';
import { useFetchOnMount } from '../hooks/useFetchOnMount';
import { useCart } from '../context/CartContext';
import StateNotice from '../components/StateNotice';

type Props = MainDrawerScreenProps<'Menu'>;

function formatPrice(cents: number, currency: string): string {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(cents / 100);
}

const ALL_CATEGORY_ID = 'all';
// How far past a category's top edge the user has to scroll before that
// category is considered "active" — keeps the tab bar from flickering
// between two categories right at the boundary between their sections.
const ACTIVE_SECTION_OFFSET = 32;

export default function MenuScreen({ navigation }: Props) {
  const { data, loading, refreshing, error, refetch } = useFetchOnMount(getMenu);
  const { lines, itemCount, subtotalCents, currency, addItem, updateQuantity } = useCart();

  const [activeCategoryId, setActiveCategoryId] = useState<string>(ALL_CATEGORY_ID);
  const scrollViewRef = useRef<ScrollView>(null);
  // Each category section's y-offset within the ScrollView's content,
  // captured via onLayout as the sections render. Used both to scroll to a
  // category when its tab is tapped, and to figure out which category is
  // active as the user scrolls.
  const sectionOffsetsRef = useRef<Record<string, number>>({});
  const sortedSectionIdsRef = useRef<string[]>([]);

  function handleCategoryLayout(categoryId: string, y: number) {
    sectionOffsetsRef.current[categoryId] = y;
    if (!sortedSectionIdsRef.current.includes(categoryId)) {
      sortedSectionIdsRef.current.push(categoryId);
    }
  }

  function handleContentScroll(event: { nativeEvent: { contentOffset: { y: number } } }) {
    const scrollY = event.nativeEvent.contentOffset.y;
    const offsets = sectionOffsetsRef.current;
    let nextActiveId = ALL_CATEGORY_ID;
    for (const categoryId of sortedSectionIdsRef.current) {
      const sectionTop = offsets[categoryId];
      if (sectionTop === undefined) {
        continue;
      }
      if (scrollY + ACTIVE_SECTION_OFFSET >= sectionTop) {
        nextActiveId = categoryId;
      }
    }
    setActiveCategoryId((current) => (current === nextActiveId ? current : nextActiveId));
  }

  function handleCategoryTabPress(categoryId: string) {
    setActiveCategoryId(categoryId);
    if (categoryId === ALL_CATEGORY_ID) {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }
    const sectionTop = sectionOffsetsRef.current[categoryId];
    if (sectionTop !== undefined) {
      scrollViewRef.current?.scrollTo({ y: Math.max(sectionTop - 8, 0), animated: true });
    }
  }

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
          title="Couldn't load the menu"
          description={error}
          onRetry={refetch}
        />
      </View>
    );
  }

  const categories = data ?? [];
  const quantityFor = (menuItemId: string) =>
    lines.find((line) => line.menuItemId === menuItemId)?.quantity ?? 0;

  return (
    <View style={styles.flex}>
      {categories.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryTabBar}
          contentContainerStyle={styles.categoryTabBarContent}
        >
          <CategoryTab
            label="All"
            selected={activeCategoryId === ALL_CATEGORY_ID}
            onPress={() => handleCategoryTabPress(ALL_CATEGORY_ID)}
          />
          {categories.map((category: MenuCategory) => (
            <CategoryTab
              key={category.id}
              label={category.name}
              selected={activeCategoryId === category.id}
              onPress={() => handleCategoryTabPress(category.id)}
            />
          ))}
        </ScrollView>
      )}

      <ScrollView
        ref={scrollViewRef}
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refetch} />}
        onScroll={handleContentScroll}
        scrollEventThrottle={32}
      >
        {categories.length === 0 ? (
          <StateNotice icon="restaurant-outline" title="No menu published yet" />
        ) : (
          categories.map((category: MenuCategory) => (
            <View
              key={category.id}
              style={styles.categoryBlock}
              onLayout={(event) => handleCategoryLayout(category.id, event.nativeEvent.layout.y)}
            >
              {!!category.description && (
                <Text style={styles.categoryDescription}>{category.description}</Text>
              )}

              {category.items.map((item: MenuItem) => {
                const quantity = quantityFor(item.id);
                return (
                  <View key={item.id} style={styles.itemCard}>
                    {!!item.imageUrl && (
                      <Image
                        source={{ uri: item.imageUrl }}
                        style={styles.itemImage}
                        resizeMode="cover"
                      />
                    )}
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      {!!item.description && (
                        <Text style={styles.itemDescription}>{item.description}</Text>
                      )}
                      <Text style={styles.itemPrice}>
                        {formatPrice(item.priceCents, item.currency)}
                      </Text>
                    </View>

                    {quantity === 0 ? (
                      <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => addItem(item, 1)}
                      >
                        <Text style={styles.addButtonText}>ADD</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.stepper}>
                        <TouchableOpacity
                          style={styles.stepperButton}
                          onPress={() => updateQuantity(item.id, quantity - 1)}
                        >
                          <Ionicons name="remove" size={16} color={colors.navy} />
                        </TouchableOpacity>
                        <Text style={styles.stepperValue}>{quantity}</Text>
                        <TouchableOpacity
                          style={styles.stepperButton}
                          onPress={() => updateQuantity(item.id, quantity + 1)}
                        >
                          <Ionicons name="add" size={16} color={colors.navy} />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          ))
        )}
      </ScrollView>

      {itemCount > 0 && !!currency && (
        <TouchableOpacity
          style={styles.cartBar}
          onPress={() => navigation.navigate('Cart')}
        >
          <View style={styles.cartBarBadge}>
            <Text style={styles.cartBarBadgeText}>{itemCount}</Text>
          </View>
          <Text style={styles.cartBarText}>View Cart</Text>
          <Text style={styles.cartBarTotal}>{formatPrice(subtotalCents, currency)}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

type CategoryTabProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

function CategoryTab({ label, selected, onPress }: CategoryTabProps) {
  return (
    <TouchableOpacity
      style={[styles.categoryTab, selected && styles.categoryTabSelected]}
      onPress={onPress}
    >
      <Text style={[styles.categoryTabLabel, selected && styles.categoryTabLabelSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
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
    paddingBottom: 90,
  },
  categoryTabBar: {
    flexGrow: 0,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  categoryTabBarContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  categoryTab: {
    paddingHorizontal: 16,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryTabSelected: {
    backgroundColor: 'rgba(201, 162, 75, 0.16)',
    borderColor: colors.gold,
  },
  categoryTabLabel: {
    color: colors.mutedOnDark,
    fontSize: 13,
    fontWeight: '600',
  },
  categoryTabLabelSelected: {
    color: colors.gold,
  },
  categoryBlock: {
    marginBottom: 24,
  },
  categoryDescription: {
    color: colors.mutedOnDark,
    fontSize: 12,
    marginBottom: 12,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 14,
    marginBottom: 10,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: colors.inputBackground,
  },
  itemInfo: {
    flex: 1,
    marginRight: 12,
  },
  itemName: {
    color: colors.navy,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  itemDescription: {
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: 6,
  },
  itemPrice: {
    color: colors.textDark,
    fontSize: 13,
    fontWeight: '600',
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: colors.navy,
  },
  addButtonText: {
    color: colors.gold,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.inputBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  stepperButton: {
    padding: 2,
  },
  stepperValue: {
    color: colors.textDark,
    fontSize: 13,
    fontWeight: '700',
    minWidth: 16,
    textAlign: 'center',
  },
  cartBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.navy,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 10,
  },
  cartBarBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBarBadgeText: {
    color: colors.navy,
    fontSize: 11,
    fontWeight: '700',
  },
  cartBarText: {
    flex: 1,
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  cartBarTotal: {
    color: colors.gold,
    fontSize: 14,
    fontWeight: '700',
  },
});
