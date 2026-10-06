import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
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
import { usePets } from '../../hooks/usePetData';
import { colors } from '../../constants/theme';

import { listVaccinations } from '../../services/vaccinations';
import type { Vaccination } from '../../services/vaccinations';

import {
  getVaccineReminders,
  getVaccineDueStatus,
} from '../../utils/vaccinationSummary';

import type {
  MainTabParamList,
  RootStackParamList,
} from '../../types/navigation';
import { useAppointmentSummary } from '../../hooks/useAppointmentSummary';


type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'MyPets'>,
  NativeStackScreenProps<RootStackParamList, 'MainTabs'>
>;

const accentColors = [
  '#F7D9C4',
  '#DDEBFF',
  '#E8DDF8',
  '#DDF2E5',
];

const petEmojis: Record<string, string> = {
  dog: '🐶',
  cat: '🐱',
  rabbit: '🐰',
  bird: '🐦',
  fish: '🐠',
  hamster: '🐹',
  turtle: '🐢',
  other: '🐾',
};

function getPetEmoji(species: string) {
  return petEmojis[species.toLowerCase()] ?? '🐾';
}

export default function MyPetsScreen({ navigation }: Props) {
  const appointments = useAppointmentSummary();
  const [selectedPet, setSelectedPet] = useState<string | null>(null);

  const { data, loading, error, refresh } = usePets();
  const pets = data ?? [];
  const petCount = data?.length ?? null;
  const [vaccinesByPet, setVaccinesByPet] = useState<
    Record<string, Vaccination[]>
  >({});
  const [vaccinesLoading, setVaccinesLoading] = useState(true);
  const [vaccinesError, setVaccinesError] = useState('');
  const [vaccinesRetry, setVaccinesRetry] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      setVaccinesByPet({});
      setVaccinesError('');

      if (loading) {
        setVaccinesLoading(true);
        return () => {
          active = false;
        };
      }

      if (error || !data) {
        setVaccinesLoading(false);
        setVaccinesError('Load your pets first to see vaccinations.');

        return () => {
          active = false;
        };
      }

      setVaccinesLoading(true);

      async function loadVaccinations() {
        try {
          const entries = await Promise.all(
            (data ?? []).map(async (pet) => {
              const records = await listVaccinations(pet.id);

              return {
                petId: pet.id,
                reminders: getVaccineReminders(records),
              };
            }),
          );

          if (!active) return;

          const grouped: Record<string, Vaccination[]> = {};

          for (const entry of entries) {
            grouped[entry.petId] = entry.reminders;
          }

          setVaccinesByPet(grouped);
        } catch (failure: unknown) {
          if (active) {
            setVaccinesError(
              failure instanceof Error
                ? failure.message
                : 'Could not load vaccinations.',
            );
          }
        } finally {
          if (active) {
            setVaccinesLoading(false);
          }
        }
      }

      void loadVaccinations();

      return () => {
        active = false;
      };
    }, [data, loading, error, vaccinesRetry]),
  );

  const allReminders = pets
    .flatMap((pet) =>
      (vaccinesByPet[pet.id] ?? []).map((record) => ({
        ...record,
        petName: pet.name,
      })),
    )
    .sort((a, b) =>
      (a.nextDueDate ?? '').localeCompare(b.nextDueDate ?? ''),
    );

  const nextVaccine = allReminders[0];

  const nextVaccineStatus = nextVaccine?.nextDueDate
    ? getVaccineDueStatus(nextVaccine.nextDueDate)
    : null;

  function openVaccinations() {
    if (loading || vaccinesLoading) return;

    if (error) {
      refresh();
      return;
    }

    if (vaccinesError) {
      setVaccinesRetry((value) => value + 1);
      return;
    }

    const petId = nextVaccine?.petId ?? pets[0]?.id;

    if (petId) {
      navigation.navigate('PetProfile', { petId });
    } else {
      navigation.navigate('AddPet');
    }
  }

  return (
    <SafeAreaView
      style={styles.screen}
      edges={['top', 'left', 'right']}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.content}>

          {/* HEADER */}
          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>YOUR LITTLE FAMILY</Text>

              <Text
                accessibilityRole="header"
                style={styles.title}
              >
                My Pets
              </Text>

              <Text style={styles.subtitle}>
                Everything they need, all in one place.
              </Text>
            </View>

            <Pressable
              style={styles.headerAddButton}
              accessibilityRole="button"
              accessibilityLabel="Add a pet"
              onPress={() => navigation.navigate('AddPet')}
            >
              <Text style={styles.headerAddIcon}>＋</Text>
            </Pressable>
          </View>

          {/* PET COUNT CARD */}
          <View style={styles.overviewCard}>
            <View style={styles.overviewLeft}>
              <Text style={styles.overviewNumber}>{petCount ?? '—'}</Text>

              <View>
                <Text style={styles.overviewTitle}>
                  {petCount === 1 ? 'Pet' : 'Pets'} in your family
                </Text>

                <Text style={styles.overviewSubtitle}>
                  Loved, cared for & protected
                </Text>
              </View>
            </View>

            <View style={styles.heartBubble}>
              <Text style={styles.heartEmoji}>💗</Text>
            </View>
          </View>

          {/* QUICK ACTIONS */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick care</Text>
            <Text style={styles.sectionLink}>View all</Text>
          </View>

          <View style={styles.quickActions}>

            <Pressable
              style={[styles.quickCard, styles.lavenderCard]}
              onPress={openVaccinations}
              disabled={loading || vaccinesLoading}
              accessibilityRole="button"
              accessibilityLabel="Open vaccination records"
            >
              <View style={styles.quickIcon}>
                <Text>💉</Text>
              </View>

              <Text style={styles.quickTitle}>Vaccines</Text>

              {loading || vaccinesLoading ? (
                <Text style={styles.quickText}>Loading reminders…</Text>
              ) : error || vaccinesError ? (
                <Text style={styles.quickText}>
                  Could not load. Tap to retry.
                </Text>
              ) : nextVaccine && nextVaccineStatus ? (
                <>
                  <Text
                    style={[
                      styles.quickText,
                      {
                        color: nextVaccineStatus.color,
                        fontWeight: '700',
                      },
                    ]}
                  >
                    {nextVaccineStatus.label}
                  </Text>

                  <Text style={styles.quickText}>
                    {nextVaccine.petName} · {nextVaccine.vaccineName}
                    {'\n'}
                    {nextVaccine.nextDueDate}
                  </Text>
                </>
              ) : (
                <Text style={styles.quickText}>
                  {pets.length === 0
                    ? 'Add your first pet'
                    : 'No due dates saved · Tap to add'}
                </Text>
              )}
            </Pressable>

            <Pressable
              style={[styles.quickCard, styles.blueCard]}
              onPress={() => { }}
            >
              <View style={styles.quickIcon}>
                <Text>📍</Text>
              </View>

              <Text style={styles.quickTitle}>Track pet</Text>

              <Text style={styles.quickText}>
                Open live tracking
              </Text>
            </Pressable>

            <Pressable
              style={[styles.quickCard, styles.peachCard]}
              onPress={() => { }}
            >
              <View style={styles.quickIcon}>
                <Text>🥣</Text>
              </View>

              <Text style={styles.quickTitle}>Pet guide</Text>

              <Text style={styles.quickText}>
                Food & daily care
              </Text>
            </Pressable>

            <Pressable
              style={[styles.quickCard, styles.mintCard]}
              disabled={appointments.loading || loading}
              accessibilityRole="button"
              onPress={() => {
                if (appointments.error) {
                  appointments.refresh();
                  return;
                }

                if (error) {
                  refresh();
                  return;
                }

                const next = appointments.next;
                const petId = next?.petId ?? pets[0]?.id;
                const petName = next?.petName ?? pets[0]?.name;

                if (petId && petName) {
                  navigation.navigate('Appointments', { petId, petName });
                } else {
                  navigation.navigate('AddPet');
                }
              }}
            >
              <View style={styles.quickIcon}>
                <Text>📅</Text>
              </View>

              <Text style={styles.quickTitle}>Appointments</Text>

              <Text style={styles.quickText}>
                {appointments.loading || loading
                  ? 'Loading visits…'
                  : appointments.error || error
                    ? 'Could not load. Tap to retry.'
                    : appointments.next
                      ? `${appointments.next.petName}\n${appointments.next.date} · ${appointments.next.time}`
                      : pets.length === 0
                        ? 'Add your first pet'
                        : 'No upcoming visits · Tap to manage'}
              </Text>
            </Pressable>

          </View>

          {/* PET LIST */}
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Meet your pets</Text>

              <Text style={styles.sectionSubtitle}>
                Tap a pet to see their complete profile
              </Text>
            </View>

            <Text style={styles.countText}>
              {petCount ?? '—'}
            </Text>
          </View>

          {loading && <Text style={styles.sectionSubtitle}>Loading your pets...</Text>}
          {!!error && <View style={{ gap: 12 }}>
            <Text accessibilityRole="alert" style={styles.sectionSubtitle}>{error}</Text>
            <AppButton title="Retry" onPress={refresh} />
          </View>}
          {!loading && !error && pets.length === 0 &&
            <Text style={styles.sectionSubtitle}>No pets yet. Add your first companion below.</Text>}
          <View style={styles.petList}>
            {pets.map((pet, index) => {

              const isSelected = selectedPet === pet.id;
              const petAppointment = appointments.upcoming.find(
                (appointment) => appointment.petId === pet.id,
              );
              const petVaccine = vaccinesByPet[pet.id]?.[0];

              const petVaccineStatus = petVaccine?.nextDueDate
                ? getVaccineDueStatus(petVaccine.nextDueDate)
                : null;
              return (
                <Pressable
                  key={pet.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Open ${pet.name}'s profile`}
                  onPress={() => {
                    setSelectedPet(pet.id);

                    navigation.navigate('PetProfile', {
                      petId: pet.id,
                    });
                  }}
                  style={({ pressed }) => [
                    styles.petCard,
                    {
                      borderColor: isSelected
                        ? colors.primary
                        : '#EAEAEA',
                    },
                    pressed && styles.pressed,
                  ]}
                >
                  {/* PET AVATAR */}
                  <View
                    style={[
                      styles.petAvatar,
                      {
                        backgroundColor:
                          accentColors[index % accentColors.length],
                      },
                    ]}
                  >
                    <Text style={styles.petEmoji}>
                      {getPetEmoji(pet.species)}
                    </Text>
                  </View>

                  {/* PET INFORMATION */}
                  <View style={styles.petInfo}>
                    <View style={styles.petNameRow}>
                      <Text style={styles.petName}>
                        {pet.name}
                      </Text>

                      <View style={styles.activeDot} />
                    </View>

                    <Text style={styles.petBreed}>
                      {pet.breed}
                    </Text>
                    <Text style={[styles.quickText, { marginTop: 7, color: '#67539B' }]}>
                      {appointments.loading
                        ? 'Loading appointments…'
                        : appointments.error
                          ? 'Appointment summary unavailable'
                          : petAppointment
                            ? `📅 ${petAppointment.date} · ${petAppointment.time}\n${petAppointment.clinicName}`
                            : 'No upcoming appointments'}
                    </Text>
                    {loading || vaccinesLoading ? (
                      <Text style={styles.quickText}>Loading vaccinations…</Text>
                    ) : error || vaccinesError ? (
                      <Text style={styles.quickText}>
                        Vaccination summary unavailable
                      </Text>
                    ) : petVaccine && petVaccineStatus ? (
                      <View style={{ marginTop: 7 }}>
                        <Text
                          style={[
                            styles.quickText,
                            {
                              color: petVaccineStatus.color,
                              fontWeight: '700',
                            },
                          ]}
                        >
                          💉 {petVaccineStatus.label}
                        </Text>

                        <Text style={styles.quickText}>
                          {petVaccine.vaccineName} · {petVaccine.nextDueDate}
                        </Text>
                      </View>
                    ) : (
                      <Text style={styles.quickText}>
                        No vaccination due date saved
                      </Text>
                    )}
                    <View style={styles.petTags}>
                      <View style={styles.speciesTag}>
                        <Text style={styles.speciesTagText}>
                          {pet.species}
                        </Text>
                      </View>

                      <View style={styles.speciesTag}>
                        <Text style={styles.speciesTagText}>
                          {pet.sex}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* ARROW */}
                  <View style={styles.arrowContainer}>
                    <Text style={styles.arrow}>›</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          {/* ADD PET */}
          <Pressable
            style={styles.addPetCard}
            onPress={() => navigation.navigate('AddPet')}
          >
            <View style={styles.addPetIcon}>
              <Text style={styles.addPetIconText}>＋</Text>
            </View>

            <View style={styles.addPetContent}>
              <Text style={styles.addPetTitle}>
                Add another pet
              </Text>

              <Text style={styles.addPetSubtitle}>
                Create a profile and keep their care organised.
              </Text>
            </View>

            <Text style={styles.addPetArrow}>›</Text>
          </Pressable>

          {/* CARE TIP */}
          <View style={styles.tipCard}>
            <View style={styles.tipIcon}>
              <Text>✨</Text>
            </View>

            <View style={styles.tipContent}>
              <Text style={styles.tipLabel}>JEEVA TIP</Text>

              <Text style={styles.tipTitle}>
                Small details make a big difference.
              </Text>

              <Text style={styles.tipText}>
                Keep vaccination records and important health
                information updated for every pet.
              </Text>
            </View>
          </View>

          <View style={styles.bottomSpace} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FAFAF8',
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 40,
  },

  content: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },

  /* HEADER */

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 22,
  },

  eyebrow: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 7,
  },

  title: {
    color: '#202B27',
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -1.2,
  },

  subtitle: {
    color: '#7A817E',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 5,
  },

  headerAddButton: {
    width: 48,
    height: 48,
    borderRadius: 17,
    backgroundColor: '#202B27',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 4,
    },
  },

  headerAddIcon: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '300',
    marginTop: -2,
  },

  /* OVERVIEW */

  overviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#EEEEEA',
    marginBottom: 26,
  },

  overviewLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },

  overviewNumber: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.primary,
  },

  overviewTitle: {
    color: '#252C29',
    fontSize: 15,
    fontWeight: '700',
  },

  overviewSubtitle: {
    color: '#858B88',
    fontSize: 12,
    marginTop: 4,
  },

  heartBubble: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: '#FDE9EF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  heartEmoji: {
    fontSize: 21,
  },

  /* SECTIONS */

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 13,
  },

  sectionTitle: {
    color: '#252C29',
    fontSize: 20,
    fontWeight: '800',
  },

  sectionSubtitle: {
    color: '#8A908D',
    fontSize: 11,
    marginTop: 4,
  },

  sectionLink: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },

  countText: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#EEEAE4',
    textAlign: 'center',
    textAlignVertical: 'center',
    color: '#626864',
    fontSize: 12,
    fontWeight: '700',
    overflow: 'hidden',
  },

  /* QUICK ACTIONS */

  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 28,
  },

  quickCard: {
    width: '48.5%',
    minHeight: 128,
    borderRadius: 22,
    padding: 15,
  },

  lavenderCard: {
    backgroundColor: '#EEE8FB',
  },

  blueCard: {
    backgroundColor: '#E4F0FF',
  },

  peachCard: {
    backgroundColor: '#FBE8DC',
  },

  mintCard: {
    backgroundColor: '#E5F3EA',
  },

  quickIcon: {
    width: 39,
    height: 39,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 11,
  },

  quickIconText: {
    fontSize: 18,
  },

  quickTitle: {
    color: '#303633',
    fontSize: 14,
    fontWeight: '800',
  },

  quickText: {
    color: '#737A76',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
  },

  /* PET LIST */

  petList: {
    gap: 12,
    marginBottom: 16,
  },

  petCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 23,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },

  petAvatar: {
    width: 70,
    height: 70,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },

  petEmoji: {
    fontSize: 37,
  },

  petInfo: {
    flex: 1,
    marginLeft: 14,
  },

  petNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  petName: {
    color: '#252C29',
    fontSize: 17,
    fontWeight: '800',
  },

  activeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#6BCB8B',
  },

  petBreed: {
    color: '#858C88',
    fontSize: 12,
    marginTop: 3,
  },

  petTags: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 9,
  },

  speciesTag: {
    backgroundColor: '#F3F2EF',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },

  speciesTagText: {
    color: '#6D7470',
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'capitalize',
  },

  arrowContainer: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: '#F5F5F2',
    alignItems: 'center',
    justifyContent: 'center',
  },

  arrow: {
    color: '#555D58',
    fontSize: 24,
    lineHeight: 27,
    marginLeft: 1,
  },

  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.99 }],
  },

  /* ADD PET */

  addPetCard: {
    backgroundColor: '#202B27',
    borderRadius: 23,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },

  addPetIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  addPetIconText: {
    color: '#202B27',
    fontSize: 25,
    fontWeight: '300',
  },

  addPetContent: {
    flex: 1,
    marginLeft: 13,
  },

  addPetTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },

  addPetSubtitle: {
    color: '#B8C1BC',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 3,
  },

  addPetArrow: {
    color: '#FFFFFF',
    fontSize: 28,
    marginLeft: 8,
  },

  /* TIP */

  tipCard: {
    marginTop: 18,
    backgroundColor: '#FFF6D9',
    borderRadius: 22,
    padding: 17,
    flexDirection: 'row',
  },

  tipIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  tipContent: {
    flex: 1,
    marginLeft: 12,
  },

  tipLabel: {
    color: '#9B7B2D',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
  },

  tipTitle: {
    color: '#4B4330',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 4,
  },

  tipText: {
    color: '#776D55',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 4,
  },

  bottomSpace: {
    height: 20,
  },
});