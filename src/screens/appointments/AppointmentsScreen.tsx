import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { RootStackParamList } from '../../types/navigation';
import {
  deleteAppointment,
  listAppointments,
  saveAppointment,
} from '../../services/appointments';
import type {
  Appointment,
  AppointmentInput,
  AppointmentStatus,
} from '../../services/appointments';

type Props = NativeStackScreenProps<
  RootStackParamList,
  'Appointments'
>;

const emptyForm: AppointmentInput = {
  clinicName: '',
  vetName: '',
  date: '',
  time: '',
  reason: '',
  notes: '',
  status: 'scheduled',
};

const statusOptions: AppointmentStatus[] = [
  'scheduled',
  'completed',
  'cancelled',
];

const fields = [
  { key: 'clinicName', label: 'Clinic name *', placeholder: 'Clinic name', max: 150 },
  { key: 'vetName', label: 'Vet name', placeholder: 'Optional', max: 100 },
  { key: 'date', label: 'Date *', placeholder: 'YYYY-MM-DD', max: 10 },
  { key: 'time', label: 'Clinic local time *', placeholder: 'HH:mm — e.g. 14:30', max: 5 },
  { key: 'reason', label: 'Reason *', placeholder: 'Check-up, vaccination…', max: 200 },
  { key: 'notes', label: 'Notes', placeholder: 'Optional details', max: 1000 },
] as const;

