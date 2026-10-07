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

import { getAdminOverview, type AdminOverviewResponse } from '../../services/admin';
import { logout, type AuthUser } from '../../services/auth';

import AdminOverviewTab from './AdminOverviewTab';
import AdminUsersTab from './AdminUsersTab';
import AdminVetApplicationsTab from './AdminVetApplicationsTab';
import AdminPetsTab from './AdminPetsTab';
import AdminAppointmentsTab from './AdminAppointmentsTab';
import AdminGuidesTab from './AdminGuidesTab';
import AdminAnnouncementsTab from './AdminAnnouncementsTab';
import AdminAuditLogsTab from './AdminAuditLogsTab';
import AdminCommunityTab from './AdminCommunityTab';

interface Props {
  user: AuthUser;
  onLoggedOut: () => void;
  onRecheckRole: () => void;
}

type TabKey =
  | 'overview'
  | 'users'
  | 'vets'
  | 'pets'
  | 'appointments'
  | 'guides'
  | 'announcements'
  | 'audit'
  | 'community';

interface TabConfig {
  key: TabKey;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  badgeCount?: (data: AdminOverviewResponse | null) => number | null;
}

const TABS: TabConfig[] = [
  { key: 'overview', label: 'Overview', icon: 'grid-outline' },
  {
    key: 'users',
    label: 'Users',
    icon: 'people-outline',
    badgeCount: (d) =>
      d
        ? d.overview.petOwners + d.overview.vets + d.overview.admins
        : null,
  },
  {
    key: 'vets',
    label: 'Vet Applications',
    icon: 'medkit-outline',
    badgeCount: (d) =>
      d && d.overview.pendingVetApplications > 0
        ? d.overview.pendingVetApplications
        : null,
  },
  {
    key: 'pets',
    label: 'Pet Oversight',
    icon: 'paw-outline',
    badgeCount: (d) => (d ? d.overview.pets : null),
  },
  {
    key: 'appointments',
    label: 'Appointments',
    icon: 'calendar-outline',
    badgeCount: (d) => (d ? d.overview.appointments : null),
  },
  {
    key: 'guides',
    label: 'Care Guides',
    icon: 'book-outline',
  },
  {
    key: 'announcements',
    label: 'Announcements',
    icon: 'megaphone-outline',
  },
  { key: 'audit', label: 'Audit Trail', icon: 'shield-checkmark-outline' },
  { key: 'community', label: 'Community', icon: 'chatbubbles-outline' },
];

