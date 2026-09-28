import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import AppButton from '../../components/AppButton';
import AppCard from '../../components/AppCard';
import { demoPets } from '../../constants/demoPets';
import { colors } from '../../constants/theme';
import type { RootStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'PetProfile'>;

export default function PetProfileScreen({ route, navigation }: Props) {
  const pet = demoPets.find((item) => item.id === route.params.petId);

  if (!pet) {
    return (
      <SafeAreaView
        style={styles.screen}
        edges={['left', 'right', 'bottom']}
      >
        <View style={styles.fallback}>
          <Text style={styles.title}>Pet not found</Text>
          <Text style={styles.subtitle}>
            This profile is unavailable.
          </Text>
          <AppButton
            title="Go back"
            onPress={() => navigation.goBack()}
          />
        </View>
      </SafeAreaView>
    );
  }

  const details = [
    { label: 'Species', value: pet.species },
    { label: 'Breed', value: pet.breed ?? 'Not provided' },
    { label: 'Sex', value: pet.sex },
    { label: 'Date of birth', value: pet.dateOfBirth ?? 'Not provided' },
    {
      label: 'Weight',
      value:
        pet.weightKg !== undefined
          ? `${pet.weightKg} kg`
          : 'Not provided',
    },
  ];

  return (
    <SafeAreaView
      style={styles.screen}
      edges={['left', 'right', 'bottom']}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>DEMO PET PROFILE</Text>
          </View>

          <Text accessibilityRole="header" style={styles.title}>
            {pet.name}
          </Text>
          <Text style={styles.subtitle}>{pet.breed}</Text>

          <View style={styles.editButton}>
            <AppButton
              title="Edit pet details"
              onPress={() =>
                navigation.navigate('EditPet', { petId: pet.id })
              }
            />
          </View>

          <AppCard>
            <Text style={styles.sectionTitle}>The little details</Text>

            {details.map((detail, index) => (
              <View
                key={detail.label}
                style={[
                  styles.detailRow,
                  index < details.length - 1 && styles.detailBorder,
                ]}
              >
                <Text style={styles.label}>{detail.label}</Text>
                <Text style={styles.value}>{detail.value}</Text>
              </View>
            ))}
          </AppCard>

          <AppCard style={styles.notesCard}>
            <Text style={styles.sectionTitle}>About {pet.name}</Text>
            <Text style={styles.notes}>
              {pet.notes || 'No notes added yet.'}
            </Text>
          </AppCard>

          <Text style={styles.previewNote}>
            Editing is currently a preview. Health records will be added
            in the next step.
          </Text>

          <AppButton
            title="Back to my pets"
            variant="secondary"
            onPress={() => navigation.goBack()}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: 24 },
  content: { width: '100%', maxWidth: 560, alignSelf: 'center' },
  fallback: { padding: 24, gap: 16 },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.lightAccent,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
  },
  badgeText: {
    color: colors.text,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  title: {
    color: colors.forest,
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1,
  },
  subtitle: {
    color: colors.mutedText,
    fontSize: 16,
    lineHeight: 24,
    marginTop: 8,
    marginBottom: 26,
  },
  editButton: { marginBottom: 24 },
  sectionTitle: {
    color: colors.forest,
    fontSize: 19,
    fontWeight: '700',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 14,
  },
  detailBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  label: {
    color: colors.mutedText,
    fontSize: 14,
    lineHeight: 22,
  },
  value: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '600',
    flexShrink: 1,
    textTransform: 'capitalize',
  },
  notesCard: { marginTop: 20 },
  notes: {
    color: colors.mutedText,
    fontSize: 15,
    lineHeight: 24,
  },
  previewNote: {
    color: colors.mutedText,
    fontSize: 12,
    lineHeight: 20,
    marginVertical: 24,
  },
});