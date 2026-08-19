import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  DrawerContentScrollView,
  DrawerItemList,
  type DrawerContentComponentProps,
} from '@react-navigation/drawer';
import { colors } from '../theme/colors';

/**
 * Shared drawer chrome for every primary section (Menu, Reservation,
 * Reservation Status, About, Gallery, Contact, Cart, Order History,
 * Profile, Notifications, Settings). Item list, icons, and active-state
 * styling come from screenOptions on the Drawer.Navigator itself (see
 * App.tsx) — this component only owns the branded header/footer around it.
 */
export default function CustomDrawerContent(props: DrawerContentComponentProps) {
  return (
    <View style={styles.flex}>
      <DrawerContentScrollView
        {...props}
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>ON</Text>
          </View>
          <Text style={styles.brand}>Ora de Nuit</Text>
          <Text style={styles.tagline}>CUCINA ITALIANA · ANIMA HAITIANA</Text>
        </View>

        <View style={styles.divider} />

        <DrawerItemList {...props} />
      </DrawerContentScrollView>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Version 1.0.0</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.navyDark,
  },
  scrollContent: {
    paddingTop: 0,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 16,
  },
  logoCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logoText: {
    color: colors.gold,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1,
  },
  brand: {
    color: colors.gold,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 4,
  },
  tagline: {
    color: colors.mutedOnDark,
    fontSize: 9,
    letterSpacing: 1,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  footer: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  footerText: {
    color: colors.mutedOnDark,
    fontSize: 11,
    letterSpacing: 0.5,
  },
});
