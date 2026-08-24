import React, { useEffect } from 'react';
import { getApp } from '@react-native-firebase/app';
import { getMessaging, onMessage } from '@react-native-firebase/messaging';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer, type LinkingOptions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';

import SplashScreen from './src/screens/SplashScreen';
import ReservationFormScreen from './src/screens/ReservationFormScreen';
import ReservationStatusScreen from './src/screens/ReservationStatusScreen';
import AboutScreen from './src/screens/AboutScreen';
import GalleryScreen from './src/screens/GalleryScreen';
import ContactScreen from './src/screens/ContactScreen';
import MenuScreen from './src/screens/MenuScreen';
import CartScreen from './src/screens/CartScreen';
import OrderHistoryScreen from './src/screens/OrderHistoryScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import CustomDrawerContent from './src/navigation/CustomDrawerContent';
import { colors } from './src/theme/colors';
import { CartProvider } from './src/context/CartContext';
import { registerDevice } from './src/device/registerDevice';
import { registerTokenRefreshHandler } from './src/notifications/push';
import { ensureNotificationChannel, showForegroundNotification } from './src/notifications/localNotification';
import type { RootStackParamList, MainDrawerParamList } from './src/navigation/types';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const Drawer = createDrawerNavigator<MainDrawerParamList>();

// Stripe Checkout redirects here after payment (see order.service.js
// successUrl/cancelUrl). Requires the "reservationapp" scheme registered in
// app.json, which needs a native rebuild to take effect (not just a JS reload).
const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['reservationapp://'],
  config: {
    screens: {
      Splash: 'splash',
      Main: {
        screens: {
          OrderHistory: 'checkout-complete',
        },
      },
    },
  },
};

function MainDrawer() {
  return (
    <Drawer.Navigator
      initialRouteName="Reservation"
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        drawerPosition: 'left',
        drawerType: 'front',
        headerStyle: { backgroundColor: colors.navyDark },
        headerTintColor: colors.gold,
        headerTitleStyle: { fontWeight: '700', letterSpacing: 1, fontSize: 16 },
        drawerStyle: { backgroundColor: colors.navyDark, width: 280 },
        drawerActiveTintColor: colors.gold,
        drawerActiveBackgroundColor: 'rgba(201, 162, 75, 0.14)',
        drawerInactiveTintColor: colors.goldSoft,
        drawerLabelStyle: { fontSize: 14, fontWeight: '600', marginLeft: -4 },
        drawerItemStyle: { borderRadius: 10, marginHorizontal: 12 },
      }}
    >
      <Drawer.Screen
        name="Reservation"
        component={ReservationFormScreen}
        options={{
          title: 'Reservation',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="ReservationStatus"
        component={ReservationStatusScreen}
        options={{
          title: 'Reservation Status',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="search-outline" color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="Menu"
        component={MenuScreen}
        options={{
          title: 'Menu',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="restaurant-outline" color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="Cart"
        component={CartScreen}
        options={{
          title: 'Cart',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="cart-outline" color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="OrderHistory"
        component={OrderHistoryScreen}
        options={{
          title: 'Order History',
          drawerIcon: ({ color, size }) => <Ionicons name="time-outline" color={color} size={size} />,
        }}
      />
      <Drawer.Screen
        name="About"
        component={AboutScreen}
        options={{
          title: 'About Us',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="information-circle-outline" color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="Gallery"
        component={GalleryScreen}
        options={{
          title: 'Gallery',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="images-outline" color={color} size={size} />
          ),
          // Hidden from the drawer list for now — screen and navigation still work.
          drawerItemStyle: { display: 'none' },
        }}
      />
      <Drawer.Screen
        name="Contact"
        component={ContactScreen}
        options={{
          title: 'Contact',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="call-outline" color={color} size={size} />
          ),
          // Hidden from the drawer list for now — screen and navigation still work.
          drawerItemStyle: { display: 'none' },
        }}
      />
      <Drawer.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="person-outline" color={color} size={size} />
          ),
          // Hidden from the drawer list for now — screen and navigation still work.
          drawerItemStyle: { display: 'none' },
        }}
      />
      <Drawer.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          title: 'Notifications',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="notifications-outline" color={color} size={size} />
          ),
          // Hidden from the drawer list for now — screen and navigation still work.
          drawerItemStyle: { display: 'none' },
        }}
      />
      <Drawer.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Settings',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" color={color} size={size} />
          ),
          // Hidden from the drawer list for now — screen and navigation still work.
          drawerItemStyle: { display: 'none' },
        }}
      />
    </Drawer.Navigator>
  );
}

export default function App() {
  useEffect(() => {
    void ensureNotificationChannel();

    // FCM only auto-displays notifications when the app is backgrounded or
    // killed — while the app is open, we have to show it ourselves. A real
    // system notification (not Alert.alert) keeps this consistent with the
    // backgrounded case and avoids colliding with the app's own dialogs
    // (e.g. the reservation form's "Booking confirmed" alert).
    const unsubscribe = onMessage(getMessaging(getApp()), async (remoteMessage) => {
      const title = remoteMessage.notification?.title ?? 'Ora de Nuit';
      const body = remoteMessage.notification?.body ?? '';
      await showForegroundNotification({ title, body, data: remoteMessage.data });
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    // Fire-and-forget: registers this installation on every launch. Must
    // never block startup, so it's intentionally not awaited here.
    void registerDevice();

    // Firebase can reissue a token independently of app launches — this
    // catches that case and re-registers immediately rather than waiting
    // for the next launch to notice.
    const unsubscribe = registerTokenRefreshHandler((token) => {
      void registerDevice(token);
    });

    return unsubscribe;
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <CartProvider>
        <NavigationContainer linking={linking}>
          <StatusBar style="light" />
          <RootStack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
            <RootStack.Screen name="Splash" component={SplashScreen} />
            <RootStack.Screen name="Main" component={MainDrawer} />
          </RootStack.Navigator>
        </NavigationContainer>
      </CartProvider>
    </GestureHandlerRootView>
  );
}
