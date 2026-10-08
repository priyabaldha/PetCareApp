import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { getCurrentUser } from '../../services/auth';
import { listPets } from '../../services/pets';
import { listVaccinations } from '../../services/vaccinations';
import type { Vaccination } from '../../services/vaccinations';

import {
  getVaccineReminders,
  getVaccineDueStatus,
} from '../../utils/vaccinationSummary';

import { useAppointmentSummary } from '../../hooks/useAppointmentSummary';
import PetGuideModal from '../../components/PetGuideModal';
import { careTips, findPetGuide } from '../../data/petGuides';

import type {
  MainTabParamList,
  RootStackParamList,
} from '../../types/navigation';

import { colors } from '../../constants/theme';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Home'>,
  NativeStackScreenProps<RootStackParamList, 'MainTabs'>
>;

type IconName = keyof typeof Ionicons.glyphMap;

interface QuickAction {
  id: string;
  title: string;
  subtitle: string;
  icon: IconName;
  color: string;
  background: string;
}

type HomeVaccineReminder = Vaccination & {
  petName: string;
};

const quickActions: QuickAction[] = [
  {
    id: 'findVet',
    title: 'Find Vet',
    subtitle: 'Book consultation',
    icon: 'medkit',
    color: '#67539B',
    background: '#EEE9FA',
  },
  {
    id: 'appointment',
    title: 'Appointment',
    subtitle: 'View saved visits',
    icon: 'calendar',
    color: '#E76F51',
    background: '#FCE8E1',
  },
  {
    id: 'vaccine',
    title: 'Vaccines',
    subtitle: 'View reminders',
    icon: 'medical',
    color: '#3A8D8A',
    background: '#E2F3F1',
  },
  {
    id: 'guide',
    title: 'Pet guide',
    subtitle: 'Food & care tips',
    icon: 'book',
    color: '#D49A3A',
    background: '#FBF0DA',
  },
];

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) return 'GOOD MORNING ✨';
  if (hour < 17) return 'GOOD AFTERNOON ☀️';

  return 'GOOD EVENING 🌙';
}

function getPetEmoji(species: string) {
  switch (species.toLowerCase()) {
    case 'dog':
      return '🐶';
    case 'cat':
      return '🐱';
    case 'bird':
      return '🐦';
    case 'rabbit':
      return '🐰';
    default:
      return '🐾';
  }
}

