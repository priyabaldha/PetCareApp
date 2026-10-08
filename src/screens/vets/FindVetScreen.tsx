import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../../types/navigation';
import {
  createVetBooking,
  getVetSlots,
  listApprovedVets,
  type VetSlot,
  type VetSummary,
} from '../../services/vets';
import { listPets } from '../../services/pets';
import type { Pet } from '../../types/pet';

type Props = NativeStackScreenProps<RootStackParamList, 'FindVet'>;

export default function FindVetScreen({ navigation }: Props) {
  const [vets, setVets] = useState<VetSummary[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');

  // Booking Modal State
  const [selectedVet, setSelectedVet] = useState<VetSummary | null>(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedPetId, setSelectedPetId] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<VetSlot[]>([]);
  const [slotMessage, setSlotMessage] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [shareHistory, setShareHistory] = useState(true);

  const [bookingBusy, setBookingBusy] = useState(false);
  const [bookingError, setBookingError] = useState('');

  const todayStr = new Date().toISOString().slice(0, 10);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [vetsRes, petsRes] = await Promise.all([
        listApprovedVets(searchQuery),
        listPets().catch(() => []),
      ]);
      setVets(vetsRes);
      setPets(petsRes);
      if (petsRes.length > 0 && !selectedPetId) {
        setSelectedPetId(petsRes[0]!.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load veterinary clinics.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  // Load slots when selected date or vet changes
  useEffect(() => {
    if (!bookingModalOpen || !selectedVet || !selectedDate) {
      setAvailableSlots([]);
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) {
      setAvailableSlots([]);
      return;
    }

    let active = true;
    setSlotsLoading(true);
    setSlotMessage('');
    setSelectedTime('');

    getVetSlots(selectedVet.vetId, selectedDate)
      .then((res) => {
        if (!active) return;
        setAvailableSlots(res.slots);
        if (res.message) setSlotMessage(res.message);
      })
      .catch((err) => {
        if (!active) return;
        setSlotMessage(err instanceof Error ? err.message : 'Could not check slots.');
      })
      .finally(() => {
        if (active) setSlotsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [bookingModalOpen, selectedVet, selectedDate]);

  function openBooking(vet: VetSummary) {
    if (pets.length === 0) {
      Alert.alert(
        'Add a Pet First',
        'Please add a pet to your profile before booking an appointment.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Add Pet', onPress: () => navigation.navigate('AddPet') },
        ],
      );
      return;
    }

    setSelectedVet(vet);
    setSelectedPetId(pets[0]!.id);

    // Default to tomorrow or next day
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomStr = tomorrow.toISOString().slice(0, 10);

    setSelectedDate(tomStr);
    setSelectedTime('');
    setReason('');
    setNotes('');
    setShareHistory(true);
    setBookingError('');
    setBookingModalOpen(true);
  }

  async function handleSubmitBooking() {
    setBookingError('');

    if (!selectedVet || !selectedPetId) return;

    if (!selectedDate || !/^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) {
      setBookingError('Please enter a valid date (YYYY-MM-DD).');
      return;
    }
    if (!selectedTime) {
      setBookingError('Please choose an available time slot.');
      return;
    }
    if (!reason.trim() || reason.trim().length < 2) {
      setBookingError('Please enter the reason for your visit.');
      return;
    }

    setBookingBusy(true);
    try {
      const result = await createVetBooking({
        vetId: selectedVet.vetId,
        petId: selectedPetId,
        date: selectedDate,
        time: selectedTime,
        reason: reason.trim(),
        notes: notes.trim(),
        shareMedicalHistory: shareHistory,
      });

      setBookingModalOpen(false);
      Alert.alert(
        'Booking Request Submitted! 🐾',
        `Your appointment request (${result.bookingNumber}) for ${selectedDate} at ${selectedTime} has been sent to Dr. ${selectedVet.name}. You will be notified once confirmed.`,
        [
          {
            text: 'View Appointments',
            onPress: () => {
              const selectedPet = pets.find((p) => p.id === selectedPetId);
              navigation.navigate('Appointments', {
                petId: selectedPetId,
                petName: selectedPet?.name || 'Pet',
              });
            },
          },
          { text: 'Done', style: 'cancel' },
        ],
      );
    } catch (err) {
      setBookingError(err instanceof Error ? err.message : 'Could not submit booking.');
    } finally {
      setBookingBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      {/* HEADER */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color="#304439" />
        </Pressable>
        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle}>Find a Verified Vet</Text>
          <Text style={styles.headerSubtitle}>
            Browse approved clinics and book appointments
          </Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      {/* SEARCH BAR */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={17} color="#958A81" />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by vet name, clinic, service or location..."
            placeholderTextColor="#958A81"
          />
          {searchQuery ? (
            <Pressable onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color="#958A81" />
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* VET CARDS LIST */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchData} tintColor="#71579C" />
        }
      >
        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#71579C" />
            <Text style={styles.loadingText}>Loading verified veterinary practitioners…</Text>
          </View>
        ) : error ? (
          <View style={styles.centerBox}>
            <Ionicons name="alert-circle-outline" size={32} color="#BA5648" />
            <Text style={styles.errorTitle}>Could not load clinics</Text>
            <Text style={styles.errorSub}>{error}</Text>
            <Pressable onPress={fetchData} style={styles.retryBtn}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </Pressable>
          </View>
        ) : vets.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="medkit-outline" size={36} color="#71579C" />
            <Text style={styles.emptyTitle}>No matching veterinary clinics</Text>
            <Text style={styles.emptySub}>
              {searchQuery
                ? 'Try searching with different terms or check back later.'
                : 'Approved veterinary doctors will be listed here.'}
            </Text>
          </View>
        ) : (
          vets.map((vet) => (
            <View key={vet.vetId} style={styles.vetCard}>
              {/* TOP INFO */}
              <View style={styles.vetTop}>
                <View style={styles.vetAvatar}>
                  <Ionicons name="medkit" size={22} color="#71579C" />
                </View>

                <View style={styles.vetTitleBox}>
                  <View style={styles.vetNameRow}>
                    <Text style={styles.vetName}>{vet.displayName || `Dr. ${vet.name}`}</Text>
                  </View>
                  <Text style={styles.clinicNameText}>{vet.clinicName}</Text>
                  <Text style={styles.qualificationsText}>
                    {vet.verifiedCredentials.qualifications} • Reg: {vet.verifiedCredentials.registrationNumber}
                  </Text>
                </View>
              </View>

              {/* BIO */}
              {vet.bio ? (
                <Text style={styles.bioText} numberOfLines={2}>
                  {vet.bio}
                </Text>
              ) : null}

              {/* ADDRESS & CONTACT */}
              <View style={styles.metaBox}>
                <View style={styles.metaRow}>
                  <Ionicons name="location-outline" size={14} color="#71579C" />
                  <Text style={styles.metaText} numberOfLines={1}>
                    {vet.clinicAddress || 'Address available upon booking'}
                  </Text>
                </View>
                {vet.clinicPhone ? (
                  <View style={styles.metaRow}>
                    <Ionicons name="call-outline" size={14} color="#71579C" />
                    <Text style={styles.metaText}>{vet.clinicPhone}</Text>
                  </View>
                ) : null}
              </View>

              {/* SERVICES & FEE */}
              <View style={styles.servicesRow}>
                {vet.services.slice(0, 3).map((s) => (
                  <View key={s.id} style={styles.servicePill}>
                    <Text style={styles.servicePillText}>{s.name}</Text>
                  </View>
                ))}
                {vet.services.length > 3 && (
                  <View style={styles.servicePillMore}>
                    <Text style={styles.servicePillMoreText}>+{vet.services.length - 3} more</Text>
                  </View>
                )}
              </View>

              {/* FOOTER: FEE & BOOK BUTTON */}
              <View style={styles.vetFooter}>
                <View style={styles.feeBox}>
                  <Text style={styles.feeLabel}>CONSULTATION FEE</Text>
                  <Text style={styles.feeVal}>₹{vet.consultationFee}</Text>
                </View>

                <Pressable
                  onPress={() => openBooking(vet)}
                  disabled={!vet.isOpen}
                  style={[styles.bookBtn, !vet.isOpen && styles.bookBtnClosed]}
                >
                  <Ionicons
                    name={vet.isOpen ? 'calendar' : 'lock-closed'}
                    size={14}
                    color="#FFFFFF"
                  />
                  <Text style={styles.bookBtnText}>
                    {vet.isOpen ? 'Book Appointment' : 'Currently Closed'}
                  </Text>
                </Pressable>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* BOOKING MODAL */}
      <Modal visible={bookingModalOpen} animationType="slide" onRequestClose={() => setBookingModalOpen(false)}>
        <SafeAreaView style={styles.modalScreen} edges={['top', 'bottom']}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setBookingModalOpen(false)} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#304439" />
            </Pressable>
            <View style={styles.headerTitleBox}>
              <Text style={styles.headerTitle}>Book Vet Appointment</Text>
              <Text style={styles.headerSubtitle}>
                {selectedVet?.displayName || `Dr. ${selectedVet?.name}`}
              </Text>
            </View>
            <View style={{ width: 36 }} />
          </View>

          <ScrollView contentContainerStyle={styles.modalScroll} keyboardShouldPersistTaps="handled">
            {bookingError ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={18} color="#BA5648" />
                <Text style={styles.errorBannerText}>{bookingError}</Text>
              </View>
            ) : null}

            <View style={styles.card}>
              {/* SELECT PET */}
              <Text style={styles.inputLabel}>1. Select Your Pet *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.petPills}>
                {pets.map((pet) => {
                  const isSelected = selectedPetId === pet.id;
                  return (
                    <Pressable
                      key={pet.id}
                      onPress={() => setSelectedPetId(pet.id)}
                      style={[styles.petPill, isSelected && styles.petPillSelected]}
                    >
                      <Ionicons
                        name="paw"
                        size={14}
                        color={isSelected ? '#FFFFFF' : '#71579C'}
                      />
                      <Text
                        style={[styles.petPillText, isSelected && styles.petPillTextSelected]}
                      >
                        {pet.name} ({pet.species})
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {/* SELECT DATE */}
              <Text style={styles.inputLabel}>2. Choose Appointment Date (YYYY-MM-DD) *</Text>
              <TextInput
                style={styles.input}
                value={selectedDate}
                onChangeText={setSelectedDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#958A81"
                maxLength={10}
              />

              {/* LIVE SLOTS */}
              <Text style={styles.inputLabel}>3. Choose Available Time Slot *</Text>
              {slotsLoading ? (
                <View style={styles.slotLoadingBox}>
                  <ActivityIndicator size="small" color="#71579C" />
                  <Text style={styles.slotLoadingText}>Checking clinic schedule…</Text>
                </View>
              ) : slotMessage ? (
                <Text style={styles.slotMessageText}>{slotMessage}</Text>
              ) : availableSlots.length === 0 ? (
                <Text style={styles.slotEmptyText}>
                  Enter a valid upcoming date above to view open slots.
                </Text>
              ) : (
                <View style={styles.slotsGrid}>
                  {availableSlots.map((slot) => {
                    const isSelected = selectedTime === slot.time;
                    return (
                      <Pressable
                        key={slot.time}
                        onPress={() => slot.available && setSelectedTime(slot.time)}
                        disabled={!slot.available}
                        style={[
                          styles.slotPill,
                          !slot.available && styles.slotPillUnavailable,
                          isSelected && styles.slotPillSelected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.slotText,
                            !slot.available && styles.slotTextUnavailable,
                            isSelected && styles.slotTextSelected,
                          ]}
                        >
                          {slot.time}
                        </Text>
                        {!slot.available && (
                          <Text style={styles.slotUnavailableTag}>Booked</Text>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              )}

              {/* REASON */}
              <Text style={styles.inputLabel}>4. Reason for Visit *</Text>
              <TextInput
                style={[styles.input, styles.textAreaSmall]}
                value={reason}
                onChangeText={setReason}
                placeholder="E.g. Annual vaccination check-up, limping on front leg, skin rash..."
                placeholderTextColor="#958A81"
                multiline
                maxLength={300}
              />

              {/* OPTIONAL NOTES */}
              <Text style={styles.inputLabel}>5. Additional Notes for the Doctor</Text>
              <TextInput
                style={[styles.input, styles.textAreaSmall]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Optional details, current symptoms duration..."
                placeholderTextColor="#958A81"
                multiline
                maxLength={500}
              />

              {/* MEDICAL HISTORY SHARING SWITCH */}
              <View style={styles.switchBox}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.switchTitle}>Share Pet Medical History</Text>
                  <Text style={styles.switchSub}>
                    Permits Dr. {selectedVet?.name} to review vaccination dates, past health notes & medications for this pet. You can revoke this anytime.
                  </Text>
                </View>
                <Switch
                  value={shareHistory}
                  onValueChange={setShareHistory}
                  trackColor={{ false: '#ECE4F2', true: '#2F7C5D' }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>

            <Pressable
              onPress={handleSubmitBooking}
              disabled={bookingBusy}
              style={[styles.submitBookingBtn, bookingBusy && styles.btnDisabled]}
            >
              {bookingBusy ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                  <Text style={styles.submitBookingBtnText}>Submit Appointment Request</Text>
                </>
              )}
            </Pressable>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F9F7F2' },
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
  backBtn: {
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
  headerSubtitle: { fontSize: 11, color: '#71579C', marginTop: 2 },
  searchContainer: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#F9F7F2' },
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
  scrollContent: { padding: 16, paddingBottom: 40, gap: 14 },
  centerBox: { alignItems: 'center', justifyContent: 'center', padding: 30, gap: 10 },
  loadingText: { color: '#71579C', fontSize: 12, fontWeight: '700' },
  errorTitle: { fontSize: 15, fontWeight: '800', color: '#BA5648' },
  errorSub: { fontSize: 11, color: '#777184', textAlign: 'center' },
  retryBtn: { marginTop: 10, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#71579C', borderRadius: 10 },
  retryBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#ECE4F2',
  },
  emptyTitle: { fontSize: 15, fontWeight: '800', color: '#304439' },
  emptySub: { fontSize: 11, color: '#958A81', textAlign: 'center', lineHeight: 16 },
  vetCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ECE4F2',
    gap: 10,
  },
  vetTop: { flexDirection: 'row', gap: 12 },
  vetAvatar: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: '#F3EEF8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vetTitleBox: { flex: 1, gap: 2 },
  vetNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  vetName: { fontSize: 15, fontWeight: '800', color: '#304439' },
  clinicNameText: { fontSize: 12, fontWeight: '700', color: '#71579C' },
  qualificationsText: { fontSize: 10, color: '#887E8E' },
  bioText: { fontSize: 11, color: '#554564', lineHeight: 16 },
  metaBox: {
    backgroundColor: '#FAF8FC',
    borderRadius: 10,
    padding: 10,
    gap: 4,
    borderWidth: 1,
    borderColor: '#ECE4F2',
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 11, color: '#554564', flex: 1 },
  servicesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  servicePill: { backgroundColor: '#F3EEF8', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  servicePillText: { fontSize: 10, fontWeight: '700', color: '#5B477A' },
  servicePillMore: { backgroundColor: '#ECE4F2', paddingHorizontal: 6, paddingVertical: 4, borderRadius: 6 },
  servicePillMoreText: { fontSize: 9, fontWeight: '700', color: '#777184' },
  vetFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F0EAF5',
    paddingTop: 10,
    marginTop: 2,
  },
  feeBox: { gap: 1 },
  feeLabel: { fontSize: 8, fontWeight: '800', color: '#958A81', letterSpacing: 0.5 },
  feeVal: { fontSize: 16, fontWeight: '800', color: '#304439' },
  bookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#71579C',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
  },
  bookBtnClosed: { backgroundColor: '#BA5648' },
  bookBtnText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  modalScreen: { flex: 1, backgroundColor: '#F9F7F2' },
  modalHeader: {
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
  modalScroll: { padding: 16, paddingBottom: 40, gap: 12 },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FBECE7',
    padding: 12,
    borderRadius: 12,
  },
  errorBannerText: { color: '#BA5648', fontSize: 12, fontWeight: '600', flex: 1 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ECE4F2',
    gap: 10,
  },
  inputLabel: { fontSize: 11, fontWeight: '800', color: '#304439', marginTop: 4 },
  petPills: { gap: 8, paddingVertical: 4 },
  petPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#FAF8FC',
    borderWidth: 1,
    borderColor: '#ECE4F2',
  },
  petPillSelected: { backgroundColor: '#71579C', borderColor: '#71579C' },
  petPillText: { fontSize: 11, fontWeight: '700', color: '#5B477A' },
  petPillTextSelected: { color: '#FFFFFF' },
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
  slotLoadingBox: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10 },
  slotLoadingText: { fontSize: 11, color: '#71579C' },
  slotMessageText: { fontSize: 11, color: '#BA5648', marginVertical: 4 },
  slotEmptyText: { fontSize: 11, color: '#958A81', marginVertical: 4, fontStyle: 'italic' },
  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 4 },
  slotPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#FAF8FC',
    borderWidth: 1,
    borderColor: '#ECE4F2',
    alignItems: 'center',
  },
  slotPillSelected: { backgroundColor: '#71579C', borderColor: '#71579C' },
  slotPillUnavailable: { backgroundColor: '#FDEAE8', opacity: 0.6 },
  slotText: { fontSize: 12, fontWeight: '700', color: '#304439' },
  slotTextSelected: { color: '#FFFFFF' },
  slotTextUnavailable: { color: '#BA5648' },
  slotUnavailableTag: { fontSize: 8, color: '#BA5648', fontWeight: '800' },
  switchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAF8FC',
    padding: 12,
    borderRadius: 12,
    marginTop: 6,
  },
  switchTitle: { fontSize: 12, fontWeight: '800', color: '#304439' },
  switchSub: { fontSize: 10, color: '#777184', marginTop: 2, paddingRight: 8, lineHeight: 14 },
  submitBookingBtn: {
    backgroundColor: '#71579C',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 6,
  },
  btnDisabled: { opacity: 0.6 },
  submitBookingBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
});
