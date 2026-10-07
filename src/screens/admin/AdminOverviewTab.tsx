import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { AdminOverviewResponse } from '../../services/admin';
import { AdminVetApplications } from '../../components/VetApplicationPanel';

interface Props {
  data: AdminOverviewResponse | null;
  loading: boolean;
  onRefresh: () => void;
  onNavigateTab: (tab: string) => void;
}

type IconName = keyof typeof Ionicons.glyphMap;

interface StatCardConfig {
  key: keyof AdminOverviewResponse['overview'];
  title: string;
  subtitle: string;
  icon: IconName;
  background: string;
  color: string;
  tabTarget?: string;
}

const statCards: StatCardConfig[] = [
  {
    key: 'petOwners',
    title: 'Pet Owners',
    subtitle: 'Active pet owners',
    icon: 'people-outline',
    background: '#EEE6F6',
    color: '#71579C',
    tabTarget: 'users',
  },
  {
    key: 'vets',
    title: 'Veterinarians',
    subtitle: 'Approved Vet accounts',
    icon: 'medkit-outline',
    background: '#E2F0E8',
    color: '#54816A',
    tabTarget: 'vets',
  },
  {
    key: 'pets',
    title: 'Saved Pets',
    subtitle: 'Registered pet profiles',
    icon: 'paw-outline',
    background: '#F9E9DA',
    color: '#AE8054',
    tabTarget: 'pets',
  },
  {
    key: 'admins',
    title: 'Administrators',
    subtitle: 'Platform admins',
    icon: 'shield-checkmark-outline',
    background: '#E4ECF8',
    color: '#6482AD',
    tabTarget: 'users',
  },
  {
    key: 'pendingVetApplications',
    title: 'Pending Vets',
    subtitle: 'Waiting for review',
    icon: 'clipboard-outline',
    background: '#FFF0C9',
    color: '#A2701F',
    tabTarget: 'vets',
  },
  {
    key: 'suspendedUsers',
    title: 'Suspended Accounts',
    subtitle: 'Deactivated users',
    icon: 'ban-outline',
    background: '#FCE8E6',
    color: '#BA5648',
    tabTarget: 'users',
  },
  {
    key: 'appointments',
    title: 'Owner Visits',
    subtitle: 'Logged clinic visits',
    icon: 'calendar-outline',
    background: '#E9E4F0',
    color: '#6E5D87',
    tabTarget: 'appointments',
  },
  {
    key: 'guides',
    title: 'Care Guides',
    subtitle: 'Published / Drafts',
    icon: 'book-outline',
    background: '#DEF0EA',
    color: '#467B6E',
    tabTarget: 'guides',
  },
];

