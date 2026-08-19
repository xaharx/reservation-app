import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { DrawerScreenProps } from '@react-navigation/drawer';

export type RootStackParamList = {
  Splash: undefined;
  Main: undefined;
};

export type MainDrawerParamList = {
  Menu: undefined;
  Reservation: undefined;
  ReservationStatus: undefined;
  About: undefined;
  Gallery: undefined;
  Contact: undefined;
  Cart: undefined;
  OrderHistory:
    | { confirmationCode?: string; status?: 'success' | 'cancelled' }
    | undefined;
  Profile: undefined;
  Notifications: undefined;
  Settings: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;

export type MainDrawerScreenProps<T extends keyof MainDrawerParamList> = CompositeScreenProps<
  DrawerScreenProps<MainDrawerParamList, T>,
  RootStackScreenProps<'Main'>
>;