export default function AppointmentsScreen({ route }: Props) {
  const { petId, petName } = route.params;

  const [records, setRecords] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [retry, setRetry] = useState(0);

  const [form, setForm] = useState<AppointmentInput>({ ...emptyForm });
  const [editingId, setEditingId] = useState<string>();
  const [formOpen, setFormOpen] = useState(false);
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

      listAppointments(petId)
        .then((items) => {
          if (active && version === requestVersion.current) {
            setRecords(items);
          }
        })
        .catch((error: unknown) => {
          if (active && version === requestVersion.current) {
            setLoadError(
              error instanceof Error
                ? error.message
                : 'Could not load appointments.',
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

  function openForm(record?: Appointment) {
    if (busy.current) return;

    setEditingId(record?.id);
    setForm(
      record
        ? {
            clinicName: record.clinicName,
            vetName: record.vetName,
            date: record.date,
            time: record.time,
            reason: record.reason,
            notes: record.notes,
            status: record.status,
          }
        : { ...emptyForm },
    );
    setFormError('');
    setFormOpen(true);
  }

  async function handleSave() {
    if (busy.current) return;

    if (!form.clinicName.trim() || !form.reason.trim()) {
      setFormError('Enter the clinic name and reason.');
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.date.trim())) {
      setFormError('Use YYYY-MM-DD for the date.');
      return;
    }

    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(form.time.trim())) {
      setFormError('Use 24-hour time, for example 14:30.');
      return;
    }

    busy.current = true;
    setSaving(true);
    setFormError('');
    ++requestVersion.current;

    try {
      await saveAppointment(
        petId,
        {
          ...form,
          clinicName: form.clinicName.trim(),
          vetName: form.vetName.trim(),
          date: form.date.trim(),
          time: form.time.trim(),
          reason: form.reason.trim(),
          notes: form.notes.trim(),
        },
        editingId,
      );

      if (mounted.current) setFormOpen(false);
    } catch (error: unknown) {
      if (mounted.current) {
        setFormError(
          (error instanceof Error ? error.message : 'Save failed.') +
          ' If the connection failed, check the refreshed list before retrying.',
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

  async function removeAppointment(id: string) {
    if (busy.current) return;

    busy.current = true;
    setSaving(true);
    ++requestVersion.current;

    try {
      await deleteAppointment(petId, id);
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

  function confirmDelete(record: Appointment) {
    Alert.alert(
      'Delete appointment?',
      `Permanently remove the visit to ${record.clinicName}?`,
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void removeAppointment(record.id);
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>{petName}'s appointments</Text>
        <Text style={styles.description}>
          Keep track of visits you arrange with your vet.
        </Text>

        {!formOpen && (
          <Pressable
            style={styles.button}
            onPress={() => openForm()}
            disabled={saving || loading}
            accessibilityRole="button"
          >
            <Text style={styles.buttonText}>Add appointment</Text>
          </Pressable>
        )}

        {formOpen && (
          <View style={styles.card}>
            <Text style={styles.heading}>
              {editingId ? 'Edit appointment' : 'New appointment'}
            </Text>

            {fields.map((field) => (
              <View key={field.key} style={{ gap: 6 }}>
                <Text style={styles.label}>{field.label}</Text>
                <TextInput
                  style={[
                    styles.input,
                    field.key === 'notes' && styles.notes,
                  ]}
                  value={form[field.key]}
                  onChangeText={(value) =>
                    setForm((current) => ({
                      ...current,
                      [field.key]: value,
                    }))
                  }
                  placeholder={field.placeholder}
                  placeholderTextColor="#8A8492"
                  maxLength={field.max}
                  multiline={field.key === 'notes'}
                  editable={!saving}
                  accessibilityLabel={field.label}
                />
              </View>
            ))}

            <Text style={styles.label}>Status</Text>

            <View style={styles.statusRow}>
              {statusOptions.map((status) => (
                <Pressable
                  key={status}
                  style={[
                    styles.statusOption,
                    form.status === status && styles.selectedStatus,
                  ]}
                  onPress={() =>
                    setForm((current) => ({ ...current, status }))
                  }
                  disabled={saving}
                  accessibilityRole="button"
                  accessibilityState={{ selected: form.status === status }}
                >
                  <Text
                    style={[
                      styles.statusText,
                      form.status === status && { color: '#FFFFFF' },
                    ]}
                  >
                    {status}
                  </Text>
                </Pressable>
              ))}
            </View>

            {!!formError && <Text style={styles.error}>{formError}</Text>}

            <Pressable
              style={styles.button}
              onPress={() => { void handleSave(); }}
              disabled={saving || loading}
              accessibilityRole="button"
            >
              <Text style={styles.buttonText}>
                {saving ? 'Please wait…' : 'Save appointment'}
              </Text>
            </Pressable>

            <Pressable
              style={styles.textButton}
              onPress={() => setFormOpen(false)}
              disabled={saving}
              accessibilityRole="button"
            >
              <Text style={styles.link}>Close form</Text>
            </Pressable>
          </View>
        )}

        {loading ? (
          <Text style={styles.description}>Loading appointments…</Text>
        ) : loadError ? (
          <View style={styles.card}>
            <Text style={styles.error}>{loadError}</Text>
            <Pressable
              onPress={() => setRetry((value) => value + 1)}
              disabled={saving}
              style={styles.textButton}
              accessibilityRole="button"
            >
              <Text style={styles.link}>Try again</Text>
            </Pressable>
          </View>
        ) : records.length === 0 ? (
          <Text style={styles.description}>No appointments saved yet.</Text>
        ) : (
          records.map((record) => (
            <View key={record.id} style={styles.card}>
              <Text style={styles.heading}>{record.clinicName}</Text>
              <Text style={styles.label}>
                {record.date} · {record.time} (clinic local time)
              </Text>
              <Text style={styles.statusText}>{record.status}</Text>

              {!!record.vetName && (
                <Text style={styles.description}>Vet: {record.vetName}</Text>
              )}

              <Text style={styles.description}>{record.reason}</Text>

              {!!record.notes && (
                <Text style={styles.description}>{record.notes}</Text>
              )}

              <View style={styles.statusRow}>
                <Pressable
                  style={styles.textButton}
                  onPress={() => openForm(record)}
                  disabled={saving || formOpen}
                  accessibilityRole="button"
                >
                  <Text style={styles.link}>Edit / change status</Text>
                </Pressable>

                <Pressable
                  style={styles.textButton}
                  onPress={() => confirmDelete(record)}
                  disabled={saving || formOpen}
                  accessibilityRole="button"
                >
                  <Text style={styles.error}>Delete</Text>
                </Pressable>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FAFAF8' },
  content: {
    padding: 20,
    gap: 16,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  title: { fontSize: 26, fontWeight: '800', color: '#20352F' },
  heading: { fontSize: 18, fontWeight: '700', color: '#20352F' },
  description: { fontSize: 13, lineHeight: 20, color: '#777184' },
  label: { fontSize: 13, fontWeight: '600', color: '#343047' },
  card: {
    padding: 18,
    gap: 12,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEE9FA',
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD6EA',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#343047',
    backgroundColor: '#FAF8FD',
  },
  notes: { minHeight: 80, textAlignVertical: 'top' },
  button: {
    backgroundColor: '#67539B',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: { color: '#FFFFFF', fontWeight: '700' },
  textButton: { paddingVertical: 10, paddingHorizontal: 4 },
  link: { color: '#67539B', fontWeight: '700' },
  error: { color: '#B34436', fontSize: 13, lineHeight: 20 },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statusOption: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#EEE9FA',
  },
  selectedStatus: { backgroundColor: '#67539B' },
  statusText: {
    color: '#67539B',
    fontWeight: '700',
    fontSize: 12,
    textTransform: 'capitalize',
  },
});