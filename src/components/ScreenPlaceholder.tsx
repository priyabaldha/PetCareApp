import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from '../constants/theme';

interface ScreenPlaceholderProps {
  title: string;
  description: string;
  children?: ReactNode;
  includeTopInset?: boolean;
}

export default function ScreenPlaceholder({
  title,
  description,
  children,
  includeTopInset = true,
}: ScreenPlaceholderProps) {
  return (
    <SafeAreaView
      style={styles.screen}
      edges={includeTopInset ? ['top', 'left', 'right'] : ['left', 'right']}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.brand}>petcare.</Text>

          <Text accessibilityRole="header" style={styles.title}>
            {title}
          </Text>

          <Text style={styles.description}>{description}</Text>

          {children}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  content: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  brand: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: spacing.xxl,
  },
  title: {
    color: colors.forest,
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -0.8,
    marginBottom: spacing.md,
  },
  description: {
    color: colors.mutedText,
    fontSize: 16,
    lineHeight: 25,
    marginBottom: spacing.xxl,
  },
});