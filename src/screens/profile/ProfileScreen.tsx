import { usePetCount } from '../../hooks/usePetData';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  getCurrentUser,
  logout,
  updateProfileName,
} from '../../services/auth';
import type { AuthUser } from '../../services/auth';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { listPets } from '../../services/pets';
import { listVaccinations } from '../../services/vaccinations';
import {
  getVaccineReminders,
  getVaccineDueStatus,
} from '../../utils/vaccinationSummary';
import { useAppointmentSummary } from '../../hooks/useAppointmentSummary';
import VetApplicationPanel from '../../components/VetApplicationPanel';

interface ProfileScreenProps {
  onLoggedOut: () => void;
}

export default function ProfileScreen({ onLoggedOut }: ProfileScreenProps) {
  const appointments = useAppointmentSummary();
  const petCount = usePetCount();
  const [vaccineSummary, setVaccineSummary] = useState<{
    total: number;
    overdue: number;
    dueToday: number;
  } | null>(null);

  const [vaccinesLoading, setVaccinesLoading] = useState(true);
  const [vaccinesError, setVaccinesError] = useState('');
  const [vaccinesRetry, setVaccinesRetry] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      setVaccinesLoading(true);
      setVaccinesError('');
      setVaccineSummary(null);

      async function loadVaccineSummary() {
        try {
          const pets = await listPets();

          if (!active) return;

          const recordsByPet = await Promise.all(
            pets.map((pet) => listVaccinations(pet.id)),
          );

          let total = 0;
          let overdue = 0;
          let dueToday = 0;

          for (const records of recordsByPet) {
            total += records.length;

            // Calculate reminders separately for each pet.
            for (const record of getVaccineReminders(records)) {
              if (!record.nextDueDate) continue;

              const status = getVaccineDueStatus(record.nextDueDate);

              if (status.label === 'Overdue') {
                overdue += 1;
              } else if (status.label === 'Due today') {
                dueToday += 1;
              }
            }
          }

          if (active) {
            setVaccineSummary({ total, overdue, dueToday });
          }
        } catch (failure: unknown) {
          if (active) {
            setVaccinesError(
              failure instanceof Error
                ? failure.message
                : 'Could not load vaccination totals.',
            );
          }
        } finally {
          if (active) {
            setVaccinesLoading(false);
          }
        }
      }

      void loadVaccineSummary();

      return () => {
        active = false;
      };
    }, [vaccinesRetry]),
  );
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [loggingOut, setLoggingOut] = useState(false);
  const busy = useRef(false);
  const mounted = useRef(true);
  const requestVersion = useRef(0);
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [editError, setEditError] = useState('');
  const [savingName, setSavingName] = useState(false);
  const nameSaveInProgress = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useFocusEffect(useCallback(() => {
    let active = true;
    const version = ++requestVersion.current;
    setLoading(true);
    setError('');
    setUser(null);
    getCurrentUser().then((currentUser) => {
      if (!active || version !== requestVersion.current) return;
      if (!currentUser) {
        onLoggedOut();
        return;
      }
      setUser(currentUser);
    }).catch((failure: unknown) => {
      if (active && version === requestVersion.current) {
        setError(failure instanceof Error ? failure.message : 'Could not load your profile.');
      }
    }).finally(() => {
      if (active && version === requestVersion.current) setLoading(false);
    });
    return () => { active = false; };
  }, [onLoggedOut, retry]));

  function openNameEditor() {
    if (!user || busy.current || nameSaveInProgress.current) {
      return;
    }

    setDraftName(user.name);
    setEditError('');
    setEditingName(true);
  }

  async function handleSaveName(): Promise<void> {
    if (nameSaveInProgress.current || busy.current) {
      return;
    }

    const nextName = draftName.trim();

    if (nextName.length < 2 || nextName.length > 100) {
      setEditError('Use between 2 and 100 characters.');
      return;
    }

    nameSaveInProgress.current = true;
    setSavingName(true);
    setEditError('');

    // Prevent an older profile request from replacing the saved name.
    ++requestVersion.current;

    try {
      const updatedUser = await updateProfileName(nextName);

      if (mounted.current) {
        setUser(updatedUser);
        setLoading(false);
        setError('');
        setEditingName(false);
      }
    } catch (error) {
      if (mounted.current) {
        setEditError(
          error instanceof Error
            ? error.message
            : 'Could not save your name.',
        );
      }
    } finally {
      nameSaveInProgress.current = false;

      if (mounted.current) {
        setSavingName(false);
      }
    }
  }

  async function handleLogout(): Promise<void> {
    if (busy.current || nameSaveInProgress.current) return;
    busy.current = true;
    setLoggingOut(true);
    ++requestVersion.current;
    try {
      // Revoke the server session, then delete the phone token.
      await logout();
    } catch (failure) {
      if (mounted.current) {
        Alert.alert('Could not log out', failure instanceof Error ? failure.message : 'Please try again.');
        setLoggingOut(false);
        setRetry((value) => value + 1);
      }
      busy.current = false;
      return;
    }
    if (mounted.current) {
      setUser(null);
      onLoggedOut();
    }
  }

  const initials = user?.name.trim().split(/\s+/).slice(0, 2)
    .map((part) => Array.from(part)[0] ?? '').join('').toUpperCase() || '🐾';

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >

        {/* HEADER */}

        <View style={styles.header}>
          <Text style={styles.title}>
            Profile
          </Text>

          <Pressable style={styles.settingsButton}>
            <Ionicons
              name="settings-outline"
              size={21}
              color="#20352F"
            />
          </Pressable>
        </View>

        {/* PROFILE CARD */}

        <View style={styles.profileCard}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileEmoji}>
              {initials}
            </Text>
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.name}>
              {user?.name ?? (loading ? 'Loading profile...' : 'Profile unavailable')}
            </Text>

            <Text style={styles.email}>
              {user?.email ?? ''}
            </Text>

            <View style={styles.memberBadge}>
              <Ionicons
                name="paw"
                size={11}
                color="#7057A5"
              />

              <Text style={styles.memberText}>
                JEEVA member
              </Text>
            </View>
          </View>

          <Pressable
            onPress={openNameEditor}
            disabled={!user || loggingOut || savingName}
            accessibilityRole="button"
            accessibilityLabel="Edit your name"
            hitSlop={12}
          >
            <Ionicons
              name="create-outline"
              size={20}
              color="#7057A5"
            />
          </Pressable>
        </View>

        {loading && <ActivityIndicator color="#7057A5" style={{ marginTop: 12 }} />}
        {!!error && (
          <View style={{ marginTop: 12 }}>
            <Text accessibilityRole="alert" style={{ color: '#C45B45' }}>{error}</Text>
            <Pressable disabled={loggingOut} onPress={() => setRetry((value) => value + 1)}
              accessibilityRole="button" style={{ paddingVertical: 12 }}>
              <Text style={{ color: '#7057A5', fontWeight: '700' }}>Retry</Text>
            </Pressable>
          </View>
        )}

        {editingName && (
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 20,
              padding: 18,
              marginTop: 16,
            }}
          >
            <Text
              style={{
                color: '#20352F',
                fontSize: 18,
                fontWeight: '800',
                marginBottom: 12,
              }}
            >
              Edit your name
            </Text>

            <TextInput
              value={draftName}
              onChangeText={setDraftName}
              placeholder="Full name"
              autoCapitalize="words"
              autoCorrect={false}
              maxLength={100}
              editable={!savingName}
              accessibilityLabel="Full name"
              returnKeyType="done"
              onSubmitEditing={() => {
                void handleSaveName();
              }}
              style={{
                borderWidth: 1,
                borderColor: '#D8D5CE',
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 12,
                fontSize: 16,
                color: '#20352F',
              }}
            />

            {!!editError && (
              <Text
                accessibilityRole="alert"
                style={{
                  color: '#C45B45',
                  marginTop: 10,
                  fontSize: 12,
                }}
              >
                {editError}
              </Text>
            )}

            <View
              style={{
                flexDirection: 'row',
                gap: 12,
                marginTop: 16,
              }}
            >
              <Pressable
                onPress={() => setEditingName(false)}
                disabled={savingName}
                accessibilityRole="button"
                style={{
                  flex: 1,
                  paddingVertical: 13,
                  borderRadius: 12,
                  backgroundColor: '#F1ECF9',
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#7057A5', fontWeight: '700' }}>
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                onPress={handleSaveName}
                disabled={savingName}
                accessibilityRole="button"
                accessibilityState={{
                  disabled: savingName,
                  busy: savingName,
                }}
                style={{
                  flex: 1,
                  paddingVertical: 13,
                  borderRadius: 12,
                  backgroundColor: '#67539B',
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>
                  {savingName ? 'Saving...' : 'Save name'}
                </Text>
              </Pressable>
            </View>
          </View>
        )}
        {/* PET SUMMARY */}

        <Text style={styles.sectionTitle}>
          Your JEEVA
        </Text>

        <View style={styles.summaryRow}>
          <Summary
            number={petCount.data === null ? "—" : String(petCount.data)}
            label="Pets"
            emoji="🐾"
            background="#E8E0F5"
          />

          <Summary
            number={
              vaccinesLoading || vaccineSummary === null
                ? '—'
                : String(vaccineSummary.total)
            }
            label="Vaccine records"
            emoji="💉"
            background="#FFE3DF"
          />

          <Summary
            number={
              appointments.loading || appointments.error
                ? '—'
                : String(appointments.count)
            }
            label="Upcoming visits"
            emoji="📅"
            background="#DDEEFF"
          />
        </View>

        {vaccinesLoading ? (
          <Text
            style={{
              color: '#929087',
              fontSize: 12,
              marginTop: 12,
            }}
          >
            Loading vaccination summary…
          </Text>
        ) : vaccinesError ? (
          <View style={{ marginTop: 12 }}>
            <Text
              accessibilityRole="alert"
              style={{ color: '#C45B45', fontSize: 12 }}
            >
              {vaccinesError}
            </Text>

            <Pressable
              onPress={() => setVaccinesRetry((value) => value + 1)}
              disabled={loggingOut}
              accessibilityRole="button"
              style={{ paddingVertical: 12 }}
            >
              <Text style={{ color: '#7057A5', fontWeight: '700' }}>
                Retry vaccination summary
              </Text>
            </Pressable>
          </View>
        ) : vaccineSummary ? (
          <View
            style={{
              marginTop: 12,
              padding: 14,
              borderRadius: 16,
              backgroundColor: '#FFF4EF',
              gap: 6,
            }}
          >
            <Text
              style={{
                color: '#20352F',
                fontSize: 14,
                fontWeight: '700',
              }}
            >
              Vaccination reminders
            </Text>

            <Text style={{ color: '#7057A5', fontSize: 12 }}>
              {vaccineSummary.overdue} overdue · {vaccineSummary.dueToday} due today
            </Text>

            <Text
              style={{
                color: '#777184',
                fontSize: 12,
                lineHeight: 18,
              }}
            >
              {vaccineSummary.total === 0
                ? 'Open a pet’s profile to add their first vaccination record.'
                : 'Based on saved due dates. Open My Pets to view or update records.'}
            </Text>
          </View>
        ) : null}

        <View style={{ marginTop: 8 }}>
          {appointments.loading ? (
            <Text style={{ color: '#929087', fontSize: 12, marginTop: 12 }}>
              Loading appointments…
            </Text>
          ) : appointments.error ? (
            <View style={{ marginTop: 12 }}>
              <Text style={{ color: '#C45B45', fontSize: 12 }}>
                {appointments.error}
              </Text>

              <Pressable
                onPress={appointments.refresh}
                disabled={loggingOut}
                accessibilityRole="button"
                style={{ paddingVertical: 12 }}
              >
                <Text style={{ color: '#7057A5', fontWeight: '700' }}>
                  Retry appointments
                </Text>
              </Pressable>
            </View>
          ) : (
            <View
              style={{
                marginTop: 12,
                padding: 14,
                borderRadius: 16,
                backgroundColor: '#E4F0FF',
                gap: 6,
              }}
            >
              <Text style={{ color: '#20352F', fontSize: 14, fontWeight: '700' }}>
                {appointments.next ? 'Next appointment' : 'No upcoming appointments'}
              </Text>

              <Text style={{ color: '#777184', fontSize: 12, lineHeight: 18 }}>
                {appointments.next
                  ? `${appointments.next.petName} · ${appointments.next.clinicName}\n${appointments.next.date} at ${appointments.next.time}`
                  : 'Open a pet’s profile to manage visits or view appointment history.'}
              </Text>
            </View>
          )}</View>

        {!!petCount.error && <Pressable onPress={petCount.refresh} accessibilityRole="button" style={{ paddingVertical: 12 }}>
          <Text style={{ color: '#C45B45', fontSize: 11 }}>Could not load pet count. Tap to retry.</Text>
        </Pressable>}
                  {user && (
          <VetApplicationPanel
            key={user.id}
            disabled={loggingOut || savingName}
          />
        )}
        {/* SETTINGS */}

        <Text style={styles.sectionTitle}>
          Account & preferences
        </Text>

        <View style={styles.menuCard}>

          <ProfileMenu
            icon="person-outline"
            title="Personal information"
            subtitle="Name, email & account details"
            color="#E8E0F5"
          />

          <ProfileMenu
            icon="paw-outline"
            title="My pets"
            subtitle="Manage your pet profiles"
            color="#E1F1E8"
          />

          <ProfileMenu
            icon="notifications-outline"
            title="Notifications"
            subtitle="App & email reminders"
            color="#FFF0D1"
          />

          <ProfileMenu
            icon="lock-closed-outline"
            title="Privacy & security"
            subtitle="Password and privacy controls"
            color="#DDEEFF"
          />

          <ProfileMenu
            icon="language-outline"
            title="Language"
            subtitle="English"
            color="#FFE3DF"
          />

        </View>

        {/* NOTIFICATIONS */}

        <Text style={styles.sectionTitle}>
          Reminder preferences
        </Text>

        <View style={styles.preferenceCard}>

          <View style={styles.preferenceRow}>
            <View style={styles.preferenceIcon}>
              <Ionicons
                name="notifications-outline"
                size={20}
                color="#7057A5"
              />
            </View>

            <View style={styles.preferenceText}>
              <Text style={styles.preferenceTitle}>
                App notifications
              </Text>

              <Text style={styles.preferenceSubtitle}>
                Vaccine & appointment reminders
              </Text>
            </View>

            <Switch
              value={true}
              trackColor={{
                false: '#D8D5CE',
                true: '#B7A7D7',
              }}
              thumbColor="#67539B"
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.preferenceRow}>
            <View style={styles.preferenceIcon}>
              <Ionicons
                name="mail-outline"
                size={20}
                color="#C45B45"
              />
            </View>

            <View style={styles.preferenceText}>
              <Text style={styles.preferenceTitle}>
                Email reminders
              </Text>

              <Text style={styles.preferenceSubtitle}>
                Important pet care updates
              </Text>
            </View>

            <Switch
              value={true}
              trackColor={{
                false: '#D8D5CE',
                true: '#E6B5A9',
              }}
              thumbColor="#C45B45"
            />
          </View>

        </View>

        {/* HELP */}

        <Text style={styles.sectionTitle}>
          Help & information
        </Text>

        <View style={styles.menuCard}>

          <ProfileMenu
            icon="help-circle-outline"
            title="Help center"
            subtitle="Get answers to common questions"
            color="#E8E0F5"
          />

          <ProfileMenu
            icon="chatbubble-ellipses-outline"
            title="Contact JEEVA"
            subtitle="We're here to help"
            color="#DDEEFF"
          />

          <ProfileMenu
            icon="document-text-outline"
            title="Terms & privacy"
            subtitle="Read our policies"
            color="#FFF0D1"
          />

        </View>

        <Pressable style={styles.logoutButton}
          onPress={handleLogout} disabled={loggingOut}
          accessibilityRole="button"
          accessibilityState={{ disabled: loggingOut, busy: loggingOut }}>
          <Ionicons
            name="log-out-outline"
            size={19}
            color="#C45B45"
          />

          <Text style={styles.logoutText}>
            {loggingOut ? 'Logging out...' : 'Log out'}
          </Text>
        </Pressable>

        <Text style={styles.version}>
          JEEVA · Version 1.0.0
        </Text>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Summary({
  number,
  label,
  emoji,
  background,
}: {
  number: string;
  label: string;
  emoji: string;
  background: string;
}) {
  return (
    <View
      style={[
        styles.summaryCard,
        { backgroundColor: background },
      ]}
    >
      <Text style={styles.summaryEmoji}>
        {emoji}
      </Text>

      <Text style={styles.summaryNumber}>
        {number}
      </Text>

      <Text style={styles.summaryLabel}>
        {label}
      </Text>
    </View>
  );
}

function ProfileMenu({
  icon,
  title,
  subtitle,
  color,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  color: string;
}) {
  return (
    <Pressable style={styles.menuItem}>
      <View
        style={[
          styles.menuIcon,
          { backgroundColor: color },
        ]}
      >
        <Ionicons
          name={icon}
          size={19}
          color="#3F5049"
        />
      </View>

      <View style={styles.menuText}>
        <Text style={styles.menuTitle}>
          {title}
        </Text>

        <Text style={styles.menuSubtitle}>
          {subtitle}
        </Text>
      </View>

      <Ionicons
        name="chevron-forward"
        size={17}
        color="#AAA59C"
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F9F7F2',
  },

  content: {
    padding: 20,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },

  title: {
    color: '#20352F',
    fontSize: 28,
    fontWeight: '900',
  },

  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    padding: 17,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ECE8E0',
  },

  profileAvatar: {
    width: 67,
    height: 67,
    borderRadius: 22,
    backgroundColor: '#E8E0F5',
    alignItems: 'center',
    justifyContent: 'center',
  },

  profileEmoji: {
    fontSize: 35,
  },

  profileInfo: {
    flex: 1,
    marginLeft: 13,
  },

  name: {
    color: '#20352F',
    fontSize: 18,
    fontWeight: '900',
  },

  email: {
    color: '#929087',
    fontSize: 10,
    marginTop: 3,
  },

  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#F1ECF9',
    borderRadius: 7,
    paddingHorizontal: 7,
    paddingVertical: 4,
    marginTop: 7,
  },

  memberText: {
    color: '#7057A5',
    fontSize: 8,
    fontWeight: '900',
    marginLeft: 4,
  },

  sectionTitle: {
    color: '#20352F',
    fontSize: 16,
    fontWeight: '900',
    marginTop: 25,
    marginBottom: 12,
  },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  summaryCard: {
    width: '31.5%',
    height: 110,
    borderRadius: 20,
    padding: 13,
  },

  summaryEmoji: {
    fontSize: 20,
  },

  summaryNumber: {
    color: '#293A35',
    fontSize: 20,
    fontWeight: '900',
    marginTop: 8,
  },

  summaryLabel: {
    color: '#77736D',
    fontSize: 9,
    marginTop: 1,
  },

  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingHorizontal: 15,
  },

  menuItem: {
    minHeight: 70,
    flexDirection: 'row',
    alignItems: 'center',
  },

  menuIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  menuText: {
    flex: 1,
    marginLeft: 12,
  },

  menuTitle: {
    color: '#303F3A',
    fontSize: 12,
    fontWeight: '900',
  },

  menuSubtitle: {
    color: '#98938A',
    fontSize: 9,
    marginTop: 3,
  },

  preferenceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingHorizontal: 15,
  },

  preferenceRow: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
  },

  preferenceIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#F1ECF9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  preferenceText: {
    flex: 1,
    marginLeft: 12,
  },

  preferenceTitle: {
    color: '#303F3A',
    fontSize: 12,
    fontWeight: '900',
  },

  preferenceSubtitle: {
    color: '#98938A',
    fontSize: 9,
    marginTop: 3,
  },

  divider: {
    height: 1,
    backgroundColor: '#F0ECE5',
  },

  logoutButton: {
    height: 52,
    borderRadius: 17,
    backgroundColor: '#FFF0EC',
    marginTop: 25,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
  },

  logoutText: {
    color: '#C45B45',
    fontSize: 12,
    fontWeight: '900',
  },

  version: {
    textAlign: 'center',
    color: '#AAA59C',
    fontSize: 9,
    marginTop: 17,
  },
});