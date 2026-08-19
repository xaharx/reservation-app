import React from 'react';
import {
  ActivityIndicator,
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

export default function MenuScreen({ navigation }: Props) {
  const { data, loading, refreshing, error, refetch } = useFetchOnMount(getMenu);
  const { lines, itemCount, subtotalCents, currency, addItem, updateQuantity } = useCart();

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
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refetch} />}
      >
        {categories.length === 0 ? (
          <StateNotice icon="restaurant-outline" title="No menu published yet" />
        ) : (
          categories.map((category: MenuCategory) => (
            <View key={category.id} style={styles.categoryBlock}>
              <Text style={styles.categoryTitle}>{category.name}</Text>
              {!!category.description && (
                <Text style={styles.categoryDescription}>{category.description}</Text>
              )}

              {category.items.map((item: MenuItem) => {
                const quantity = quantityFor(item.id);
                return (
                  <View key={item.id} style={styles.itemCard}>
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
  categoryBlock: {
    marginBottom: 24,
  },
  categoryTitle: {
    color: colors.gold,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
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
