import { useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import AppButton from '../../components/AppButton';
import AppInput from '../../components/AppInput';
import { demoPets } from '../../constants/demoPets';
import { colors } from '../../constants/theme';
import type { RootStackParamList } from '../../types/navigation';
import type { PetSex, PetSpecies } from '../../types/pet';

type Props = NativeStackScreenProps<RootStackParamList, 'EditPet'>;

const speciesOptions: PetSpecies[] = [
  'dog',
  'cat',
  'bird',
  'rabbit',
  'other',
];

const sexOptions: PetSex[] = ['male', 'female', 'unknown'];

export default function EditPetScreen({ route, navigation }: Props) {
  const pet = demoPets.find((item) => item.id === route.params.petId);

  const [name, setName] = useState(pet?.name ?? '');
  const [species, setSpecies] = useState<PetSpecies>(pet?.species ?? 'dog');
  const [sex, setSex] = useState<PetSex>(pet?.sex ?? 'unknown');
  const [breed, setBreed] = useState(pet?.breed ?? '');
  const [weight, setWeight] = useState(
    pet?.weightKg !== undefined ? String(pet.weightKg) : '',
  );
  const [notes, setNotes] = useState(pet?.notes ?? '');
  const [submitted, setSubmitted] = useState(false);

  const nameError = name.trim() ? '' : 'Enter your pet’s name.';
  const trimmedWeight = weight.trim();
  const numericWeight = Number(trimmedWeight);

  const weightError =
    trimmedWeight &&
    (!/^\d+(\.\d+)?$/.test(trimmedWeight) ||
      !Number.isFinite(numericWeight) ||
      numericWeight <= 0)
      ? 'Enter a positive weight, such as 4.2.'
      : '';

  function handlePreview() {
    setSubmitted(true);

    if (nameError || weightError) {
      return;
    }

    Keyboard.dismiss();

    Alert.alert(
      'Edit preview',
      `${name.trim()}’s details passed validation. The original demo profile has not been changed.`,
      [
        { text: 'Keep editing', style: 'cancel' },
        {
          text: 'Back to profile',
          onPress: () => navigation.goBack(),
        },
      ],
    );
  }

  if (!pet) {
    return (
      <SafeAreaView
        style={styles.screen}
        edges={['left', 'right', 'bottom']}
      >
        <View style={styles.fallback}>
          <Text style={styles.title}>Pet not found</Text>
          <AppButton
            title="Go back"
            onPress={() => navigation.goBack()}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.screen}
      edges={['left', 'right', 'bottom']}
    >
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
            <Text style={styles.eyebrow}>THE LITTLE DETAILS MATTER</Text>
            <Text accessibilityRole="header" style={styles.title}>
              About {pet.name}
            </Text>
            <Text style={styles.description}>
              Keep their profile as unique as they are.
            </Text>

            <View style={styles.form}>
              <AppInput
                label="Pet name"
                placeholder="Your pet’s name"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                maxLength={60}
                error={submitted ? nameError : undefined}
              />

              <View style={styles.field}>
                <Text style={styles.label}>Pet type</Text>
                <View style={styles.options}>
                  {speciesOptions.map((option) => {
                    const selected = species === option;

                    return (
                      <Pressable
                        key={option}
                        accessibilityRole="radio"
                        accessibilityLabel={option}
                        accessibilityState={{ checked: selected }}
                        onPress={() => setSpecies(option)}
                        style={[
                          styles.option,
                          selected && styles.selectedOption,
                        ]}
                      >
                        <Text
                          style={[
                            styles.optionText,
                            selected && styles.selectedOptionText,
                          ]}
                        >
                          {option}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Sex</Text>
                <View style={styles.options}>
                  {sexOptions.map((option) => {
                    const selected = sex === option;

                    return (
                      <Pressable
                        key={option}
                        accessibilityRole="radio"
                        accessibilityLabel={option}
                        accessibilityState={{ checked: selected }}
                        onPress={() => setSex(option)}
                        style={[
                          styles.option,
                          selected && styles.selectedOption,
                        ]}
                      >
                        <Text
                          style={[
                            styles.optionText,
                            selected && styles.selectedOptionText,
                          ]}
                        >
                          {option}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <AppInput
                label="Breed (optional)"
                placeholder="Your pet’s breed"
                value={breed}
                onChangeText={setBreed}
                autoCapitalize="words"
                maxLength={80}
              />

              <AppInput
                label="Weight in kg (optional)"
                placeholder="For example, 4.2"
                value={weight}
                onChangeText={setWeight}
                keyboardType="decimal-pad"
                maxLength={10}
                error={submitted ? weightError : undefined}
              />

              <AppInput
                label="Notes (optional)"
                placeholder="Anything to remember"
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                maxLength={500}
                hint={`${notes.length}/500 characters`}
              />

              <View style={styles.previewNote}>
                <Text style={styles.previewText}>
                  Preview only. Saving, photo selection, and date-of-birth
                  editing will be connected in the pet-management step.
                </Text>
              </View>

              <AppButton
                title="Preview changes"
                onPress={handlePreview}
              />

              <AppButton
                title="Cancel"
                variant="secondary"
                onPress={() => navigation.goBack()}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: 24, paddingBottom: 32 },
  content: { width: '100%', maxWidth: 560, alignSelf: 'center' },
  fallback: { padding: 24, gap: 24 },
  eyebrow: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
    marginBottom: 12,
  },
  title: {
    color: colors.forest,
    fontSize: 32,
    lineHeight: 39,
    fontWeight: '800',
    letterSpacing: -1,
  },
  description: {
    color: colors.mutedText,
    fontSize: 15,
    lineHeight: 24,
    marginTop: 12,
    marginBottom: 28,
  },
  form: { gap: 24 },
  field: { gap: 10 },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  option: {
    minHeight: 46,
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  selectedOption: {
    backgroundColor: colors.forest,
    borderColor: colors.forest,
  },
  optionText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  selectedOptionText: { color: colors.onForest },
  previewNote: {
    backgroundColor: colors.paleSage,
    padding: 16,
    borderRadius: 16,
  },
  previewText: {
    color: colors.text,
    fontSize: 12,
    lineHeight: 20,
  },
});