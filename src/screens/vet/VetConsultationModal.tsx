import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import {
  createConsultation,
  updateConsultation,
  type VetConsultation,
} from '../../services/vets';

interface Props {
  visible: boolean;
  petId: string;
  petName: string;
  bookingId?: string | null;
  existingConsultation?: VetConsultation | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function VetConsultationModal({
  visible,
  petId,
  petName,
  bookingId,
  existingConsultation,
  onClose,
  onSuccess,
}: Props) {
  const isEditing = Boolean(existingConsultation);
  const isFinalized = existingConsultation?.status === 'finalized';

  const todayStr = new Date().toISOString().slice(0, 10);

  const [visitDate, setVisitDate] = useState(
    existingConsultation?.visitDate || todayStr,
  );
  const [symptoms, setSymptoms] = useState(
    existingConsultation?.symptoms || '',
  );
  const [examinationNotes, setExaminationNotes] = useState(
    existingConsultation?.examinationNotes || '',
  );
  const [diagnosis, setDiagnosis] = useState(
    existingConsultation?.diagnosis || '',
  );
  const [treatmentPlan, setTreatmentPlan] = useState(
    existingConsultation?.treatmentPlan || '',
  );
  const [followUpDate, setFollowUpDate] = useState(
    existingConsultation?.followUpDate || '',
  );
  const [followUpInstructions, setFollowUpInstructions] = useState(
    existingConsultation?.followUpInstructions || '',
  );
  const [isFinalizedDraft, setIsFinalizedDraft] = useState(true);
  const [amendmentNote, setAmendmentNote] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    setError('');

    if (isFinalized) {
      if (!amendmentNote.trim() || amendmentNote.trim().length < 3) {
        setError('Provide an amendment note of at least 3 characters.');
        return;
      }

      setSaving(true);
      try {
        await updateConsultation(existingConsultation!.id, {
          amendmentNote: amendmentNote.trim(),
        });
        onSuccess();
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not add amendment.');
      } finally {
        setSaving(false);
      }
      return;
    }

    if (!visitDate.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(visitDate.trim())) {
      setError('Enter a valid visit date (YYYY-MM-DD).');
      return;
    }
    if (!symptoms.trim() || symptoms.trim().length < 2) {
      setError('Symptoms / reason for visit is required (min 2 characters).');
      return;
    }
    if (isFinalizedDraft && (!diagnosis.trim() || diagnosis.trim().length < 2)) {
      setError('Diagnosis is required to finalize consultation notes.');
      return;
    }

    setSaving(true);
    try {
      if (isEditing && existingConsultation?.status === 'draft') {
        await updateConsultation(existingConsultation.id, {
          visitDate: visitDate.trim(),
          symptoms: symptoms.trim(),
          examinationNotes: examinationNotes.trim(),
          diagnosis: diagnosis.trim(),
          treatmentPlan: treatmentPlan.trim(),
          followUpDate: followUpDate.trim() || null,
          followUpInstructions: followUpInstructions.trim(),
          status: isFinalizedDraft ? 'finalized' : 'draft',
        });
      } else {
        await createConsultation({
          petId,
          bookingId,
          visitDate: visitDate.trim(),
          symptoms: symptoms.trim(),
          examinationNotes: examinationNotes.trim(),
          diagnosis: diagnosis.trim(),
          treatmentPlan: treatmentPlan.trim(),
          followUpDate: followUpDate.trim() || null,
          followUpInstructions: followUpInstructions.trim(),
          status: isFinalizedDraft ? 'finalized' : 'draft',
        });
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save consultation.');
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
            <Text style={styles.headerTitle}>
              {isFinalized
                ? 'Add Clinical Amendment'
                : isEditing
                  ? 'Edit Consultation Draft'
                  : 'New Clinical Consultation'}
            </Text>
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

          {isFinalized ? (
            <View style={styles.card}>
              <View style={styles.finalizedNotice}>
                <Ionicons name="lock-closed-outline" size={20} color="#71579C" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.finalizedTitle}>Finalized Medical Record</Text>
                  <Text style={styles.finalizedText}>
                    This consultation was published and finalized on {existingConsultation?.visitDate}. In
                    accordance with clinical integrity guidelines, existing findings cannot be silently
                    altered. Add an amendment note below.
                  </Text>
                </View>
              </View>

              <View style={styles.readOnlyField}>
                <Text style={styles.readOnlyLabel}>Diagnosis</Text>
                <Text style={styles.readOnlyValue}>{existingConsultation?.diagnosis}</Text>
              </View>

              <View style={styles.readOnlyField}>
                <Text style={styles.readOnlyLabel}>Treatment Plan</Text>
                <Text style={styles.readOnlyValue}>{existingConsultation?.treatmentPlan}</Text>
              </View>

              <Text style={styles.label}>Amendment Note *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={amendmentNote}
                onChangeText={setAmendmentNote}
                placeholder="Describe post-visit updates, lab results or patient progress..."
                placeholderTextColor="#958A81"
                multiline
                maxLength={1000}
                editable={!saving}
              />
            </View>
          ) : (
            <View style={styles.card}>
              <Text style={styles.label}>Visit Date (YYYY-MM-DD) *</Text>
              <TextInput
                style={styles.input}
                value={visitDate}
                onChangeText={setVisitDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#958A81"
                maxLength={10}
                editable={!saving}
              />

              <Text style={styles.label}>Symptoms / Reason for Visit *</Text>
              <TextInput
                style={[styles.input, styles.textAreaSmall]}
                value={symptoms}
                onChangeText={setSymptoms}
                placeholder="E.g. Limping on left front leg, loss of appetite..."
                placeholderTextColor="#958A81"
                multiline
                maxLength={500}
                editable={!saving}
              />

              <Text style={styles.label}>Clinical Examination & Findings</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={examinationNotes}
                onChangeText={setExaminationNotes}
                placeholder="Physical examination notes, vitals, observations..."
                placeholderTextColor="#958A81"
                multiline
                maxLength={1000}
                editable={!saving}
              />

              <Text style={styles.label}>Diagnosis *</Text>
              <TextInput
                style={[styles.input, styles.textAreaSmall]}
                value={diagnosis}
                onChangeText={setDiagnosis}
                placeholder="E.g. Acute Canine Gastroenteritis, Soft tissue sprain..."
                placeholderTextColor="#958A81"
                multiline
                maxLength={500}
                editable={!saving}
              />

              <Text style={styles.label}>Treatment Plan & Care Instructions</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={treatmentPlan}
                onChangeText={setTreatmentPlan}
                placeholder="Medications administered, dietary advice, rest period..."
                placeholderTextColor="#958A81"
                multiline
                maxLength={1000}
                editable={!saving}
              />

              <Text style={styles.label}>Suggested Follow-up Date (Optional)</Text>
              <TextInput
                style={styles.input}
                value={followUpDate}
                onChangeText={setFollowUpDate}
                placeholder="YYYY-MM-DD (e.g. 2026-11-01)"
                placeholderTextColor="#958A81"
                maxLength={10}
                editable={!saving}
              />

              <Text style={styles.label}>Follow-up Instructions (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textAreaSmall]}
                value={followUpInstructions}
                onChangeText={setFollowUpInstructions}
                placeholder="E.g. Return if symptoms persist after 5 days..."
                placeholderTextColor="#958A81"
                multiline
                maxLength={300}
                editable={!saving}
              />

              <View style={styles.switchRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.switchLabel}>Finalize and Publish to Owner</Text>
                  <Text style={styles.switchSub}>
                    {isFinalizedDraft
                      ? 'Notes will be visible to the pet owner in their pet profile.'
                      : 'Saved as a private draft. You can complete it later.'}
                  </Text>
                </View>
                <Switch
                  value={isFinalizedDraft}
                  onValueChange={setIsFinalizedDraft}
                  trackColor={{ false: '#ECE4F2', true: '#71579C' }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>
          )}

          <Pressable
            onPress={handleSave}
            disabled={saving}
            style={[styles.saveBtn, saving && styles.btnDisabled]}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Ionicons
                  name={isFinalized ? 'document-attach' : 'checkmark-circle'}
                  size={18}
                  color="#FFFFFF"
                />
                <Text style={styles.saveBtnText}>
                  {isFinalized
                    ? 'Save Amendment'
                    : isFinalizedDraft
                      ? 'Finalize & Publish Consultation'
                      : 'Save Draft'}
                </Text>
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
  textAreaSmall: { minHeight: 65, textAlignVertical: 'top' },
  textArea: { minHeight: 95, textAlignVertical: 'top' },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F0EAF5',
  },
  switchLabel: { fontSize: 12, fontWeight: '800', color: '#304439' },
  switchSub: { fontSize: 10, color: '#958A81', marginTop: 2, paddingRight: 8 },
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
  finalizedNotice: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#F4EEF9',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  finalizedTitle: { fontSize: 12, fontWeight: '800', color: '#71579C' },
  finalizedText: { fontSize: 11, color: '#5B477A', marginTop: 4, lineHeight: 16 },
  readOnlyField: {
    backgroundColor: '#FAF8FC',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ECE4F2',
  },
  readOnlyLabel: { fontSize: 10, fontWeight: '700', color: '#71579C', textTransform: 'uppercase' },
  readOnlyValue: { fontSize: 12, color: '#304439', marginTop: 3 },
});
