import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  deleteVaccination,
  listVaccinations,
  saveVaccination,
} from '../services/vaccinations';

import {
  getVaccineReminders,
  getVaccineDueStatus,
} from '../utils/vaccinationSummary';

import type { Vaccination } from '../services/vaccinations';

interface Props {
  petId: string;
}

export default function PetVaccinations({ petId }: Props) {
  const [records, setRecords] = useState<Vaccination[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [retry, setRetry] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string>();
  const [vaccineName, setVaccineName] = useState('');
  const [dateGiven, setDateGiven] = useState('');
  const [nextDueDate, setNextDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const busy = useRef(false);
  const mounted = useRef(false);
  const requestVersion = useRef(0);

  useEffect(() => {
    mounted.current = true;

    return () => {
      mounted.current = false;
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const version = ++requestVersion.current;

      setLoading(true);
      setLoadError('');

      listVaccinations(petId)
        .then((data) => {
          if (active && version === requestVersion.current) {
            setRecords(data);
          }
        })
        .catch((error: unknown) => {
          if (active && version === requestVersion.current) {
            setLoadError(
              error instanceof Error
                ? error.message
                : 'Could not load vaccinations.',
            );
          }
        })
        .finally(() => {
          if (active && version === requestVersion.current) {
            setLoading(false);
          }
        });

      return () => {
        active = false;
      };
    }, [petId, retry]),
  );

  function openForm(record?: Vaccination) {
    if (busy.current) return;

    setEditingId(record?.id);
    setVaccineName(record?.vaccineName ?? '');
    setDateGiven(record?.dateGiven ?? '');
    setNextDueDate(record?.nextDueDate ?? '');
    setNotes(record?.notes ?? '');
    setFormError('');
    setFormOpen(true);
  }

  async function handleSave() {
    if (busy.current) return;

    if (vaccineName.trim().length < 2) {
      setFormError('Enter a vaccine name with at least 2 characters.');
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateGiven.trim())) {
      setFormError('Enter the date given as YYYY-MM-DD.');
      return;
    }

    if (
      nextDueDate.trim() &&
      !/^\d{4}-\d{2}-\d{2}$/.test(nextDueDate.trim())
    ) {
      setFormError('Enter the next due date as YYYY-MM-DD.');
      return;
    }

    busy.current = true;
    setSaving(true);
    setFormError('');
    ++requestVersion.current;

    try {
      await saveVaccination(
        petId,
        {
          vaccineName: vaccineName.trim(),
          dateGiven: dateGiven.trim(),
          nextDueDate: nextDueDate.trim() || null,
          notes: notes.trim(),
        },
        editingId,
      );

      if (mounted.current) {
        setFormOpen(false);
      }
    } catch (error: unknown) {
      if (mounted.current) {
        setFormError(
          (error instanceof Error
            ? error.message
            : 'Could not confirm the save.') +
            ' If the connection failed, check the refreshed list before saving again.',
        );
      }
    } finally {
      busy.current = false;

      if (mounted.current) {
        setSaving(false);
        setRetry((value) => value + 1);
      }
    }
  }

  async function removeRecord(id: string) {
    if (busy.current) return;

    busy.current = true;
    setSaving(true);
    ++requestVersion.current;

    try {
      await deleteVaccination(petId, id);
    } catch (error: unknown) {
      if (mounted.current) {
        Alert.alert(
          'Could not confirm deletion',
          error instanceof Error
            ? error.message
            : 'Check the refreshed list before retrying.',
        );
      }
    } finally {
      busy.current = false;

      if (mounted.current) {
        setSaving(false);
        setRetry((value) => value + 1);
      }
    }
  }

  function confirmDelete(record: Vaccination) {
    if (busy.current) return;

    Alert.alert(
      'Delete vaccination?',
      `Remove the ${record.vaccineName} record?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void removeRecord(record.id);
          },
        },
      ],
    );
  }

  const reminders = getVaccineReminders(records);

const overdueCount = reminders.filter(
  (record) =>
    record.nextDueDate &&
    getVaccineDueStatus(record.nextDueDate).label === 'Overdue',
).length;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Vaccinations</Text>

      {!loading && !loadError && (
  <View
    style={{
      backgroundColor: '#F5F1FB',
      borderRadius: 14,
      padding: 14,
      gap: 10,
    }}
  >
    <Text style={styles.recordTitle}>Vaccination summary</Text>

    <Text style={styles.detail}>
      {records.length} saved record{records.length === 1 ? '' : 's'}
      {' · '}
      {overdueCount} overdue
    </Text>

    {reminders.length === 0 ? (
      <Text style={styles.detail}>
        No next due dates saved. This does not confirm that
        vaccinations are up to date.
      </Text>
    ) : (
      reminders.map((record) => {
        const status = getVaccineDueStatus(record.nextDueDate!);

        return (
          <View key={record.id} style={{ gap: 4 }}>
            <Text style={styles.recordTitle}>
              {record.vaccineName}
            </Text>

            <Text
              style={[
                styles.detail,
                { color: status.color, fontWeight: '700' },
              ]}
            >
              {status.label} · {status.description}
            </Text>

            <Text style={styles.detail}>
              Due date: {record.nextDueDate}
            </Text>
          </View>
        );
      })
    )}
  </View>
)}

      <Text style={styles.description}>
        Keep vaccine dates and your vet’s next due date together.
      </Text>

      {!formOpen && (
        <Pressable
          style={styles.primaryButton}
          onPress={() => openForm()}
          disabled={saving || loading}
          accessibilityRole="button"
        >
          <Text style={styles.primaryText}>Add vaccination</Text>
        </Pressable>
      )}

      {formOpen && (
        <View style={styles.form}>
          <Text style={styles.recordTitle}>
            {editingId ? 'Edit vaccination' : 'New vaccination'}
          </Text>

          <Text style={styles.label}>Vaccine name *</Text>
          <TextInput
            style={styles.input}
            value={vaccineName}
            onChangeText={setVaccineName}
            placeholder="e.g. Rabies"
            placeholderTextColor="#888888"
            maxLength={100}
            editable={!saving}
            accessibilityLabel="Vaccine name"
          />

          <Text style={styles.label}>Date given *</Text>
          <TextInput
            style={styles.input}
            value={dateGiven}
            onChangeText={setDateGiven}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#888888"
            maxLength={10}
            autoCapitalize="none"
            editable={!saving}
            accessibilityLabel="Date given, YYYY-MM-DD"
          />

          <Text style={styles.label}>Next due date — optional</Text>
          <TextInput
            style={styles.input}
            value={nextDueDate}
            onChangeText={setNextDueDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#888888"
            maxLength={10}
            autoCapitalize="none"
            editable={!saving}
            accessibilityLabel="Next due date, YYYY-MM-DD"
          />

          <Text style={styles.label}>Notes — optional</Text>
          <TextInput
            style={[styles.input, styles.notesInput]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Clinic, vet, or other details"
            placeholderTextColor="#888888"
            maxLength={1000}
            multiline
            editable={!saving}
            accessibilityLabel="Vaccination notes"
          />

          {!!formError && (
            <Text style={styles.error}>{formError}</Text>
          )}

          <Pressable
            style={styles.primaryButton}
            onPress={() => {
              void handleSave();
            }}
            disabled={saving || loading}
            accessibilityRole="button"
          >
            <Text style={styles.primaryText}>
              {saving ? 'Please wait…' : 'Save vaccination'}
            </Text>
          </Pressable>

          <Pressable
            style={styles.secondaryButton}
            onPress={() => setFormOpen(false)}
            disabled={saving}
            accessibilityRole="button"
          >
            <Text style={styles.link}>Cancel</Text>
          </Pressable>
        </View>
      )}

      {loading ? (
        <Text style={styles.description}>Loading vaccinations…</Text>
      ) : loadError ? (
        <View>
          <Text style={styles.error}>{loadError}</Text>

          <Pressable
            style={styles.secondaryButton}
            onPress={() => setRetry((value) => value + 1)}
            disabled={saving}
            accessibilityRole="button"
          >
            <Text style={styles.link}>Try again</Text>
          </Pressable>
        </View>
      ) : records.length === 0 ? (
        <Text style={styles.description}>
          No vaccination records yet. Add the first one above.
        </Text>
      ) : (
        records.map((record) => (
          <View key={record.id} style={styles.record}>
            <Text style={styles.recordTitle}>
              {record.vaccineName}
            </Text>

            <Text style={styles.detail}>
              Given: {record.dateGiven}
            </Text>

            <Text style={styles.detail}>
              Next due: {record.nextDueDate ?? 'Not set'}
            </Text>

            {!!record.notes && (
              <Text style={styles.detail}>{record.notes}</Text>
            )}

            <View style={styles.actions}>
              <Pressable
                onPress={() => openForm(record)}
                disabled={saving || formOpen}
                accessibilityRole="button"
                accessibilityLabel={`Edit ${record.vaccineName}`}
                style={styles.smallButton}
              >
                <Text style={styles.link}>Edit</Text>
              </Pressable>

              <Pressable
                onPress={() => confirmDelete(record)}
                disabled={saving || formOpen}
                accessibilityRole="button"
                accessibilityLabel={`Delete ${record.vaccineName}`}
                style={styles.smallButton}
              >
                <Text style={styles.error}>Delete</Text>
              </Pressable>
            </View>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    marginBottom: 24,
    padding: 18,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEE9FA',
    gap: 12,
  },
  title: {
    fontSize: 21,
    fontWeight: '700',
    color: '#343047',
  },
  description: {
    fontSize: 13,
    lineHeight: 20,
    color: '#777184',
  },
  form: {
    gap: 10,
    paddingVertical: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#343047',
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD6EA',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#343047',
    backgroundColor: '#FAF8FD',
    fontSize: 14,
  },
  notesInput: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  primaryButton: {
    backgroundColor: '#67539B',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  primaryText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  secondaryButton: {
    padding: 12,
    alignItems: 'center',
  },
  link: {
    color: '#67539B',
    fontSize: 14,
    fontWeight: '700',
  },
  error: {
    color: '#B34436',
    fontSize: 13,
    lineHeight: 20,
  },
  record: {
    borderTopWidth: 1,
    borderTopColor: '#EEE9FA',
    paddingTop: 16,
    gap: 7,
  },
  recordTitle: {
    color: '#343047',
    fontSize: 16,
    fontWeight: '700',
  },
  detail: {
    color: '#777184',
    fontSize: 13,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 16,
  },
  smallButton: {
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
});