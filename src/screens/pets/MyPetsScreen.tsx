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
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import AppButton from '../../components/AppButton';
import { demoPets } from '../../constants/demoPets';
import { colors } from '../../constants/theme';
import type {
  MainTabParamList,
  RootStackParamList,
} from '../../types/navigation';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'MyPets'>,
  NativeStackScreenProps<RootStackParamList, 'MainTabs'>
>;

export default function MyPetsScreen({ navigation }: Props) {
  const [photoWidth, setPhotoWidth] = useState(0);
  const photoHeight = photoWidth * (2 / 3);

  return (
    <SafeAreaView
      style={styles.screen}
      edges={['top', 'left', 'right']}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.eyebrow}>YOUR LITTLE FAMILY</Text>
          <Text accessibilityRole="header" style={styles.title}>
            My Pets
          </Text>
          <Text style={styles.description}>
            Different personalities. The same place in your heart.
          </Text>

          <View
            style={[styles.photoFrame, { height: photoHeight }]}
            onLayout={(event) => {
              setPhotoWidth(event.nativeEvent.layout.width);
            }}
          >
            {photoWidth > 0 && (
              <Image
                source={require('../../../assets/images/pets-hero.png')}
                style={{ width: photoWidth, height: photoHeight }}
                resizeMode="contain"
                accessible
                accessibilityLabel="A dog and kitten together"
              />
            )}
          </View>

          <View style={styles.addButton}>
            <AppButton
              title="Add a pet"
              onPress={() => navigation.navigate('AddPet')}
            />
          </View>

          <View style={styles.listHeader}>
            <Text style={styles.sectionTitle}>Meet the family</Text>
            <Text style={styles.count}>{demoPets.length} demo pets</Text>
          </View>

          <View style={styles.list}>
            {demoPets.map((pet) => (
              <Pressable
                key={pet.id}
                accessibilityRole="button"
                accessibilityLabel={`Open ${pet.name}'s profile`}
                onPress={() =>
                  navigation.navigate('PetProfile', { petId: pet.id })
                }
                style={({ pressed }) => [
                  styles.petCard,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.petDetails}>
                  <Text style={styles.petName}>{pet.name}</Text>
                  <Text style={styles.breed}>{pet.breed}</Text>

                  <View style={styles.tags}>
                    <View style={styles.tag}>
                      <Text style={styles.tagText}>{pet.species}</Text>
                    </View>
                    <View style={styles.tag}>
                      <Text style={styles.tagText}>{pet.sex}</Text>
                    </View>
                  </View>
                </View>

                <Text accessible={false} style={styles.arrow}>›</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.note}>
            Sample profiles for testing. Your own pets will be saved in
            the pet-management step.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: 24, paddingBottom: 32 },
  content: { width: '100%', maxWidth: 560, alignSelf: 'center' },
  eyebrow: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  title: {
    color: colors.forest,
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -1,
  },
  description: {
    color: colors.mutedText,
    fontSize: 15,
    lineHeight: 24,
    marginTop: 10,
    marginBottom: 24,
  },
  photoFrame: {
    alignSelf: 'stretch',
    overflow: 'hidden',
    borderRadius: 24,
    backgroundColor: colors.paleSage,
    marginBottom: 24,
  },
  addButton: { marginBottom: 28 },
  listHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  count: { color: colors.mutedText, fontSize: 12 },
  list: { gap: 14 },
  petCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
    padding: 20,
  },
  petDetails: { flex: 1 },
  petName: {
    color: colors.forest,
    fontSize: 23,
    fontWeight: '700',
  },
  breed: {
    color: colors.mutedText,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 5,
  },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  tag: {
    backgroundColor: colors.paleSage,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagText: {
    color: colors.forest,
    fontSize: 12,
    textTransform: 'capitalize',
  },
  arrow: { color: colors.primary, fontSize: 30 },
  pressed: { opacity: 0.75 },
  note: {
    color: colors.mutedText,
    fontSize: 12,
    lineHeight: 20,
    marginTop: 24,
  },
});