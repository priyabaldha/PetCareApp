import { useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface OnboardingScreenProps {
  onComplete: () => void;
}

const COLORS = {
  background: '#F5FBF8',
  white: '#FFFFFF',

  forest: '#123C35',
  dark: '#173B36',

  green: '#42B978',
  mint: '#DDF7EA',
  lightMint: '#ECFAF3',

  blue: '#4DB8D8',
  lightBlue: '#E6F7FB',

  yellow: '#F6C85F',
  lightYellow: '#FFF7DE',

  purple: '#9B82E8',
  lightPurple: '#F0EBFF',

  coral: '#F28B7A',
  lightCoral: '#FFF0ED',

  muted: '#6D827C',
  border: '#DCEBE5',
};

const slides = [
  {
    eyebrow: 'WELCOME TO JEEVA',
    title: 'One world.\nEvery life matters.',
    description:
      'A global space created to help animals, birds and every living companion find care, safety and a loving home.',

    animals: ['🐶', '🐱', '🐰', '🐦', '🐢', '🐘'],

    badge: 'FOR EVERY LIFE',

    background: COLORS.lightMint,
    accent: COLORS.green,
  },

  {
    eyebrow: 'ADOPT • RESCUE • CONNECT',
    title: 'Give them a\nplace to belong.',
    description:
      'Discover animals waiting for a loving home and connect with people who believe every life deserves a second chance.',

    animals: ['🐕', '🐈', '🦜', '🐇', '🐾'],

    badge: 'ADOPT WITH LOVE',

    background: COLORS.lightYellow,
    accent: COLORS.yellow,
  },

  {
    eyebrow: 'CARE • GROOM • HEAL',
    title: 'Everything they\nneed, in one place.',
    description:
      'Manage everyday care, find grooming services, keep health records and connect with trusted veterinary support.',

    animals: ['🩺', '✂️', '💚', '💊', '🐾'],

    badge: 'CARE MADE SIMPLE',

    background: COLORS.lightBlue,
    accent: COLORS.blue,
  },

  {
    eyebrow: 'HELP • NURTURE • PROTECT',
    title: 'Be there when\nthey need us most.',
    description:
      'Report animals in need, find help for strays and become part of a community that cares beyond our own homes.',

    animals: ['🐕', '🕊️', '🐈', '🐢', '🦋', '🐘'],

    badge: 'MAKE A DIFFERENCE',

    background: COLORS.lightPurple,
    accent: COLORS.purple,
  },
];

export default function OnboardingScreen({
  onComplete,
}: OnboardingScreenProps) {
  const [slideIndex, setSlideIndex] = useState(0);

  const slide = slides[slideIndex];
  const isLastSlide =
    slideIndex === slides.length - 1;

  function handleNext() {
    if (isLastSlide) {
      onComplete();
      return;
    }

    setSlideIndex((current) => current + 1);
  }

  function handleBack() {
    if (slideIndex > 0) {
      setSlideIndex((current) => current - 1);
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>

          {/* =====================================
              HEADER
          ====================================== */}

          <View style={styles.header}>
            <Image
              source={require('../../../assets/jeeva.png')}
              style={styles.logo}
              resizeMode="contain"
              accessibilityLabel="JEEVA logo"
            />

            <Pressable
              onPress={onComplete}
              accessibilityRole="button"
              accessibilityLabel="Skip onboarding"
            >
              <Text style={styles.skipText}>
                Skip
              </Text>
            </Pressable>
          </View>

          {/* =====================================
              HERO CARD
          ====================================== */}

          <View
            style={[
              styles.heroCard,
              {
                backgroundColor:
                  slide.background,
              },
            ]}
          >

            {/* Decorative circles */}

            <View
              style={[
                styles.decorCircleOne,
                {
                  backgroundColor:
                    slide.accent,
                },
              ]}
            />

            <View
              style={[
                styles.decorCircleTwo,
                {
                  borderColor:
                    slide.accent,
                },
              ]}
            />

            {/* Global symbol */}

            <View style={styles.globalBadge}>
              <Text style={styles.globalEmoji}>
                🌍
              </Text>

              <Text style={styles.globalText}>
                GLOBAL CARE
              </Text>
            </View>

            {/* Animal illustration */}

            <View style={styles.animalStage}>
              {slide.animals.map(
                (animal, index) => (
                  <View
                    key={`${animal}-${index}`}
                    style={[
                      styles.animalBubble,
                      getAnimalPosition(
                        index,
                        slide.animals.length
                      ),
                    ]}
                  >
                    <Text
                      style={[
                        styles.animalEmoji,
                        getAnimalSize(index),
                      ]}
                    >
                      {animal}
                    </Text>
                  </View>
                )
              )}
            </View>

            {/* Bottom badge */}

            <View
              style={[
                styles.heroBadge,
                {
                  borderColor:
                    slide.accent,
                },
              ]}
            >
              <View
                style={[
                  styles.badgeDot,
                  {
                    backgroundColor:
                      slide.accent,
                  },
                ]}
              />

              <Text style={styles.heroBadgeText}>
                {slide.badge}
              </Text>
            </View>

          </View>

          {/* =====================================
              PAGE INDICATOR
          ====================================== */}

          <View style={styles.pageRow}>
            <Text style={styles.pageNumber}>
              0{slideIndex + 1}
            </Text>

            <View style={styles.pageLine}>
              {slides.map(
                (_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.pageDot,
                      index === slideIndex && {
                        backgroundColor:
                          slide.accent,
                        width: 30,
                      },
                    ]}
                  />
                )
              )}
            </View>

            <Text style={styles.totalPages}>
              0{slides.length}
            </Text>
          </View>

          {/* =====================================
              CONTENT
          ====================================== */}

          <View style={styles.content}>

            <Text
              style={[
                styles.eyebrow,
                {
                  color: slide.accent,
                },
              ]}
            >
              {slide.eyebrow}
            </Text>

            <Text style={styles.title}>
              {slide.title}
            </Text>

            <Text style={styles.description}>
              {slide.description}
            </Text>

          </View>



          {/* =====================================
              BUTTONS
          ====================================== */}

          <View style={styles.actions}>

            <Pressable
              onPress={handleNext}
              style={[
                styles.primaryButton,
                {
                  backgroundColor:
                    COLORS.forest,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={
                isLastSlide
                  ? 'Get started'
                  : 'Continue'
              }
            >
              <Text style={styles.primaryButtonText}>
                {isLastSlide
                  ? 'Get Started'
                  : 'Continue'}
              </Text>

              <View style={styles.arrowCircle}>
                <Text style={styles.arrow}>
                  →
                </Text>
              </View>
            </Pressable>

            {slideIndex > 0 && (
              <Pressable
                onPress={handleBack}
                style={styles.backButton}
                accessibilityRole="button"
                accessibilityLabel="Go back"
              >
                <Text style={styles.backButtonText}>
                  ← Back
                </Text>
              </Pressable>
            )}

          </View>

          {/* =====================================
              FOOTER
          ====================================== */}

          <View style={styles.footer}>
            <Text style={styles.footerPaw}>
              🐾
            </Text>

            <Text style={styles.footerText}>
              Every life. Better care.
            </Text>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}


/* ==========================================
   ANIMAL POSITIONS
========================================== */

function getAnimalPosition(
  index: number,
  total: number
) {
  const positions = [
    {
      top: 20,
      left: 40,
    },
    {
      top: 35,
      right: 32,
    },
    {
      top: 103,
      left: 18,
    },
    {
      top: 125,
      right: 18,
    },
    {
      top: 85,
      left: 80,
    },
    {
      top: 170,
      left: 69,
    },
  ];

  return positions[
    index % positions.length
  ];
}

function getAnimalSize(index: number) {
  const sizes = [
    54,
    48,
    46,
    45,
    42,
    40,
  ];

  return {
    fontSize:
      sizes[index % sizes.length],
  };
}

/* ==========================================
   STYLES
========================================== */

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  scrollContent: {
    flexGrow: 1,
  },

  container: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 20,
  },

  /* ========================================
     HEADER
  ======================================== */

  header: {
    height: 58,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',

    marginBottom: 14,
  },

  logo: {
    width: 82,
    height: 50,
  },

  skipText: {
    color: COLORS.muted,

    fontSize: 15,

    fontWeight: '700',

    paddingVertical: 10,

    paddingHorizontal: 8,
  },

  /* ========================================
     HERO CARD
  ======================================== */

  heroCard: {
    height: 330,

    borderRadius: 34,

    overflow: 'hidden',

    position: 'relative',

    justifyContent: 'center',

    alignItems: 'center',
  },

  decorCircleOne: {
    position: 'absolute',

    width: 210,
    height: 210,

    borderRadius: 105,

    opacity: 0.08,

    top: -90,
    right: -70,
  },

  decorCircleTwo: {
    position: 'absolute',

    width: 170,
    height: 170,

    borderRadius: 85,

    borderWidth: 2,

    opacity: 0.10,

    bottom: -70,
    left: -60,
  },

  /* ========================================
     GLOBAL BADGE
  ======================================== */

  globalBadge: {
    position: 'absolute',

    top: 18,

    left: 18,

    flexDirection: 'row',

    alignItems: 'center',

    backgroundColor:
      'rgba(255,255,255,0.82)',

    paddingHorizontal: 11,

    paddingVertical: 7,

    borderRadius: 20,
  },

  globalEmoji: {
    fontSize: 15,

    marginRight: 5,
  },

  globalText: {
    color: COLORS.forest,

    fontSize: 8,

    fontWeight: '900',

    letterSpacing: 1.2,
  },

  /* ========================================
     ANIMAL STAGE
  ======================================== */

  animalStage: {
    width: 240,
    height: 225,

    position: 'relative',

    alignItems: 'center',

    justifyContent: 'center',
  },

  animalBubble: {
    position: 'absolute',

    width: 82,
    height: 82,

    borderRadius: 41,

    backgroundColor:
      'rgba(255,255,255,0.88)',

    alignItems: 'center',

    justifyContent: 'center',

    shadowColor: '#000',

    shadowOpacity: 0.06,

    shadowRadius: 10,

    elevation: 3,
  },

  animalEmoji: {
    textAlign: 'center',
  },

  /* ========================================
     HERO BADGE
  ======================================== */

  heroBadge: {
    position: 'absolute',

    bottom: 10,

    flexDirection: 'row',

    alignItems: 'center',

    backgroundColor:
      'rgba(255,255,255,0.9)',

    paddingHorizontal: 14,

    paddingVertical: 8,

    borderRadius: 20,

    borderWidth: 1,
  },

  badgeDot: {
    width: 7,
    height: 7,

    borderRadius: 4,

    marginRight: 7,
  },

  heroBadgeText: {
    color: COLORS.forest,

    fontSize: 9,

    fontWeight: '900',

    letterSpacing: 1.1,
  },

  /* ========================================
     PAGE INDICATOR
  ======================================== */

  pageRow: {
    flexDirection: 'row',

    alignItems: 'center',

    marginTop: 19,

    marginBottom: 22,
  },

  pageNumber: {
    color: COLORS.forest,

    fontSize: 11,

    fontWeight: '900',
  },

  totalPages: {
    color: COLORS.muted,

    fontSize: 11,

    fontWeight: '700',
  },

  pageLine: {
    flex: 1,

    flexDirection: 'row',

    alignItems: 'center',

    gap: 5,

    marginHorizontal: 10,
  },

  pageDot: {
    height: 5,

    width: 8,

    borderRadius: 3,

    backgroundColor: COLORS.border,
  },

  /* ========================================
     CONTENT
  ======================================== */

  content: {
    marginBottom: 10,
  },

  eyebrow: {
    fontSize: 10,

    fontWeight: '900',

    letterSpacing: 1.4,

    marginBottom: 10,
  },

  title: {
    color: COLORS.forest,

    fontSize: 34,

    lineHeight: 40,

    fontWeight: '900',

    letterSpacing: -1.2,
  },

  description: {
    color: COLORS.muted,

    fontSize: 15,

    lineHeight: 23,

    marginTop: 13,

    maxWidth: 520,
  },

  
  /* ========================================
     BUTTONS
  ======================================== */

  actions: {
    gap: 10,
  },

  primaryButton: {
    minHeight: 58,

    borderRadius: 19,

    paddingLeft: 22,

    paddingRight: 8,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',

    shadowColor: COLORS.forest,

    shadowOpacity: 0.12,

    shadowRadius: 12,

    elevation: 4,
  },

  primaryButtonText: {
    color: COLORS.white,

    fontSize: 15,

    fontWeight: '800',

    letterSpacing: 0.2,
  },

  arrowCircle: {
    width: 43,
  height: 43,
  borderRadius: 22,
  backgroundColor: 'rgba(255,255,255,0.16)',

  alignItems: 'center',
  justifyContent: 'center',

  marginLeft: 12,
  },

  arrow: {
    color: COLORS.white,
    fontSize: 35,
    fontWeight: '500',
    textAlign: 'center',
  lineHeight: 22,
  includeFontPadding: false,
  marginTop: -11,
  },

  backButton: {
    alignItems: 'center',

    paddingVertical: 5,
  },

  backButtonText: {
    color: COLORS.muted,

    fontSize: 13,

    fontWeight: '700',
  },

  /* ========================================
     FOOTER
  ======================================== */

  footer: {
    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',

    marginTop: 13,
  },

  footerPaw: {
    fontSize: 12,

    marginRight: 5,
  },

  footerText: {
    color: COLORS.muted,

    fontSize: 10,

    fontWeight: '700',

    letterSpacing: 0.8,
  },
});