import React, { useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';

import {
  acceptVetBooking,
  cancelVetBooking,
  completeVetBooking,
  proposeReschedule,
  rejectVetBooking,
  type VetBooking,
  type VetBookingStatus,
} from '../../services/vets';

import VetConsultationModal from './VetConsultationModal';

interface Props {
  bookings: VetBooking[];
  loading: boolean;
  onRefresh: () => void;
  onOpenPatient: (petId: string) => void;
}

type SubFilter = 'pending' | 'confirmed' | 'completed' | 'all';

export default function VetAppointmentsTab({
  bookings,
  loading,
  onRefresh,
  onOpenPatient,
}: Props) {
  const [filter, setFilter] = useState<SubFilter>('pending');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [selectedBooking, setSelectedBooking] = useState<VetBooking | null>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');

  const [consultModalOpen, setConsultModalOpen] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState('');

  const pendingCount = bookings.filter((b) => b.status === 'pending').length;
  const confirmedCount = bookings.filter((b) => b.status === 'confirmed').length;
  const completedCount = bookings.filter((b) => b.status === 'completed').length;

  const filtered = bookings.filter((b) => {
    let matchFilter = true;
    if (filter === 'pending') matchFilter = b.status === 'pending';
    else if (filter === 'confirmed') matchFilter = b.status === 'confirmed';
    else if (filter === 'completed') matchFilter = b.status === 'completed';

    if (!matchFilter) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      b.petName.toLowerCase().includes(q) ||
      b.ownerName.toLowerCase().includes(q) ||
      b.bookingNumber.toLowerCase().includes(q) ||
      b.reason.toLowerCase().includes(q)
    );
  });

  async function handleAccept(booking: VetBooking) {
    if (actionBusy) return;
    setActionBusy(true);
    try {
      await acceptVetBooking(booking.id);
      onRefresh();
    } catch (err) {
      Alert.alert('Could not accept booking', err instanceof Error ? err.message : 'Please retry.');
    } finally {
      setActionBusy(false);
    }
  }

  async function handleRejectSubmit() {
    if (!selectedBooking || actionBusy) return;
    if (!rejectReason.trim() || rejectReason.trim().length < 3) {
      setActionError('Provide a rejection reason of at least 3 characters.');
      return;
    }

    setActionBusy(true);
    setActionError('');
    try {
      await rejectVetBooking(selectedBooking.id, rejectReason.trim());
      setRejectModalOpen(false);
      setRejectReason('');
      onRefresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not reject booking.');
    } finally {
      setActionBusy(false);
    }
  }

  async function handleCancelSubmit() {
    if (!selectedBooking || actionBusy) return;
    if (!cancelReason.trim() || cancelReason.trim().length < 3) {
      setActionError('Provide a cancellation reason of at least 3 characters.');
      return;
    }

    setActionBusy(true);
    setActionError('');
    try {
      await cancelVetBooking(selectedBooking.id, cancelReason.trim());
      setCancelModalOpen(false);
      setCancelReason('');
      onRefresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not cancel booking.');
    } finally {
      setActionBusy(false);
    }
  }

  async function handleRescheduleSubmit() {
    if (!selectedBooking || actionBusy) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(rescheduleDate.trim())) {
      setActionError('Enter a valid date (YYYY-MM-DD).');
      return;
    }
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(rescheduleTime.trim())) {
      setActionError('Enter a valid time in HH:mm format.');
      return;
    }

    setActionBusy(true);
    setActionError('');
    try {
      await proposeReschedule(
        selectedBooking.id,
        rescheduleDate.trim(),
        rescheduleTime.trim(),
        rescheduleReason.trim(),
      );
      setRescheduleModalOpen(false);
      onRefresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not propose reschedule.');
    } finally {
      setActionBusy(false);
    }
  }

  async function handleCompleteDirect(booking: VetBooking) {
    if (actionBusy) return;
    setActionBusy(true);
    try {
      await completeVetBooking(booking.id);
      onRefresh();
    } catch (err) {
      Alert.alert('Could not complete appointment', err instanceof Error ? err.message : 'Please retry.');
    } finally {
      setActionBusy(false);
    }
  }

  return (
    <View style={styles.container}>
      {/* SUB-FILTER PILLS */}
      <View style={styles.subFilterRow}>
        <Pressable
          onPress={() => setFilter('pending')}
          style={[styles.subPill, filter === 'pending' && styles.subPillActive]}
        >
          <Text
            style={[styles.subPillText, filter === 'pending' && styles.subPillTextActive]}
          >
            Pending
          </Text>
          {pendingCount > 0 && (
            <View style={[styles.badge, filter === 'pending' && styles.badgeActive]}>
              <Text style={[styles.badgeText, filter === 'pending' && styles.badgeTextActive]}>
                {pendingCount}
              </Text>
            </View>
          )}
        </Pressable>

        <Pressable
          onPress={() => setFilter('confirmed')}
          style={[styles.subPill, filter === 'confirmed' && styles.subPillActive]}
        >
          <Text
            style={[styles.subPillText, filter === 'confirmed' && styles.subPillTextActive]}
          >
            Confirmed ({confirmedCount})
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setFilter('completed')}
          style={[styles.subPill, filter === 'completed' && styles.subPillActive]}
        >
          <Text
            style={[styles.subPillText, filter === 'completed' && styles.subPillTextActive]}
          >
            Completed ({completedCount})
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setFilter('all')}
          style={[styles.subPill, filter === 'all' && styles.subPillActive]}
        >
          <Text
            style={[styles.subPillText, filter === 'all' && styles.subPillTextActive]}
          >
            All / History
          </Text>
        </Pressable>
      </View>

      {/* SEARCH BOX */}
      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={17} color="#958A81" />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search by pet, owner, or booking ref..."
          placeholderTextColor="#958A81"
        />
        {searchQuery ? (
          <Pressable onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={16} color="#958A81" />
          </Pressable>
        ) : null}
      </View>

      {/* APPOINTMENT CARDS LIST */}
      {filtered.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="calendar-outline" size={32} color="#71579C" />
          <Text style={styles.emptyTitle}>
            {filter === 'pending'
              ? 'No pending appointment requests'
              : `No ${filter} appointments found`}
          </Text>
          <Text style={styles.emptySub}>
            {filter === 'pending'
              ? 'When pet owners book appointments, they will appear here for your review.'
              : 'Try selecting a different filter above.'}
          </Text>
        </View>
      ) : (
        filtered.map((booking) => {
          const isPending = booking.status === 'pending';
          const isConfirmed = booking.status === 'confirmed';
          const isCompleted = booking.status === 'completed';
          const isCancelled = booking.status === 'cancelled';
          const isRejected = booking.status === 'rejected';

          return (
            <View key={booking.id} style={styles.card}>
              {/* CARD TOP BAR */}
              <View style={styles.cardTop}>
                <View style={styles.bookingRefBox}>
                  <Text style={styles.bookingRef}>{booking.bookingNumber}</Text>
                  <Text style={styles.bookingDate}>
                    {booking.date} • {booking.time} ({booking.durationMinutes} min)
                  </Text>
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
                    {booking.status.toUpperCase()}
                  </Text>
                </View>
              </View>

              {/* PATIENT & OWNER INFO */}
              <View style={styles.patientRow}>
                <Pressable
                  onPress={() => onOpenPatient(booking.petId)}
                  style={styles.petBadgeLink}
                >
                  <Ionicons name="paw" size={14} color="#71579C" />
                  <Text style={styles.petNameLink}>{booking.petName}</Text>
                  <Text style={styles.petSpeciesText}>
                    ({booking.petSpecies}{booking.petBreed ? ` • ${booking.petBreed}` : ''})
                  </Text>
                  <Ionicons name="open-outline" size={12} color="#71579C" />
                </Pressable>

                <View style={styles.ownerBox}>
                  <Text style={styles.ownerText}>Owner: {booking.ownerName}</Text>
                  <Text style={styles.ownerEmailText}>{booking.ownerEmail}</Text>
                </View>
              </View>

              {/* REASON & NOTES */}
              <View style={styles.reasonCard}>
                <Text style={styles.reasonLabel}>REASON FOR VISIT</Text>
                <Text style={styles.reasonText}>{booking.reason}</Text>
                {booking.notes ? (
                  <Text style={styles.notesText}>Notes: {booking.notes}</Text>
                ) : null}
              </View>

              {/* SHARING BADGE */}
              <View style={styles.sharingRow}>
                <Ionicons
                  name={booking.shareMedicalHistory ? 'shield-checkmark' : 'lock-closed'}
                  size={13}
                  color={booking.shareMedicalHistory ? '#2F7C5D' : '#958A81'}
                />
                <Text style={styles.sharingText}>
                  {booking.shareMedicalHistory
                    ? 'Owner shared full medical records for this visit'
                    : 'Minimum booking info shared (Medical history restricted)'}
                </Text>
              </View>

              {/* RESCHEDULE PROPOSAL BANNER IF PRESENT */}
              {booking.rescheduleProposal && booking.rescheduleProposal.status === 'pending' && (
                <View style={styles.rescheduleNotice}>
                  <Ionicons name="time" size={16} color="#976A17" />
                  <Text style={styles.rescheduleNoticeText}>
                    Reschedule proposal pending owner confirmation:{' '}
                    <Text style={{ fontWeight: '800' }}>
                      {booking.rescheduleProposal.proposedDate} at {booking.rescheduleProposal.proposedTime}
                    </Text>
                  </Text>
                </View>
              )}

              {/* REJECTION / CANCELLATION REASON */}
              {booking.rejectionReason ? (
                <View style={styles.cancelReasonBox}>
                  <Text style={styles.cancelReasonLabel}>Rejection reason:</Text>
                  <Text style={styles.cancelReasonText}>{booking.rejectionReason}</Text>
                </View>
              ) : null}
              {booking.cancellationReason ? (
                <View style={styles.cancelReasonBox}>
                  <Text style={styles.cancelReasonLabel}>
                    Cancelled by {booking.cancelledBy || 'user'}:
                  </Text>
                  <Text style={styles.cancelReasonText}>{booking.cancellationReason}</Text>
                </View>
              ) : null}

              {/* ACTION BUTTONS BAR */}
              <View style={styles.cardActions}>
                {isPending && (
                  <>
                    <Pressable
                      onPress={() => handleAccept(booking)}
                      disabled={actionBusy}
                      style={styles.acceptBtn}
                    >
                      <Ionicons name="checkmark-circle" size={15} color="#FFFFFF" />
                      <Text style={styles.acceptBtnText}>Confirm Appointment</Text>
                    </Pressable>

                    <Pressable
                      onPress={() => {
                        setSelectedBooking(booking);
                        setRejectReason('');
                        setActionError('');
                        setRejectModalOpen(true);
                      }}
                      disabled={actionBusy}
                      style={styles.declineBtn}
                    >
                      <Ionicons name="close-circle-outline" size={15} color="#BA5648" />
                      <Text style={styles.declineBtnText}>Decline</Text>
                    </Pressable>
                  </>
                )}

                {isConfirmed && (
                  <>
                    <Pressable
                      onPress={() => {
                        setSelectedBooking(booking);
                        setConsultModalOpen(true);
                      }}
                      style={styles.consultBtn}
                    >
                      <Ionicons name="document-text" size={15} color="#FFFFFF" />
                      <Text style={styles.consultBtnText}>Record Consultation</Text>
                    </Pressable>

                    <Pressable
                      onPress={() => {
                        setSelectedBooking(booking);
                        setRescheduleDate(booking.date);
                        setRescheduleTime(booking.time);
                        setRescheduleReason('');
                        setActionError('');
                        setRescheduleModalOpen(true);
                      }}
                      style={styles.actionBtnOutline}
                    >
                      <Ionicons name="calendar-outline" size={14} color="#71579C" />
                      <Text style={styles.actionBtnOutlineText}>Reschedule</Text>
                    </Pressable>

                    <Pressable
                      onPress={() => {
                        setSelectedBooking(booking);
                        setCancelReason('');
                        setActionError('');
                        setCancelModalOpen(true);
                      }}
                      style={styles.actionBtnOutlineDanger}
                    >
                      <Ionicons name="ban-outline" size={14} color="#BA5648" />
                      <Text style={styles.actionBtnOutlineDangerText}>Cancel</Text>
                    </Pressable>
                  </>
                )}

                {isCompleted && (
                  <Pressable
                    onPress={() => onOpenPatient(booking.petId)}
                    style={styles.actionBtnOutline}
                  >
                    <Ionicons name="folder-open-outline" size={14} color="#71579C" />
                    <Text style={styles.actionBtnOutlineText}>View Medical Chart</Text>
                  </Pressable>
                )}
              </View>
            </View>
          );
        })
      )}

      {/* REJECT MODAL */}
      <Modal visible={rejectModalOpen} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.promptCard}>
            <Text style={styles.promptTitle}>Decline Appointment Request</Text>
            <Text style={styles.promptSub}>
              Please provide a reason to the pet owner (e.g. clinic fully booked, emergency surgery).
            </Text>

            {actionError ? <Text style={styles.promptError}>{actionError}</Text> : null}

            <TextInput
              style={[styles.promptInput, { minHeight: 80 }]}
              value={rejectReason}
              onChangeText={setRejectReason}
              placeholder="Reason for declining..."
              placeholderTextColor="#958A81"
              multiline
              maxLength={500}
            />

            <View style={styles.promptActions}>
              <Pressable
                onPress={() => setRejectModalOpen(false)}
                disabled={actionBusy}
                style={styles.promptCancelBtn}
              >
                <Text style={styles.promptCancelBtnText}>Back</Text>
              </Pressable>
              <Pressable
                onPress={handleRejectSubmit}
                disabled={actionBusy}
                style={styles.promptConfirmDanger}
              >
                {actionBusy ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.promptConfirmDangerText}>Confirm Decline</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* CANCEL MODAL */}
      <Modal visible={cancelModalOpen} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.promptCard}>
            <Text style={styles.promptTitle}>Cancel Confirmed Appointment</Text>
            <Text style={styles.promptSub}>
              Enter a cancellation explanation for {selectedBooking?.petName}'s owner.
            </Text>

            {actionError ? <Text style={styles.promptError}>{actionError}</Text> : null}

            <TextInput
              style={[styles.promptInput, { minHeight: 80 }]}
              value={cancelReason}
              onChangeText={setCancelReason}
              placeholder="Reason for cancellation..."
              placeholderTextColor="#958A81"
              multiline
              maxLength={500}
            />

            <View style={styles.promptActions}>
              <Pressable
                onPress={() => setCancelModalOpen(false)}
                disabled={actionBusy}
                style={styles.promptCancelBtn}
              >
                <Text style={styles.promptCancelBtnText}>Keep Booking</Text>
              </Pressable>
              <Pressable
                onPress={handleCancelSubmit}
                disabled={actionBusy}
                style={styles.promptConfirmDanger}
              >
                {actionBusy ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.promptConfirmDangerText}>Cancel Appointment</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* RESCHEDULE MODAL */}
      <Modal visible={rescheduleModalOpen} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.promptCard}>
            <Text style={styles.promptTitle}>Propose Reschedule</Text>
            <Text style={styles.promptSub}>
              Propose a new date and time for {selectedBooking?.petName}. The owner will receive a notification to accept or decline.
            </Text>

            {actionError ? <Text style={styles.promptError}>{actionError}</Text> : null}

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>New Date *</Text>
                <TextInput
                  style={styles.promptInput}
                  value={rescheduleDate}
                  onChangeText={setRescheduleDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#958A81"
                  maxLength={10}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>New Time (HH:mm) *</Text>
                <TextInput
                  style={styles.promptInput}
                  value={rescheduleTime}
                  onChangeText={setRescheduleTime}
                  placeholder="HH:mm"
                  placeholderTextColor="#958A81"
                  maxLength={5}
                />
              </View>
            </View>

            <Text style={[styles.fieldLabel, { marginTop: 8 }]}>Reason (Optional)</Text>
            <TextInput
              style={[styles.promptInput, { minHeight: 60 }]}
              value={rescheduleReason}
              onChangeText={setRescheduleReason}
              placeholder="E.g. Earlier surgery extended..."
              placeholderTextColor="#958A81"
              multiline
              maxLength={200}
            />

            <View style={styles.promptActions}>
              <Pressable
                onPress={() => setRescheduleModalOpen(false)}
                disabled={actionBusy}
                style={styles.promptCancelBtn}
              >
                <Text style={styles.promptCancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleRescheduleSubmit}
                disabled={actionBusy}
                style={styles.promptConfirmPrimary}
              >
                {actionBusy ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.promptConfirmPrimaryText}>Send Proposal</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* CONSULTATION MODAL */}
      {selectedBooking && (
        <VetConsultationModal
          visible={consultModalOpen}
          petId={selectedBooking.petId}
          petName={selectedBooking.petName}
          bookingId={selectedBooking.id}
          onClose={() => setConsultModalOpen(false)}
          onSuccess={onRefresh}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 14 },
  subFilterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  subPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECE4F2',
  },
  subPillActive: { backgroundColor: '#71579C', borderColor: '#71579C' },
  subPillText: { fontSize: 11, fontWeight: '700', color: '#5B477A' },
  subPillTextActive: { color: '#FFFFFF' },
  badge: { backgroundColor: '#EEE6F6', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  badgeActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  badgeText: { fontSize: 9, fontWeight: '800', color: '#71579C' },
  badgeTextActive: { color: '#FFFFFF' },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ECE4F2',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: { flex: 1, fontSize: 12, color: '#304439' },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#ECE4F2',
  },
  emptyTitle: { fontSize: 14, fontWeight: '800', color: '#304439' },
  emptySub: { fontSize: 11, color: '#958A81', textAlign: 'center', lineHeight: 16 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ECE4F2',
    gap: 12,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  bookingRefBox: { gap: 2 },
  bookingRef: { fontSize: 13, fontWeight: '800', color: '#304439' },
  bookingDate: { fontSize: 11, fontWeight: '700', color: '#71579C' },
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
  patientRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  petBadgeLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F4EEF9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  petNameLink: { fontSize: 12, fontWeight: '800', color: '#71579C' },
  petSpeciesText: { fontSize: 10, color: '#5B477A' },
  ownerBox: { alignItems: 'flex-end' },
  ownerText: { fontSize: 11, fontWeight: '700', color: '#304439' },
  ownerEmailText: { fontSize: 10, color: '#958A81' },
  reasonCard: {
    backgroundColor: '#FAF8FC',
    borderRadius: 12,
    padding: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: '#ECE4F2',
  },
  reasonLabel: { fontSize: 9, fontWeight: '800', color: '#71579C', letterSpacing: 0.5 },
  reasonText: { fontSize: 12, color: '#304439', fontWeight: '600' },
  notesText: { fontSize: 11, color: '#777184', marginTop: 2 },
  sharingRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sharingText: { fontSize: 10, color: '#777184', flex: 1 },
  rescheduleNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF0C9',
    padding: 10,
    borderRadius: 10,
  },
  rescheduleNoticeText: { fontSize: 11, color: '#7D5305', flex: 1 },
  cancelReasonBox: {
    backgroundColor: '#FDEAE8',
    padding: 10,
    borderRadius: 10,
    gap: 2,
  },
  cancelReasonLabel: { fontSize: 9, fontWeight: '800', color: '#BA5648' },
  cancelReasonText: { fontSize: 11, color: '#BA5648' },
  cardActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  acceptBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#2F7C5D',
    paddingVertical: 10,
    borderRadius: 12,
  },
  acceptBtnText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  declineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#FDEAE8',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  declineBtnText: { color: '#BA5648', fontSize: 11, fontWeight: '800' },
  consultBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#71579C',
    paddingVertical: 10,
    borderRadius: 12,
  },
  consultBtnText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  actionBtnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECE4F2',
  },
  actionBtnOutlineText: { color: '#71579C', fontSize: 11, fontWeight: '700' },
  actionBtnOutlineDanger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#FDEAE8',
  },
  actionBtnOutlineDangerText: { color: '#BA5648', fontSize: 11, fontWeight: '700' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  promptCard: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    gap: 10,
  },
  promptTitle: { fontSize: 16, fontWeight: '800', color: '#304439' },
  promptSub: { fontSize: 12, color: '#777184', lineHeight: 18 },
  promptError: { fontSize: 11, color: '#BA5648', fontWeight: '700' },
  fieldLabel: { fontSize: 10, fontWeight: '700', color: '#554564', marginBottom: 2 },
  promptInput: {
    borderWidth: 1,
    borderColor: '#ECE4F2',
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    color: '#304439',
    backgroundColor: '#FAF8FC',
    textAlignVertical: 'top',
  },
  promptActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 8 },
  promptCancelBtn: { paddingHorizontal: 14, paddingVertical: 10 },
  promptCancelBtnText: { fontSize: 12, fontWeight: '700', color: '#777184' },
  promptConfirmDanger: {
    backgroundColor: '#BA5648',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  promptConfirmDangerText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  promptConfirmPrimary: {
    backgroundColor: '#71579C',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  promptConfirmPrimaryText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
});
