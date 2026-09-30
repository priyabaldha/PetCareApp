import React, {
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  Animated,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

const COLORS = {
  background: '#071F2A',
  white: '#FFFFFF',
  softWhite: '#EFFFF7',
  mint: '#7DE2B0',
  green: '#4FCB83',
  blue: '#49C6F5',
  purple: '#9677F5',
  muted: '#B9DCD0',
};

const ANIMALS = [
  '🐶',
  '🐱',
  '🐰',
  '🐦',
  '🕊️',
  '🐠',
  '🐢',
  '🐴',
  '🐼',
];

const ACTIONS = [
  'ADOPT',
  'CARE',
  'HEAL',
  'RESCUE',
  'CONNECT',
];

type SplashScreenProps = {
  onComplete: () => void;
};

/* ==========================================
   LOADER COMPONENT
========================================== */

function Loader() {
  const dot1 = useRef(
    new Animated.Value(0.35)
  ).current;

  const dot2 = useRef(
    new Animated.Value(0.35)
  ).current;

  const dot3 = useRef(
    new Animated.Value(0.35)
  ).current;

  useEffect(() => {
    const animateDot = (
      dot: Animated.Value,
      delay: number
    ) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),

          Animated.timing(dot, {
            toValue: 1,
            duration: 450,
            useNativeDriver: true,
          }),

          Animated.timing(dot, {
            toValue: 0.35,
            duration: 450,
            useNativeDriver: true,
          }),

          Animated.delay(300),
        ])
      ).start();
    };

    animateDot(dot1, 0);
    animateDot(dot2, 180);
    animateDot(dot3, 360);

    return () => {
      dot1.stopAnimation();
      dot2.stopAnimation();
      dot3.stopAnimation();
    };
  }, []);

  return (
    <View style={styles.loader}>
      <Animated.View
        style={[
          styles.loaderDot,
          {
            opacity: dot1,
          },
        ]}
      />

      <Animated.View
        style={[
          styles.loaderDot,
          {
            opacity: dot2,
          },
        ]}
      />

      <Animated.View
        style={[
          styles.loaderDot,
          {
            opacity: dot3,
          },
        ]}
      />
    </View>
  );
}

/* ==========================================
   SPLASH SCREEN
========================================== */

