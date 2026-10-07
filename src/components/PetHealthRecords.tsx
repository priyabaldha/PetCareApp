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
  deleteHealthRecord,
  listHealthRecords,
  saveHealthRecord,
} from '../services/healthRecords';

import type {
  HealthRecord,
  HealthRecordInput,
} from '../services/healthRecords';

interface Props {
  petId: string;
  petName: string;
  disabled?: boolean;
}

interface FormField {
  key: keyof HealthRecordInput;
  label: string;
  placeholder: string;
  maxLength: number;
  multiline?: boolean;
}

const formFields: FormField[] = [
  {
    key: 'visitDate',
    label: 'Visit date *',
    placeholder: 'YYYY-MM-DD',
    maxLength: 10,
  },
  {
    key: 'clinicName',
    label: 'Clinic name *',
    placeholder: 'Where did the visit take place?',
    maxLength: 150,
  },
  {
    key: 'vetName',
    label: 'Veterinarian',
    placeholder: 'Vet name, if known',
    maxLength: 100,
  },
  {
    key: 'symptoms',
    label: 'Symptoms / reason for visit *',
    placeholder: 'For example: routine check-up',
    maxLength: 1000,
    multiline: true,
  },
  {
    key: 'diagnosis',
    label: 'Diagnosis provided by the vet',
    placeholder: 'Leave blank if no diagnosis was provided',
    maxLength: 2000,
    multiline: true,
  },
  {
    key: 'treatment',
    label: 'Treatment / instructions from the vet',
    placeholder: 'Copy the instructions provided during the visit',
    maxLength: 2000,
    multiline: true,
  },
  {
    key: 'notes',
    label: 'Additional notes',
    placeholder: 'Anything else you want to remember',
    maxLength: 2000,
    multiline: true,
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

function emptyForm(): HealthRecordInput {
  return {
    visitDate: today(),
    clinicName: '',
    vetName: '',
    symptoms: '',
    diagnosis: '',
    treatment: '',
    notes: '',
  };
}

function validateForm(form: HealthRecordInput): string | null {
  const date = new Date(`${form.visitDate}T00:00:00.000Z`);

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(form.visitDate) ||
    !Number.isFinite(date.getTime()) ||
    date.toISOString().slice(0, 10) !== form.visitDate ||
    form.visitDate < '1900-01-01'
  ) {
    return 'Enter a valid visit date in YYYY-MM-DD format.';
  }

  if (form.visitDate > today()) {
    return 'Use appointments to record a future visit.';
  }

  if (form.clinicName.trim().length < 2) {
    return 'Enter a clinic name with at least 2 characters.';
  }

  if (form.symptoms.trim().length < 2) {
    return 'Enter the symptoms or reason for this visit.';
  }

  return null;
}

function sortRecords(records: HealthRecord[]) {
  return [...records].sort(
    (a, b) =>
      b.visitDate.localeCompare(a.visitDate) ||
      b.createdAt.localeCompare(a.createdAt) ||
      b.id.localeCompare(a.id),
  );
}

function messageFrom(error: unknown) {
  return error instanceof Error
    ? error.message
    : 'Something went wrong. Please try again.';
}

export default function PetHealthRecords({
  petId,
  petName,
  disabled = false,
}: Props) {
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [retry, setRetry] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<HealthRecordInput>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [actionError, setActionError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const mounted = useRef(false);
  const busy = useRef(false);
  const requestVersion = useRef(0);

  const locked = disabled || saving || deletingId !== null;

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

      // Avoid starting a fetch while a mutation is pending.
      if (busy.current) return;

      const version = ++requestVersion.current;

      setLoading(true);
      setLoadError('');

      async function load() {
        try {
          const result = await listHealthRecords(petId);

          if (active && version === requestVersion.current) {
            setRecords(sortRecords(result));
          }
        } catch (error: unknown) {
          if (active && version === requestVersion.current) {
            setLoadError(messageFrom(error));
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

  function startEdit(record: HealthRecord) {
    if (locked || busy.current || loading) return;

    setEditingId(record.id);

    setForm({
      visitDate: record.visitDate,
      clinicName: record.clinicName,
      vetName: record.vetName,
      symptoms: record.symptoms,
      diagnosis: record.diagnosis,
      treatment: record.treatment,
      notes: record.notes,
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
      const saved = await saveHealthRecord(
        petId,
        form,
        editingId ?? undefined,
      );

      if (!mounted.current) return;

      setRecords((current) =>
        sortRecords([
          saved,
          ...current.filter((record) => record.id !== saved.id),
        ]),
      );

      setExpandedId(saved.id);
      setFormOpen(false);
      setEditingId(null);
      setForm(emptyForm());
    } catch (error: unknown) {
      if (mounted.current) {
        setActionError(
          `${messageFrom(error)} If the connection was interrupted, ` +
            'close the form and refresh the list before retrying; ' +
            'the change may already have been saved.',
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

  async function remove(record: HealthRecord) {
    if (disabled || busy.current || !mounted.current) return;

    busy.current = true;
    requestVersion.current += 1;
    setDeletingId(record.id);
    setActionError('');

    try {
      await deleteHealthRecord(petId, record.id);

      if (!mounted.current) return;

      setRecords((current) =>
        current.filter((item) => item.id !== record.id),
      );

      setExpandedId((current) =>
        current === record.id ? null : current,
      );
    } catch (error: unknown) {
      if (mounted.current) {
        setActionError(
          `${messageFrom(error)} Refresh the list to confirm whether ` +
            'the record was removed before retrying.',
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

  function confirmDelete(record: HealthRecord) {
    if (locked || busy.current) return;

    Alert.alert(
      'Delete health record?',
      `Remove the visit to ${record.clinicName} on ${record.visitDate}? This cannot be undone.`,
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
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons
            name="medkit-outline"
            size={25}
            color="#71579C"
          />
        </View>

        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>THEIR CARE JOURNEY</Text>
          <Text style={styles.title}>Health records</Text>
          <Text style={styles.subtitle}>
            Visits, notes and little details for {petName}.
          </Text>
        </View>
      </View>

      <View style={styles.summary}>
        <View style={styles.summaryCopy}>
          <Text style={styles.summaryLabel}>SAVED VISITS</Text>
          <Text style={styles.summaryCount}>
            {loading || loadError ? '—' : records.length}
          </Text>
          <Text style={styles.summaryHint}>
            Your pet’s history, kept together.
          </Text>
        </View>

        {!formOpen && (
          <Pressable
            onPress={startAdd}
            disabled={locked || loading || !!loadError}
            accessibilityRole="button"
            style={[
              styles.addButton,
              (locked || loading || !!loadError) && styles.disabled,
            ]}
          >
            <Ionicons name="add" size={19} color="#FFFFFF" />
            <Text style={styles.buttonText}>Add visit</Text>
          </Pressable>
        )}
      </View>

      {/* FORM */}

      {formOpen && (
        <View style={styles.formCard}>
          <View style={styles.formHeading}>
            <View style={styles.formHeadingCopy}>
              <Text style={styles.formTitle}>
                {editingId ? 'Edit visit' : 'A new care memory'}
              </Text>
              <Text style={styles.formSubtitle}>
                Fields marked * are required.
              </Text>
            </View>

            <Pressable
              onPress={cancelForm}
              disabled={locked}
              accessibilityRole="button"
              accessibilityLabel="Close health record form"
              style={styles.closeButton}
            >
              <Ionicons name="close" size={21} color="#71579C" />
            </Pressable>
          </View>

          {formFields.map((field) => (
            <View key={field.key} style={styles.field}>
              <Text style={styles.fieldLabel}>{field.label}</Text>

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
                placeholderTextColor="#A399AA"
                maxLength={field.maxLength}
                multiline={field.multiline}
                textAlignVertical={field.multiline ? 'top' : 'center'}
                autoCapitalize={
                  field.key === 'visitDate' ? 'none' : 'sentences'
                }
                autoCorrect={field.key !== 'visitDate'}
                accessibilityLabel={field.label}
                style={[
                  styles.input,
                  field.multiline && styles.multilineInput,
                ]}
              />
            </View>
          ))}

          <View style={styles.note}>
            <Ionicons
              name="information-circle-outline"
              size={18}
              color="#71579C"
            />
            <Text style={styles.noteText}>
              These are owner-entered records. Add diagnoses and
              treatment instructions only as provided by your vet.
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
              style={[styles.cancelButton, locked && styles.disabled]}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                void save();
              }}
              disabled={locked || loading}
              accessibilityRole="button"
              style={[
                styles.saveButton,
                (locked || loading) && styles.disabled,
              ]}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons
                  name="checkmark"
                  size={19}
                  color="#FFFFFF"
                />
              )}

              <Text style={styles.buttonText}>
                {saving ? 'Saving…' : 'Save record'}
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

      {/* LIST */}

      {loading ? (
        <View style={styles.messageCard}>
          <ActivityIndicator color="#71579C" />
          <Text style={styles.messageText}>Loading health records…</Text>
        </View>
      ) : loadError ? (
        <View style={styles.messageCard}>
          <Text style={styles.error}>{loadError}</Text>

          <Pressable
            onPress={() => setRetry((value) => value + 1)}
            disabled={locked}
            accessibilityRole="button"
            style={styles.retryButton}
          >
            <Text style={styles.linkText}>Try again</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <View style={styles.listHeading}>
            <Text style={styles.listTitle}>Visit history</Text>

            <Pressable
              onPress={() => setRetry((value) => value + 1)}
              disabled={locked}
              accessibilityRole="button"
              accessibilityLabel="Refresh health records"
              style={styles.refreshButton}
            >
              <Ionicons
                name="refresh-outline"
                size={16}
                color="#71579C"
              />
              <Text style={styles.linkText}>Refresh</Text>
            </Pressable>
          </View>

          {records.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name="document-text-outline"
                  size={30}
                  color="#71579C"
                />
              </View>

              <Text style={styles.emptyTitle}>
                Their story starts here.
              </Text>

              <Text style={styles.emptyDescription}>
                Add a completed vet visit to keep notes and care
                instructions together.
              </Text>
            </View>
          ) : (
            records.map((record) => {
              const expanded = expandedId === record.id;
              const deleting = deletingId === record.id;

              return (
                <View key={record.id} style={styles.recordCard}>
                  <Pressable
                    onPress={() =>
                      setExpandedId(expanded ? null : record.id)
                    }
                    accessibilityRole="button"
                    accessibilityState={{ expanded }}
                    accessibilityLabel={`${record.clinicName}, ${record.visitDate}`}
                    style={styles.recordHeader}
                  >
                    <View style={styles.recordIcon}>
                      <Ionicons
                        name="medical-outline"
                        size={21}
                        color="#5B8A77"
                      />
                    </View>

                    <View style={styles.recordHeading}>
                      <Text style={styles.recordDate}>
                        {record.visitDate}
                      </Text>
                      <Text style={styles.clinicName}>
                        {record.clinicName}
                      </Text>
                      <Text
                        style={styles.recordPreview}
                        numberOfLines={expanded ? undefined : 2}
                      >
                        {record.symptoms}
                      </Text>
                    </View>

                    <Ionicons
                      name={
                        expanded ? 'chevron-up' : 'chevron-down'
                      }
                      size={18}
                      color="#9C91A7"
                    />
                  </Pressable>

                  {expanded && (
                    <View style={styles.recordBody}>
                      <View style={styles.ownerBadge}>
                        <Text style={styles.ownerBadgeText}>
                          OWNER-ENTERED RECORD
                        </Text>
                      </View>

                      <RecordDetail
                        label="Veterinarian"
                        value={record.vetName || 'Not provided'}
                      />
                      <RecordDetail
                        label="Symptoms / reason for visit"
                        value={record.symptoms}
                      />
                      <RecordDetail
                        label="Diagnosis provided by the vet"
                        value={record.diagnosis || 'Not recorded'}
                      />
                      <RecordDetail
                        label="Treatment / instructions"
                        value={record.treatment || 'Not recorded'}
                      />
                      <RecordDetail
                        label="Additional notes"
                        value={record.notes || 'No additional notes'}
                      />

                      {!formOpen && (
                        <View style={styles.recordActions}>
                          <Pressable
                            onPress={() => startEdit(record)}
                            disabled={locked}
                            accessibilityRole="button"
                            style={[
                              styles.editButton,
                              locked && styles.disabled,
                            ]}
                          >
                            <Ionicons
                              name="create-outline"
                              size={17}
                              color="#71579C"
                            />
                            <Text style={styles.linkText}>Edit</Text>
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
                            {deleting ? (
                              <ActivityIndicator
                                size="small"
                                color="#BA655A"
                              />
                            ) : (
                              <Ionicons
                                name="trash-outline"
                                size={16}
                                color="#BA655A"
                              />
                            )}
                            <Text style={styles.deleteText}>
                              {deleting ? 'Deleting…' : 'Delete'}
                            </Text>
                          </Pressable>
                        </View>
                      )}
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

function RecordDetail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.detail}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 24,
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 17,
  },
  headerIcon: {
    width: 51,
    height: 55,
    borderRadius: 18,
    backgroundColor: '#EDE6F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: { flex: 1 },
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
    letterSpacing: -0.5,
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
    justifyContent: 'space-between',
    gap: 15,
    backgroundColor: '#EEE8F5',
    borderRadius: 22,
    padding: 19,
    marginBottom: 16,
  },
  summaryCopy: { flexGrow: 1 },
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
  summaryHint: {
    color: '#9988AB',
    fontSize: 10,
    marginTop: 3,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#71579C',
    borderRadius: 13,
    paddingHorizontal: 13,
    paddingVertical: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 12,
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
  formHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  formHeadingCopy: { flex: 1 },
  formTitle: {
    color: '#3F384B',
    fontSize: 18,
    fontWeight: '800',
  },
  formSubtitle: {
    color: '#A096A9',
    fontSize: 10,
    marginTop: 5,
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F2EDF7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  field: { marginBottom: 15 },
  fieldLabel: {
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
  multilineInput: {
    minHeight: 95,
    lineHeight: 20,
  },
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
    gap: 10,
    marginTop: 18,
  },
  cancelButton: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 13,
    borderRadius: 13,
    backgroundColor: '#F1EDF5',
  },
  cancelText: {
    color: '#7E6A93',
    fontSize: 12,
    fontWeight: '700',
  },
  saveButton: {
    flexGrow: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 13,
    borderRadius: 13,
    backgroundColor: '#71579C',
  },
  messageCard: {
    padding: 22,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    gap: 10,
  },
  messageText: {
    color: '#958A9E',
    fontSize: 12,
  },
  retryButton: { padding: 10 },
  listHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  listTitle: {
    color: '#5B5066',
    fontSize: 14,
    fontWeight: '800',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 10,
    paddingHorizontal: 5,
  },
  linkText: {
    color: '#71579C',
    fontSize: 11,
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
  emptyDescription: {
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
    borderRadius: 21,
    marginBottom: 12,
    overflow: 'hidden',
  },
  recordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    padding: 16,
  },
  recordIcon: {
    width: 43,
    height: 47,
    borderRadius: 15,
    backgroundColor: '#E7F0EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordHeading: { flex: 1 },
  recordDate: {
    color: '#A18CAC',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  clinicName: {
    color: '#473D51',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 5,
  },
  recordPreview: {
    color: '#9B90A3',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 4,
  },
  recordBody: {
    padding: 17,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F0EAF4',
  },
  ownerBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 7,
    backgroundColor: '#F1EDF6',
    marginBottom: 15,
  },
  ownerBadgeText: {
    color: '#9583A7',
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  detail: { marginBottom: 15 },
  detailLabel: {
    color: '#9A87AB',
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 5,
  },
  detailValue: {
    color: '#65586F',
    fontSize: 13,
    lineHeight: 21,
  },
  recordActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0EAF4',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F1EBF7',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#FBEEEB',
  },
  deleteText: {
    color: '#BA655A',
    fontSize: 11,
    fontWeight: '700',
  },
});