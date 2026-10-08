import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import {
  getMyVetProfile,
  getVetDashboardStats,
  listVetBookings,
  listVetPatients,
  type VetBooking,
  type VetDashboardStats,
  type VetPatient,
  type VetProfile,
} from '../../services/vets';
import { logout, type AuthUser } from '../../services/auth';

import VetOverviewTab from './VetOverviewTab';
import VetAppointmentsTab from './VetAppointmentsTab';
import VetPatientsTab from './VetPatientsTab';
import VetProfileTab from './VetProfileTab';
import VetPatientDetailModal from './VetPatientDetailModal';
import VetConsultationModal from './VetConsultationModal';

interface Props {
  user: AuthUser;
  onLoggedOut: () => void;
  onRecheckRole: () => void;
  onSwitchToOwnerMode?: () => void;
}

type VetTabKey = 'overview' | 'appointments' | 'patients' | 'profile';

interface TabConfig {
  key: VetTabKey;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  badgeCount?: (stats: VetDashboardStats | null, bookings: VetBooking[]) => number | null;
}

const TABS: TabConfig[] = [
  { key: 'overview', label: 'Overview', icon: 'grid-outline' },
  {
    key: 'appointments',
    label: 'Appointments',
    icon: 'calendar-outline',
    badgeCount: (s, b) => {
      const pending = s?.pendingRequests ?? b.filter((x) => x.status === 'pending').length;
      return pending > 0 ? pending : null;
    },
  },
  {
    key: 'patients',
    label: 'Patients',
    icon: 'paw-outline',
    badgeCount: (s) => (s ? s.totalPatients : null),
  },
  {
    key: 'profile',
    label: 'Clinic & Schedule',
    icon: 'medkit-outline',
  },
];