export default function HomeScreen({ navigation }: Props) {
  const appointments = useAppointmentSummary();

  const [showActions, setShowActions] = useState(false);

  const [selectedGuideId, setSelectedGuideId] = useState<string | null>(
    null,
  );
  const [tipIndex, setTipIndex] = useState(0);

  const [userName, setUserName] = useState('');
  const [nameError, setNameError] = useState('');
  const [nameRetry, setNameRetry] = useState(0);
  const [greeting, setGreeting] = useState(getGreeting);

  const [pets, setPets] = useState<
    Awaited<ReturnType<typeof listPets>>
  >([]);
  const [petsLoading, setPetsLoading] = useState(true);
  const [petsError, setPetsError] = useState('');
  const [petsRetry, setPetsRetry] = useState(0);

  const [vaccineReminders, setVaccineReminders] = useState<
    HomeVaccineReminder[]
  >([]);
  const [vaccinesLoading, setVaccinesLoading] = useState(true);
  const [vaccinesError, setVaccinesError] = useState('');

  const selectedGuide = selectedGuideId
    ? findPetGuide(selectedGuideId)
    : null;

  const currentTip =
    careTips[tipIndex] ??
    'Keep your pet’s records and clinic contact details together.';

  const nextVaccine = vaccineReminders[0];

  const vaccineStatus = nextVaccine?.nextDueDate
    ? getVaccineDueStatus(nextVaccine.nextDueDate)
    : null;

  // Load the signed-in user's name whenever Home is focused.
  useFocusEffect(
    useCallback(() => {
      let active = true;

      setGreeting(getGreeting());
      setNameError('');

      async function loadName() {
        try {
          const user = await getCurrentUser();

          if (!active) return;

          setUserName(user?.name ?? '');
        } catch (error: unknown) {
          if (!active) return;

          setNameError(
            error instanceof Error
              ? error.message
              : 'Could not load your name.',
          );
        }
      }

      void loadName();

      return () => {
        active = false;
      };
    }, [nameRetry]),
  );

  // Load pets once, then load each pet's vaccination reminders.
  useFocusEffect(
    useCallback(() => {
      let active = true;

      setPetsLoading(true);
      setPetsError('');
      setPets([]);

      setVaccinesLoading(true);
      setVaccinesError('');
      setVaccineReminders([]);

      async function loadHomePets() {
        let savedPets: Awaited<ReturnType<typeof listPets>>;

        try {
          savedPets = await listPets();
        } catch (error: unknown) {
          if (active) {
            setPetsError(
              error instanceof Error
                ? error.message
                : 'Could not load your pets.',
            );

            setVaccinesError(
              'Could not load vaccination reminders.',
            );

            setPetsLoading(false);
            setVaccinesLoading(false);
          }

          return;
        }

        if (!active) return;

        setPets(savedPets);
        setPetsLoading(false);

        try {
          const remindersByPet = await Promise.all(
            savedPets.map(async (pet) => {
              const records = await listVaccinations(pet.id);

              return getVaccineReminders(records).map((record) => ({
                ...record,
                petName: pet.name,
              }));
            }),
          );

          const reminders = remindersByPet
            .flat()
            .sort((a, b) =>
              (a.nextDueDate ?? '').localeCompare(
                b.nextDueDate ?? '',
              ),
            );

          if (active) {
            setVaccineReminders(reminders);
          }
        } catch (error: unknown) {
          if (active) {
            setVaccinesError(
              error instanceof Error
                ? error.message
                : 'Could not load vaccination reminders.',
            );
          }
        } finally {
          if (active) {
            setVaccinesLoading(false);
          }
        }
      }

      void loadHomePets();

      return () => {
        active = false;
      };
    }, [petsRetry]),
  );

  function openAppointments() {
    if (appointments.loading) {
      Alert.alert(
        'Appointments',
        'Your appointments are loading.',
      );
      return;
    }

    if (appointments.error) {
      appointments.refresh();
      return;
    }

    if (appointments.next) {
      navigation.navigate('Appointments', {
        petId: appointments.next.petId,
        petName: appointments.next.petName,
      });
      return;
    }

    navigation.navigate('MyPets');
  }

  function openVaccinations() {
    if (vaccinesLoading) {
      Alert.alert(
        'Vaccinations',
        'Your reminders are loading.',
      );
      return;
    }

    if (vaccinesError) {
      setPetsRetry((value) => value + 1);
      return;
    }

    if (nextVaccine) {
      navigation.navigate('PetProfile', {
        petId: nextVaccine.petId,
      });
      return;
    }

    navigation.navigate('MyPets');
  }

  function showAiMessage() {
    Alert.alert(
      'JEEVA AI · Coming soon',
      'The AI assistant is not available yet. You can read the pet guides for everyday care information.',
    );
  }

  function handleQuickAction(id: string) {
    switch (id) {
      case 'findVet':
        navigation.navigate('FindVet');
        break;

      case 'appointment':
        openAppointments();
        break;

      case 'vaccine':
        openVaccinations();
        break;

      case 'guide':
        navigation.navigate('Explore');
        break;

      default:
        break;
    }
  }

  function showNextTip() {
    if (careTips.length === 0) return;

    setTipIndex((value) => (value + 1) % careTips.length);
  }

  return (
    <SafeAreaView
      style={styles.screen}
      edges={['top', 'left', 'right']}
    >
      <PetGuideModal
        guide={selectedGuide}
        onClose={() => setSelectedGuideId(null)}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.content}>
          {/* HEADER */}

          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.greeting}>{greeting}</Text>

              <Text style={styles.title}>
                {userName ? `Hello, ${userName}` : 'Hello'}
              </Text>

              {!!nameError && (
                <Pressable
                  onPress={() =>
                    setNameRetry((value) => value + 1)
                  }
                  accessibilityRole="button"
                  style={styles.retryNameButton}
                >
                  <Text style={styles.retryNameText}>
                    Could not load your name. Tap to retry.
                  </Text>
                </Pressable>
              )}

              <Text style={styles.subtitle}>
                Let's make today special for them.
              </Text>
            </View>

            <Pressable
              style={styles.notificationButton}
              onPress={() =>
                navigation.navigate('Notifications')
              }
              accessibilityRole="button"
              accessibilityLabel="Open notifications"
            >
              <Ionicons
                name="notifications-outline"
                size={23}
                color={colors.forest}
              />
            </Pressable>
          </View>

          {/* PET OVERVIEW */}

          <View style={styles.petHeroCard}>
            <View style={styles.petHeroText}>
              <View style={styles.smallPill}>
                <Ionicons
                  name="heart"
                  size={12}
                  color="#E76F51"
                />
                <Text style={styles.smallPillText}>
                  YOUR PET FAMILY
                </Text>
              </View>

              <Text style={styles.petHeroTitle}>
                Their happiness
              </Text>

              <Text style={styles.petHeroTitleAccent}>
                starts with you.
              </Text>

              <Text style={styles.petHeroDescription}>
                Keep their health, appointments and everyday
                care beautifully organised.
              </Text>

              <Pressable
                style={styles.viewPetsButton}
                onPress={() => navigation.navigate('MyPets')}
                accessibilityRole="button"
              >
                <Text style={styles.viewPetsText}>
                  View my pets
                </Text>

                <Ionicons
                  name="arrow-forward"
                  size={16}
                  color="#FFFFFF"
                />
              </Pressable>
            </View>

            <View style={styles.heroDecoration}>
              <View style={styles.heroCircle}>
                <Text style={styles.heroEmoji}>🐶</Text>
              </View>

              <View style={styles.heroSmallCircle}>
                <Text style={styles.heroSmallEmoji}>🐱</Text>
              </View>
            </View>
          </View>

          {/* SAVED PETS */}

          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeading}>
              <Text style={styles.sectionTitle}>My pets</Text>

              <Text style={styles.sectionSubtitle}>
                Your little family, all in one place
              </Text>
            </View>

            <Pressable
              onPress={() => navigation.navigate('AddPet')}
              accessibilityRole="button"
              accessibilityLabel="Add a pet"
              style={styles.plusButton}
            >
              <Ionicons
                name="add"
                size={23}
                color="#FFFFFF"
              />
            </Pressable>
          </View>

          <View style={styles.petListSection}>
            {petsLoading ? (
              <View style={homePetStyles.messageCard}>
                <Text style={homePetStyles.detail}>
                  Loading your pets…
                </Text>
              </View>
            ) : petsError ? (
              <View style={homePetStyles.messageCard}>
                <Text style={homePetStyles.error}>
                  {petsError}
                </Text>

                <Pressable
                  onPress={() =>
                    setPetsRetry((value) => value + 1)
                  }
                  accessibilityRole="button"
                  style={homePetStyles.actionButton}
                >
                  <Text style={homePetStyles.actionText}>
                    Try again
                  </Text>
                </Pressable>
              </View>
            ) : pets.length === 0 ? (
              <View style={homePetStyles.messageCard}>
                <Text style={homePetStyles.emoji}>🐾</Text>

                <Text style={homePetStyles.name}>
                  Meet your pet family
                </Text>

                <Text style={homePetStyles.detail}>
                  Add your first pet to start organising their
                  care.
                </Text>

                <Pressable
                  onPress={() => navigation.navigate('AddPet')}
                  accessibilityRole="button"
                  style={homePetStyles.actionButton}
                >
                  <Text style={homePetStyles.actionText}>
                    Add your first pet
                  </Text>
                </Pressable>
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={homePetStyles.list}
              >
                {pets.map((pet) => (
                  <Pressable
                    key={pet.id}
                    onPress={() =>
                      navigation.navigate('PetProfile', {
                        petId: pet.id,
                      })
                    }
                    accessibilityRole="button"
                    accessibilityLabel={`Open ${pet.name}'s profile`}
                    style={({ pressed }) => [
                      homePetStyles.card,
                      pressed && styles.pressed,
                    ]}
                  >
                    <View style={homePetStyles.avatar}>
                      <Text style={homePetStyles.emoji}>
                        {getPetEmoji(pet.species)}
                      </Text>
                    </View>

                    <Text
                      style={homePetStyles.name}
                      numberOfLines={1}
                    >
                      {pet.name}
                    </Text>

                    <Text
                      style={homePetStyles.detail}
                      numberOfLines={1}
                    >
                      {pet.breed?.trim() ||
                        pet.species.charAt(0).toUpperCase() +
                          pet.species.slice(1)}
                    </Text>

                    <View style={homePetStyles.profileLink}>
                      <Text style={homePetStyles.linkText}>
                        View profile
                      </Text>

                      <Ionicons
                        name="arrow-forward"
                        size={15}
                        color="#67539B"
                      />
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </View>

          {/* TODAY'S CARE */}

          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeading}>
              <Text style={styles.sectionTitle}>
                Today's care
              </Text>

              <Text style={styles.sectionSubtitle}>
                A few things worth checking
              </Text>
            </View>

            <Pressable
              onPress={() =>
                setShowActions((value) => !value)
              }
              style={styles.plusButton}
              accessibilityRole="button"
              accessibilityLabel={
                showActions
                  ? 'Hide quick actions'
                  : 'Show quick actions'
              }
              accessibilityState={{ expanded: showActions }}
            >
              <Ionicons
                name={showActions ? 'close' : 'add'}
                size={23}
                color="#FFFFFF"
              />
            </Pressable>
          </View>

          {/* QUICK ACTIONS */}

          {showActions && (
            <View style={styles.quickActionsGrid}>
              {quickActions.map((action) => (
                <Pressable
                  key={action.id}
                  style={({ pressed }) => [
                    styles.quickActionCard,
                    pressed && styles.pressed,
                  ]}
                  onPress={() =>
                    handleQuickAction(action.id)
                  }
                  accessibilityRole="button"
                >
                  <View
                    style={[
                      styles.quickActionIcon,
                      { backgroundColor: action.background },
                    ]}
                  >
                    <Ionicons
                      name={action.icon}
                      size={21}
                      color={action.color}
                    />
                  </View>

                  <Text style={styles.quickActionTitle}>
                    {action.title}
                  </Text>

                  <Text style={styles.quickActionSubtitle}>
                    {action.subtitle}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          {/* TRACKING */}

          <Pressable
            style={({ pressed }) => [
              styles.trackingCard,
              pressed && styles.pressed,
            ]}
            onPress={() => handleQuickAction('track')}
            accessibilityRole="button"
            accessibilityLabel="Pet tracking, coming soon"
          >
            <View style={styles.trackingIcon}>
              <Ionicons
                name="navigate"
                size={25}
                color="#67539B"
              />
            </View>

            <View style={styles.trackingContent}>
              <Text style={styles.trackingLabel}>
                PET SAFETY
              </Text>

              <Text style={styles.trackingTitle}>
                Track your pet
              </Text>

              <Text style={styles.trackingDescription}>
                Coming soon · Live tracking is not available yet.
              </Text>
            </View>

            <View style={styles.arrowCircle}>
              <Ionicons
                name="chevron-forward"
                size={18}
                color="#67539B"
              />
            </View>
          </Pressable>

          {/* APPOINTMENTS */}

          <View
            style={[
              styles.vaccineCard,
              styles.appointmentCard,
            ]}
          >
            <View
              style={[
                styles.vaccineIcon,
                styles.appointmentIcon,
              ]}
            >
              <Ionicons
                name="calendar"
                size={23}
                color="#537CB0"
              />
            </View>

            <View style={styles.vaccineContent}>
              <Text
                style={[
                  styles.vaccineLabel,
                  styles.appointmentLabel,
                ]}
              >
                NEXT APPOINTMENT
              </Text>

              {appointments.loading ? (
                <Text style={styles.vaccineDescription}>
                  Loading appointments…
                </Text>
              ) : appointments.error ? (
                <>
                  <Text style={styles.vaccineDescription}>
                    {appointments.error}
                  </Text>

                  <Pressable
                    onPress={() => appointments.refresh()}
                    accessibilityRole="button"
                    style={styles.textButton}
                  >
                    <Text
                      style={[
                        styles.manageReminder,
                        styles.appointmentLabel,
                      ]}
                    >
                      Try again →
                    </Text>
                  </Pressable>
                </>
              ) : appointments.next ? (
                <>
                  <Text style={styles.vaccineTitle}>
                    {appointments.next.petName} ·{' '}
                    {appointments.next.clinicName}
                  </Text>

                  <Text style={styles.vaccineDescription}>
                    {appointments.next.date} at{' '}
                    {appointments.next.time}
                    {'\n'}
                    {appointments.next.reason}
                  </Text>

                  {!!appointments.next.vetName && (
                    <Text style={styles.vaccineDescription}>
                      Vet: {appointments.next.vetName}
                    </Text>
                  )}

                  {appointments.count > 1 && (
                    <Text style={styles.vaccineDescription}>
                      {appointments.count - 1} other upcoming
                      {' '}
                      {appointments.count === 2
                        ? 'appointment'
                        : 'appointments'}
                    </Text>
                  )}

                  <Pressable
                    onPress={openAppointments}
                    accessibilityRole="button"
                    style={styles.textButton}
                  >
                    <Text
                      style={[
                        styles.manageReminder,
                        styles.appointmentLabel,
                      ]}
                    >
                      Manage appointments →
                    </Text>
                  </Pressable>
                </>
              ) : (
                <>
                  <Text style={styles.vaccineTitle}>
                    No upcoming appointments
                  </Text>

                  <Text style={styles.vaccineDescription}>
                    Select a pet to record a visit or view
                    appointment history.
                  </Text>

                  <Pressable
                    onPress={openAppointments}
                    accessibilityRole="button"
                    style={styles.textButton}
                  >
                    <Text
                      style={[
                        styles.manageReminder,
                        styles.appointmentLabel,
                      ]}
                    >
                      Choose a pet →
                    </Text>
                  </Pressable>
                </>
              )}
            </View>
          </View>

          {/* VACCINATION REMINDER */}

          <View style={styles.vaccineCard}>
            <View style={styles.vaccineIcon}>
              <Ionicons
                name="medical"
                size={23}
                color="#E76F51"
              />
            </View>

            <View style={styles.vaccineContent}>
              <View style={styles.vaccineTopRow}>
                <Text style={styles.vaccineLabel}>
                  VACCINATION REMINDER
                </Text>

                {!vaccinesLoading &&
                  !vaccinesError &&
                  vaccineStatus && (
                    <View style={styles.upcomingBadge}>
                      <Text
                        style={[
                          styles.upcomingText,
                          { color: vaccineStatus.color },
                        ]}
                      >
                        {vaccineStatus.label.toUpperCase()}
                      </Text>
                    </View>
                  )}
              </View>

              {vaccinesLoading ? (
                <Text style={styles.vaccineDescription}>
                  Loading vaccination reminders…
                </Text>
              ) : vaccinesError ? (
                <>
                  <Text style={styles.vaccineDescription}>
                    {vaccinesError}
                  </Text>

                  <Pressable
                    onPress={() =>
                      setPetsRetry((value) => value + 1)
                    }
                    accessibilityRole="button"
                    style={styles.textButton}
                  >
                    <Text style={styles.manageReminder}>
                      Try again →
                    </Text>
                  </Pressable>
                </>
              ) : nextVaccine && vaccineStatus ? (
                <>
                  <Text style={styles.vaccineTitle}>
                    {nextVaccine.petName} ·{' '}
                    {nextVaccine.vaccineName}
                  </Text>

                  <Text style={styles.vaccineDescription}>
                    {vaccineStatus.description}
                    {'\n'}
                    Due date: {nextVaccine.nextDueDate}
                  </Text>

                  {vaccineReminders.length > 1 && (
                    <Text style={styles.vaccineDescription}>
                      {vaccineReminders.length - 1} other vaccine
                      {vaccineReminders.length === 2 ? '' : 's'}
                      {' '}with due dates
                    </Text>
                  )}

                  <Pressable
                    onPress={openVaccinations}
                    accessibilityRole="button"
                    accessibilityLabel={`Open ${nextVaccine.petName}'s vaccination records`}
                    style={styles.textButton}
                  >
                    <Text style={styles.manageReminder}>
                      View vaccination records →
                    </Text>
                  </Pressable>
                </>
              ) : (
                <>
                  <Text style={styles.vaccineTitle}>
                    No vaccination due dates saved
                  </Text>

                  <Text style={styles.vaccineDescription}>
                    Add your vet’s next due date to a pet’s
                    vaccination record.
                  </Text>

                  <Pressable
                    onPress={() =>
                      navigation.navigate('MyPets')
                    }
                    accessibilityRole="button"
                    style={styles.textButton}
                  >
                    <Text style={styles.manageReminder}>
                      Open my pets →
                    </Text>
                  </Pressable>
                </>
              )}
            </View>
          </View>

          {/* COMMUNITY */}

          <View style={styles.communityCard}>
            <View style={styles.communityIllustration}>
              <View style={styles.communityBubbleOne}>
                <Text style={styles.communityEmoji}>🐕</Text>
              </View>

              <View style={styles.communityBubbleTwo}>
                <Text style={styles.communityEmoji}>🐈</Text>
              </View>

              <View style={styles.communityBubbleThree}>
                <Text style={styles.communityEmoji}>🐰</Text>
              </View>
            </View>

            <View style={styles.communityContent}>
              <Text style={styles.communityEyebrow}>
                JEEVA COMMUNITY
              </Text>

              <Text style={styles.communityTitle}>
                You're not caring alone.
              </Text>

              <Text style={styles.communityDescription}>
                A space for animal lovers and pet parents.
                Explore the community preview.
              </Text>

              <Pressable
                style={styles.communityButton}
                onPress={() =>
                  navigation.navigate('Community')
                }
                accessibilityRole="button"
              >
                <Text style={styles.communityButtonText}>
                  Explore community
                </Text>

                <Ionicons
                  name="arrow-forward"
                  size={15}
                  color="#67539B"
                />
              </Pressable>
            </View>
          </View>

          {/* CARE TIP */}

          <View style={styles.tipCard}>
            <View style={styles.tipHeader}>
              <View style={styles.tipHeading}>
                <Ionicons
                  name="bulb-outline"
                  size={20}
                  color="#D49A3A"
                />

                <Text style={styles.tipTitle}>
                  A little care tip
                </Text>
              </View>

              <Pressable
                onPress={showNextTip}
                accessibilityRole="button"
                accessibilityLabel="Show another care tip"
                style={styles.tipButton}
              >
                <Text style={styles.tipButtonText}>
                  Another tip
                </Text>

                <Ionicons
                  name="refresh"
                  size={14}
                  color="#67539B"
                />
              </Pressable>
            </View>

            <Text style={styles.tipDescription}>
              {currentTip}
            </Text>
          </View>

          {/* PET GUIDES */}

          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeading}>
              <Text style={styles.sectionTitle}>
                Pet guide
              </Text>

              <Text style={styles.sectionSubtitle}>
                Better choices for happier pets
              </Text>
            </View>

            <Pressable
              onPress={() => navigation.navigate('Explore')}
              accessibilityRole="button"
              style={styles.textButton}
            >
              <Text style={styles.seeAll}>See all</Text>
            </Pressable>
          </View>

          <View style={styles.guideRow}>
            <Pressable
              style={({ pressed }) => [
                styles.guideCard,
                styles.foodCard,
                pressed && styles.pressed,
              ]}
              onPress={() =>
                setSelectedGuideId('nutrition')
              }
              accessibilityRole="button"
              accessibilityLabel="Read the food and meals guide"
            >
              <View style={styles.guideIconFood}>
                <Ionicons
                  name="restaurant"
                  size={23}
                  color="#D49A3A"
                />
              </View>

              <Text style={styles.guideTitle}>
                Food & meals
              </Text>

              <Text style={styles.guideDescription}>
                Everyday feeding, fresh water and helpful
                routines.
              </Text>

              <Text style={styles.guideArrow}>
                Read guide →
              </Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.guideCard,
                styles.lawsCard,
                pressed && styles.pressed,
              ]}
              onPress={() =>
                setSelectedGuideId('daily-care')
              }
              accessibilityRole="button"
              accessibilityLabel="Read the everyday care guide"
            >
              <View style={styles.guideIconLaw}>
                <Ionicons
                  name="heart"
                  size={23}
                  color="#3A8D8A"
                />
              </View>

              <Text style={styles.guideTitle}>
                Everyday care
              </Text>

              <Text style={styles.guideDescription}>
                Simple checklists and an organised care
                routine.
              </Text>

              <Text style={styles.guideArrow}>
                Read guide →
              </Text>
            </Pressable>
          </View>

          {/* COMMUNITY BANNER */}

          <Pressable
            style={({ pressed }) => [
              styles.rescueBanner,
              pressed && styles.pressed,
            ]}
            onPress={() => navigation.navigate('Community')}
            accessibilityRole="button"
            accessibilityLabel="Explore the community"
          >
            <View style={styles.rescueIcon}>
              <Ionicons
                name="paw"
                size={23}
                color="#FFFFFF"
              />
            </View>

            <View style={styles.rescueContent}>
              <Text style={styles.rescueTitle}>
                Help make a difference
              </Text>

              <Text style={styles.rescueDescription}>
                Explore JEEVA’s community space for people
                who care about animals.
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={20}
              color="#FFFFFF"
            />
          </Pressable>

          {/* AI INFORMATION */}

          <Pressable
            style={({ pressed }) => [
              styles.aiInfoCard,
              pressed && styles.pressed,
            ]}
            onPress={showAiMessage}
            accessibilityRole="button"
            accessibilityLabel="JEEVA AI, coming soon"
          >
            <View style={styles.aiIcon}>
              <Text style={styles.aiSparkle}>✦</Text>
            </View>

            <View style={styles.aiText}>
              <Text style={styles.aiTitle}>
                JEEVA AI · Coming soon
              </Text>

              <Text style={styles.aiDescription}>
                Your pet-care assistant is on the way.
                Explore our care guides in the meantime.
              </Text>
            </View>
          </Pressable>

          <View style={styles.bottomSpace} />
        </View>
      </ScrollView>

      {/* FLOATING AI BUTTON */}

      <Pressable
        style={({ pressed }) => [
          styles.aiFloatingButton,
          pressed && styles.aiFloatingPressed,
        ]}
        onPress={showAiMessage}
        accessibilityRole="button"
        accessibilityLabel="JEEVA AI, coming soon"
      >
        <View style={styles.aiFloatingInner}>
          <Text style={styles.aiFloatingSparkle}>✦</Text>
        </View>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F9F7F2',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
  content: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },

  // Header

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 22,
  },
  headerText: {
    flex: 1,
    paddingRight: 12,
  },
  greeting: {
    color: '#8D877E',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 5,
  },
  title: {
    color: '#20352F',
    fontSize: 27,
    fontWeight: '800',
    letterSpacing: -0.7,
  },
  subtitle: {
    color: '#85827B',
    fontSize: 13,
    marginTop: 4,
  },
  retryNameButton: {
    paddingVertical: 8,
  },
  retryNameText: {
    color: '#C45B45',
    fontSize: 11,
  },
  notificationButton: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECE8E0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#20352F',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  // Hero

  petHeroCard: {
    minHeight: 220,
    borderRadius: 30,
    backgroundColor: '#EAE5F5',
    padding: 23,
    overflow: 'hidden',
    flexDirection: 'row',
    marginBottom: 28,
  },
  petHeroText: {
    flex: 1,
    zIndex: 2,
  },
  smallPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 15,
  },
  smallPillText: {
    color: '#67539B',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  petHeroTitle: {
    color: '#20352F',
    fontSize: 25,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  petHeroTitleAccent: {
    color: '#67539B',
    fontSize: 25,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  petHeroDescription: {
    color: '#68636A',
    fontSize: 12,
    lineHeight: 19,
    marginTop: 9,
    maxWidth: 230,
  },
  viewPetsButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#67539B',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 15,
  },
  viewPetsText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  heroDecoration: {
    width: 125,
    height: 180,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCircle: {
    width: 125,
    height: 125,
    borderRadius: 63,
    backgroundColor: '#DAD1ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroEmoji: {
    fontSize: 70,
  },
  heroSmallCircle: {
    position: 'absolute',
    right: -4,
    bottom: 12,
    width: 65,
    height: 65,
    borderRadius: 33,
    backgroundColor: '#F8D9CE',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 5,
    borderColor: '#EAE5F5',
  },
  heroSmallEmoji: {
    fontSize: 35,
  },

  // Sections

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionHeading: {
    flex: 1,
    paddingRight: 10,
  },
  sectionTitle: {
    color: '#20352F',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    color: '#85827B',
    fontSize: 12,
    marginTop: 3,
  },
  plusButton: {
    width: 43,
    height: 43,
    borderRadius: 15,
    backgroundColor: '#67539B',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#67539B',
    shadowOpacity: 0.2,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  petListSection: {
    marginBottom: 28,
  },

  // Quick actions

  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  quickActionCard: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 15,
    borderWidth: 1,
    borderColor: '#ECE8E0',
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  quickActionTitle: {
    color: '#20352F',
    fontSize: 14,
    fontWeight: '800',
  },
  quickActionSubtitle: {
    color: '#85827B',
    fontSize: 10,
    marginTop: 3,
  },

  // Tracking

  trackingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 23,
    borderWidth: 1,
    borderColor: '#ECE8E0',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 13,
  },
  trackingIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: '#EEE9FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },
  trackingContent: {
    flex: 1,
  },
  trackingLabel: {
    color: '#67539B',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  trackingTitle: {
    color: '#20352F',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 3,
  },
  trackingDescription: {
    color: '#85827B',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 3,
  },
  arrowCircle: {
    width: 35,
    height: 35,
    borderRadius: 18,
    backgroundColor: '#F4F1FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },

  // Vaccines and appointments

  vaccineCard: {
    backgroundColor: '#FFF7F3',
    borderRadius: 23,
    borderWidth: 1,
    borderColor: '#F5DED5',
    padding: 17,
    flexDirection: 'row',
    marginBottom: 28,
  },
  vaccineIcon: {
    width: 48,
    height: 48,
    borderRadius: 17,
    backgroundColor: '#FCE8E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  vaccineContent: {
    flex: 1,
  },
  vaccineTopRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  vaccineLabel: {
    color: '#E76F51',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
  },
  upcomingBadge: {
    backgroundColor: '#FBE1D8',
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 999,
  },
  upcomingText: {
    color: '#C65A3F',
    fontSize: 7,
    fontWeight: '900',
  },
  vaccineTitle: {
    color: '#20352F',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 6,
  },
  vaccineDescription: {
    color: '#85827B',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 3,
  },
  manageReminder: {
    color: '#E76F51',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 8,
  },
  textButton: {
    paddingVertical: 10,
  },
  appointmentCard: {
    backgroundColor: '#F0F5FC',
    borderColor: '#DCE7F5',
    marginBottom: 13,
  },
  appointmentIcon: {
    backgroundColor: '#DFEAF8',
  },
  appointmentLabel: {
    color: '#537CB0',
  },

  // Community

  communityCard: {
    backgroundColor: '#E5F2EF',
    borderRadius: 26,
    padding: 18,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 28,
  },
  communityIllustration: {
    width: 110,
    minHeight: 145,
    position: 'relative',
  },
  communityBubbleOne: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: '#D0E7E3',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 8,
    left: 5,
  },
  communityBubbleTwo: {
    width: 57,
    height: 57,
    borderRadius: 29,
    backgroundColor: '#F8D9CE',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 10,
    right: 2,
  },
  communityBubbleThree: {
    width: 49,
    height: 49,
    borderRadius: 25,
    backgroundColor: '#EEE9FA',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 58,
    right: 12,
  },
  communityEmoji: {
    fontSize: 27,
  },
  communityContent: {
    flex: 1,
    paddingLeft: 3,
  },
  communityEyebrow: {
    color: '#3A8D8A',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.1,
  },
  communityTitle: {
    color: '#20352F',
    fontSize: 19,
    fontWeight: '800',
    marginTop: 7,
  },
  communityDescription: {
    color: '#687B77',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 6,
  },
  communityButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 12,
    paddingVertical: 6,
  },
  communityButtonText: {
    color: '#67539B',
    fontSize: 11,
    fontWeight: '800',
  },

  // Care tips

  tipCard: {
    backgroundColor: '#FFF8E8',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#F1E5C9',
    padding: 17,
    marginBottom: 28,
  },
  tipHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 8,
  },
  tipHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  tipTitle: {
    color: '#20352F',
    fontSize: 14,
    fontWeight: '800',
  },
  tipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  tipButtonText: {
    color: '#67539B',
    fontSize: 11,
    fontWeight: '700',
  },
  tipDescription: {
    color: '#77736B',
    fontSize: 12,
    lineHeight: 19,
  },

  // Guides

  seeAll: {
    color: '#67539B',
    fontSize: 11,
    fontWeight: '800',
  },
  guideRow: {
    flexDirection: 'row',
    gap: 11,
    marginBottom: 20,
  },
  guideCard: {
    flex: 1,
    borderRadius: 22,
    padding: 15,
    minHeight: 190,
  },
  foodCard: {
    backgroundColor: '#FFF5DE',
  },
  lawsCard: {
    backgroundColor: '#E4F3F0',
  },
  guideIconFood: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#FBE8B7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  guideIconLaw: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#CFE8E4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  guideTitle: {
    color: '#20352F',
    fontSize: 15,
    fontWeight: '800',
  },
  guideDescription: {
    color: '#77736B',
    fontSize: 10,
    lineHeight: 16,
    marginTop: 5,
    marginBottom: 14,
  },
  guideArrow: {
    color: '#67539B',
    fontSize: 10,
    fontWeight: '800',
    marginTop: 'auto',
  },

  // Community banner

  rescueBanner: {
    backgroundColor: '#67539B',
    borderRadius: 23,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  rescueIcon: {
    width: 47,
    height: 47,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rescueContent: {
    flex: 1,
  },
  rescueTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  rescueDescription: {
    color: '#E9E4F4',
    fontSize: 10,
    lineHeight: 15,
    marginTop: 3,
  },

  // AI information

  aiInfoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#ECE8E0',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiIcon: {
    width: 47,
    height: 47,
    borderRadius: 17,
    backgroundColor: '#67539B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  aiSparkle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
  },
  aiText: {
    flex: 1,
  },
  aiTitle: {
    color: '#67539B',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  aiDescription: {
    color: '#85827B',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 3,
  },

  // Floating AI button

  aiFloatingButton: {
    position: 'absolute',
    left: 22,
    bottom: 96,
    width: 61,
    height: 61,
    borderRadius: 31,
    backgroundColor: '#67539B',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#67539B',
    shadowOpacity: 0.3,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  aiFloatingInner: {
    width: 43,
    height: 43,
    borderRadius: 22,
    backgroundColor: '#7A65AF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiFloatingSparkle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
  },
  aiFloatingPressed: {
    transform: [{ scale: 0.94 }],
  },
  pressed: {
    opacity: 0.75,
  },
  bottomSpace: {
    height: 80,
  },
});

const homePetStyles = StyleSheet.create({
  list: {
    paddingBottom: 8,
    gap: 12,
  },
  card: {
    width: 164,
    padding: 16,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEE9FA',
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: '#EEE9FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emoji: {
    fontSize: 32,
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
    color: '#343047',
    marginBottom: 5,
  },
  detail: {
    fontSize: 12,
    lineHeight: 19,
    color: '#777184',
  },
  profileLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 16,
  },
  linkText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#67539B',
  },
  messageCard: {
    padding: 20,
    gap: 10,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEE9FA',
  },
  error: {
    fontSize: 13,
    lineHeight: 20,
    color: '#C45B45',
  },
  actionButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#67539B',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 4,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});