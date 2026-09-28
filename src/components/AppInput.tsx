import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';

import { colors } from '../constants/theme';

interface AppInputProps
  extends Omit<TextInputProps, 'style' | 'secureTextEntry'> {
  label: string;
  error?: string;
  hint?: string;
  isPassword?: boolean;
}

export default function AppInput({
  label,
  error,
  hint,
  isPassword = false,
  editable = true,
  onFocus,
  onBlur,
  accessibilityLabel,
  ...inputProps
}: AppInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <View
        style={[
          styles.inputContainer,
          isFocused && styles.focused,
          Boolean(error) && styles.invalid,
          !editable && styles.disabled,
        ]}
      >
        <TextInput
          {...inputProps}
          editable={editable}
          accessibilityLabel={accessibilityLabel ?? label}
          accessibilityHint={error || hint}
          placeholderTextColor={colors.mutedText}
          selectionColor={colors.primary}
          secureTextEntry={isPassword && !passwordVisible}
          style={styles.input}
          onFocus={(event) => {
            setIsFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setIsFocused(false);
            onBlur?.(event);
          }}
        />

        {isPassword && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              passwordVisible ? 'Hide password' : 'Show password'
            }
            disabled={!editable}
            onPress={() => {
              setPasswordVisible((previous) => !previous);
            }}
            style={styles.visibilityButton}
          >
            <Text style={styles.visibilityText}>
              {passwordVisible ? 'Hide' : 'Show'}
            </Text>
          </Pressable>
        )}
      </View>

      {error ? (
        <Text
          accessibilityLiveRegion="polite"
          style={styles.errorText}
        >
          {error}
        </Text>
      ) : hint ? (
        <Text style={styles.hintText}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: 8,
  },
  label: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.card,
  },
  focused: {
    borderColor: colors.primary,
  },
  invalid: {
    borderColor: '#A43D3D',
  },
  disabled: {
    opacity: 0.5,
  },
  input: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 16,
    paddingVertical: 15,
    color: colors.text,
    fontSize: 16,
  },
  visibilityButton: {
    minWidth: 60,
    minHeight: 48,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  visibilityText: {
    color: colors.forest,
    fontSize: 13,
    fontWeight: '700',
  },
  hintText: {
    color: colors.mutedText,
    fontSize: 12,
    lineHeight: 18,
  },
  errorText: {
    color: '#A43D3D',
    fontSize: 12,
    lineHeight: 18,
  },
});