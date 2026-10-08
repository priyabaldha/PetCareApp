import { useEffect, useState } from 'react';

import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../../types/navigation';
import {
  fetchPublicAnnouncements,
  type PublicAnnouncement,
} from '../../services/announcements';
import {
  fetchInAppNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  type InAppNotification,
} from '../../services/notifications';

import { useCareReminders } from '../../hooks/useCareReminders';
import type {
  CareReminder,
  ReminderGroup,
  ReminderKind,
} from '../../hooks/useCareReminders';

type Props = NativeStackScreenProps<
  RootStackParamList,
  'Notifications'
>;

type Filter = 'all' | ReminderKind;
type IconName = keyof typeof Ionicons.glyphMap;

const filters: {
  id: Filter;
  label: string;
}[] = [
  { id: 'all', label: 'All' },
  { id: 'vaccine', label: 'Vaccines' },
  { id: 'appointment', label: 'Appointments' },
  { id: 'medication', label: 'Medications' },
];

const sections: {
  id: ReminderGroup;
  title: string;
  subtitle: string;
}[] = [
  {
    id: 'overdue',
    title: 'Overdue',
    subtitle: 'Saved vaccination due dates that have passed',
  },
  {
    id: 'today',
    title: 'Today',
    subtitle: 'Vaccination dates and upcoming visits today',
  },
  {
    id: 'upcoming',
    title: 'Coming up',
    subtitle: 'Future vaccination dates and scheduled visits',
  },
  {
    id: 'medications',
    title: 'Marked Active',
    subtitle: 'Saved medication records, not dose-time alerts',
  },
];

const appearance: Record<
  ReminderKind,
  {
    icon: IconName;
    color: string;
    background: string;
    label: string;
  }
> = {
  vaccine: {
    icon: 'medkit-outline',
    color: '#C45B45',
    background: '#FFE3DF',
    label: 'VACCINATION',
  },
  appointment: {
    icon: 'calendar-outline',
    color: '#7057A5',
    background: '#E8E0F5',
    label: 'SAVED APPOINTMENT',
  },
  medication: {
    icon: 'medical-outline',
    color: '#4D8A68',
    background: '#E1F1E8',
    label: 'MEDICATION',
  },
};

