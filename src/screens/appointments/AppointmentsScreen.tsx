import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  Alert,
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
import {
  cancelMyVetBooking,
  listMyVetBookings,
  respondToReschedule,
  type VetBooking,
} from '../../services/vets';

type Props = NativeStackScreenProps<
  RootStackParamList,
  'Appointments'
>;

type TabMode = 'vet_bookings' | 'personal_notes';

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

export default function AppointmentsScreen({ route, navigation }: Props) {
  const petId = route.params?.petId ?? '';
  const petName = route.params?.petName ?? 'Your Pets';

  const [activeMode, setActiveMode] = useState<TabMode>('vet_bookings');

  // Vet bookings state
  const [vetBookings, setVetBookings] = useState<VetBooking[]>([]);
  const [vetBookingsLoading, setVetBookingsLoading] = useState(true);
  const [actionBusy, setActionBusy] = useState(false);

  // Cancel modal state
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelBookingId, setCancelBookingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // Personal appointments state
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

  const fetchVetBookings = useCallback(async () => {
    setVetBookingsLoading(true);
    try {
      const all = await listMyVetBookings();
      // Filter for this pet if petId is provided
      const forPet = petId ? all.filter((b) => b.petId === petId) : all;
      if (mounted.current) setVetBookings(forPet);
    } catch {
      // Ignored if fail
    } finally {
      if (mounted.current) setVetBookingsLoading(false);
    }
  }, [petId]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const version = ++requestVersion.current;

      setLoading(true);
      setLoadError('');

      void fetchVetBookings();

      if (petId) {
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
      } else {
        setRecords([]);
        setLoading(false);
      }

      return () => {
        active = false;
      };
    }, [petId, retry, fetchVetBookings]),
  );

  async function handleAcceptReschedule(bookingId: string) {
    setActionBusy(true);
    try {
      await respondToReschedule(bookingId, 'accept');
      await fetchVetBookings();
      Alert.alert('Reschedule Accepted', 'The appointment time has been updated.');
    } catch (err) {
      Alert.alert('Could not accept reschedule', err instanceof Error ? err.message : 'Please retry.');
    } finally {
      setActionBusy(false);
    }
  }

  async function handleDeclineReschedule(bookingId: string) {
    setActionBusy(true);
    try {
      await respondToReschedule(bookingId, 'decline');
      await fetchVetBookings();
    } catch (err) {
      Alert.alert('Could not decline reschedule', err instanceof Error ? err.message : 'Please retry.');
    } finally {
      setActionBusy(false);
    }
  }

  async function handleCancelVetBookingSubmit() {
    if (!cancelBookingId) return;
    setActionBusy(true);
    try {
      await cancelMyVetBooking(cancelBookingId, cancelReason.trim());
      setCancelModalOpen(false);
      setCancelReason('');
      await fetchVetBookings();
    } catch (err) {
      Alert.alert('Could not cancel booking', err instanceof Error ? err.message : 'Please retry.');
    } finally {
      setActionBusy(false);
    }
  }

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
        <Text style={styles.title}>{petName}'s Appointments</Text>
        <Text style={styles.description}>
          Manage verified veterinary clinic bookings and your personal visit notes.
        </Text>

        {/* MODE SWITCHER */}
        <View style={styles.modePillRow}>
          <Pressable
            onPress={() => setActiveMode('vet_bookings')}
            style={[styles.modePill, activeMode === 'vet_bookings' && styles.modePillActive]}
          >
            <Ionicons
              name="medkit"
              size={14}
              color={activeMode === 'vet_bookings' ? '#FFFFFF' : '#71579C'}
            />
            <Text
              style={[styles.modePillText, activeMode === 'vet_bookings' && styles.modePillTextActive]}
            >
              Verified Vet Bookings ({vetBookings.length})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveMode('personal_notes')}
            style={[styles.modePill, activeMode === 'personal_notes' && styles.modePillActive]}
          >
            <Ionicons
              name="document-text-outline"
              size={14}
              color={activeMode === 'personal_notes' ? '#FFFFFF' : '#71579C'}
            />
            <Text
              style={[styles.modePillText, activeMode === 'personal_notes' && styles.modePillTextActive]}
            >
              Personal Notes ({records.length})
            </Text>
          </Pressable>
        </View>

        {/* ========================================================
            MODE: VERIFIED VET BOOKINGS
           ======================================================== */}
        {activeMode === 'vet_bookings' && (
          <View style={{ gap: 14 }}>
            <Pressable
              style={styles.bookVetBtn}
              onPress={() => navigation.navigate('FindVet')}
            >
              <Ionicons name="calendar" size={17} color="#FFFFFF" />
              <Text style={styles.bookVetBtnText}>+ Book Appointment with a Vet</Text>
            </Pressable>

            {vetBookingsLoading ? (
              <View style={styles.centerBox}>
                <ActivityIndicator size="small" color="#71579C" />
                <Text style={styles.loadingText}>Loading verified clinic bookings…</Text>
              </View>
            ) : vetBookings.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="calendar-outline" size={32} color="#71579C" />
                <Text style={styles.emptyTitle}>No vet appointments yet</Text>
                <Text style={styles.emptySub}>
                  Find verified veterinarians, select available clinic time slots, and track visit status in real-time.
                </Text>
              </View>
            ) : (
              vetBookings.map((b) => {
                const isPending = b.status === 'pending';
                const isConfirmed = b.status === 'confirmed';
                const isCompleted = b.status === 'completed';
                const isCancelled = b.status === 'cancelled';
                const isRejected = b.status === 'rejected';

                const hasReschedule = b.rescheduleProposal && b.rescheduleProposal.status === 'pending';

                return (
                  <View key={b.id} style={styles.card}>
                    <View style={styles.cardTop}>
                      <View>
                        <Text style={styles.heading}>{b.clinicName}</Text>
                        <Text style={styles.vetDoctorText}>Dr. {b.vetName}</Text>
                        <Text style={styles.bookingRefText}>Ref: {b.bookingNumber}</Text>
                      </View>

                      <View
                        style={[
                          styles.statusBadge,
                          isConfirmed && styles.statusBadgeConfirmed,
                          isPending && styles.statusBadgePending,
                          isCompleted && styles.statusBadgeCompleted,
                          (isCancelled || isRejected) && styles.statusBadgeCancelled,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusBadgeText,
                            isConfirmed && styles.statusTextConfirmed,
                            isPending && styles.statusTextPending,
                            isCompleted && styles.statusTextCompleted,
                            (isCancelled || isRejected) && styles.statusTextCancelled,
                          ]}
                        >
                          {b.status.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.dateTimeRow}>
                      <Ionicons name="time-outline" size={15} color="#71579C" />
                      <Text style={styles.dateTimeText}>
                        {b.date} at {b.time} ({b.durationMinutes} min consultation)
                      </Text>
                    </View>

                    <View style={styles.reasonCard}>
                      <Text style={styles.reasonLabel}>REASON FOR VISIT</Text>
                      <Text style={styles.reasonVal}>{b.reason}</Text>
                      {b.notes ? <Text style={styles.notesVal}>Notes: {b.notes}</Text> : null}
                    </View>

                    {/* RESCHEDULE PROPOSAL BANNER */}
                    {hasReschedule && (
                      <View style={styles.rescheduleAlert}>
                        <Ionicons name="calendar" size={18} color="#976A17" />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.rescheduleAlertTitle}>Doctor Proposed Rescheduling</Text>
                          <Text style={styles.rescheduleAlertText}>
                            Dr. {b.vetName} proposed to change your visit to{' '}
                            <Text style={{ fontWeight: '800' }}>
                              {b.rescheduleProposal!.proposedDate} at {b.rescheduleProposal!.proposedTime}
                            </Text>
                            {b.rescheduleProposal!.reason ? ` (${b.rescheduleProposal!.reason})` : ''}.
                          </Text>

                          <View style={styles.rescheduleActions}>
                            <Pressable
                              onPress={() => handleAcceptReschedule(b.id)}
                              disabled={actionBusy}
                              style={styles.rescheduleAcceptBtn}
                            >
                              <Text style={styles.rescheduleAcceptBtnText}>Accept New Time</Text>
                            </Pressable>
                            <Pressable
                              onPress={() => handleDeclineReschedule(b.id)}
                              disabled={actionBusy}
                              style={styles.rescheduleDeclineBtn}
                            >
                              <Text style={styles.rescheduleDeclineBtnText}>Decline</Text>
                            </Pressable>
                          </View>
                        </View>
                      </View>
                    )}

                    {/* REJECTION / CANCELLATION REASON */}
                    {b.rejectionReason ? (
                      <View style={styles.cancelNotice}>
                        <Text style={styles.cancelNoticeLabel}>Clinic rejection note:</Text>
                        <Text style={styles.cancelNoticeText}>{b.rejectionReason}</Text>
                      </View>
                    ) : null}
                    {b.cancellationReason ? (
                      <View style={styles.cancelNotice}>
                        <Text style={styles.cancelNoticeLabel}>
                          Cancelled by {b.cancelledBy || 'user'}:
                        </Text>
                        <Text style={styles.cancelNoticeText}>{b.cancellationReason}</Text>
                      </View>
                    ) : null}

                    {/* ACTIONS */}
                    {(isPending || isConfirmed) && (
                      <Pressable
                        onPress={() => {
                          setCancelBookingId(b.id);
                          setCancelReason('');
                          setCancelModalOpen(true);
                        }}
                        style={styles.cancelBookingLink}
                      >
                        <Text style={styles.cancelBookingLinkText}>Cancel Booking</Text>
                      </Pressable>
                    )}
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* ========================================================
            MODE: PERSONAL VISIT NOTES (ORIGINAL CRUD)
           ======================================================== */}
        {activeMode === 'personal_notes' && (
          <View style={{ gap: 14 }}>
            {!formOpen && (
              <Pressable
                style={styles.button}
                onPress={() => openForm()}
                disabled={saving || loading}
                accessibilityRole="button"
              >
                <Text style={styles.buttonText}>+ Add Personal Visit Note</Text>
              </Pressable>
            )}

            {formOpen && (
              <View style={styles.card}>
                <Text style={styles.heading}>
                  {editingId ? 'Edit Personal Visit Note' : 'New Personal Visit Note'}
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
                    {saving ? 'Please wait…' : 'Save Note'}
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
              <Text style={styles.description}>No personal visit notes saved yet.</Text>
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
          </View>
        )}
      </ScrollView>

      {/* CANCEL MODAL FOR OWNER */}
      <Modal visible={cancelModalOpen} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.promptCard}>
            <Text style={styles.promptTitle}>Cancel Appointment</Text>
            <Text style={styles.promptSub}>
              Are you sure you want to cancel this appointment? You can provide a reason for the doctor below.
            </Text>

            <TextInput
              style={[styles.input, { minHeight: 70, marginTop: 8 }]}
              value={cancelReason}
              onChangeText={setCancelReason}
              placeholder="Reason for cancelling (optional)..."
              placeholderTextColor="#958A81"
              multiline
              maxLength={300}
            />

            <View style={styles.promptActions}>
              <Pressable
                onPress={() => setCancelModalOpen(false)}
                disabled={actionBusy}
                style={styles.promptCancelBtn}
              >
                <Text style={styles.promptCancelBtnText}>Keep Appointment</Text>
              </Pressable>
              <Pressable
                onPress={handleCancelVetBookingSubmit}
                disabled={actionBusy}
                style={styles.promptConfirmDanger}
              >
                {actionBusy ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.promptConfirmDangerText}>Confirm Cancel</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FAFAF8' },
  content: {
    padding: 20,
    gap: 16,
    width: '100%',
    maxWidth: 580,
    alignSelf: 'center',
  },
  title: { fontSize: 26, fontWeight: '800', color: '#20352F' },
  heading: { fontSize: 16, fontWeight: '800', color: '#20352F' },
  description: { fontSize: 13, lineHeight: 20, color: '#777184' },
  label: { fontSize: 12, fontWeight: '600', color: '#343047' },
  modePillRow: { flexDirection: 'row', gap: 8, marginVertical: 4 },
  modePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEE9FA',
  },
  modePillActive: { backgroundColor: '#67539B', borderColor: '#67539B' },
  modePillText: { fontSize: 11, fontWeight: '700', color: '#67539B' },
  modePillTextActive: { color: '#FFFFFF' },
  bookVetBtn: {
    backgroundColor: '#67539B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  bookVetBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  centerBox: { alignItems: 'center', paddingVertical: 20, gap: 6 },
  loadingText: { color: '#67539B', fontSize: 12 },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#EEE9FA',
  },
  emptyTitle: { fontSize: 15, fontWeight: '800', color: '#20352F' },
  emptySub: { fontSize: 12, color: '#777184', textAlign: 'center', lineHeight: 17 },
  card: {
    padding: 16,
    gap: 10,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEE9FA',
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  vetDoctorText: { fontSize: 12, fontWeight: '700', color: '#67539B', marginTop: 1 },
  bookingRefText: { fontSize: 10, color: '#958A81', marginTop: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusBadgeConfirmed: { backgroundColor: '#E4EFE8' },
  statusTextConfirmed: { color: '#2F7C5D', fontSize: 9, fontWeight: '800' },
  statusBadgePending: { backgroundColor: '#FFF0C9' },
  statusTextPending: { color: '#976A17', fontSize: 9, fontWeight: '800' },
  statusBadgeCompleted: { backgroundColor: '#EBF3FB' },
  statusTextCompleted: { color: '#4A75A0', fontSize: 9, fontWeight: '800' },
  statusBadgeCancelled: { backgroundColor: '#FDEAE8' },
  statusTextCancelled: { color: '#BA5648', fontSize: 9, fontWeight: '800' },
  statusBadgeText: { fontSize: 9, fontWeight: '800' },
  dateTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dateTimeText: { fontSize: 12, fontWeight: '700', color: '#304439' },
  reasonCard: {
    backgroundColor: '#FAF8FD',
    borderRadius: 10,
    padding: 10,
    gap: 2,
    borderWidth: 1,
    borderColor: '#EEE9FA',
  },
  reasonLabel: { fontSize: 8, fontWeight: '800', color: '#67539B', letterSpacing: 0.5 },
  reasonVal: { fontSize: 12, color: '#304439', fontWeight: '600' },
  notesVal: { fontSize: 11, color: '#777184', marginTop: 2 },
  rescheduleAlert: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#FFF0C9',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F3DB98',
  },
  rescheduleAlertTitle: { fontSize: 12, fontWeight: '800', color: '#7D5305' },
  rescheduleAlertText: { fontSize: 11, color: '#976A17', marginTop: 2, lineHeight: 16 },
  rescheduleActions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  rescheduleAcceptBtn: {
    backgroundColor: '#2F7C5D',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  rescheduleAcceptBtnText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  rescheduleDeclineBtn: {
    backgroundColor: '#FDEAE8',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  rescheduleDeclineBtnText: { color: '#BA5648', fontSize: 11, fontWeight: '800' },
  cancelNotice: {
    backgroundColor: '#FDEAE8',
    padding: 10,
    borderRadius: 8,
    gap: 2,
  },
  cancelNoticeLabel: { fontSize: 9, fontWeight: '800', color: '#BA5648' },
  cancelNoticeText: { fontSize: 11, color: '#BA5648' },
  cancelBookingLink: { alignSelf: 'flex-start', paddingVertical: 4 },
  cancelBookingLinkText: { fontSize: 11, fontWeight: '700', color: '#BA5648' },
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  promptCard: {
    width: '100%',
    maxWidth: 450,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    gap: 10,
  },
  promptTitle: { fontSize: 16, fontWeight: '800', color: '#304439' },
  promptSub: { fontSize: 12, color: '#777184', lineHeight: 17 },
  promptActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 10 },
  promptCancelBtn: { paddingHorizontal: 12, paddingVertical: 10 },
  promptCancelBtnText: { fontSize: 12, fontWeight: '700', color: '#777184' },
  promptConfirmDanger: {
    backgroundColor: '#BA5648',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  promptConfirmDangerText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
});