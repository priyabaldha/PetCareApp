import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import {
  deleteMedication,
  listMedications,
  saveMedication,
} from '../services/medications';

import type {
  Medication,
  MedicationInput,
  MedicationStatus,
} from '../services/medications';

interface Props {
  petId: string;
  petName: string;
  disabled?: boolean;
}

type MedicationForm = Omit<MedicationInput, 'endDate'> & {
  endDate: string;
};

type TextField =
  | 'medicineName'
  | 'dosage'
  | 'frequency'
  | 'startDate'
  | 'endDate'
  | 'instructions';

const fields: {
  key: TextField;
  label: string;
  placeholder: string;
  maxLength: number;
  multiline?: boolean;
}[] = [
  {
    key: 'medicineName',
    label: 'Medicine name *',
    placeholder: 'Name shown on the prescription',
    maxLength: 150,
  },
  {
    key: 'dosage',
    label: 'Prescribed dosage *',
    placeholder: 'Copy the amount and units from the prescription',
    maxLength: 200,
  },
  {
    key: 'frequency',
    label: 'Frequency *',
    placeholder: 'Copy how often your vet instructed',
    maxLength: 200,
  },
  {
    key: 'startDate',
    label: 'Start date *',
    placeholder: 'YYYY-MM-DD',
    maxLength: 10,
  },
  {
    key: 'endDate',
    label: 'End date — optional',
    placeholder: 'YYYY-MM-DD, or leave blank',
    maxLength: 10,
  },
  {
    key: 'instructions',
    label: 'Instructions from your vet',
    placeholder: 'Additional directions from the prescription',
    maxLength: 2000,
    multiline: true,
  },
];

const statuses: {
  value: MedicationStatus;
  label: string;
  color: string;
  background: string;
}[] = [
  {
    value: 'active',
    label: 'Active',
    color: '#42806B',
    background: '#E5F1EA',
  },
  {
    value: 'completed',
    label: 'Completed',
    color: '#71579C',
    background: '#EEE7F6',
  },
  {
    value: 'stopped',
    label: 'Stopped',
    color: '#B06B51',
    background: '#F9EAE2',
  },
];

function today() {
  const date = new Date();

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

function emptyForm(): MedicationForm {
  return {
    medicineName: '',
    dosage: '',
    frequency: '',
    instructions: '',
    startDate: today(),
    endDate: '',
    status: 'active',
  };
}

function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const date = new Date(`${value}T00:00:00.000Z`);

  return (
    Number.isFinite(date.getTime()) &&
    date.toISOString().slice(0, 10) === value &&
    value >= '1900-01-01'
  );
}

function validateForm(form: MedicationForm): string | null {
  if (!form.medicineName.trim()) return 'Enter the medicine name.';
  if (!form.dosage.trim()) return 'Enter the prescribed dosage.';
  if (!form.frequency.trim()) return 'Enter the prescribed frequency.';

  if (!validDate(form.startDate)) {
    return 'Enter a valid start date in YYYY-MM-DD format.';
  }

  if (form.endDate) {
    if (!validDate(form.endDate)) {
      return 'Enter a valid end date, or leave it blank.';
    }

    if (form.endDate < form.startDate) {
      return 'End date cannot be before start date.';
    }
  }

  return null;
}

function sortMedications(records: Medication[]) {
  return [...records].sort(
    (a, b) =>
      b.startDate.localeCompare(a.startDate) ||
      b.createdAt.localeCompare(a.createdAt) ||
      b.id.localeCompare(a.id),
  );
}

function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : 'Something went wrong. Please try again.';
}