export default function VetDashboardScreen({
  user,
  onLoggedOut,
  onRecheckRole,
  onSwitchToOwnerMode,
}: Props) {
  const [activeTab, setActiveTab] = useState<VetTabKey>('overview');

  const [stats, setStats] = useState<VetDashboardStats | null>(null);
  const [bookings, setBookings] = useState<VetBooking[]>([]);
  const [patients, setPatients] = useState<VetPatient[]>([]);
  const [profile, setProfile] = useState<VetProfile | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [loggingOut, setLoggingOut] = useState(false);

  // Modals
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const [patientModalOpen, setPatientModalOpen] = useState(false);
  const [genericConsultOpen, setGenericConsultOpen] = useState(false);

  const mounted = useRef(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [statsRes, bookingsRes, patientsRes, profileRes] = await Promise.all([
        getVetDashboardStats().catch(() => null),
        listVetBookings().catch(() => []),
        listVetPatients().catch(() => []),
        getMyVetProfile().catch(() => null),
      ]);

      if (mounted.current) {
        setStats(statsRes);
        setBookings(bookingsRes);
        setPatients(patientsRes);
        setProfile(profileRes);
      }
    } catch (err) {
      if (mounted.current) {
        setError(err instanceof Error ? err.message : 'Could not load dashboard data.');
      }
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAllData();
  }, [fetchAllData, retry]);

  async function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of your account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          setLoggingOut(true);
          try {
            await logout();
            if (mounted.current) onLoggedOut();
          } catch (err) {
            Alert.alert('Could not sign out', err instanceof Error ? err.message : 'Please retry.');
          } finally {
            if (mounted.current) setLoggingOut(false);
          }
        },
      },
    ]);
  }

  function handleSwitchTab(tab: VetTabKey) {
    setActiveTab(tab);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }

  function handleOpenPatient(petId: string) {
    setSelectedPetId(petId);
    setPatientModalOpen(true);
  }

  function handleOpenBooking(booking: VetBooking) {
    setActiveTab('appointments');
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayBookings = bookings.filter((b) => b.status === 'confirmed' && b.date === todayStr);
  const pendingBookings = bookings.filter((b) => b.status === 'pending');

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      {/* TOP BRAND HEADER */}
      <View style={styles.topHeader}>
        <View style={styles.headerLeft}>
          <View style={styles.eyebrowRow}>
            <Text style={styles.eyebrow}>JEEVA VETERINARY PRACTICE</Text>
            <View
              style={[
                styles.liveStatusPill,
                profile?.availability?.isOpen ? styles.liveStatusOpen : styles.liveStatusClosed,
              ]}
            >
              <Text
                style={[
                  styles.liveStatusText,
                  profile?.availability?.isOpen ? styles.liveStatusTextOpen : styles.liveStatusTextClosed,
                ]}
              >
                {profile?.availability?.isOpen ? '● ACCEPTING BOOKINGS' : '○ CLOSED FOR BOOKINGS'}
              </Text>
            </View>
          </View>
          <Text style={styles.title}>Dr. {user.name}</Text>
          <Text style={styles.subtitle}>
            {profile?.verifiedCredentials?.clinicName || 'Veterinary Clinic'}
          </Text>
        </View>

        <View style={styles.headerRight}>
          <Pressable
            onPress={handleSignOut}
            disabled={loggingOut}
            style={styles.signOutHeaderBtn}
            accessibilityRole="button"
            accessibilityLabel="Sign out"
          >
            {loggingOut ? (
              <ActivityIndicator color="#BA5648" size="small" />
            ) : (
              <Ionicons name="log-out-outline" size={17} color="#BA5648" />
            )}
            <Text style={styles.signOutHeaderText}>Exit</Text>
          </Pressable>
        </View>
      </View>

      {/* HORIZONTAL NAVIGATION PILL BAR */}
      <View style={styles.navBarWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.navBarScroll}
        >
          {TABS.map((tab) => {
            const isSelected = activeTab === tab.key;
            const count = tab.badgeCount ? tab.badgeCount(stats, bookings) : null;

            return (
              <Pressable
                key={tab.key}
                onPress={() => handleSwitchTab(tab.key)}
                style={[styles.navPill, isSelected && styles.navPillSelected]}
                accessibilityRole="tab"
                accessibilityState={{ selected: isSelected }}
              >
                <Ionicons
                  name={tab.icon}
                  size={15}
                  color={isSelected ? '#FFFFFF' : '#71579C'}
                />
                <Text
                  style={[styles.navPillText, isSelected && styles.navPillTextSelected]}
                >
                  {tab.label}
                </Text>
                {count !== null && count > 0 && (
                  <View
                    style={[
                      styles.pillBadge,
                      isSelected && styles.pillBadgeSelected,
                      tab.key === 'appointments' && styles.pillBadgeAlert,
                    ]}
                  >
                    <Text
                      style={[
                        styles.pillBadgeText,
                        isSelected && styles.pillBadgeTextSelected,
                        tab.key === 'appointments' && styles.pillBadgeTextAlert,
                      ]}
                    >
                      {count}
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* MAIN TAB CONTENT */}
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => setRetry((v) => v + 1)}
            tintColor="#71579C"
            colors={['#71579C']}
          />
        }
      >
        <View style={styles.contentContainer}>
          {error && activeTab === 'overview' ? (
            <View style={styles.globalErrorCard}>
              <Ionicons name="cloud-offline-outline" size={24} color="#BA5648" />
              <Text style={styles.globalErrorText}>{error}</Text>
              <Pressable onPress={onRecheckRole} style={styles.recheckBtn}>
                <Text style={styles.recheckText}>Recheck Account Access →</Text>
              </Pressable>
            </View>
          ) : (
            <>
              {activeTab === 'overview' && (
                <VetOverviewTab
                  stats={stats}
                  todayBookings={todayBookings}
                  pendingBookings={pendingBookings}
                  loading={loading}
                  onNavigateTab={handleSwitchTab}
                  onOpenBooking={handleOpenBooking}
                  onOpenConsultation={() => setGenericConsultOpen(true)}
                />
              )}

              {activeTab === 'appointments' && (
                <VetAppointmentsTab
                  bookings={bookings}
                  loading={loading}
                  onRefresh={() => setRetry((v) => v + 1)}
                  onOpenPatient={handleOpenPatient}
                />
              )}

              {activeTab === 'patients' && (
                <VetPatientsTab
                  patients={patients}
                  loading={loading}
                  onOpenPatient={handleOpenPatient}
                />
              )}

              {activeTab === 'profile' && (
                <VetProfileTab
                  profile={profile}
                  loading={loading}
                  onRefresh={() => setRetry((v) => v + 1)}
                  onSwitchToOwnerMode={() => {
                    if (onSwitchToOwnerMode) {
                      onSwitchToOwnerMode();
                    } else {
                      Alert.alert(
                        'Pet Owner Mode',
                        'Use the top menu or profile to access your personal pets anytime.',
                      );
                    }
                  }}
                />
              )}
            </>
          )}

          {/* FOOTER ACCOUNT INFO & LOGOUT */}
          <View style={styles.footerAccount}>
            <View style={styles.footerLeft}>
              <Text style={styles.footerLabel}>VETERINARY PRACTITIONER SESSION</Text>
              <Text style={styles.footerEmail}>{user.email}</Text>
            </View>

            <Pressable
              onPress={handleSignOut}
              disabled={loggingOut}
              style={styles.footerSignOutBtn}
            >
              {loggingOut ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Ionicons name="log-out-outline" size={16} color="#FFFFFF" />
              )}
              <Text style={styles.footerSignOutText}>Sign out</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* PATIENT DETAIL MODAL */}
      <VetPatientDetailModal
        visible={patientModalOpen}
        petId={selectedPetId}
        onClose={() => {
          setPatientModalOpen(false);
          setSelectedPetId(null);
        }}
      />

      {/* GENERIC NEW CONSULTATION MODAL */}
      {patients.length > 0 && (
        <VetConsultationModal
          visible={genericConsultOpen}
          petId={patients[0]!.petId}
          petName={patients[0]!.name}
          onClose={() => setGenericConsultOpen(false)}
          onSuccess={() => setRetry((v) => v + 1)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F9F7F2' },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 10,
    backgroundColor: '#F9F7F2',
  },
  headerLeft: { flex: 1 },
  headerRight: { marginLeft: 12 },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  eyebrow: { color: '#71579C', fontSize: 9, fontWeight: '800', letterSpacing: 1.2 },
  liveStatusPill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  liveStatusOpen: { backgroundColor: '#E4EFE8' },
  liveStatusClosed: { backgroundColor: '#FDEAE8' },
  liveStatusText: { fontSize: 8, fontWeight: '800' },
  liveStatusTextOpen: { color: '#2F7C5D' },
  liveStatusTextClosed: { color: '#BA5648' },
  title: { color: '#304439', fontSize: 22, fontWeight: '800', marginTop: 3 },
  subtitle: { color: '#958A81', fontSize: 11, marginTop: 2 },
  signOutHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FDEAE8',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  signOutHeaderText: { fontSize: 11, fontWeight: '800', color: '#BA5648' },
  navBarWrapper: {
    backgroundColor: '#F9F7F2',
    borderBottomWidth: 1,
    borderBottomColor: '#ECE4F2',
    paddingVertical: 8,
  },
  navBarScroll: { paddingHorizontal: 18, gap: 8 },
  navPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECE4F2',
  },
  navPillSelected: { backgroundColor: '#71579C', borderColor: '#71579C' },
  navPillText: { fontSize: 11, fontWeight: '700', color: '#5B477A' },
  navPillTextSelected: { color: '#FFFFFF' },
  pillBadge: { backgroundColor: '#EEE6F6', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  pillBadgeSelected: { backgroundColor: 'rgba(255, 255, 255, 0.25)' },
  pillBadgeAlert: { backgroundColor: '#FFF0C9' },
  pillBadgeText: { fontSize: 9, fontWeight: '800', color: '#71579C' },
  pillBadgeTextSelected: { color: '#FFFFFF' },
  pillBadgeTextAlert: { color: '#976A17' },
  scrollContent: { padding: 18, paddingBottom: 40 },
  contentContainer: { width: '100%', maxWidth: 680, alignSelf: 'center' },
  globalErrorCard: {
    backgroundColor: '#FBECE7',
    borderRadius: 18,
    padding: 18,
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  globalErrorText: { color: '#BA5648', fontSize: 12, textAlign: 'center' },
  recheckBtn: { paddingVertical: 6 },
  recheckText: { color: '#71579C', fontSize: 11, fontWeight: '800' },
  footerAccount: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EAE2F1',
    padding: 16,
    marginTop: 24,
  },
  footerLeft: { flex: 1 },
  footerLabel: { fontSize: 8, fontWeight: '800', color: '#9B8CA7', letterSpacing: 0.8 },
  footerEmail: { fontSize: 12, color: '#554564', marginTop: 2 },
  footerSignOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#71579C',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
  },
  footerSignOutText: { fontSize: 11, fontWeight: '800', color: '#FFFFFF' },
});
