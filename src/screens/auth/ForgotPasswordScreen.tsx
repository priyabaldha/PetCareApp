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

type Props = NativeStackScreenProps<
  AuthStackParamList,
  'ForgotPassword'
>;

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

export default function ForgotPasswordScreen({
  navigation,
}: Props) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const emailError =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
      ? ''
      : 'Enter a valid email address.';

  function handleReset() {
    setSubmitted(true);

    if (emailError) {
      return;
    }

    Keyboard.dismiss();

    Alert.alert(
      'Reset preview complete',
      'The email format is valid. No reset email was sent; this feature will be connected to the backend later.',
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

            <View style={styles.heroIcon}>
              <Image
              source={require('../../../assets/jeeva.png')}
              style={styles.logo}
              resizeMode="contain"
              accessibilityLabel="JEEVA logo"
            />
            </View>

            <Text style={styles.heroEyebrow}>
              ACCOUNT RECOVERY
            </Text>

            <Text style={styles.heroTitle}>
              Let's get you back in.
            </Text>

            <Text style={styles.heroSubtitle}>
              Don't worry. We'll help you get back to your pet's world.
            </Text>
          </View>

          {/* =========================================
              FORM CARD
          ========================================== */}

          <View style={styles.formCard}>

            {/* HEADER */}

            <View style={styles.formHeader}>
              <View style={styles.headerText}>
                <Text style={styles.formTitle}>
                  Reset your password
                </Text>

                <Text style={styles.formSubtitle}>
                  Enter your registered email address.
                </Text>
              </View>

              <View style={styles.mailBadge}>
                <Ionicons
                  name="mail-outline"
                  size={19}
                  color={COLORS.primary}
                />
              </View>
            </View>

            {/* =========================================
                EMAIL FIELD
            ========================================== */}

            <View style={styles.inputWrapper}>
              <AppInput
                label="Email address"
                placeholder="you@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleReset}
                error={
                  submitted
                    ? emailError
                    : undefined
                }
              />
            </View>

            {/* =========================================
                RESET BUTTON
            ========================================== */}

            <Pressable
              style={({ pressed }) => [
                styles.resetButton,
                pressed && styles.pressed,
              ]}
              onPress={handleReset}
              accessibilityRole="button"
            >
              <Text style={styles.resetButtonText}>
                Send reset link
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
                BACK TO LOGIN
            ========================================== */}

            <Pressable
              style={({ pressed }) => [
                styles.backButton,
                pressed && styles.pressed,
              ]}
              onPress={() => {
                Keyboard.dismiss();
                navigation.goBack();
              }}
              accessibilityRole="button"
            >
              <Ionicons
                name="arrow-back"
                size={17}
                color={COLORS.forest}
              />

              <Text style={styles.backButtonText}>
                Back to login
              </Text>
            </Pressable>

          </View>

          {/* =========================================
              HELP MESSAGE
          ========================================== */}

          <View style={styles.helpCard}>
            <View style={styles.helpIcon}>
              <Ionicons
                name="information-circle-outline"
                size={18}
                color={COLORS.primary}
              />
            </View>

            <View style={styles.helpContent}>
              <Text style={styles.helpTitle}>
                Check your inbox
              </Text>

              <Text style={styles.helpText}>
                If an account exists with this email, you'll
                receive instructions to reset your password.
              </Text>
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

  logo: {
    width: 75,
    height: 75,
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

  heroIcon: {
    width: 80,
    height: 80,

    borderRadius: 17,

    backgroundColor: COLORS.white,

    alignItems: 'center',
    justifyContent: 'center',

    marginBottom: 5,

    shadowColor: COLORS.forest,
    shadowOpacity: 0.07,
    shadowRadius: 9,

    elevation: 3,
  },

  heroEyebrow: {
    color: COLORS.primaryDark,

    fontSize: 10,

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

    marginTop: 3,
  },

  /* =========================================
     FORM CARD
  ========================================== */

  formCard: {
    backgroundColor: COLORS.white,

    borderRadius: 25,

    paddingHorizontal: 18,
    paddingVertical: 18,

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

  mailBadge: {
    width: 38,
    height: 38,

    borderRadius: 13,

    backgroundColor: COLORS.softGreen,

    alignItems: 'center',
    justifyContent: 'center',
  },

  /* =========================================
     INPUT
  ========================================== */

  inputWrapper: {
    marginBottom: 13,
  },

  /* =========================================
     RESET BUTTON
  ========================================== */

  resetButton: {
    height: 52,

    borderRadius: 16,

    backgroundColor: COLORS.forest,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',

    paddingLeft: 18,
    paddingRight: 6,
  },

  resetButtonText: {
    color: COLORS.white,

    fontSize: 14,

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

  /* =========================================
     BACK BUTTON
  ========================================== */

  backButton: {
    height: 48,

    borderRadius: 15,

    backgroundColor: COLORS.white,

    borderWidth: 1,

    borderColor: COLORS.border,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',

    marginTop: 10,
  },

  backButtonText: {
    color: COLORS.forest,

    fontSize: 13,

    fontWeight: '800',

    marginLeft: 7,
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
     HELP CARD
  ========================================== */

  helpCard: {
    flexDirection: 'row',

    backgroundColor: COLORS.softGreen,

    borderRadius: 18,

    padding: 13,

    marginTop: 13,

    borderWidth: 1,

    borderColor: '#DDF0E5',
  },

  helpIcon: {
    width: 34,
    height: 34,

    borderRadius: 11,

    backgroundColor: COLORS.white,

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 10,
  },

  helpContent: {
    flex: 1,
  },

  helpTitle: {
    color: COLORS.forest,

    fontSize: 11,

    fontWeight: '900',

    marginBottom: 2,
  },

  helpText: {
    color: COLORS.muted,

    fontSize: 9.5,

    lineHeight: 14,
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