export default function PetMedications({
  petId,
  petName,
  disabled = false,
}: Props) {
  const [records, setRecords] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [retry, setRetry] = useState(0);

  const [form, setForm] = useState<MedicationForm>(emptyForm);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');

  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const mounted = useRef(false);
  const busy = useRef(false);
  const requestVersion = useRef(0);

  const locked = disabled || saving || deletingId !== null;

  const activeCount = records.filter(
    (record) => record.status === 'active',
  ).length;

  useEffect(() => {
    mounted.current = true;

    return () => {
      mounted.current = false;
      requestVersion.current += 1;
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      if (busy.current) return;

      const version = ++requestVersion.current;

      setLoading(true);
      setLoadError('');

      async function load() {
        try {
          const result = await listMedications(petId);

          if (active && version === requestVersion.current) {
            setRecords(sortMedications(result));
          }
        } catch (error: unknown) {
          if (active && version === requestVersion.current) {
            setLoadError(errorMessage(error));
          }
        } finally {
          if (active && version === requestVersion.current) {
            setLoading(false);
          }
        }
      }

      void load();

      return () => {
        active = false;
      };
    }, [petId, retry]),
  );

  function startAdd() {
    if (locked || busy.current || loading || loadError) return;

    setEditingId(null);
    setForm(emptyForm());
    setActionError('');
    setFormOpen(true);
  }

  function startEdit(record: Medication) {
    if (locked || busy.current || loading) return;

    setEditingId(record.id);

    setForm({
      medicineName: record.medicineName,
      dosage: record.dosage,
      frequency: record.frequency,
      instructions: record.instructions,
      startDate: record.startDate,
      endDate: record.endDate ?? '',
      status: record.status,
    });

    setActionError('');
    setFormOpen(true);
  }

  function cancelForm() {
    if (locked || busy.current) return;

    setFormOpen(false);
    setEditingId(null);
    setForm(emptyForm());
    setActionError('');
  }

  async function save() {
    if (locked || busy.current || loading) return;

    const validationError = validateForm(form);

    if (validationError) {
      setActionError(validationError);
      return;
    }

    busy.current = true;
    requestVersion.current += 1;
    setSaving(true);
    setActionError('');

    try {
      const saved = await saveMedication(
        petId,
        {
          ...form,
          endDate: form.endDate || null,
        },
        editingId ?? undefined,
      );

      if (!mounted.current) return;

      setRecords((current) =>
        sortMedications([
          saved,
          ...current.filter((item) => item.id !== saved.id),
        ]),
      );

      setFormOpen(false);
      setEditingId(null);
      setForm(emptyForm());
    } catch (error: unknown) {
      if (mounted.current) {
        setActionError(
          `${errorMessage(error)} If the connection was interrupted, ` +
            'close the form and check the refreshed list before retrying; ' +
            'the medication may already have been saved.',
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

  async function remove(record: Medication) {
    if (disabled || busy.current || !mounted.current) return;

    busy.current = true;
    requestVersion.current += 1;
    setDeletingId(record.id);
    setActionError('');

    try {
      await deleteMedication(petId, record.id);

      if (mounted.current) {
        setRecords((current) =>
          current.filter((item) => item.id !== record.id),
        );
      }
    } catch (error: unknown) {
      if (mounted.current) {
        setActionError(
          `${errorMessage(error)} Check the refreshed list before retrying.`,
        );
      }
    } finally {
      busy.current = false;

      if (mounted.current) {
        setDeletingId(null);
        setRetry((value) => value + 1);
      }
    }
  }

  function confirmDelete(record: Medication) {
    if (locked || busy.current) return;

    Alert.alert(
      'Delete medication record?',
      `Remove ${record.medicineName} from the saved records? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void remove(record);
          },
        },
      ],
    );
  }

  return (
    <View style={styles.section}>
      <View style={styles.heading}>
        <View style={styles.headingIcon}>
          <Ionicons
            name="medical-outline"
            size={25}
            color="#71579C"
          />
        </View>

        <View style={styles.flex}>
          <Text style={styles.eyebrow}>PRESCRIBED CARE</Text>
          <Text style={styles.title}>Medications</Text>
          <Text style={styles.subtitle}>
            Keep {petName}’s prescription details together.
          </Text>
        </View>
      </View>

      <View style={styles.summary}>
        <View style={styles.flex}>
          <Text style={styles.summaryLabel}>MARKED ACTIVE</Text>
          <Text style={styles.summaryCount}>
            {loading || loadError ? '—' : activeCount}
          </Text>
          <Text style={styles.hint}>
            Status is updated manually.
          </Text>
        </View>

        {!formOpen && (
          <Pressable
            onPress={startAdd}
            disabled={locked || loading || !!loadError}
            accessibilityRole="button"
            style={[
              styles.primaryButton,
              (locked || loading || !!loadError) && styles.disabled,
            ]}
          >
            <Ionicons name="add" size={18} color="#FFFFFF" />
            <Text style={styles.primaryText}>Add medicine</Text>
          </Pressable>
        )}
      </View>

      {formOpen && (
        <View style={styles.formCard}>
          <View style={styles.formHeader}>
            <View style={styles.flex}>
              <Text style={styles.formTitle}>
                {editingId ? 'Edit medication' : 'Add medication'}
              </Text>
              <Text style={styles.hint}>
                Copy details from your vet’s prescription.
              </Text>
            </View>

            <Pressable
              onPress={cancelForm}
              disabled={locked}
              accessibilityRole="button"
              accessibilityLabel="Close medication form"
              style={styles.closeButton}
            >
              <Ionicons name="close" size={21} color="#71579C" />
            </Pressable>
          </View>

          {fields.map((field) => (
            <View key={field.key} style={styles.field}>
              <Text style={styles.label}>{field.label}</Text>

              <TextInput
                value={form[field.key]}
                onChangeText={(value) =>
                  setForm((current) => ({
                    ...current,
                    [field.key]: value,
                  }))
                }
                editable={!locked}
                placeholder={field.placeholder}
                placeholderTextColor="#A295AC"
                maxLength={field.maxLength}
                multiline={field.multiline}
                textAlignVertical={field.multiline ? 'top' : 'center'}
                autoCapitalize={
                  field.key === 'startDate' || field.key === 'endDate'
                    ? 'none'
                    : 'sentences'
                }
                autoCorrect={false}
                accessibilityLabel={field.label}
                style={[
                  styles.input,
                  field.multiline && styles.multiline,
                ]}
              />
            </View>
          ))}

          <Text style={styles.label}>Status *</Text>

          <View style={styles.statusOptions}>
            {statuses.map((status) => {
              const selected = form.status === status.value;

              return (
                <Pressable
                  key={status.value}
                  onPress={() =>
                    setForm((current) => ({
                      ...current,
                      status: status.value,
                    }))
                  }
                  disabled={locked}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  style={[
                    styles.statusOption,
                    {
                      backgroundColor: selected
                        ? status.background
                        : '#FAF8FC',
                      borderColor: selected
                        ? status.color
                        : '#E9E2EF',
                    },
                  ]}
                >
                  {selected && (
                    <Ionicons
                      name="checkmark-circle"
                      size={15}
                      color={status.color}
                    />
                  )}
                  <Text
                    style={[
                      styles.statusText,
                      { color: selected ? status.color : '#9B8BA8' },
                    ]}
                  >
                    {status.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.note}>
            <Ionicons
              name="information-circle-outline"
              size={19}
              color="#71579C"
            />
            <Text style={styles.noteText}>
              Recording a status does not change the prescription.
              Follow your vet’s instructions. Dates do not
              automatically complete a medication.
            </Text>
          </View>

          {!!actionError && (
            <Text accessibilityRole="alert" style={styles.error}>
              {actionError}
            </Text>
          )}

          <View style={styles.formActions}>
            <Pressable
              onPress={cancelForm}
              disabled={locked}
              accessibilityRole="button"
              style={[styles.secondaryButton, locked && styles.disabled]}
            >
              <Text style={styles.secondaryText}>Cancel</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                void save();
              }}
              disabled={locked || loading}
              accessibilityRole="button"
              style={[
                styles.primaryButton,
                (locked || loading) && styles.disabled,
              ]}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Ionicons name="checkmark" size={18} color="#FFFFFF" />
              )}
              <Text style={styles.primaryText}>
                {saving ? 'Saving…' : 'Save medication'}
              </Text>
            </Pressable>
          </View>
        </View>
      )}

      {!formOpen && !!actionError && (
        <Text accessibilityRole="alert" style={styles.error}>
          {actionError}
        </Text>
      )}

      {loading ? (
        <View style={styles.messageCard}>
          <ActivityIndicator color="#71579C" />
          <Text style={styles.messageText}>Loading medications…</Text>
        </View>
      ) : loadError ? (
        <View style={styles.messageCard}>
          <Text style={styles.error}>{loadError}</Text>
          <Pressable
            onPress={() => setRetry((value) => value + 1)}
            disabled={locked}
            accessibilityRole="button"
            style={styles.smallButton}
          >
            <Text style={styles.secondaryText}>Try again</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>Saved medications</Text>

            <Pressable
              onPress={() => setRetry((value) => value + 1)}
              disabled={locked}
              accessibilityRole="button"
              style={styles.smallButton}
            >
              <Ionicons
                name="refresh-outline"
                size={15}
                color="#71579C"
              />
              <Text style={styles.secondaryText}>Refresh</Text>
            </Pressable>
          </View>

          {records.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name="medical-outline"
                  size={31}
                  color="#71579C"
                />
              </View>
              <Text style={styles.emptyTitle}>
                A place for prescribed care.
              </Text>
              <Text style={styles.emptyText}>
                Add a medication to keep its dosage, dates and
                instructions together.
              </Text>
            </View>
          ) : (
            records.map((record) => {
              const status = statuses.find(
                (item) => item.value === record.status,
              )!;

              return (
                <View key={record.id} style={styles.recordCard}>
                  <View style={styles.recordHeader}>
                    <View style={styles.recordIcon}>
                      <Ionicons
                        name="medical"
                        size={22}
                        color="#71579C"
                      />
                    </View>

                    <View style={styles.flex}>
                      <Text style={styles.recordEyebrow}>
                        OWNER-ENTERED
                      </Text>
                      <Text style={styles.medicineName}>
                        {record.medicineName}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: status.background },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          { color: status.color },
                        ]}
                      >
                        {status.label}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.doseBox}>
                    <Text style={styles.detailLabel}>
                      PRESCRIBED DOSAGE
                    </Text>
                    <Text style={styles.doseText}>{record.dosage}</Text>

                    <Text style={styles.frequency}>
                      {record.frequency}
                    </Text>
                  </View>

                  <View style={styles.dateRow}>
                    <View style={styles.dateColumn}>
                      <Text style={styles.detailLabel}>START DATE</Text>
                      <Text style={styles.detailValue}>
                        {record.startDate}
                      </Text>
                    </View>
                    <View style={styles.dateColumn}>
                      <Text style={styles.detailLabel}>END DATE</Text>
                      <Text style={styles.detailValue}>
                        {record.endDate ?? 'Not specified'}
                      </Text>
                    </View>
                  </View>

                  {!!record.instructions && (
                    <View style={styles.instructions}>
                      <Text style={styles.detailLabel}>
                        VET’S INSTRUCTIONS
                      </Text>
                      <Text style={styles.instructionText}>
                        {record.instructions}
                      </Text>
                    </View>
                  )}

                  {!formOpen && (
                    <View style={styles.recordActions}>
                      <Pressable
                        onPress={() => startEdit(record)}
                        disabled={locked}
                        accessibilityRole="button"
                        style={[
                          styles.secondaryButton,
                          locked && styles.disabled,
                        ]}
                      >
                        <Ionicons
                          name="create-outline"
                          size={17}
                          color="#71579C"
                        />
                        <Text style={styles.secondaryText}>Edit</Text>
                      </Pressable>

                      <Pressable
                        onPress={() => confirmDelete(record)}
                        disabled={locked}
                        accessibilityRole="button"
                        style={[
                          styles.deleteButton,
                          locked && styles.disabled,
                        ]}
                      >
                        {deletingId === record.id ? (
                          <ActivityIndicator size="small" color="#B76555" />
                        ) : (
                          <Ionicons
                            name="trash-outline"
                            size={16}
                            color="#B76555"
                          />
                        )}
                        <Text style={styles.deleteText}>
                          {deletingId === record.id ? 'Deleting…' : 'Delete'}
                        </Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 8, marginBottom: 26 },
  flex: { flex: 1 },
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 17,
  },
  headingIcon: {
    width: 51,
    height: 55,
    borderRadius: 18,
    backgroundColor: '#EDE6F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: {
    color: '#9A8AA9',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.3,
  },
  title: {
    color: '#304439',
    fontSize: 23,
    fontWeight: '800',
    marginTop: 4,
  },
  subtitle: {
    color: '#93899A',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 4,
  },
  summary: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#EEE8F5',
    borderRadius: 22,
    padding: 18,
    marginBottom: 17,
  },
  summaryLabel: {
    color: '#937CAB',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
  },
  summaryCount: {
    color: '#624B82',
    fontSize: 31,
    fontWeight: '800',
    marginTop: 4,
  },
  hint: {
    color: '#9988AB',
    fontSize: 10,
    lineHeight: 16,
    marginTop: 4,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: '#71579C',
    paddingHorizontal: 13,
    paddingVertical: 13,
    borderRadius: 13,
  },
  primaryText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F0EAF6',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
  },
  secondaryText: {
    color: '#71579C',
    fontSize: 11,
    fontWeight: '800',
  },
  disabled: { opacity: 0.45 },
  formCard: {
    padding: 18,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E6DDEC',
    backgroundColor: '#FFFFFF',
    marginBottom: 20,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  formTitle: {
    color: '#3F384B',
    fontSize: 18,
    fontWeight: '800',
  },
  closeButton: {
    width: 37,
    height: 37,
    borderRadius: 12,
    backgroundColor: '#F2EDF7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  field: { marginBottom: 15 },
  label: {
    color: '#63566F',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 7,
  },
  input: {
    minHeight: 47,
    borderWidth: 1,
    borderColor: '#E9E2EF',
    backgroundColor: '#FBF9FD',
    borderRadius: 13,
    paddingHorizontal: 13,
    paddingVertical: 12,
    fontSize: 13,
    color: '#3F384B',
  },
  multiline: { minHeight: 100, lineHeight: 20 },
  statusOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginBottom: 16,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 11,
  },
  statusText: { fontSize: 10, fontWeight: '800' },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    backgroundColor: '#F2EDF7',
    borderRadius: 12,
  },
  noteText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 17,
    color: '#8B789D',
  },
  error: {
    color: '#B65D52',
    fontSize: 12,
    lineHeight: 19,
    marginVertical: 10,
  },
  formActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 18,
  },
  messageCard: {
    padding: 22,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    gap: 10,
  },
  messageText: { color: '#958A9E', fontSize: 12 },
  smallButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 12,
  },
  listTitle: {
    color: '#5B5066',
    fontSize: 14,
    fontWeight: '800',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    padding: 25,
    borderRadius: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEE7F2',
  },
  emptyIcon: {
    width: 65,
    height: 65,
    borderRadius: 22,
    backgroundColor: '#F0EAF7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  emptyTitle: {
    color: '#554761',
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptyText: {
    color: '#9A8EA3',
    fontSize: 12,
    lineHeight: 20,
    marginTop: 8,
    textAlign: 'center',
  },
  recordCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAE3EF',
    borderRadius: 22,
    padding: 17,
    marginBottom: 13,
  },
  recordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 15,
  },
  recordIcon: {
    width: 42,
    height: 46,
    borderRadius: 15,
    backgroundColor: '#EEE8F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordEyebrow: {
    color: '#AA99B5',
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: 1,
  },
  medicineName: {
    color: '#473D51',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 5,
  },
  statusBadge: {
    borderRadius: 9,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  doseBox: {
    backgroundColor: '#F7F3FB',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  detailLabel: {
    color: '#A18BAB',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  doseText: {
    color: '#68517D',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '700',
    marginTop: 7,
  },
  frequency: {
    color: '#9985A9',
    fontSize: 12,
    lineHeight: 19,
    marginTop: 5,
  },
  dateRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
    marginBottom: 16,
  },
  dateColumn: { flexGrow: 1 },
  detailValue: {
    color: '#74637F',
    fontSize: 12,
    marginTop: 6,
  },
  instructions: { marginBottom: 16 },
  instructionText: {
    color: '#877590',
    fontSize: 12,
    lineHeight: 20,
    marginTop: 6,
  },
  recordActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: '#F0EAF4',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: '#FBEEEB',
  },
  deleteText: {
    color: '#B76555',
    fontSize: 11,
    fontWeight: '700',
  },
});