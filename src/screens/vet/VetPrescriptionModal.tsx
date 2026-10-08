import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { createPrescription } from '../../services/vets';

interface Props {
  visible: boolean;
  petId: string;
  petName: string;
  consultationId?: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

const ROUTES = ['Oral', 'Topical', 'Injection', 'Ophthalmic (Eye)', 'Otic (Ear)', 'Other'];

export default function VetPrescriptionModal({
  visible,
  petId,
  petName,
  consultationId,
  onClose,
  onSuccess,
}: Props) {
  const todayStr = new Date().toISOString().slice(0, 10);

  const [medicineName, setMedicineName] = useState('');
  const [dosage, setDosage] = useState('');
  const [route, setRoute] = useState('Oral');
  const [frequency, setFrequency] = useState('');
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState('');
  const [instructions, setInstructions] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    setError('');

    if (!medicineName.trim()) {
      setError('Medicine name is required.');
      return;
    }
    if (!dosage.trim()) {
      setError('Prescribed dosage is required.');
      return;
    }
    if (!frequency.trim()) {
      setError('Frequency is required (e.g. Once daily with food).');
      return;
    }
    if (!startDate.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(startDate.trim())) {
      setError('Enter a valid start date (YYYY-MM-DD).');
      return;
    }
    if (endDate.trim() && !/^\d{4}-\d{2}-\d{2}$/.test(endDate.trim())) {
      setError('Enter a valid end date (YYYY-MM-DD) or leave blank.');
      return;
    }

    setSaving(true);
    try {
      await createPrescription({
        petId,
        consultationId: consultationId || null,
        medicineName: medicineName.trim(),
        dosage: dosage.trim(),
        route,
        frequency: frequency.trim(),
        startDate: startDate.trim(),
        endDate: endDate.trim() || null,
        instructions: instructions.trim(),
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save prescription.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalScreen} edges={['top', 'bottom']}>
        {/* HEADER */}
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.closeBtn} disabled={saving}>
            <Ionicons name="close" size={22} color="#304439" />
          </Pressable>
          <View style={styles.headerTitleBox}>
            <Text style={styles.headerTitle}>New Veterinary Prescription</Text>
            <Text style={styles.headerSubtitle}>Patient: {petName}</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {error ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={18} color="#BA5648" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.card}>
            <Text style={styles.label}>Medicine / Drug Name *</Text>
            <TextInput
              style={styles.input}
              value={medicineName}
              onChangeText={setMedicineName}
              placeholder="E.g. Amoxicillin, Meloxicam, NexGard..."
              placeholderTextColor="#958A81"
              maxLength={150}
              editable={!saving}
            />

            <Text style={styles.label}>Prescribed Dosage & Units *</Text>
            <TextInput
              style={styles.input}
              value={dosage}
              onChangeText={setDosage}
              placeholder="E.g. 250mg, 1 tablet, 2.5ml..."
              placeholderTextColor="#958A81"
              maxLength={100}
              editable={!saving}
            />

            <Text style={styles.label}>Administration Route</Text>
            <View style={styles.routePills}>
              {ROUTES.map((r) => (
                <Pressable
                  key={r}
                  onPress={() => setRoute(r)}
                  style={[styles.routePill, route === r && styles.routePillSelected]}
                >
                  <Text
                    style={[
                      styles.routePillText,
                      route === r && styles.routePillTextSelected,
                    ]}
                  >
                    {r}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>Frequency *</Text>
            <TextInput
              style={styles.input}
              value={frequency}
              onChangeText={setFrequency}
              placeholder="E.g. Once daily, Twice daily after meals..."
              placeholderTextColor="#958A81"
              maxLength={100}
              editable={!saving}
            />

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Start Date *</Text>
                <TextInput
                  style={styles.input}
                  value={startDate}
                  onChangeText={setStartDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#958A81"
                  maxLength={10}
                  editable={!saving}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>End Date (Optional)</Text>
                <TextInput
                  style={styles.input}
                  value={endDate}
                  onChangeText={setEndDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#958A81"
                  maxLength={10}
                  editable={!saving}
                />
              </View>
            </View>

            <Text style={styles.label}>Additional Instructions & Warnings</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={instructions}
              onChangeText={setInstructions}
              placeholder="E.g. Complete full course, store in refrigerator, avoid giving with milk..."
              placeholderTextColor="#958A81"
              multiline
              maxLength={500}
              editable={!saving}
            />
          </View>

          <Pressable
            onPress={handleSave}
            disabled={saving}
            style={[styles.saveBtn, saving && styles.btnDisabled]}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Ionicons name="medical" size={18} color="#FFFFFF" />
                <Text style={styles.saveBtnText}>Save & Issue Prescription</Text>
              </>
            )}
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalScreen: { flex: 1, backgroundColor: '#F9F7F2' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ECE4F2',
    backgroundColor: '#F9F7F2',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ECE4F2',
  },
  headerTitleBox: { alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#304439' },
  headerSubtitle: { fontSize: 11, color: '#71579C', fontWeight: '700', marginTop: 2 },
  scrollContent: { padding: 18, paddingBottom: 40 },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FBECE7',
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
  },
  errorText: { color: '#BA5648', fontSize: 12, flex: 1, fontWeight: '600' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#ECE4F2',
    gap: 10,
    marginBottom: 16,
  },
  label: { fontSize: 11, fontWeight: '700', color: '#554564', marginTop: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#ECE4F2',
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    color: '#304439',
    backgroundColor: '#FAF8FC',
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 10 },
  routePills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 4 },
  routePill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#F3EEF8',
    borderWidth: 1,
    borderColor: '#ECE4F2',
  },
  routePillSelected: {
    backgroundColor: '#71579C',
    borderColor: '#71579C',
  },
  routePillText: { fontSize: 11, fontWeight: '700', color: '#5B477A' },
  routePillTextSelected: { color: '#FFFFFF' },
  saveBtn: {
    backgroundColor: '#71579C',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  btnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
});
