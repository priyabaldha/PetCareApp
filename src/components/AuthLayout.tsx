import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '../constants/theme';

interface AuthLayoutProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  formTitle: string;
  notice: string;
  children: ReactNode;
}

export default function AuthLayout({
  eyebrow,
  title,
  subtitle,
  formTitle,
  notice,
  children,
}: AuthLayoutProps) {
  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <Text style={styles.brand}>petcare.</Text>

            <View style={styles.introduction}>
              <Text style={styles.eyebrow}>{eyebrow}</Text>
              <Text accessibilityRole="header" style={styles.title}>
                {title}
              </Text>
              <Text style={styles.subtitle}>{subtitle}</Text>
            </View>

            <View style={styles.formCard}>
              <Text style={styles.formTitle}>{formTitle}</Text>
              <View style={styles.form}>{children}</View>
            </View>

            <View style={styles.previewNote}>
              <Text style={styles.previewTitle}>Frontend preview</Text>
              <Text style={styles.previewText}>{notice}</Text>
            </View>

            <Text style={styles.footer}>
              Their happiest life starts with your care.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingBottom: 40,
  },
  content: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  brand: {
    color: colors.forest,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -1,
  },
  introduction: {
    marginTop: 36,
    marginBottom: 28,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 10,
    lineHeight: 17,
    letterSpacing: 1.5,
    fontWeight: '700',
    marginBottom: 12,
  },
  title: {
    color: colors.forest,
    fontSize: 44,
    lineHeight: 49,
    letterSpacing: -1.5,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.mutedText,
    fontSize: 16,
    lineHeight: 25,
    marginTop: 14,
  },
  formCard: {
    backgroundColor: colors.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
  },
  formTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 24,
  },
  form: { gap: 20 },
  previewNote: {
    backgroundColor: colors.paleSage,
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
  },
  previewTitle: {
    color: colors.forest,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 5,
  },
  previewText: {
    color: colors.text,
    fontSize: 12,
    lineHeight: 19,
  },
  footer: {
    color: colors.mutedText,
    fontSize: 12,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 28,
  },
});