export default function NotificationsScreen({
  navigation,
}: Props) {
  const {
    reminders,
    loading,
    error,
    warnings,
    refresh,
  } = useCareReminders();

  const [filter, setFilter] = useState<Filter>('all');
  const [announcements, setAnnouncements] = useState<PublicAnnouncement[]>([]);
  const [inAppNotifications, setInAppNotifications] = useState<InAppNotification[]>([]);
  const [unreadInAppCount, setUnreadInAppCount] = useState(0);

  const loadInApp = async () => {
    try {
      const res = await fetchInAppNotifications();
      setInAppNotifications(res.notifications);
      setUnreadInAppCount(res.unreadCount);
    } catch {
      // Non-blocking
    }
  };

  useEffect(() => {
    void fetchPublicAnnouncements().then(setAnnouncements);
    void loadInApp();
  }, []);

  const handleFullRefresh = () => {
    refresh();
    void fetchPublicAnnouncements().then(setAnnouncements);
    void loadInApp();
  };

  const handleInAppPress = async (item: InAppNotification) => {
    if (!item.isRead) {
      void markNotificationAsRead(item.id);
      setInAppNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
      );
      setUnreadInAppCount((prev) => Math.max(0, prev - 1));
    }

    if (item.data?.bookingId) {
      navigation.navigate('Appointments');
    } else if (item.data?.petId && typeof item.data.petId === 'string') {
      navigation.navigate('PetProfile', { petId: item.data.petId });
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setInAppNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadInAppCount(0);
    } catch {}
  };

  const visible = reminders.filter(
    (item) => filter === 'all' || item.kind === filter,
  );

  const overdueCount = reminders.filter(
    (item) => item.group === 'overdue',
  ).length;

  const todayCount = reminders.filter(
    (item) => item.group === 'today',
  ).length;

  const upcomingCount = reminders.filter(
    (item) => item.group === 'upcoming',
  ).length;

  const hasPartialData = warnings.length > 0;
  const countUnavailable = loading || !!error;

  function openReminder(item: CareReminder) {
    if (item.kind === 'appointment') {
      navigation.navigate('Appointments', {
        petId: item.petId,
        petName: item.petName,
      });
      return;
    }

    navigation.navigate('PetProfile', {
      petId: item.petId,
    });
  }

  return (
    <SafeAreaView
      style={styles.screen}
      edges={['left', 'right', 'bottom']}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={handleFullRefresh}
            tintColor="#67539B"
            colors={['#67539B']}
          />
        }
      >
        <View style={styles.content}>
          {/* HEADER */}

          <View style={styles.header}>
            <View style={styles.flex}>
              <Text style={styles.eyebrow}>JEEVA CARE UPDATES</Text>
              <Text style={styles.title}>Notifications</Text>
              <Text style={styles.subtitle}>
                Their care, a little more organised.
              </Text>
            </View>

            <Pressable
              onPress={handleFullRefresh}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Refresh reminders"
              style={[
                styles.refreshButton,
                loading && styles.disabled,
              ]}
            >
              {loading ? (
                <ActivityIndicator
                  size="small"
                  color="#67539B"
                />
              ) : (
                <Ionicons
                  name="refresh-outline"
                  size={21}
                  color="#67539B"
                />
              )}
            </Pressable>
          </View>

          {/* OFFICIAL ANNOUNCEMENTS IF PRESENT */}
          {announcements.length > 0 && (
            <View style={styles.announcementSection}>
              <View style={styles.announcementSectionHeader}>
                <Ionicons name="megaphone-outline" size={16} color="#71579C" />
                <Text style={styles.announcementSectionTitle}>
                  Official JEEVA Announcements
                </Text>
              </View>

              {announcements.map((ann) => (
                <View
                  key={ann.id}
                  style={[
                    styles.announcementCard,
                    ann.priority === 'urgent' && styles.announcementUrgent,
                  ]}
                >
                  <View style={styles.announcementHeader}>
                    <Text style={styles.announcementTitle}>{ann.title}</Text>
                    {ann.priority === 'urgent' && (
                      <View style={styles.urgentBadge}>
                        <Text style={styles.urgentBadgeText}>URGENT</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.announcementBody}>{ann.content}</Text>
                </View>
              ))}
            </View>
          )}

          {/* IN-APP ACTIVITY & VISIT NOTIFICATIONS */}
          {inAppNotifications.length > 0 && (
            <View style={styles.inAppSection}>
              <View style={styles.inAppSectionHeader}>
                <View style={styles.inAppTitleRow}>
                  <Ionicons name="notifications" size={16} color="#67539B" />
                  <Text style={styles.inAppSectionTitle}>Activity & Clinic Updates</Text>
                  {unreadInAppCount > 0 && (
                    <View style={styles.inAppUnreadBadge}>
                      <Text style={styles.inAppUnreadBadgeText}>{unreadInAppCount} new</Text>
                    </View>
                  )}
                </View>
                {unreadInAppCount > 0 && (
                  <Pressable onPress={handleMarkAllRead} style={styles.markAllReadBtn}>
                    <Text style={styles.markAllReadText}>Mark all read</Text>
                  </Pressable>
                )}
              </View>

              {inAppNotifications.map((notif) => {
                const getIconInfo = (type: string) => {
                  if (type.startsWith('booking_') || type.startsWith('reschedule_')) {
                    if (type === 'booking_confirmed' || type === 'reschedule_accepted') {
                      return { icon: 'checkmark-circle' as const, color: '#39745D', bg: '#E4EFE8' };
                    }
                    if (type === 'booking_rejected' || type === 'booking_cancelled' || type === 'reschedule_declined') {
                      return { icon: 'close-circle' as const, color: '#C45B45', bg: '#FFE3DF' };
                    }
                    return { icon: 'calendar' as const, color: '#7057A5', bg: '#E8E0F5' };
                  }
                  if (type === 'consultation_published') {
                    return { icon: 'document-text' as const, color: '#3A8D8A', bg: '#E2F3F1' };
                  }
                  if (type === 'prescription_added') {
                    return { icon: 'medkit' as const, color: '#4D8A68', bg: '#E1F1E8' };
                  }
                  if (type === 'vaccination_recorded') {
                    return { icon: 'shield-checkmark' as const, color: '#D49A3A', bg: '#FBF0DA' };
                  }
                  return { icon: 'information-circle' as const, color: '#67539B', bg: '#EEE9FA' };
                };

                const iconInfo = getIconInfo(notif.type);

                return (
                  <Pressable
                    key={notif.id}
                    onPress={() => handleInAppPress(notif)}
                    style={[
                      styles.inAppCard,
                      !notif.isRead && styles.inAppCardUnread,
                    ]}
                  >
                    <View style={[styles.inAppIconWrap, { backgroundColor: iconInfo.bg }]}>
                      <Ionicons name={iconInfo.icon} size={20} color={iconInfo.color} />
                    </View>
                    <View style={styles.inAppBody}>
                      <View style={styles.inAppCardHeader}>
                        <Text style={[styles.inAppCardTitle, !notif.isRead && styles.inAppCardTitleUnread]}>
                          {notif.title}
                        </Text>
                        {!notif.isRead && <View style={styles.unreadDot} />}
                      </View>
                      <Text style={styles.inAppCardMessage}>{notif.message}</Text>
                      <Text style={styles.inAppCardDate}>
                        {new Date(notif.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* SUMMARY */}

          <View style={styles.summaryCard}>
            <View style={styles.summaryHeading}>
              <Ionicons
                name="notifications-outline"
                size={20}
                color="#67539B"
              />
              <Text style={styles.summaryTitle}>
                Your care overview
              </Text>
            </View>

            <View style={styles.stats}>
              <SummaryStat
                label="Overdue"
                value={countUnavailable ? '—' : String(overdueCount)}
                color="#C45B45"
              />

              <View style={styles.statDivider} />

              <SummaryStat
                label="Today"
                value={countUnavailable ? '—' : String(todayCount)}
                color="#67539B"
              />

              <View style={styles.statDivider} />

              <SummaryStat
                label="Upcoming"
                value={countUnavailable ? '—' : String(upcomingCount)}
                color="#4D8A68"
              />
            </View>

            <Text style={styles.summaryNote}>
              {hasPartialData
                ? 'Counts include only the records that loaded.'
                : 'Based on your saved vaccination and appointment dates.'}
            </Text>
          </View>

          {/* FILTERS */}

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filters}
          >
            {filters.map((item) => {
              const selected = filter === item.id;

              return (
                <Pressable
                  key={item.id}
                  onPress={() => setFilter(item.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  style={[
                    styles.filter,
                    selected && styles.filterSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterText,
                      selected && styles.filterTextSelected,
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* LOAD STATES */}

          {loading ? (
            <View style={styles.messageCard}>
              <ActivityIndicator color="#67539B" />
              <Text style={styles.messageTitle}>
                Checking saved care records…
              </Text>
              <Text style={styles.messageText}>
                Loading vaccinations, visits and medications.
              </Text>
            </View>
          ) : error ? (
            <View style={styles.messageCard}>
              <Ionicons
                name="cloud-offline-outline"
                size={32}
                color="#C45B45"
              />

              <Text style={styles.messageTitle}>
                Could not load reminders
              </Text>

              <Text style={styles.messageText}>{error}</Text>

              <Pressable
                onPress={refresh}
                accessibilityRole="button"
                style={styles.retryButton}
              >
                <Text style={styles.retryText}>Try again</Text>
              </Pressable>
            </View>
          ) : (
            <>
              {hasPartialData && (
                <View style={styles.warningCard}>
                  <View style={styles.warningHeading}>
                    <Ionicons
                      name="alert-circle-outline"
                      size={20}
                      color="#A57539"
                    />
                    <Text style={styles.warningTitle}>
                      Some records couldn’t load
                    </Text>
                  </View>

                  <Text style={styles.warningText}>
                    The reminders below may be incomplete.
                  </Text>

                  {warnings.map((warning, index) => (
                    <Text
                      key={`${index}-${warning}`}
                      style={styles.warningText}
                    >
                      • {warning}
                    </Text>
                  ))}

                  <Pressable
                    onPress={refresh}
                    accessibilityRole="button"
                    style={styles.inlineButton}
                  >
                    <Text style={styles.warningLink}>
                      Retry missing records →
                    </Text>
                  </Pressable>
                </View>
              )}

              {visible.length === 0 ? (
                <View style={styles.messageCard}>
                  <View style={styles.emptyIcon}>
                    <Ionicons
                      name="leaf-outline"
                      size={32}
                      color="#67539B"
                    />
                  </View>

                  <Text style={styles.messageTitle}>
                    {hasPartialData
                      ? 'No matching reminders loaded'
                      : filter === 'all'
                        ? 'No reminders to show'
                        : 'Nothing in this category'}
                  </Text>

                  <Text style={styles.messageText}>
                    {hasPartialData
                      ? 'Retry the missing records to check the full list.'
                      : 'Reminders appear from saved vaccination due dates, upcoming appointments and medications marked Active.'}
                  </Text>
                </View>
              ) : (
                sections.map((section) => {
                  const items = visible.filter(
                    (item) => item.group === section.id,
                  );

                  if (items.length === 0) return null;

                  return (
                    <View key={section.id}>
                      <View style={styles.sectionHeader}>
                        <View style={styles.flex}>
                          <Text style={styles.sectionTitle}>
                            {section.title}
                          </Text>
                          <Text style={styles.sectionSubtitle}>
                            {section.subtitle}
                          </Text>
                        </View>

                        <View style={styles.countBadge}>
                          <Text style={styles.countText}>
                            {items.length}
                          </Text>
                        </View>
                      </View>

                      {items.map((item) => (
                        <ReminderCard
                          key={item.id}
                          item={item}
                          onPress={() => openReminder(item)}
                        />
                      ))}
                    </View>
                  );
                })
              )}
            </>
          )}

          {/* INFORMATION */}

          <View style={styles.infoCard}>
            <View style={styles.infoIcon}>
              <Ionicons
                name="information-circle-outline"
                size={23}
                color="#67539B"
              />
            </View>

            <View style={styles.flex}>
              <Text style={styles.infoTitle}>
                Reminders inside JEEVA
              </Text>

              <Text style={styles.infoText}>
                This page updates when opened or refreshed. Phone
                alerts aren’t enabled yet.
              </Text>

              <Text style={styles.infoText}>
                Medication status is saved manually. An Active
                record doesn’t mean a dose is due now.
              </Text>

              <Text style={styles.infoText}>
                Appointment times are compared with your phone’s
                local time. Your phone and clinic should use the
                same time zone.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryStat({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ReminderCard({
  item,
  onPress,
}: {
  item: CareReminder;
  onPress: () => void;
}) {
  const design = appearance[item.kind];

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${design.label}: ${item.title}, ${item.petName}. ${item.detail}`}
      style={({ pressed }) => [
        styles.notificationCard,
        item.group === 'overdue' && styles.overdueCard,
        pressed && styles.pressed,
      ]}
    >
      <View
        style={[
          styles.notificationIcon,
          { backgroundColor: design.background },
        ]}
      >
        <Ionicons
          name={design.icon}
          size={21}
          color={design.color}
        />
      </View>

      <View style={styles.notificationContent}>
        <Text
          style={[
            styles.notificationLabel,
            { color: design.color },
          ]}
        >
          {design.label}
        </Text>

        <Text style={styles.notificationTitle}>
          {item.title}
        </Text>

        <Text style={styles.notificationMessage}>
          {item.message}
        </Text>

        <View style={styles.dateBox}>
          <Text style={styles.notificationDate}>
            {item.detail}
          </Text>
        </View>

        <Text style={styles.openLink}>
          {item.kind === 'appointment'
            ? 'Open appointments →'
            : 'Open pet profile →'}
        </Text>
      </View>

      <Ionicons
        name="chevron-forward"
        size={16}
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
  scrollContent: {
    padding: 20,
    paddingBottom: 45,
  },
  content: {
    width: '100%',
    maxWidth: 620,
    alignSelf: 'center',
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 23,
  },
  eyebrow: {
    color: '#7057A5',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.3,
  },
  title: {
    color: '#20352F',
    fontSize: 28,
    fontWeight: '800',
    marginTop: 5,
    letterSpacing: -0.6,
  },
  subtitle: {
    color: '#928A80',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
  },
  refreshButton: {
    width: 45,
    height: 45,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECE8E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.5,
  },

  // Overview

  summaryCard: {
    padding: 19,
    backgroundColor: '#EEE8F5',
    borderRadius: 24,
    marginBottom: 20,
  },
  summaryHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryTitle: {
    color: '#5F4B79',
    fontSize: 13,
    fontWeight: '800',
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 15,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 29,
    fontWeight: '800',
  },
  statLabel: {
    color: '#95869F',
    fontSize: 10,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 35,
    backgroundColor: '#DBD1E6',
  },
  summaryNote: {
    color: '#95869F',
    fontSize: 10,
    lineHeight: 16,
    textAlign: 'center',
  },

  // Filters

  filters: {
    gap: 8,
    paddingBottom: 8,
  },
  filter: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAE4DD',
  },
  filterSelected: {
    backgroundColor: '#67539B',
    borderColor: '#67539B',
  },
  filterText: {
    color: '#93859F',
    fontSize: 11,
    fontWeight: '700',
  },
  filterTextSelected: {
    color: '#FFFFFF',
  },

  // Sections

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 23,
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#20352F',
    fontSize: 18,
    fontWeight: '800',
  },
  sectionSubtitle: {
    color: '#9B9288',
    fontSize: 10,
    lineHeight: 16,
    marginTop: 4,
  },
  countBadge: {
    minWidth: 29,
    height: 29,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: '#EEE7F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    color: '#7057A5',
    fontSize: 11,
    fontWeight: '800',
  },

  // Reminder cards

  notificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 15,
    marginBottom: 11,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#ECE8E0',
  },
  overdueCard: {
    borderColor: '#EECFC6',
    backgroundColor: '#FFFBF9',
  },
  notificationIcon: {
    width: 44,
    height: 46,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationContent: {
    flex: 1,
    marginHorizontal: 11,
  },
  notificationLabel: {
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: 0.9,
    marginBottom: 6,
  },
  notificationTitle: {
    color: '#303F3A',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '800',
  },
  notificationMessage: {
    color: '#85817A',
    fontSize: 11,
    lineHeight: 18,
    marginTop: 5,
  },
  dateBox: {
    backgroundColor: '#F7F4F9',
    borderRadius: 9,
    padding: 9,
    marginTop: 10,
  },
  notificationDate: {
    color: '#9683A6',
    fontSize: 10,
    lineHeight: 17,
  },
  openLink: {
    color: '#7057A5',
    fontSize: 10,
    fontWeight: '800',
    marginTop: 12,
  },
  pressed: {
    opacity: 0.75,
  },

  // Loading, empty and error states

  messageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#ECE8E0',
    padding: 25,
    marginTop: 20,
    alignItems: 'center',
    gap: 10,
  },
  messageTitle: {
    color: '#51465C',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  messageText: {
    color: '#9A8D9F',
    fontSize: 12,
    lineHeight: 20,
    textAlign: 'center',
  },
  emptyIcon: {
    width: 67,
    height: 67,
    borderRadius: 23,
    backgroundColor: '#F0EAF6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },
  retryButton: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#67539B',
    marginTop: 5,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  warningCard: {
    padding: 16,
    backgroundColor: '#FFF5E4',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EEDDBF',
    marginTop: 15,
  },
  warningHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 5,
  },
  warningTitle: {
    flex: 1,
    color: '#9E7138',
    fontSize: 12,
    fontWeight: '800',
  },
  warningText: {
    color: '#A18A68',
    fontSize: 11,
    lineHeight: 18,
    marginTop: 4,
  },
  inlineButton: {
    alignSelf: 'flex-start',
    paddingVertical: 10,
  },
  warningLink: {
    color: '#9E7138',
    fontSize: 11,
    fontWeight: '800',
  },

  // Information card

  infoCard: {
    backgroundColor: '#E8E0F5',
    borderRadius: 23,
    padding: 17,
    marginTop: 25,
    flexDirection: 'row',
    gap: 12,
  },
  infoIcon: {
    width: 43,
    height: 46,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTitle: {
    color: '#463D5D',
    fontSize: 14,
    fontWeight: '800',
  },
  infoText: {
    color: '#867493',
    fontSize: 10,
    lineHeight: 17,
    marginTop: 7,
  },
  announcementSection: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ECE8E0',
    padding: 14,
  },
  announcementSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  announcementSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#71579C',
    letterSpacing: 0.5,
  },
  announcementCard: {
    backgroundColor: '#F8F6FB',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#71579C',
  },
  announcementUrgent: {
    backgroundColor: '#FFF5F4',
    borderLeftColor: '#BA5648',
  },
  announcementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  announcementTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#342542',
    flex: 1,
  },
  urgentBadge: {
    backgroundColor: '#FDEAE8',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  urgentBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#BA5648',
  },
  announcementBody: {
    fontSize: 11,
    color: '#655474',
    lineHeight: 16,
  },

  // In-App Notifications
  inAppSection: {
    marginBottom: 18,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ECE8E0',
    padding: 14,
  },
  inAppSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  inAppTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  inAppSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#20352F',
  },
  inAppUnreadBadge: {
    backgroundColor: '#67539B',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  inAppUnreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  markAllReadBtn: {
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  markAllReadText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#71579C',
  },
  inAppCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 11,
    borderRadius: 14,
    backgroundColor: '#FAF9F6',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F0EEE8',
  },
  inAppCardUnread: {
    backgroundColor: '#F5F2FB',
    borderColor: '#DFD7EC',
  },
  inAppIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inAppBody: {
    flex: 1,
  },
  inAppCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  inAppCardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#463D5D',
  },
  inAppCardTitleUnread: {
    fontWeight: '800',
    color: '#20352F',
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#67539B',
  },
  inAppCardMessage: {
    fontSize: 11,
    color: '#7B746E',
    lineHeight: 16,
    marginBottom: 4,
  },
  inAppCardDate: {
    fontSize: 9,
    color: '#AAA59C',
    fontWeight: '600',
  },
});