export default function SplashScreen({
  onComplete,
}: SplashScreenProps) {
  const [animalIndex, setAnimalIndex] =
    useState(0);

  const animalOpacity = useRef(
    new Animated.Value(1)
  ).current;

  const animalScale = useRef(
    new Animated.Value(1)
  ).current;

  const contentOpacity = useRef(
    new Animated.Value(0)
  ).current;

  const contentTranslateY = useRef(
    new Animated.Value(15)
  ).current;

  const completedRef = useRef(false);

  /* ==========================================
     INITIAL ANIMATION

     Animal + actions + JEEVA + loader
     appear together.
  ========================================== */

  useEffect(() => {
    Animated.parallel([
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),

      Animated.spring(contentTranslateY, {
        toValue: 0,
        friction: 8,
        tension: 30,
        useNativeDriver: true,
      }),

      Animated.spring(animalScale, {
        toValue: 1,
        friction: 7,
        tension: 35,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  /* ==========================================
   ANIMAL SEQUENCE

   Faster animal switching:
   Each animal stays for ~0.9 seconds.
========================================== */

useEffect(() => {
  /*
   * Last animal reached.
   *
   * Keep final screen for 5 seconds
   * before continuing.
   */

  if (animalIndex >= ANIMALS.length - 1) {
    const timer = setTimeout(() => {
      if (!completedRef.current) {
        completedRef.current = true;

        onComplete();
      }
    }, 1700);

    return () => clearTimeout(timer);
  }

  /*
   * Faster timing:
   *
   * Previous: 1700ms
   * New:       900ms
   */

  const timer = setTimeout(() => {
    Animated.parallel([
      Animated.timing(animalOpacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),

      Animated.timing(animalScale, {
        toValue: 0.75,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(() => {
      /*
       * Change animal while invisible.
       */

      setAnimalIndex(
        previous => previous + 1
      );

      /*
       * Reset scale.
       */

      animalScale.setValue(0.75);

      /*
       * New animal appears quickly.
       */

      Animated.parallel([
        Animated.timing(animalOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),

        Animated.spring(animalScale, {
          toValue: 1,
          friction: 7,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, 900);

  return () => clearTimeout(timer);
}, [animalIndex]);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.container}>

        {/* ======================================
            BACKGROUND GLOWS
        ====================================== */}

        <View style={styles.blueGlow} />

        <View style={styles.purpleGlow} />

        <View style={styles.greenGlow} />

        {/* ======================================
            DECORATIVE STARS
        ====================================== */}

        <Text style={styles.starOne}>
          ✦
        </Text>

        <Text style={styles.starTwo}>
          ✧
        </Text>

        <Text style={styles.starThree}>
          ✦
        </Text>

        <Text style={styles.starFour}>
          ✧
        </Text>

        {/* ======================================
            MAIN CONTENT
        ====================================== */}

        <Animated.View
          style={[
            styles.mainContent,
            {
              opacity: contentOpacity,

              transform: [
                {
                  translateY:
                    contentTranslateY,
                },
              ],
            },
          ]}
        >

          {/* ====================================
              ANIMAL
          ==================================== */}

          <View style={styles.animalArea}>

            <View style={styles.animalGlow} />

            <Animated.View
              style={[
                styles.animalCircle,

                {
                  opacity: animalOpacity,

                  transform: [
                    {
                      scale: animalScale,
                    },
                  ],
                },
              ]}
            >
              <Text style={styles.animalEmoji}>
                {ANIMALS[animalIndex]}
              </Text>
            </Animated.View>

          </View>

          {/* ====================================
              ACTION TEXT
          ==================================== */}

          <View style={styles.actionsContainer}>
            {ACTIONS.map(
              (action, index) => (
                <React.Fragment
                  key={action}
                >
                  <Text
                    style={styles.actionText}
                  >
                    {action}
                  </Text>

                  {index <
                    ACTIONS.length - 1 && (
                    <Text
                      style={
                        styles.separator
                      }
                    >
                      •
                    </Text>
                  )}
                </React.Fragment>
              )
            )}
          </View>

          {/* ====================================
              JEEVA LOGO
          ==================================== */}

          <View style={styles.logoContainer}>

            <Text style={styles.logoText}>
              JEEVA
            </Text>

            {/* Green line removed */}

            <Text style={styles.tagline}>
              Every Life. Better Care.
            </Text>

            {/* ==================================
                LOADER
            ================================== */}

            <Loader />

          </View>

        </Animated.View>

        {/* ======================================
            BOTTOM TEXT
        ====================================== */}

        <View style={styles.bottomContainer}>
          <Text style={styles.bottomText}>
            FOR EVERY LIFE
          </Text>
        </View>

      </View>
    </SafeAreaView>
  );
}

/* ==========================================
   STYLES
========================================== */

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  container: {
    flex: 1,

    backgroundColor:
      COLORS.background,

    alignItems: 'center',

    justifyContent: 'center',

    overflow: 'hidden',
  },

  /* ========================================
     BACKGROUND GLOWS
  ======================================== */

  blueGlow: {
    position: 'absolute',

    width: 420,
    height: 420,

    borderRadius: 210,

    backgroundColor:
      COLORS.blue,

    opacity: 0.12,

    top: -190,
    left: -140,
  },

  purpleGlow: {
    position: 'absolute',

    width: 400,
    height: 400,

    borderRadius: 200,

    backgroundColor:
      COLORS.purple,

    opacity: 0.10,

    right: -220,

    top: '30%',
  },

  greenGlow: {
    position: 'absolute',

    width: 450,
    height: 450,

    borderRadius: 225,

    backgroundColor:
      COLORS.green,

    opacity: 0.09,

    bottom: -280,

    left: -170,
  },

  /* ========================================
     STARS
  ======================================== */

  starOne: {
    position: 'absolute',

    top: '13%',
    left: '13%',

    color: COLORS.white,

    fontSize: 20,

    opacity: 0.7,
  },

  starTwo: {
    position: 'absolute',

    top: '20%',
    right: '14%',

    color: COLORS.mint,

    fontSize: 15,

    opacity: 0.7,
  },

  starThree: {
    position: 'absolute',

    top: '58%',
    left: '8%',

    color: COLORS.white,

    fontSize: 14,

    opacity: 0.5,
  },

  starFour: {
    position: 'absolute',

    bottom: '18%',
    right: '10%',

    color: COLORS.mint,

    fontSize: 18,

    opacity: 0.5,
  },

  /* ========================================
     MAIN CONTENT
  ======================================== */

  mainContent: {
    alignItems: 'center',

    justifyContent: 'center',

    width: '100%',
  },

  /* ========================================
     ANIMAL
  ======================================== */

  animalArea: {
    width: 210,
    height: 210,

    alignItems: 'center',

    justifyContent: 'center',

    marginBottom: 25,
  },

  animalGlow: {
    position: 'absolute',

    width: 180,
    height: 180,

    borderRadius: 90,

    backgroundColor:
      'rgba(125,226,176,0.13)',
  },

  animalCircle: {
    width: 165,
    height: 165,

    borderRadius: 82.5,

    backgroundColor:
      'rgba(255,255,255,0.96)',

    justifyContent: 'center',

    alignItems: 'center',

    shadowColor:
      COLORS.green,

    shadowOpacity: 0.45,

    shadowRadius: 25,

    elevation: 12,
  },

  animalEmoji: {
    fontSize: 100,

    textAlign: 'center',
  },

  /* ========================================
     ACTION TEXT
  ======================================== */

  actionsContainer: {
    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',

    paddingHorizontal: 10,

    flexWrap: 'wrap',

    marginBottom: 35,
  },

  actionText: {
    color: COLORS.softWhite,

    fontSize: 13,

    fontWeight: '800',

    letterSpacing: 1,
  },

  separator: {
    color: COLORS.green,

    fontSize: 21,

    marginHorizontal: 6,
  },

  /* ========================================
     JEEVA
  ======================================== */

  logoContainer: {
    alignItems: 'center',
  },

  logoText: {
    color: COLORS.white,

    fontSize: 47,

    fontWeight: '900',

    letterSpacing: 5,
  },

  /* Green logo line removed */

  tagline: {
    color: COLORS.muted,

    fontSize: 13,

    fontWeight: '600',

    letterSpacing: 1.1,

    marginTop: 6,
  },

  /* ========================================
     LOADER
  ======================================== */

  loader: {
    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',

    marginTop: 26,

    gap: 10,
  },

  loaderDot: {
    width: 10,

    height: 10,

    borderRadius: 5,

    backgroundColor:
      COLORS.green,
  },

  /* ========================================
     BOTTOM
  ======================================== */

  bottomContainer: {
    position: 'absolute',

    bottom: 38,

    alignItems: 'center',
  },

  bottomText: {
    color: COLORS.muted,

    fontSize: 8,

    fontWeight: '700',

    letterSpacing: 3,
  },
});