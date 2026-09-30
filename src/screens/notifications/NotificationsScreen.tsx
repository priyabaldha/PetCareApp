import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function NotificationsScreen() {
  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >

        {/* HEADER */}

        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>
              JEEVA UPDATES
            </Text>

            <Text style={styles.title}>
              Notifications
            </Text>
          </View>

          <Pressable style={styles.markButton}>
            <Ionicons
              name="checkmark-done-outline"
              size={19}
              color="#67539B"
            />
          </Pressable>
        </View>

        {/* TODAY */}

        <Text style={styles.sectionTitle}>
          Today
        </Text>

        <NotificationCard
          icon="medkit-outline"
          iconColor="#C45B45"
          iconBackground="#FFE3DF"
          title="Vaccination reminder"
          message="Bruno's Rabies vaccination is due in 12 days."
          time="10 min ago"
          unread
        />

        <NotificationCard
          icon="calendar-outline"
          iconColor="#7057A5"
          iconBackground="#E8E0F5"
          title="Upcoming appointment"
          message="Bruno has a vet appointment tomorrow at 5:30 PM."
          time="1 hour ago"
          unread
        />

        <NotificationCard
          icon="restaurant-outline"
          iconColor="#A17819"
          iconBackground="#FFF0D1"
          title="Daily nutrition tip"
          message="Remember to keep fresh drinking water available."
          time="3 hours ago"
        />

        {/* YESTERDAY */}

        <Text style={styles.sectionTitle}>
          Yesterday
        </Text>

        <NotificationCard
          icon="people-outline"
          iconColor="#4385C5"
          iconBackground="#DDEEFF"
          title="Community"
          message="Priya posted a new story about Bruno's recovery."
          time="Yesterday"
        />

        <NotificationCard
          icon="paw-outline"
          iconColor="#4D8A68"
          iconBackground="#E1F1E8"
          title="Pet profile updated"
          message="Bruno's health record was successfully updated."
          time="Yesterday"
        />

        {/* EARLIER */}

        <Text style={styles.sectionTitle}>
          Earlier
        </Text>

        <NotificationCard
          icon="shield-checkmark-outline"
          iconColor="#7057A5"
          iconBackground="#E8E0F5"
          title="Safety reminder"
          message="Set up a safe zone to receive location alerts."
          time="2 days ago"
        />

        <View style={styles.settingsCard}>
          <View style={styles.settingsIcon}>
            <Ionicons
              name="notifications-outline"
              size={22}
              color="#67539B"
            />
          </View>

          <View style={styles.settingsContent}>
            <Text style={styles.settingsTitle}>
              Manage notifications
            </Text>

            <Text style={styles.settingsText}>
              Choose which reminders and updates
              JEEVA can send you.
            </Text>

            <Pressable>
              <Text style={styles.settingsLink}>
                Notification settings →
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function NotificationCard({
  icon,
  iconColor,
  iconBackground,
  title,
  message,
  time,
  unread = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBackground: string;
  title: string;
  message: string;
  time: string;
  unread?: boolean;
}) {
  return (
    <Pressable
      style={[
        styles.notificationCard,
        unread && styles.unreadCard,
      ]}
    >
      <View
        style={[
          styles.notificationIcon,
          {
            backgroundColor: iconBackground,
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={20}
          color={iconColor}
        />
      </View>

      <View style={styles.notificationContent}>
        <View style={styles.notificationTitleRow}>
          <Text style={styles.notificationTitle}>
            {title}
          </Text>

          {unread && (
            <View style={styles.unreadDot} />
          )}
        </View>

        <Text style={styles.notificationMessage}>
          {message}
        </Text>

        <Text style={styles.notificationTime}>
          {time}
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

  content: {
    padding: 20,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  eyebrow: {
    color: '#7057A5',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.3,
  },

  title: {
    color: '#20352F',
    fontSize: 28,
    fontWeight: '900',
    marginTop: 5,
  },

  markButton: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  sectionTitle: {
    color: '#20352F',
    fontSize: 16,
    fontWeight: '900',
    marginTop: 27,
    marginBottom: 11,
  },

  notificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ECE8E0',
  },

  unreadCard: {
    borderColor: '#E4DDF1',
  },

  notificationIcon: {
    width: 45,
    height: 45,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },

  notificationContent: {
    flex: 1,
    marginHorizontal: 12,
  },

  notificationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  notificationTitle: {
    color: '#303F3A',
    fontSize: 12,
    fontWeight: '900',
  },

  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#67539B',
    marginLeft: 6,
  },

  notificationMessage: {
    color: '#85817A',
    fontSize: 10,
    lineHeight: 15,
    marginTop: 4,
  },

  notificationTime: {
    color: '#AAA59C',
    fontSize: 8,
    marginTop: 5,
  },

  settingsCard: {
    backgroundColor: '#E8E0F5',
    borderRadius: 23,
    padding: 17,
    marginTop: 25,
    flexDirection: 'row',
  },

  settingsIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  settingsContent: {
    flex: 1,
    marginLeft: 12,
  },

  settingsTitle: {
    color: '#463D5D',
    fontSize: 14,
    fontWeight: '900',
  },

  settingsText: {
    color: '#746B83',
    fontSize: 10,
    lineHeight: 15,
    marginTop: 4,
  },

  settingsLink: {
    color: '#7057A5',
    fontSize: 10,
    fontWeight: '900',
    marginTop: 7,
  },
});