import { useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Ionicons } from '@expo/vector-icons';

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

const quickActions: QuickAction[] = [
  {
    id: 'track',
    title: 'Track pet',
    subtitle: 'Check their location',
    icon: 'location',
    color: '#67539B',
    background: '#EEE9FA',
  },
  {
    id: 'appointment',
    title: 'Appointment',
    subtitle: 'Book a vet visit',
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

export default function HomeScreen({ navigation }: Props) {
  const [showActions, setShowActions] = useState(false);

  function handleQuickAction(id: string) {
    switch (id) {
      case 'track':
        Alert.alert(
          'Track your pet',
          'Pet tracking will open here once your GPS tracking feature is connected.',
        );
        break;

      case 'appointment':
        Alert.alert(
          'Appointments',
          'Your appointment booking feature will be connected here.',
        );
        break;

      case 'vaccine':
        Alert.alert(
          'Vaccination reminders',
          'Your upcoming vaccination reminders will appear here.',
        );
        break;

      case 'guide':
        navigation.navigate('Explore');
        break;

      default:
        break;
    }
  }

  return (
    <SafeAreaView
      style={styles.screen}
      edges={['top', 'left', 'right']}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.content}>

          {/* =====================================
              TOP HEADER
          ===================================== */}

          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>
                GOOD MORNING ✨
              </Text>

              <Text style={styles.title}>
                Hello, Aayushi
              </Text>

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

              <View style={styles.notificationDot} />
            </Pressable>
          </View>

          {/* =====================================
              PET OVERVIEW CARD
          ===================================== */}

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
                Keep their health, food, appointments
                and everyday care beautifully organised.
              </Text>

              <Pressable
                style={styles.viewPetsButton}
                onPress={() =>
                  navigation.navigate('MyPets')
                }
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
                <Text style={styles.heroEmoji}>
                  🐶
                </Text>
              </View>

              <View style={styles.heroSmallCircle}>
                <Text style={styles.heroSmallEmoji}>
                  🐱
                </Text>
              </View>
            </View>
          </View>

          {/* =====================================
              TODAY'S CARE
          ===================================== */}

          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>
                Today's care
              </Text>

              <Text style={styles.sectionSubtitle}>
                A few things worth checking
              </Text>
            </View>

            <Pressable
              onPress={() => setShowActions(!showActions)}
              style={styles.plusButton}
              accessibilityRole="button"
              accessibilityLabel="Show quick actions"
            >
              <Ionicons
                name={showActions ? 'close' : 'add'}
                size={23}
                color="#FFFFFF"
              />
            </Pressable>
          </View>

          {/* =====================================
              QUICK ACTIONS
          ===================================== */}

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
                >
                  <View
                    style={[
                      styles.quickActionIcon,
                      {
                        backgroundColor:
                          action.background,
                      },
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

          {/* =====================================
              TRACK YOUR PET
          ===================================== */}

          <Pressable
            style={({ pressed }) => [
              styles.trackingCard,
              pressed && styles.pressed,
            ]}
            onPress={() => handleQuickAction('track')}
            accessibilityRole="button"
            accessibilityLabel="Track your pet"
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
                See their latest location when tracking
                is enabled.
              </Text>
            </View>

            <View style={styles.arrowCircle}>
              <Ionicons
                name="arrow-forward"
                size={17}
                color="#67539B"
              />
            </View>
          </Pressable>

          {/* =====================================
              VACCINATION REMINDER
          ===================================== */}

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
                  NEXT REMINDER
                </Text>

                <View style={styles.upcomingBadge}>
                  <Text style={styles.upcomingText}>
                    UPCOMING
                  </Text>
                </View>
              </View>

              <Text style={styles.vaccineTitle}>
                Vaccination reminder
              </Text>

              <Text style={styles.vaccineDescription}>
                Milo's annual vaccination is due in
                12 days.
              </Text>

              <Pressable
                onPress={() =>
                  Alert.alert(
                    'Vaccination reminder',
                    'Email and in-app vaccine reminders will be connected to your pet profile.',
                  )
                }
              >
                <Text style={styles.manageReminder}>
                  Manage reminders →
                </Text>
              </Pressable>
            </View>
          </View>

          {/* =====================================
              COMMUNITY
          ===================================== */}

          <View style={styles.communityCard}>
            <View style={styles.communityIllustration}>
              <View style={styles.communityBubbleOne}>
                <Text style={styles.communityEmoji}>
                  🐕
                </Text>
              </View>

              <View style={styles.communityBubbleTwo}>
                <Text style={styles.communityEmoji}>
                  🐈
                </Text>
              </View>

              <View style={styles.communityBubbleThree}>
                <Text style={styles.communityEmoji}>
                  🐰
                </Text>
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
                Connect with animal lovers, rescuers,
                shelters and pet parents.
              </Text>

              <Pressable
                style={styles.communityButton}
                onPress={() =>
                  navigation.navigate('Community')
                }
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

          {/* =====================================
              PET GUIDE
          ===================================== */}

          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>
                Pet guide
              </Text>

              <Text style={styles.sectionSubtitle}>
                Better choices for happier pets
              </Text>
            </View>

            <Pressable
              onPress={() =>
                navigation.navigate('Explore')
              }
            >
              <Text style={styles.seeAll}>
                See all
              </Text>
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
                navigation.navigate('Explore')
              }
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
                Portions, healthy meals & what to avoid.
              </Text>

              <Text style={styles.guideArrow}>
                Explore →
              </Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.guideCard,
                styles.lawsCard,
                pressed && styles.pressed,
              ]}
              onPress={() =>
                navigation.navigate('Explore')
              }
            >
              <View style={styles.guideIconLaw}>
                <Ionicons
                  name="shield-checkmark"
                  size={23}
                  color="#3A8D8A"
                />
              </View>

              <Text style={styles.guideTitle}>
                Animal laws
              </Text>

              <Text style={styles.guideDescription}>
                Know existing rights and protections.
              </Text>

              <Text style={styles.guideArrow}>
                Learn more →
              </Text>
            </Pressable>

          </View>

          {/* =====================================
              COMMUNITY / SHELTER BANNER
          ===================================== */}

          <View style={styles.rescueBanner}>
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
                Discover shelters, adoption drives and
                ways to support animals around you.
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={20}
              color="#FFFFFF"
            />
          </View>

          {/* =====================================
              JEEVA AI SPACE
          ===================================== */}

          <View style={styles.aiInfoCard}>
            <View style={styles.aiIcon}>
              <Text style={styles.aiSparkle}>
                ✦
              </Text>
            </View>

            <View style={styles.aiText}>
              <Text style={styles.aiTitle}>
                JEEVA AI
              </Text>

              <Text style={styles.aiDescription}>
                Ask about pet care, food, behaviour or
                everyday concerns.
              </Text>
            </View>
          </View>

          <View style={styles.bottomSpace} />

        </View>
      </ScrollView>

      {/* =====================================
          JEEVA AI FLOATING BUTTON
      ===================================== */}

      <Pressable
        style={({ pressed }) => [
          styles.aiFloatingButton,
          pressed && styles.aiFloatingPressed,
        ]}
        onPress={() =>
          Alert.alert(
            'JEEVA AI',
            'Your AI pet-care assistant will open here. You can ask about food, behaviour, health and everyday pet care.',
          )
        }
        accessibilityRole="button"
        accessibilityLabel="Open JEEVA AI"
      >
        <View style={styles.aiFloatingInner}>
          <Text style={styles.aiFloatingSparkle}>
            ✦
          </Text>
        </View>

        <View style={styles.aiOnlineDot} />
      </Pressable>

    </SafeAreaView>
  );
}

/* =====================================================
   STYLES
===================================================== */

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

  /* HEADER */

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 22,
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
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 3,
  },

  notificationDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#E76F51',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },

  /* HERO */

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

  /* SECTION HEADER */

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
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
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 4,
  },

  /* QUICK ACTIONS */

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

  /* TRACKING */

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

  /* VACCINE */

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

  /* COMMUNITY */

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
  },

  communityButtonText: {
    color: '#67539B',
    fontSize: 11,
    fontWeight: '800',
  },

  /* GUIDE */

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
  },

  guideArrow: {
    color: '#67539B',
    fontSize: 10,
    fontWeight: '800',
    marginTop: 'auto',
  },

  /* RESCUE / HELP */

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

  /* AI INFO */

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

  /* FLOATING AI */

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
    shadowOpacity: 0.30,
    shadowRadius: 14,

    shadowOffset: {
      width: 0,
      height: 6,
    },

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

  aiOnlineDot: {
    position: 'absolute',
    right: 1,
    top: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#55C878',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },

  aiFloatingPressed: {
    transform: [
      {
        scale: 0.94,
      },
    ],
  },

  pressed: {
    opacity: 0.75,
  },

  bottomSpace: {
    height: 80,
  },
});