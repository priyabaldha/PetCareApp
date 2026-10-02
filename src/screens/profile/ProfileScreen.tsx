import { usePetCount } from '../../hooks/usePetData';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { getCurrentUser, logout } from '../../services/auth';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface ProfileScreenProps {
  onLoggedOut: () => void;
}

export default function ProfileScreen({ onLoggedOut }: ProfileScreenProps) {
  const petCount = usePetCount();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [loggingOut, setLoggingOut] = useState(false);
  const busy = useRef(false);
  const mounted = useRef(true);
  const requestVersion = useRef(0);

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

  async function handleLogout(): Promise<void> {
    if (busy.current) return;
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

          <Pressable>
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
            number="—"
            label="Vaccines"
            emoji="💉"
            background="#FFE3DF"
          />

          <Summary
            number="—"
            label="Appointments"
            emoji="📅"
            background="#DDEEFF"
          />
        </View>

        <Text style={{ color: '#929087', fontSize: 10, marginTop: 8 }}>
          Vaccine and appointment totals will appear when those features are connected.
        </Text>

        {!!petCount.error && <Pressable onPress={petCount.refresh} accessibilityRole="button" style={{ paddingVertical: 12 }}>
          <Text style={{ color: '#C45B45', fontSize: 11 }}>Could not load pet count. Tap to retry.</Text>
        </Pressable>}

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