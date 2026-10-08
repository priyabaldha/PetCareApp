import { useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import AppButton from '../../components/AppButton';
import AppCard from '../../components/AppCard';
import { usePet } from '../../hooks/usePetData';
import { deletePet } from '../../services/pets';
import { colors } from '../../constants/theme';
import type { RootStackParamList } from '../../types/navigation';
import PetVaccinations from '../../components/PetVaccinations';
import PetHealthRecords from '../../components/PetHealthRecords';
import PetMedications from '../../components/PetMedications';
import PetVetConsultations from '../../components/PetVetConsultations';
import PetVetPrescriptions from '../../components/PetVetPrescriptions';
import PetRecordSharingModal from '../../components/PetRecordSharingModal';

type Props = NativeStackScreenProps<RootStackParamList, 'PetProfile'>;

export default function PetProfileScreen({ route, navigation }: Props) {
  const { data: pet, loading, error, refresh } = usePet(route.params.petId);
  const [deleting, setDeleting] = useState(false);
  const [sharingModalOpen, setSharingModalOpen] = useState(false);
  const busy = useRef(false);
  async function removePet(): Promise<void> {
    if (busy.current) return;
    busy.current = true;
    setDeleting(true);
    try {
      await deletePet(route.params.petId);
    } catch (failure) {
      Alert.alert('Could not delete pet', failure instanceof Error ? failure.message : 'Please retry.');
      busy.current = false;
      setDeleting(false);
      return;
    }
    navigation.goBack();
  }
  function confirmDelete() {
    Alert.alert(
      'Delete pet?',
      `Remove ${pet?.name ?? 'this pet'} and their vaccination, appointment, health and medication records? This cannot be undone.`,
      [{ text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { void removePet(); } },
      ]);
  }

  if (!pet) {
    return (
      <SafeAreaView
        style={styles.screen}
        edges={['left', 'right', 'bottom']}
      >
        <View style={styles.fallback}>
          <Text style={styles.title}>{loading ? 'Loading pet...' : 'Pet unavailable'}</Text>
          <Text style={styles.subtitle}>
            {error || (loading ? 'Please wait.' : 'This profile is unavailable.')}
          </Text>
          {!loading && <AppButton title="Retry" onPress={refresh} />}
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
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>PET PROFILE</Text>
          </View>

          <Text accessibilityRole="header" style={styles.title}>
            {pet.name}
          </Text>
          <Text style={styles.subtitle}>{pet.breed}</Text>

          <View style={styles.editButton}>
            <AppButton
              title="Edit pet details"
              disabled={deleting}
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

          <PetVaccinations key={pet.id} petId={pet.id} />

          <PetHealthRecords
            key={`health-${pet.id}`}
            petId={pet.id}
            petName={pet.name}
            disabled={deleting}
          />
          <PetMedications
            key={`medications-${pet.id}`}
            petId={pet.id}
            petName={pet.name}
            disabled={deleting}
          />

          <PetVetConsultations petId={pet.id} />

          <PetVetPrescriptions petId={pet.id} />

          <View style={{ marginBottom: 12 }}>
            <AppButton
              title="Manage Medical Record Sharing"
              variant="secondary"
              disabled={deleting}
              onPress={() => setSharingModalOpen(true)}
            />
          </View>

          <View style={{ marginBottom: 20 }}>
            <AppButton
              title="Manage appointments"
              disabled={deleting}
              onPress={() =>
                navigation.navigate('Appointments', {
                  petId: pet.id,
                  petName: pet.name,
                })
              }
            />
          </View>

          <View style={{ marginBottom: 12 }}>
            <AppButton title="Delete pet" variant="secondary" onPress={confirmDelete}
              loading={deleting} disabled={deleting} />
          </View>
          <AppButton
            title="Back to my pets"
            disabled={deleting}
            variant="secondary"
            onPress={() => navigation.goBack()}
          />
        </View>
      </ScrollView>

      <PetRecordSharingModal
        visible={sharingModalOpen}
        petId={pet.id}
        petName={pet.name}
        onClose={() => setSharingModalOpen(false)}
      />
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