export default function AdminDashboardScreen({
  user,
  onLoggedOut,
  onRecheckRole,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [data, setData] = useState<AdminOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [loggingOut, setLoggingOut] = useState(false);

  const mounted = useRef(false);
  const logoutBusy = useRef(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const res = await getAdminOverview();
      if (mounted.current) setData(res);
    } catch (err) {
      if (mounted.current) {
        setError(
          err instanceof Error
            ? err.message
            : 'Could not load dashboard data.',
        );
      }
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchOverview();
  }, [fetchOverview, retry]);

  async function handleSignOut() {
    if (logoutBusy.current) return;
    logoutBusy.current = true;
    setLoggingOut(true);

    try {
      await logout();
      if (mounted.current) onLoggedOut();
    } catch (err) {
      if (mounted.current) {
        Alert.alert(
          'Could not sign out',
          err instanceof Error ? err.message : 'Please retry.',
        );
      }
    } finally {
      logoutBusy.current = false;
      if (mounted.current) setLoggingOut(false);
    }
  }

  function handleSwitchTab(tab: TabKey) {
    setActiveTab(tab);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      {/* TOP BRAND HEADER */}
      <View style={styles.topHeader}>
        <View style={styles.headerLeft}>
          <Text style={styles.eyebrow}>JEEVA ADMIN</Text>
          <Text style={styles.title}>Hello, {user.name}</Text>
          <Text style={styles.subtitle}>
            Platform governance, verifications and resources.
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
              <Ionicons name="log-out-outline" size={18} color="#BA5648" />
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
            const count = tab.badgeCount ? tab.badgeCount(data) : null;

            return (
              <Pressable
                key={tab.key}
                onPress={() => handleSwitchTab(tab.key)}
                style={[
                  styles.navPill,
                  isSelected && styles.navPillSelected,
                ]}
                accessibilityRole="tab"
                accessibilityState={{ selected: isSelected }}
              >
                <Ionicons
                  name={tab.icon}
                  size={15}
                  color={isSelected ? '#FFFFFF' : '#71579C'}
                />
                <Text
                  style={[
                    styles.navPillText,
                    isSelected && styles.navPillTextSelected,
                  ]}
                >
                  {tab.label}
                </Text>
                {count !== null && (
                  <View
                    style={[
                      styles.pillBadge,
                      isSelected && styles.pillBadgeSelected,
                      tab.key === 'vets' && count > 0 && styles.pillBadgeAlert,
                    ]}
                  >
                    <Text
                      style={[
                        styles.pillBadgeText,
                        isSelected && styles.pillBadgeTextSelected,
                        tab.key === 'vets' &&
                          count > 0 &&  
                          styles.pillBadgeTextAlert,
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

      {/* MAIN TAB CONTENT SCROLLVIEW */}
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
              <Pressable
                onPress={onRecheckRole}
                style={styles.recheckBtn}
              >
                <Text style={styles.recheckText}>Recheck Account Access →</Text>
              </Pressable>
            </View>
          ) : (
            <>
              {activeTab === 'overview' && (
                <AdminOverviewTab
                  data={data}
                  loading={loading}
                  onRefresh={() => setRetry((v) => v + 1)}
                  onNavigateTab={(tabKey) => handleSwitchTab(tabKey as TabKey)}
                />
              )}

              {activeTab === 'users' && (
                <AdminUsersTab currentUser={user} />
              )}

              {activeTab === 'vets' && (
                <AdminVetApplicationsTab />
              )}

              {activeTab === 'pets' && (
                <AdminPetsTab />
              )}

              {activeTab === 'appointments' && (
                <AdminAppointmentsTab />
              )}

              {activeTab === 'guides' && (
                <AdminGuidesTab />
              )}

              {activeTab === 'announcements' && (
                <AdminAnnouncementsTab />
              )}

              {activeTab === 'audit' && (
                <AdminAuditLogsTab />
              )}

              {activeTab === 'community' && (
                <AdminCommunityTab />
              )}
            </>
          )}

          {/* FOOTER ACCOUNT INFO & LOGOUT */}
          <View style={styles.footerAccount}>
            <View style={styles.footerLeft}>
              <Text style={styles.footerLabel}>ADMINISTRATOR SESSION</Text>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F9F7F2',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 10,
    backgroundColor: '#F9F7F2',
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    marginLeft: 12,
  },
  eyebrow: {
    color: '#71579C',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  title: {
    color: '#304439',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 3,
  },
  subtitle: {
    color: '#958A81',
    fontSize: 11,
    marginTop: 3,
  },
  signOutHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FDEAE8',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  signOutHeaderText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#BA5648',
  },
  navBarWrapper: {
    backgroundColor: '#F9F7F2',
    borderBottomWidth: 1,
    borderBottomColor: '#ECE4F2',
    paddingVertical: 8,
  },
  navBarScroll: {
    paddingHorizontal: 18,
    gap: 8,
  },
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
  navPillSelected: {
    backgroundColor: '#71579C',
    borderColor: '#71579C',
  },
  navPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#5B477A',
  },
  navPillTextSelected: {
    color: '#FFFFFF',
  },
  pillBadge: {
    backgroundColor: '#EEE6F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  pillBadgeSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  pillBadgeAlert: {
    backgroundColor: '#FFF0C9',
  },
  pillBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#71579C',
  },
  pillBadgeTextSelected: {
    color: '#FFFFFF',
  },
  pillBadgeTextAlert: {
    color: '#976A17',
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 40,
  },
  contentContainer: {
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
  },
  globalErrorCard: {
    backgroundColor: '#FBECE7',
    borderRadius: 18,
    padding: 18,
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  globalErrorText: {
    color: '#BA5648',
    fontSize: 12,
    textAlign: 'center',
  },
  recheckBtn: {
    paddingVertical: 6,
  },
  recheckText: {
    color: '#71579C',
    fontSize: 11,
    fontWeight: '800',
  },
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
  footerLeft: {
    flex: 1,
  },
  footerLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#9B8CA7',
    letterSpacing: 0.8,
  },
  footerEmail: {
    fontSize: 12,
    color: '#554564',
    marginTop: 2,
  },
  footerSignOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#71579C',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
  },
  footerSignOutText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});