import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
} from 'react-native';

import { colors } from '../constants/theme';

interface AppButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  loading?: boolean;
  accessibilityLabel?: string;
}

export default function AppButton({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  accessibilityLabel,
}: AppButtonProps) {
  const isUnavailable = disabled || loading;
  const isPrimary = variant === 'primary';

  const foregroundColor = isPrimary
    ? colors.onForest
    : colors.forest;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{
        disabled: isUnavailable,
        busy: loading,
      }}
      disabled={isUnavailable}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        isPrimary ? styles.primary : styles.secondary,
        isUnavailable && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      {loading && (
        <ActivityIndicator
          size="small"
          color={foregroundColor}
        />
      )}

      <Text
        style={[
          styles.title,
          { color: foregroundColor },
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    minHeight: 54,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
  },
  primary: {
    backgroundColor: colors.forest,
    borderColor: colors.forest,
  },
  secondary: {
    backgroundColor: colors.paleSage,
    borderColor: colors.border,
  },
  title: {
    flexShrink: 1,
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});