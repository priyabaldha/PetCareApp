import { useState } from 'react';
import {
  Alert,
  Image,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import AppInput from '../../components/AppInput';
import type { AuthStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<AuthStackParamList, 'Signup'>;

const COLORS = {
  background: '#F7FBF9',
  white: '#FFFFFF',

  forest: '#123C35',
  primary: '#45B978',
  primaryDark: '#319C63',

  text: '#173C35',
  muted: '#758681',

  border: '#E2ECE8',
  softGreen: '#EAF8F0',
};

export default function SignupScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [submitted, setSubmitted] = useState(false);

  const errors = {
    name: name.trim() ? '' : 'Enter your name.',

    email:
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
        ? ''
        : 'Enter a valid email address.',

    password:
      password.length >= 8
        ? ''
        : 'Use at least 8 characters.',

    confirmPassword: !confirmPassword
      ? 'Confirm your password.'
      : confirmPassword !== password
        ? 'Passwords do not match.'
        : '',
  };

  function handleSignup() {
    setSubmitted(true);

    if (Object.values(errors).some(Boolean)) {
      return;
    }

    Keyboard.dismiss();

    Alert.alert(
      'Signup preview complete',
      'Your details passed validation. No account has been created yet.',
      [
        {
          text: 'Back to login',
          onPress: () => navigation.popToTop(),
        },
      ],
    );
  }

  function handleGoogleSignup() {
    Keyboard.dismiss();

    Alert.alert(
      'Google signup',
      'Google authentication will be connected during backend setup.',
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.container}>

          {/* =========================================
              JEEVA LOGO
          ========================================== */}

          <View style={styles.logoWrapper}>
        
        
          </View>

          {/* =========================================
              HERO SECTION
          ========================================== */}

          <View style={styles.heroCard}>
            <View style={styles.circleOne} />
            <View style={styles.circleTwo} />

            <View style={styles.heroLogoContainer}>
              <Image
                source={require('../../../assets/jeeva.png')}
                style={styles.heroLogo}
                resizeMode="contain"
                accessibilityLabel="JEEVA logo"
              />
            </View>

            <Text style={styles.heroEyebrow}>
              WELCOME TO JEEVA
            </Text>

            <Text style={styles.heroTitle}>
              More love starts here.
            </Text>

            <Text style={styles.heroSubtitle}>
              A beautiful space for you and every pet you call family.
            </Text>
          </View>

          {/* =========================================
              FORM CARD
          ========================================== */}

          <View style={styles.formCard}>

            {/* FORM HEADER */}

            <View style={styles.formHeader}>
              <View style={styles.headerText}>
                <Text style={styles.formTitle}>
                  Create account
                </Text>

                <Text style={styles.formSubtitle}>
                  Start your JEEVA journey.
                </Text>
              </View>

              <View style={styles.pawBadge}>
                <Ionicons
                  name="paw"
                  size={18}
                  color={COLORS.primary}
                />
              </View>
            </View>

            {/* =========================================
                FULL NAME
            ========================================== */}

            <View style={styles.inputSpacing}>
              <AppInput
                label="Full name"
                placeholder="Your name"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoCorrect={false}
                error={
                  submitted
                    ? errors.name
                    : undefined
                }
              />
            </View>

            {/* =========================================
                EMAIL
            ========================================== */}

            <View style={styles.inputSpacing}>
              <AppInput
                label="Email address"
                placeholder="you@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                error={
                  submitted
                    ? errors.email
                    : undefined
                }
              />
            </View>

            {/* =========================================
                PASSWORD
            ========================================== */}

            <View
              style={[
                styles.passwordWrapper,
                styles.inputSpacing,
              ]}
            >
              <AppInput
                label="Password"
                placeholder="At least 8 characters"
                value={password}
                onChangeText={setPassword}
                isPassword={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                error={
                  submitted
                    ? errors.password
                    : undefined
                }
              />
            </View>

            {/* =========================================
                CONFIRM PASSWORD
            ========================================== */}

            <View
              style={[
                styles.passwordWrapper,
                styles.confirmPasswordSpacing,
              ]}
            >
              <AppInput
                label="Confirm password"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                isPassword={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleSignup}
                error={
                  submitted
                    ? errors.confirmPassword
                    : undefined
                }
              />
            </View>

            {/* =========================================
                CREATE ACCOUNT BUTTON
            ========================================== */}

            <Pressable
              style={({ pressed }) => [
                styles.createButton,
                pressed && styles.pressed,
              ]}
              onPress={handleSignup}
              accessibilityRole="button"
            >
              <Text style={styles.createButtonText}>
                Create account
              </Text>

              <View style={styles.arrowCircle}>
                <Ionicons
                  name="arrow-forward"
                  size={18}
                  color={COLORS.forest}
                />
              </View>
            </Pressable>

            {/* =========================================
                DIVIDER
            ========================================== */}

            <View style={styles.dividerRow}>
              <View style={styles.divider} />

              <Text style={styles.orText}>
                OR
              </Text>

              <View style={styles.divider} />
            </View>

            {/* =========================================
                GOOGLE BUTTON
            ========================================== */}

            <Pressable
              style={({ pressed }) => [
                styles.googleButton,
                pressed && styles.pressed,
              ]}
              onPress={handleGoogleSignup}
              accessibilityRole="button"
            >
              <View style={styles.googleIconBox}>
                <Image
                                source={require('../../../assets/images/google-logo.png')}
                                style={styles.googleG}
                                resizeMode="contain"
                              />      
              </View>

              <Text style={styles.googleText}>
                Continue with Google
              </Text>
            </Pressable>

            {/* =========================================
                LOGIN LINK
            ========================================== */}

            <View style={styles.loginRow}>
              <Text style={styles.loginText}>
                Already have an account?
              </Text>

              <Pressable
                onPress={() => {
                  Keyboard.dismiss();
                  navigation.goBack();
                }}
              >
                <Text style={styles.loginLink}>
                  Sign in
                </Text>
              </Pressable>
            </View>
          </View>

          {/* =========================================
              SECURITY
          ========================================== */}

          <View style={styles.securityRow}>
            <Ionicons
              name="shield-checkmark-outline"
              size={16}
              color={COLORS.primary}
            />

            <Text style={styles.securityText}>
              Your information stays private and secure.
            </Text>
          </View>

          <Text style={styles.footer}>
            Every life. Better care.
          </Text>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  scrollContent: {
    flexGrow: 1,
    paddingBottom: 25,
  },

  container: {
    width: '100%',
    maxWidth: 430,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingTop: 3,
  },

  /* =========================================
     LOGO
  ========================================== */

  logoWrapper: {
    height: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },

  /* =========================================
     HERO
  ========================================== */

  heroCard: {
    height: 160,
    borderRadius: 25,
    backgroundColor: COLORS.softGreen,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    paddingHorizontal: 18,
    marginBottom: 12,
  },

  circleOne: {
    position: 'absolute',
    width: 145,
    height: 145,
    borderRadius: 75,
    backgroundColor: '#C9E8D7',
    opacity: 0.4,
    top: -95,
    right: -40,
  },

  circleTwo: {
    position: 'absolute',
    width: 105,
    height: 105,
    borderRadius: 55,
    backgroundColor: '#91DDB5',
    opacity: 0.15,
    bottom: -65,
    left: -35,
  },

  heroLogoContainer: {
    width: 80,
    height: 80,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,

    shadowColor: COLORS.forest,
    shadowOpacity: 0.07,
    shadowRadius: 9,

    elevation: 3,
  },

  heroLogo: {
    width: 75,
    height: 75,
  },

  heroEyebrow: {
    color: COLORS.primaryDark,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 2,
  },

  heroTitle: {
    color: COLORS.forest,
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
    textAlign: 'center',
  },

  heroSubtitle: {
    color: COLORS.muted,
    fontSize: 10.5,
    lineHeight: 14,
    textAlign: 'center',
    marginTop: 2,
  },

  /* =========================================
     FORM CARD
  ========================================== */

  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: 25,

    paddingHorizontal: 18,
    paddingVertical: 17,

    borderWidth: 1,
    borderColor: COLORS.border,

    shadowColor: COLORS.forest,
    shadowOpacity: 0.045,
    shadowRadius: 16,

    elevation: 2,
  },

  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    marginBottom: 12,
  },

  headerText: {
    flex: 1,
  },

  formTitle: {
    color: COLORS.forest,

    fontSize: 21,
    lineHeight: 25,

    fontWeight: '900',

    letterSpacing: -0.5,
  },

  formSubtitle: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 2,
  },

  pawBadge: {
    width: 38,
    height: 38,

    borderRadius: 13,

    backgroundColor: COLORS.softGreen,

    alignItems: 'center',
    justifyContent: 'center',
  },

  /* =========================================
     INPUT SPACING
  ========================================== */

  inputSpacing: {
    marginBottom: 10,
  },

  confirmPasswordSpacing: {
    marginBottom: 13,
  },

  /* =========================================
     PASSWORD EYE
  ========================================== */

  passwordWrapper: {
    position: 'relative',
  },

  eyeButton: {
    position: 'absolute',

    right: 12,
    top: 38,

    width: 36,
    height: 36,

    alignItems: 'center',
    justifyContent: 'center',

    zIndex: 20,
    elevation: 20,
  },

  /* =========================================
     CREATE BUTTON
  ========================================== */

  createButton: {
    height: 52,

    borderRadius: 16,

    backgroundColor: COLORS.forest,

    flexDirection: 'row',

    alignItems: 'center',
    justifyContent: 'space-between',

    paddingLeft: 18,
    paddingRight: 6,

    marginTop: 0,
  },

  createButtonText: {
    color: COLORS.white,

    fontSize: 15,

    fontWeight: '900',
  },

  arrowCircle: {
    width: 40,
    height: 40,

    borderRadius: 20,

    backgroundColor: COLORS.white,

    alignItems: 'center',
    justifyContent: 'center',
  },

  pressed: {
    opacity: 0.82,

    transform: [
      {
        scale: 0.99,
      },
    ],
  },

  /* =========================================
     DIVIDER
  ========================================== */

  dividerRow: {
    flexDirection: 'row',

    alignItems: 'center',

    marginVertical: 12,
  },

  divider: {
    flex: 1,

    height: 1,

    backgroundColor: COLORS.border,
  },

  orText: {
    color: COLORS.muted,

    fontSize: 8,

    fontWeight: '900',

    letterSpacing: 1,

    marginHorizontal: 9,
  },

  /* =========================================
     GOOGLE
  ========================================== */

  googleButton: {
    height: 50,

    borderRadius: 15,

    backgroundColor: COLORS.white,

    borderWidth: 1,
    borderColor: COLORS.border,

    flexDirection: 'row',

    alignItems: 'center',
    justifyContent: 'center',

    position: 'relative',
  },

  googleIconBox: {
    position: 'absolute',

    left: 15,

    width: 28,
    height: 28,

    alignItems: 'center',
    justifyContent: 'center',
  },

  googleG: {
    height:30,
  },

  googleText: {
    color: COLORS.text,

    fontSize: 14,

    fontWeight: '800',
  },

  /* =========================================
     LOGIN
  ========================================== */

  loginRow: {
    flexDirection: 'row',

    alignItems: 'center',
    justifyContent: 'center',

    marginTop: 14,
  },

  loginText: {
    color: COLORS.muted,

    fontSize: 14,
  },

  loginLink: {
    color: COLORS.primaryDark,

    fontSize: 14,

    fontWeight: '900',

    marginLeft: 4,
  },

  /* =========================================
     SECURITY
  ========================================== */

  securityRow: {
    flexDirection: 'row',

    alignItems: 'center',
    justifyContent: 'center',

    marginTop: 13,
  },

  securityText: {
    color: COLORS.muted,

    fontSize: 9.5,

    marginLeft: 5,
  },

  footer: {
    color: COLORS.muted,

    textAlign: 'center',

    fontSize: 9,

    fontWeight: '700',

    letterSpacing: 0.5,

    marginTop: 11,
  },
});