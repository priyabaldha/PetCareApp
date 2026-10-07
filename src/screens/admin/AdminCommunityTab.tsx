import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AdminCommunityTab() {
  return (
    <View style={styles.container}>
      <View style={styles.statusCard}>
        <View style={styles.iconCircle}>
          <Ionicons name="chatbubbles-outline" size={28} color="#71579C" />
        </View>

        <Text style={styles.title}>Community Module Status</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>CLIENT DEMO FEED</Text>
        </View>

        <Text style={styles.description}>
          The pet owner Community tab currently displays curated demonstration
          stories and mock categories directly within the mobile client.
        </Text>

        <View style={styles.infoBox}>
          <View style={styles.infoItem}>
            <Ionicons name="checkmark-circle-outline" size={16} color="#54816A" />
            <Text style={styles.infoText}>
              Client-side UI structure is established with categories and story
              cards.
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="alert-circle-outline" size={16} color="#A2701F" />
            <Text style={styles.infoText}>
              Live user posting, comments, and report queues require dedicated
              database collections.
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="shield-outline" size={16} color="#71579C" />
            <Text style={styles.infoText}>
              Admin moderation controls (e.g. flag removal, content moderation,
              and report resolution) will activate automatically when user posts
              are connected to the backend.
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%' },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#EAE2F1',
    padding: 22,
    alignItems: 'center',
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#EEE6F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#342542',
  },
  badge: {
    backgroundColor: '#FFF0C9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 6,
    marginBottom: 12,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#976A17',
    letterSpacing: 0.6,
  },
  description: {
    fontSize: 12,
    color: '#7C6F86',
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 16,
  },
  infoBox: {
    backgroundColor: '#FAF8FC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F0EAF6',
    padding: 14,
    width: '100%',
    gap: 10,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 11,
    color: '#554664',
    lineHeight: 16,
  },
});
