import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '../../constants/theme';

export default function SplashScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <Text style={styles.brand}>petcare.</Text>
        <Text style={styles.tagline}>A little care. A whole lot of love.</Text>
        <ActivityIndicator
          size="small"
          color={colors.onForest}
          style={styles.loader}
          accessibilityLabel="Loading PetCare"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.forest,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    alignItems: 'center',
  },
  brand: {
    color: colors.onForest,
    fontSize: 54,
    fontWeight: '800',
    letterSpacing: -2,
  },
  tagline: {
    color: colors.onForestMuted,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 24,
    marginTop: 12,
  },
  loader: {
    marginTop: 32,
  },
});