export default function AdminOverviewTab({
  data,
  loading,
  onRefresh,
  onNavigateTab,
}: Props) {
  const overview = data?.overview;
  const recentActivity = data?.recentActivity || [];

  return (
    <View style={styles.container}>
      {/* HERO BANNER */}
      <View style={styles.hero}>
        <Text style={styles.heroEyebrow}>PLATFORM OVERVIEW</Text>
        <Text style={styles.heroTitle}>
          Every little life.{'\n'}One caring community.
        </Text>
        <Text style={styles.heroDescription}>
          Real-time platform metrics, pending professional applications, and
          moderated care resources across JEEVA.
        </Text>
      </View>

      {/* STATS SECTION */}
      <View style={styles.sectionHeader}>
        <View style={styles.flex}>
          <Text style={styles.sectionTitle}>Platform Metrics</Text>
          <Text style={styles.sectionSubtitle}>
            Live counts directly from the database
          </Text>
        </View>
        <Pressable
          onPress={onRefresh}
          disabled={loading}
          accessibilityRole="button"
          style={styles.refreshButton}
        >
          <Ionicons name="refresh-outline" size={16} color="#71579C" />
          <Text style={styles.refreshText}>Refresh</Text>
        </Pressable>
      </View>

      <View style={styles.grid}>
        {statCards.map((card) => {
          const value = overview ? overview[card.key] : null;

          return (
            <Pressable
              key={card.key}
              onPress={() => card.tabTarget && onNavigateTab(card.tabTarget)}
              style={[
                styles.statCard,
                { backgroundColor: card.background },
              ]}
            >
              <View style={styles.statCardHeader}>
                <Ionicons name={card.icon} size={22} color={card.color} />
                {card.tabTarget && (
                  <Ionicons
                    name="arrow-forward"
                    size={14}
                    color={card.color}
                    style={{ opacity: 0.6 }}
                  />
                )}
              </View>

              {loading && value === null ? (
                <ActivityIndicator
                  color={card.color}
                  style={styles.countLoading}
                />
              ) : (
                <Text style={[styles.count, { color: card.color }]}>
                  {value !== null && value !== undefined ? value : '—'}
                </Text>
              )}

              <Text style={styles.cardTitle}>{card.title}</Text>
              <Text style={styles.cardSubtitle}>{card.subtitle}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* ACTIONABLE PENDING VET APPLICATIONS */}
      <AdminVetApplications onReviewed={onRefresh} />

      {/* LIVE RECENT ACTIVITY */}
      <View style={styles.activitySection}>
        <View style={styles.sectionHeader}>
          <View style={styles.flex}>
            <Text style={styles.sectionTitle}>Recent Admin Activity</Text>
            <Text style={styles.sectionSubtitle}>
              Live audit event stream
            </Text>
          </View>
          <Pressable
            onPress={() => onNavigateTab('audit')}
            accessibilityRole="button"
            style={styles.viewAllButton}
          >
            <Text style={styles.viewAllText}>View all logs →</Text>
          </Pressable>
        </View>

        {recentActivity.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="time-outline" size={24} color="#A89EAF" />
            <Text style={styles.emptyText}>No recent audit entries yet.</Text>
          </View>
        ) : (
          <View style={styles.activityList}>
            {recentActivity.map((act) => (
              <View key={act.id} style={styles.activityItem}>
                <View style={styles.activityDot}>
                  <Ionicons
                    name="ellipse"
                    size={10}
                    color={
                      act.action.includes('suspend') || act.action.includes('reject')
                        ? '#BA5648'
                        : act.action.includes('approved') ||
                          act.action.includes('published')
                        ? '#54816A'
                        : '#71579C'
                    }
                  />
                </View>
                <View style={styles.flex}>
                  <View style={styles.activityTop}>
                    <Text style={styles.activityAction}>
                      {act.action.replace(/_/g, ' ').toUpperCase()}
                    </Text>
                    <Text style={styles.activityDate}>
                      {new Date(act.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                  <Text style={styles.activityDetails}>
                    By <Text style={styles.bold}>{act.actorName}</Text> on{' '}
                    <Text style={styles.bold}>
                      {act.targetName || act.targetId}
                    </Text>
                  </Text>
                  {!!act.reason && (
                    <Text style={styles.activityReason}>
                      "{act.reason}"
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%' },
  flex: { flex: 1 },
  hero: {
    backgroundColor: '#354E43',
    padding: 22,
    borderRadius: 24,
    marginBottom: 22,
  },
  heroEyebrow: {
    color: '#D2D9BA',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  heroTitle: {
    color: '#FFFDF5',
    fontSize: 24,
    lineHeight: 31,
    fontWeight: '800',
    marginTop: 10,
  },
  heroDescription: {
    color: '#C4D1C7',
    fontSize: 12,
    lineHeight: 19,
    marginTop: 9,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitle: {
    color: '#304439',
    fontSize: 18,
    fontWeight: '800',
  },
  sectionSubtitle: {
    color: '#958A81',
    fontSize: 11,
    marginTop: 2,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ECE4F2',
  },
  refreshText: {
    color: '#71579C',
    fontSize: 11,
    fontWeight: '700',
  },
  viewAllButton: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  viewAllText: {
    color: '#71579C',
    fontSize: 12,
    fontWeight: '800',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  statCard: {
    width: '48.5%',
    padding: 16,
    borderRadius: 20,
  },
  statCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  count: {
    fontSize: 28,
    fontWeight: '800',
    marginVertical: 10,
  },
  countLoading: {
    alignSelf: 'flex-start',
    marginVertical: 14,
  },
  cardTitle: {
    color: '#465047',
    fontSize: 13,
    fontWeight: '800',
  },
  cardSubtitle: {
    color: '#8D887F',
    fontSize: 10,
    lineHeight: 15,
    marginTop: 4,
  },
  activitySection: {
    marginTop: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#EAE2F1',
    padding: 18,
  },
  activityList: {
    marginTop: 10,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3EDF8',
    gap: 10,
  },
  activityDot: {
    marginTop: 4,
  },
  activityTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityAction: {
    color: '#524361',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  activityDate: {
    color: '#A093AA',
    fontSize: 10,
  },
  activityDetails: {
    color: '#7E6F8C',
    fontSize: 12,
    marginTop: 3,
  },
  activityReason: {
    color: '#9E8FA9',
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 4,
  },
  bold: {
    fontWeight: '700',
    color: '#40334E',
  },
  emptyCard: {
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    color: '#9E92A6',
    fontSize: 12,
  },
});
