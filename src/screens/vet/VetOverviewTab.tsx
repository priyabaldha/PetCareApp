import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { VetBooking, VetDashboardStats } from '../../services/vets';

interface Props {
  stats: VetDashboardStats | null;
  todayBookings: VetBooking[];
  pendingBookings: VetBooking[];
  loading: boolean;
  onNavigateTab: (tab: 'overview' | 'appointments' | 'patients' | 'profile') => void;
  onOpenBooking: (booking: VetBooking) => void;
  onOpenConsultation: () => void;
}

export default function VetOverviewTab({
  stats,
  todayBookings,
  pendingBookings,
  loading,
  onNavigateTab,
  onOpenBooking,
  onOpenConsultation,
}: Props) {
  const pendingCount = stats?.pendingRequests ?? 0;
  const todayCount = stats?.todayConfirmed ?? 0;
  const upcomingCount = stats?.upcomingVisits ?? 0;
  const completedCount = stats?.completedConsultations ?? 0;
  const patientCount = stats?.totalPatients ?? 0;

  return (
    <View style={styles.container}>
      {/* QUICK STATUS BANNER */}
      {pendingCount > 0 && (
        <Pressable
          onPress={() => onNavigateTab('appointments')}
          style={styles.pendingAlertBanner}
        >
          <View style={styles.pendingAlertLeft}>
            <View style={styles.alertPulse}>
              <Ionicons name="time" size={18} color="#976A17" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.pendingAlertTitle}>
                {pendingCount} Pending Appointment {pendingCount === 1 ? 'Request' : 'Requests'}
              </Text>
              <Text style={styles.pendingAlertSub}>
                Pet owners are waiting for your confirmation. Review now.
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#976A17" />
        </Pressable>
      )}

      {/* METRIC CARDS GRID */}
      <View style={styles.statsGrid}>
        <Pressable
          onPress={() => onNavigateTab('appointments')}
          style={[styles.statCard, { backgroundColor: '#F2EBF9' }]}
        >
          <View style={styles.statTop}>
            <Text style={styles.statLabel}>PENDING REQUESTS</Text>
            <Ionicons name="time-outline" size={18} color="#71579C" />
          </View>
          <Text style={[styles.statNumber, { color: '#71579C' }]}>
            {loading ? '—' : pendingCount}
          </Text>
          <Text style={styles.statFootnote}>Awaiting review</Text>
        </Pressable>

        <Pressable
          onPress={() => onNavigateTab('appointments')}
          style={[styles.statCard, { backgroundColor: '#E4EFE8' }]}
        >
          <View style={styles.statTop}>
            <Text style={styles.statLabel}>TODAY'S VISITS</Text>
            <Ionicons name="calendar-outline" size={18} color="#2F7C5D" />
          </View>
          <Text style={[styles.statNumber, { color: '#2F7C5D' }]}>
            {loading ? '—' : todayCount}
          </Text>
          <Text style={styles.statFootnote}>Confirmed today</Text>
        </Pressable>

        <Pressable
          onPress={() => onNavigateTab('appointments')}
          style={[styles.statCard, { backgroundColor: '#EBF3FB' }]}
        >
          <View style={styles.statTop}>
            <Text style={styles.statLabel}>UPCOMING VISITS</Text>
            <Ionicons name="calendar-number-outline" size={18} color="#4A75A0" />
          </View>
          <Text style={[styles.statNumber, { color: '#4A75A0' }]}>
            {loading ? '—' : upcomingCount}
          </Text>
          <Text style={styles.statFootnote}>Upcoming scheduled</Text>
        </Pressable>

        <Pressable
          onPress={() => onNavigateTab('patients')}
          style={[styles.statCard, { backgroundColor: '#FFF5E6' }]}
        >
          <View style={styles.statTop}>
            <Text style={styles.statLabel}>TOTAL PATIENTS</Text>
            <Ionicons name="paw-outline" size={18} color="#A66F1E" />
          </View>
          <Text style={[styles.statNumber, { color: '#A66F1E' }]}>
            {loading ? '—' : patientCount}
          </Text>
          <Text style={styles.statFootnote}>{completedCount} consultations</Text>
        </Pressable>
      </View>

      {/* QUICK ACTIONS ROW */}
      <View style={styles.quickActionsCard}>
        <Text style={styles.sectionHeading}>Quick Actions</Text>
        <View style={styles.actionGrid}>
          <Pressable
            onPress={() => onNavigateTab('profile')}
            style={styles.actionItem}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#EFE7F6' }]}>
              <Ionicons name="time" size={18} color="#71579C" />
            </View>
            <Text style={styles.actionItemLabel}>Set Schedule</Text>
          </Pressable>

          <Pressable
            onPress={() => onNavigateTab('appointments')}
            style={styles.actionItem}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#E4EFE8' }]}>
              <Ionicons name="checkmark-done" size={18} color="#2F7C5D" />
            </View>
            <Text style={styles.actionItemLabel}>Review Requests</Text>
          </Pressable>

          <Pressable
            onPress={onOpenConsultation}
            style={styles.actionItem}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#EBF3FB' }]}>
              <Ionicons name="document-text" size={18} color="#4A75A0" />
            </View>
            <Text style={styles.actionItemLabel}>New Record</Text>
          </Pressable>

          <Pressable
            onPress={() => onNavigateTab('patients')}
            style={styles.actionItem}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#FFF0D3' }]}>
              <Ionicons name="people" size={18} color="#9B702C" />
            </View>
            <Text style={styles.actionItemLabel}>Patient Chart</Text>
          </Pressable>
        </View>
      </View>

      {/* TODAY'S SCHEDULE TIMELINE */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="today-outline" size={18} color="#71579C" />
          <Text style={styles.sectionHeading}>Today's Schedule</Text>
        </View>

        {todayBookings.length === 0 ? (
          <View style={styles.emptyTimeline}>
            <Ionicons name="leaf-outline" size={26} color="#71579C" />
            <Text style={styles.emptyTimelineTitle}>No visits scheduled for today</Text>
            <Text style={styles.emptyTimelineSub}>
              Confirmed appointments for today will show up here along with patient details.
            </Text>
          </View>
        ) : (
          todayBookings.map((b, index) => (
            <Pressable
              key={b.id}
              onPress={() => onOpenBooking(b)}
              style={[
                styles.timelineItem,
                index < todayBookings.length - 1 && styles.timelineItemBorder,
              ]}
            >
              <View style={styles.timeBadge}>
                <Text style={styles.timeBadgeText}>{b.time}</Text>
              </View>
              <View style={styles.timelineContent}>
                <View style={styles.timelineRow}>
                  <Text style={styles.timelinePetName}>{b.petName}</Text>
                  <Text style={styles.timelineSpecies}>({b.petSpecies})</Text>
                </View>
                <Text style={styles.timelineReason} numberOfLines={1}>{b.reason}</Text>
                <Text style={styles.timelineOwner}>Owner: {b.ownerName}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#958A81" />
            </Pressable>
          ))
        )}
      </View>

      {/* RECENT REQUESTS */}
      {pendingBookings.length > 0 && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="mail-unread-outline" size={18} color="#976A17" />
            <Text style={styles.sectionHeading}>Pending Appointment Requests</Text>
          </View>

          {pendingBookings.slice(0, 3).map((b) => (
            <Pressable
              key={b.id}
              onPress={() => onOpenBooking(b)}
              style={styles.pendingSnippet}
            >
              <View style={styles.pendingSnippetTop}>
                <Text style={styles.pendingPetName}>
                  {b.petName} <Text style={styles.pendingSpecies}>({b.petSpecies})</Text>
                </Text>
                <View style={styles.pendingTimePill}>
                  <Text style={styles.pendingTimeText}>{b.date} • {b.time}</Text>
                </View>
              </View>
              <Text style={styles.pendingReason} numberOfLines={2}>Reason: {b.reason}</Text>
              <Text style={styles.pendingOwner}>Requested by {b.ownerName}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 14 },
  pendingAlertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF0C9',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F3DB98',
  },
  pendingAlertLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  alertPulse: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFE5A3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingAlertTitle: { fontSize: 13, fontWeight: '800', color: '#7D5305' },
  pendingAlertSub: { fontSize: 11, color: '#976A17', marginTop: 2 },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  statTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: { fontSize: 9, fontWeight: '800', color: '#777184', letterSpacing: 0.5 },
  statNumber: { fontSize: 28, fontWeight: '800', marginTop: 6 },
  statFootnote: { fontSize: 10, color: '#887E8E', marginTop: 2 },
  quickActionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ECE4F2',
    gap: 12,
  },
  sectionHeading: { fontSize: 14, fontWeight: '800', color: '#304439' },
  actionGrid: { flexDirection: 'row', justifyContent: 'space-around' },
  actionItem: { alignItems: 'center', gap: 6 },
  actionIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionItemLabel: { fontSize: 10, fontWeight: '700', color: '#554564' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ECE4F2',
    gap: 12,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  emptyTimeline: {
    alignItems: 'center',
    paddingVertical: 18,
    gap: 6,
  },
  emptyTimelineTitle: { fontSize: 13, fontWeight: '800', color: '#304439' },
  emptyTimelineSub: { fontSize: 11, color: '#958A81', textAlign: 'center', lineHeight: 16 },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  timelineItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0EAF5',
  },
  timeBadge: {
    backgroundColor: '#EFE7F6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  timeBadgeText: { fontSize: 11, fontWeight: '800', color: '#71579C' },
  timelineContent: { flex: 1, gap: 2 },
  timelineRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timelinePetName: { fontSize: 13, fontWeight: '800', color: '#304439' },
  timelineSpecies: { fontSize: 11, color: '#71579C', textTransform: 'capitalize' },
  timelineReason: { fontSize: 11, color: '#554564' },
  timelineOwner: { fontSize: 10, color: '#958A81' },
  pendingSnippet: {
    backgroundColor: '#FFFDF7',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F3DB98',
    gap: 4,
  },
  pendingSnippetTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pendingPetName: { fontSize: 13, fontWeight: '800', color: '#304439' },
  pendingSpecies: { fontSize: 11, color: '#71579C', textTransform: 'capitalize' },
  pendingTimePill: { backgroundColor: '#FFF0C9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  pendingTimeText: { fontSize: 10, fontWeight: '800', color: '#7D5305' },
  pendingReason: { fontSize: 11, color: '#554564', marginTop: 2 },
  pendingOwner: { fontSize: 10, color: '#958A81', marginTop: 2 },
});
