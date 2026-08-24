import React, { useEffect } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import * as ExpoSplashScreen from 'expo-splash-screen';
import type { RootStackScreenProps } from '../navigation/types';
import { colors } from '../theme/colors';

type Props = RootStackScreenProps<'Splash'>;

const SPLASH_DURATION_MS = 3000;
const LOGOMARK_ASPECT_RATIO = 523 / 323;

export default function SplashScreen({ navigation }: Props) {
  useEffect(() => {
    // This screen renders the same cream background + logomark as the native
    // launch screen (see the expo-splash-screen plugin config in app.json),
    // so hiding the native one the moment this mounts is an invisible
    // handoff rather than a jarring cut.
    ExpoSplashScreen.hideAsync().catch(() => {});

    const timer = setTimeout(() => {
      navigation.replace('Main');
    }, SPLASH_DURATION_MS);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Image
          source={require('../../assets/on-logomark.png')}
          style={styles.logomark}
          resizeMode="contain"
        />
        <Text style={styles.title}>Ora de Nuit</Text>
        <Text style={styles.tagline}>CUCINA ITALIANA · ANIMA HAITIANA</Text>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <View style={styles.dividerDiamond} />
          <View style={styles.dividerLine} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cream,
    paddingHorizontal: 24,
  },
  content: {
    alignItems: 'center',
  },
  logomark: {
    width: 150,
    height: 150 / LOGOMARK_ASPECT_RATIO,
    marginBottom: 8,
  },
  title: {
    color: colors.gold,
    fontSize: 26,
    fontWeight: '600',
    letterSpacing: 3,
    marginBottom: 10,
  },
  tagline: {
    color: colors.textMuted,
    fontSize: 11,
    letterSpacing: 1.5,
    marginBottom: 14,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dividerLine: {
    width: 44,
    height: 1,
    backgroundColor: colors.goldSoft,
  },
  dividerDiamond: {
    width: 6,
    height: 6,
    backgroundColor: colors.gold,
    marginHorizontal: 8,
    transform: [{ rotate: '45deg' }],
  },
});
