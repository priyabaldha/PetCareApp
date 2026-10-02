import { useRef, useState } from 'react';
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

import { createPet } from '../../services/pets';
import AppButton from '../../components/AppButton';
import AppInput from '../../components/AppInput';
import { colors } from '../../constants/theme';
import type { RootStackParamList } from '../../types/navigation';
import type { PetSex, PetSpecies } from '../../types/pet';

type Props = NativeStackScreenProps<RootStackParamList, 'AddPet'>;

const speciesOptions: PetSpecies[] = [
  'dog',
  'cat',
  'bird',
  'rabbit',
  'other',
];

const sexOptions: PetSex[] = ['male', 'female', 'unknown'];

export default function AddPetScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [species, setSpecies] = useState<PetSpecies>('dog');
  const [sex, setSex] = useState<PetSex>('unknown');
  const [breed, setBreed] = useState('');
  const [weight, setWeight] = useState('');
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [saving, setSaving] = useState(false);
  const busy = useRef(false);
  const [saved, setSaved] = useState(false);


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

  async function handleSave(): Promise<void> {
    if (busy.current || saved) return;
    setSubmitted(true);
    if (nameError || weightError) return;
    Keyboard.dismiss();
    busy.current = true;
    setSaving(true);
    try {
      const input = {
        name: name.trim(), species, sex, breed: breed.trim(), notes: notes.trim(),
        weightKg: trimmedWeight ? numericWeight : null,
        dateOfBirth: dateOfBirth.trim() || null,
      };
      await createPet(input);
      setSaved(true);
      Alert.alert('Pet saved', 'Your pet’s details have been saved.', [
        { text: 'Done', onPress: () => navigation.goBack() },
      ]);
    } catch (failure) {
      Alert.alert('Could not save pet', failure instanceof Error ? failure.message : 'Please try again.');
    } finally {
      busy.current = false;
      setSaving(false);
    }
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
            <Text style={styles.eyebrow}>MAKE ROOM FOR ONE MORE</Text>
            <Text accessibilityRole="header" style={styles.title}>
              Meet your{'\n'}little companion.
            </Text>
            <Text style={styles.description}>
              Start with the details that make them, them.
            </Text>

            <View style={styles.form}>
              <AppInput
                label="Pet name"
                placeholder="For example, Buddy"
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
                        accessibilityState={{ checked: selected }}
                        accessibilityLabel={option}
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
                        accessibilityState={{ checked: selected }}
                        accessibilityLabel={option}
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
                placeholder="For example, Golden Retriever"
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
                label="Date of birth (optional)"
                placeholder="YYYY-MM-DD"
                value={dateOfBirth}
                onChangeText={setDateOfBirth}
                autoCapitalize="none"
                maxLength={10}
              />

              <AppInput
                label="Notes (optional)"
                placeholder="Their favourite things or anything to remember"
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
                  Your pet’s details will be saved to your account.
                  Photo upload will be added separately.
                </Text>
              </View>

              <AppButton
                title={saved ? "Saved" : "Save pet"}
                onPress={handleSave}
                loading={saving}
                disabled={saving || saved}
              />

              <AppButton
                title={saved ? "Done" : "Cancel"}
                disabled={saving}
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
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
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
  previewText: { color: colors.text, fontSize: 12, lineHeight: 20 },
});