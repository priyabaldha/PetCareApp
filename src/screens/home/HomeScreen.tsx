import { useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

import AppButton from '../../components/AppButton';
import { colors } from '../../constants/theme';
import type { MainTabParamList } from '../../types/navigation';

type Props = BottomTabScreenProps<MainTabParamList, 'Home'>;

interface CareShortcut {
  number: string;
  title: string;
  description: string;
  route: 'MyPets' | 'Appointments' | 'Notifications';
}

const shortcuts: CareShortcut[] = [
  {
    number: '01',
    title: 'My pets',
    description: 'A space for every companion.',
    route: 'MyPets',
  },
  {
    number: '02',
    title: 'Appointments',
    description: 'Plan their next visit.',
    route: 'Appointments',
  },
  {
    number: '03',
    title: 'Care updates',
    description: 'Keep important reminders close.',
    route: 'Notifications',
  },
];

export default function HomeScreen({ navigation }: Props) {
  const [photoWidth, setPhotoWidth] = useState(0);
  const photoHeight = photoWidth * (2 / 3);

  return (
    <SafeAreaView
      style={styles.screen}
      edges={['top', 'left', 'right']}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.brand}>petcare.</Text>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open your profile"
              onPress={() => navigation.navigate('Profile')}
              style={({ pressed }) => [
                styles.profileButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.profileButtonText}>My profile</Text>
            </Pressable>
          </View>

          <Text style={styles.eyebrow}>YOUR EVERYDAY CARE COMPANION</Text>

          <Text accessibilityRole="header" style={styles.title}>
            Happy pets.{'\n'}
            <Text style={styles.titleAccent}>A happier you.</Text>
          </Text>

          <Text style={styles.subtitle}>
            A little care today. More happy moments together.
          </Text>

          <View style={styles.heroCard}>
            <View
              style={[styles.photoFrame, { height: photoHeight }]}
              onLayout={(event) => {
                setPhotoWidth(event.nativeEvent.layout.width);
              }}
            >
              {photoWidth > 0 && (
                <Image
                  source={require('../../../assets/images/pets-hero.png')}
                  style={{
                    width: photoWidth,
                    height: photoHeight,
                  }}
                  resizeMode="contain"
                  accessible
                  accessibilityLabel="A golden retriever and kitten resting together"
                />
              )}
            </View>

            <View style={styles.heroCaption}>
              <View style={styles.captionAccent} />
              <View style={styles.captionContent}>
                <Text style={styles.captionTitle}>
                  Family comes in all sizes.
                </Text>
                <Text style={styles.captionDescription}>
                  Every one deserves a little extra care.
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <Text accessibilityRole="header" style={styles.sectionTitle}>
              Their care, at a glance
            </Text>
            <Text style={styles.sectionDescription}>
              Everything you need, a little closer.
            </Text>
          </View>

          <View style={styles.shortcutList}>
            {shortcuts.map((shortcut) => (
              <Pressable
                key={shortcut.route}
                accessibilityRole="button"
                accessibilityLabel={`Open ${shortcut.title}`}
                onPress={() => navigation.navigate(shortcut.route)}
                style={({ pressed }) => [
                  styles.shortcut,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.numberCircle}>
                  <Text style={styles.numberText}>{shortcut.number}</Text>
                </View>

                <View style={styles.shortcutContent}>
                  <Text style={styles.shortcutTitle}>
                    {shortcut.title}
                  </Text>
                  <Text style={styles.shortcutDescription}>
                    {shortcut.description}
                  </Text>
                </View>

                <Text accessible={false} style={styles.arrow}>
                  ›
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.carePanel}>
            <Text style={styles.panelEyebrow}>MADE FOR YOUR LITTLE FAMILY</Text>
            <Text accessibilityRole="header" style={styles.panelTitle}>
              Every pet has a story.
            </Text>
            <Text style={styles.panelDescription}>
              Give their details, routines, and health records a place to
              belong.
            </Text>

            <AppButton
              title="Explore my pets"
              variant="secondary"
              onPress={() => navigation.navigate('MyPets')}
            />
          </View>

          <View style={styles.previewNote}>
            <Text style={styles.previewTitle}>Your dashboard preview</Text>
            <Text style={styles.previewDescription}>
              Pet summaries and upcoming appointments will appear here
              once we connect those features.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 32,
  },
  content: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 30,
  },
  brand: {
    color: colors.forest,
    fontSize: 29,
    fontWeight: '800',
    letterSpacing: -1.4,
  },
  profileButton: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.paleSage,
    borderRadius: 999,
  },
  profileButtonText: {
    color: colors.forest,
    fontSize: 13,
    fontWeight: '600',
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 10,
    lineHeight: 17,
    letterSpacing: 1.3,
    fontWeight: '700',
    marginBottom: 12,
  },
  title: {
    color: colors.text,
    fontSize: 36,
    lineHeight: 43,
    fontWeight: '800',
    letterSpacing: -1.3,
  },
  titleAccent: {
    color: colors.primary,
  },
  subtitle: {
    color: colors.mutedText,
    fontSize: 15,
    lineHeight: 24,
    marginTop: 14,
    marginBottom: 24,
  },
  heroCard: {
    backgroundColor: colors.card,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: 30,
  },
  photoFrame: {
    alignSelf: 'stretch',
    overflow: 'hidden',
    backgroundColor: colors.background,
  },
  heroCaption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
  },
  captionAccent: {
    width: 4,
    height: 36,
    borderRadius: 2,
    backgroundColor: colors.accent,
  },
  captionContent: {
    flex: 1,
  },
  captionTitle: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '700',
  },
  captionDescription: {
    color: colors.mutedText,
    fontSize: 12,
    lineHeight: 19,
    marginTop: 3,
  },
  sectionHeader: {
    marginBottom: 18,
  },
  sectionTitle: {
    color: colors.forest,
    fontSize: 23,
    lineHeight: 30,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  sectionDescription: {
    color: colors.mutedText,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 6,
  },
  shortcutList: {
    gap: 12,
    marginBottom: 24,
  },
  shortcut: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    padding: 16,
  },
  numberCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.paleSage,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: {
    color: colors.forest,
    fontSize: 12,
    fontWeight: '700',
  },
  shortcutContent: {
    flex: 1,
  },
  shortcutTitle: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 23,
    fontWeight: '700',
  },
  shortcutDescription: {
    color: colors.mutedText,
    fontSize: 12,
    lineHeight: 19,
    marginTop: 3,
  },
  arrow: {
    color: colors.primary,
    fontSize: 28,
  },
  pressed: {
    opacity: 0.75,
  },
  carePanel: {
    backgroundColor: colors.forest,
    borderRadius: 26,
    padding: 24,
    marginBottom: 20,
  },
  panelEyebrow: {
    color: colors.onForestMuted,
    fontSize: 9,
    lineHeight: 16,
    letterSpacing: 1.2,
    fontWeight: '700',
    marginBottom: 12,
  },
  panelTitle: {
    color: colors.onForest,
    fontSize: 27,
    lineHeight: 34,
    fontWeight: '700',
    marginBottom: 12,
  },
  panelDescription: {
    color: colors.onForestMuted,
    fontSize: 14,
    lineHeight: 23,
    marginBottom: 24,
  },
  previewNote: {
    borderRadius: 16,
    backgroundColor: colors.paleSage,
    padding: 16,
  },
  previewTitle: {
    color: colors.forest,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 5,
  },
  previewDescription: {
    color: colors.text,
    fontSize: 12,
    lineHeight: 19,
  },
});