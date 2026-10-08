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

import { recordVetVaccination } from '../../services/vets';

interface Props {
  visible: boolean;
  petId: string;
  petName: string;
  onClose: () => void;
  onSuccess: () => void;
}

const COMMON_VACCINES = [
  'Rabies Vaccine',
  'DHPP (Distemper/Parvo)',
  'Bordetella (Kennel Cough)',
  'FVRCP (Feline 3-in-1)',
  'FeLV (Feline Leukemia)',
  'Lyme Disease Vaccine',
];

export default function VetVaccinationModal({
  visible,
  petId,
  petName,
  onClose,
  onSuccess,
}: Props) {
  const todayStr = new Date().toISOString().slice(0, 10);

  const [vaccineName, setVaccineName] = useState('');
  const [dateAdministered, setDateAdministered] = useState(todayStr);
  const [nextDueDate, setNextDueDate] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [notes, setNotes] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    setError('');

    if (!vaccineName.trim()) {
      setError('Vaccine name is required.');
      return;
    }
    if (!dateAdministered.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(dateAdministered.trim())) {
      setError('Enter a valid administered date (YYYY-MM-DD).');
      return;
    }
    if (nextDueDate.trim() && !/^\d{4}-\d{2}-\d{2}$/.test(nextDueDate.trim())) {
      setError('Enter a valid next due date (YYYY-MM-DD) or leave blank.');
      return;
    }

    setSaving(true);
    try {
      await recordVetVaccination({
        petId,
        vaccineName: vaccineName.trim(),
        dateAdministered: dateAdministered.trim(),
        nextDueDate: nextDueDate.trim() || null,
        batchNumber: batchNumber.trim(),
        notes: notes.trim(),
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not record vaccination.');
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
            <Text style={styles.headerTitle}>Record Veterinary Vaccination</Text>
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
            <Text style={styles.label}>Vaccine Name *</Text>
            <TextInput
              style={styles.input}
              value={vaccineName}
              onChangeText={setVaccineName}
              placeholder="E.g. Rabies, DHPP, FVRCP..."
              placeholderTextColor="#958A81"
              maxLength={150}
              editable={!saving}
            />

            <View style={styles.quickPills}>
              {COMMON_VACCINES.map((v) => (
                <Pressable
                  key={v}
                  onPress={() => setVaccineName(v)}
                  style={[styles.quickPill, vaccineName === v && styles.quickPillSelected]}
                >
                  <Text
                    style={[
                      styles.quickPillText,
                      vaccineName === v && styles.quickPillTextSelected,
                    ]}
                  >
                    {v}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Date Administered *</Text>
                <TextInput
                  style={styles.input}
                  value={dateAdministered}
                  onChangeText={setDateAdministered}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#958A81"
                  maxLength={10}
                  editable={!saving}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Next Due Date</Text>
                <TextInput
                  style={styles.input}
                  value={nextDueDate}
                  onChangeText={setNextDueDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#958A81"
                  maxLength={10}
                  editable={!saving}
                />
              </View>
            </View>

            <Text style={styles.label}>Batch / Lot Number (Optional)</Text>
            <TextInput
              style={styles.input}
              value={batchNumber}
              onChangeText={setBatchNumber}
              placeholder="E.g. BATCH-2026-X9"
              placeholderTextColor="#958A81"
              maxLength={100}
              editable={!saving}
            />

            <Text style={styles.label}>Clinical Notes / Observations</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Site of administration, route, reaction monitoring..."
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
                <Ionicons name="medkit" size={18} color="#FFFFFF" />
                <Text style={styles.saveBtnText}>Record Administered Vaccine</Text>
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
  textArea: { minHeight: 75, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 10 },
  quickPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 4 },
  quickPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#F3EEF8',
    borderWidth: 1,
    borderColor: '#ECE4F2',
  },
  quickPillSelected: {
    backgroundColor: '#71579C',
    borderColor: '#71579C',
  },
  quickPillText: { fontSize: 10, fontWeight: '700', color: '#5B477A' },
  quickPillTextSelected: { color: '#FFFFFF' },
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
