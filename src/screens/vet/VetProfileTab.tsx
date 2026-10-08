import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import {
  updateMyVetAvailability,
  updateMyVetProfile,
  type VetProfile,
} from '../../services/vets';

interface Props {
  profile: VetProfile | null;
  loading: boolean;
  onRefresh: () => void;
  onSwitchToOwnerMode: () => void;
}

const DAYS = [
  { id: 1, label: 'Mon' },
  { id: 2, label: 'Tue' },
  { id: 3, label: 'Wed' },
  { id: 4, label: 'Thu' },
  { id: 5, label: 'Fri' },
  { id: 6, label: 'Sat' },
  { id: 0, label: 'Sun' },
];

const SLOT_DURATIONS = [15, 30, 45, 60];

export default function VetProfileTab({
  profile,
  loading,
  onRefresh,
  onSwitchToOwnerMode,
}: Props) {
  // Operational Details State
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [clinicPhone, setClinicPhone] = useState(profile?.clinicPhone || '');
  const [clinicEmail, setClinicEmail] = useState(profile?.clinicEmail || '');
  const [clinicAddress, setClinicAddress] = useState(profile?.clinicAddress || '');
  const [consultationFee, setConsultationFee] = useState(
    profile ? String(profile.consultationFee) : '500',
  );

  // Availability State
  const [isOpen, setIsOpen] = useState(profile?.availability?.isOpen ?? true);
  const [slotDuration, setSlotDuration] = useState(
    profile?.availability?.slotDurationMinutes || 30,
  );
  const [workingDays, setWorkingDays] = useState<number[]>(
    profile?.availability?.workingDays || [1, 2, 3, 4, 5],
  );
  const [startTime, setStartTime] = useState(
    profile?.availability?.workingHours?.start || '09:00',
  );
  const [endTime, setEndTime] = useState(
    profile?.availability?.workingHours?.end || '17:00',
  );

  const [newUnavailableDate, setNewUnavailableDate] = useState('');
  const [unavailableDates, setUnavailableDates] = useState<string[]>(
    profile?.availability?.unavailableDates || [],
  );

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingAvailability, setSavingAvailability] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');
  const [availMsg, setAvailMsg] = useState('');

  // Sync state if profile loads
  React.useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || '');
      setBio(profile.bio || '');
      setClinicPhone(profile.clinicPhone || '');
      setClinicEmail(profile.clinicEmail || '');
      setClinicAddress(profile.clinicAddress || '');
      setConsultationFee(String(profile.consultationFee));
      setIsOpen(profile.availability?.isOpen ?? true);
      setSlotDuration(profile.availability?.slotDurationMinutes || 30);
      setWorkingDays(profile.availability?.workingDays || [1, 2, 3, 4, 5]);
      setStartTime(profile.availability?.workingHours?.start || '09:00');
      setEndTime(profile.availability?.workingHours?.end || '17:00');
      setUnavailableDates(profile.availability?.unavailableDates || []);
    }
  }, [profile]);

  function toggleDay(dayId: number) {
    setWorkingDays((current) =>
      current.includes(dayId) ? current.filter((d) => d !== dayId) : [...current, dayId],
    );
  }

  function addUnavailableDate() {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(newUnavailableDate.trim())) {
      Alert.alert('Invalid Date', 'Enter date in YYYY-MM-DD format.');
      return;
    }
    if (!unavailableDates.includes(newUnavailableDate.trim())) {
      setUnavailableDates((current) => [...current, newUnavailableDate.trim()]);
    }
    setNewUnavailableDate('');
  }

  function removeUnavailableDate(dateStr: string) {
    setUnavailableDates((current) => current.filter((d) => d !== dateStr));
  }

  async function handleSaveProfile() {
    setSavingProfile(true);
    setProfileMsg('');
    try {
      await updateMyVetProfile({
        displayName: displayName.trim(),
        bio: bio.trim(),
        clinicPhone: clinicPhone.trim(),
        clinicEmail: clinicEmail.trim(),
        clinicAddress: clinicAddress.trim(),
        consultationFee: Math.max(0, parseInt(consultationFee, 10) || 0),
      });
      setProfileMsg('Clinic profile saved successfully!');
      onRefresh();
    } catch (err) {
      Alert.alert('Could not save profile', err instanceof Error ? err.message : 'Please retry.');
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleSaveAvailability() {
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(startTime.trim()) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(endTime.trim())) {
      Alert.alert('Invalid Time', 'Enter hours in HH:mm format (e.g. 09:00).');
      return;
    }
    if (startTime >= endTime) {
      Alert.alert('Invalid Range', 'Start time must be before end time.');
      return;
    }

    setSavingAvailability(true);
    setAvailMsg('');
    try {
      await updateMyVetAvailability({
        isOpen,
        slotDurationMinutes: slotDuration,
        workingDays,
        workingHours: { start: startTime.trim(), end: endTime.trim() },
        unavailableDates,
      });
      setAvailMsg('Working schedule & availability updated!');
      onRefresh();
    } catch (err) {
      Alert.alert('Could not save schedule', err instanceof Error ? err.message : 'Please retry.');
    } finally {
      setSavingAvailability(false);
    }
  }

  return (
    <View style={styles.container}>
      {/* PERSONAL PET MODE SWITCHER */}
      <View style={styles.petModeCard}>
        <View style={styles.petModeLeft}>
          <View style={styles.petModeIcon}>
            <Ionicons name="paw" size={20} color="#71579C" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.petModeTitle}>My Personal Pets</Text>
            <Text style={styles.petModeSub}>
              Switch to Pet Owner mode to manage your own pets' health records, vaccines & visits.
            </Text>
          </View>
        </View>
        <Pressable onPress={onSwitchToOwnerMode} style={styles.switchModeBtn}>
          <Text style={styles.switchModeBtnText}>Open My Pets →</Text>
        </Pressable>
      </View>

      {/* VERIFIED CREDENTIALS CARD */}
      <View style={styles.card}>
        <View style={styles.verifiedHeader}>
          <View style={styles.verifiedBadge}>
            <Ionicons name="shield-checkmark" size={14} color="#2F7C5D" />
            <Text style={styles.verifiedBadgeText}>ADMIN VERIFIED CREDENTIALS</Text>
          </View>
        </View>

        <Text style={styles.clinicTitle}>
          {profile?.verifiedCredentials?.clinicName || 'Veterinary Clinic'}
        </Text>

        <View style={styles.grid2}>
          <View style={styles.credCol}>
            <Text style={styles.credLabel}>Qualifications</Text>
            <Text style={styles.credVal}>{profile?.verifiedCredentials?.qualifications || '—'}</Text>
          </View>
          <View style={styles.credCol}>
            <Text style={styles.credLabel}>Registration Number</Text>
            <Text style={styles.credVal}>{profile?.verifiedCredentials?.registrationNumber || '—'}</Text>
          </View>
          <View style={styles.credColFull}>
            <Text style={styles.credLabel}>Registration Council</Text>
            <Text style={styles.credVal}>{profile?.verifiedCredentials?.registrationCouncil || '—'}</Text>
          </View>
        </View>

        <Text style={styles.credNotice}>
          Locked credentials reflect your approved application. Any modifications require admin re-verification.
        </Text>
      </View>

      {/* EDITABLE OPERATIONAL DETAILS */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="create-outline" size={18} color="#71579C" />
          <Text style={styles.cardTitle}>Public Clinic & Contact Details</Text>
        </View>

        {profileMsg ? <Text style={styles.successMsg}>{profileMsg}</Text> : null}

        <Text style={styles.label}>Display Name / Title</Text>
        <TextInput
          style={styles.input}
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="E.g. Dr. Sarah Connor, Senior Surgeon"
          placeholderTextColor="#958A81"
        />

        <Text style={styles.label}>Professional Bio / About</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={bio}
          onChangeText={setBio}
          placeholder="Brief introduction for pet owners..."
          placeholderTextColor="#958A81"
          multiline
          maxLength={1000}
        />

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Clinic Phone</Text>
            <TextInput
              style={styles.input}
              value={clinicPhone}
              onChangeText={setClinicPhone}
              placeholder="+91 9876543210"
              placeholderTextColor="#958A81"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Clinic Contact Email</Text>
            <TextInput
              style={styles.input}
              value={clinicEmail}
              onChangeText={setClinicEmail}
              placeholder="contact@clinic.com"
              placeholderTextColor="#958A81"
            />
          </View>
        </View>

        <Text style={styles.label}>Clinic Address</Text>
        <TextInput
          style={styles.input}
          value={clinicAddress}
          onChangeText={setClinicAddress}
          placeholder="Complete street address..."
          placeholderTextColor="#958A81"
        />

        <Text style={styles.label}>Consultation Fee (₹)</Text>
        <TextInput
          style={styles.input}
          value={consultationFee}
          onChangeText={setConsultationFee}
          placeholder="500"
          placeholderTextColor="#958A81"
          keyboardType="numeric"
        />

        <Pressable
          onPress={handleSaveProfile}
          disabled={savingProfile}
          style={styles.saveBtn}
        >
          {savingProfile ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.saveBtnText}>Save Profile Details</Text>
          )}
        </Pressable>
      </View>

      {/* WORKING SCHEDULE & AVAILABILITY */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="time-outline" size={18} color="#71579C" />
          <Text style={styles.cardTitle}>Availability & Slot Schedule</Text>
        </View>

        {availMsg ? <Text style={styles.successMsg}>{availMsg}</Text> : null}

        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.switchTitle}>Accepting New Bookings</Text>
            <Text style={styles.switchSub}>
              When disabled, pet owners cannot submit new appointment requests.
            </Text>
          </View>
          <Switch
            value={isOpen}
            onValueChange={setIsOpen}
            trackColor={{ false: '#ECE4F2', true: '#2F7C5D' }}
            thumbColor="#FFFFFF"
          />
        </View>

        <Text style={styles.label}>Consultation Slot Duration</Text>
        <View style={styles.durationPills}>
          {SLOT_DURATIONS.map((dur) => (
            <Pressable
              key={dur}
              onPress={() => setSlotDuration(dur)}
              style={[
                styles.durationPill,
                slotDuration === dur && styles.durationPillSelected,
              ]}
            >
              <Text
                style={[
                  styles.durationPillText,
                  slotDuration === dur && styles.durationPillTextSelected,
                ]}
              >
                {dur} mins
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Working Days</Text>
        <View style={styles.daysRow}>
          {DAYS.map((d) => {
            const isSelected = workingDays.includes(d.id);
            return (
              <Pressable
                key={d.id}
                onPress={() => toggleDay(d.id)}
                style={[styles.dayPill, isSelected && styles.dayPillSelected]}
              >
                <Text
                  style={[styles.dayPillText, isSelected && styles.dayPillTextSelected]}
                >
                  {d.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Start Time (HH:mm)</Text>
            <TextInput
              style={styles.input}
              value={startTime}
              onChangeText={setStartTime}
              placeholder="09:00"
              placeholderTextColor="#958A81"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>End Time (HH:mm)</Text>
            <TextInput
              style={styles.input}
              value={endTime}
              onChangeText={setEndTime}
              placeholder="17:00"
              placeholderTextColor="#958A81"
            />
          </View>
        </View>

        <Text style={styles.label}>Unavailable Dates (Holidays / Leave)</Text>
        <View style={styles.addDateRow}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            value={newUnavailableDate}
            onChangeText={setNewUnavailableDate}
            placeholder="YYYY-MM-DD (e.g. 2026-12-25)"
            placeholderTextColor="#958A81"
            maxLength={10}
          />
          <Pressable onPress={addUnavailableDate} style={styles.addDateBtn}>
            <Text style={styles.addDateBtnText}>+ Add Date</Text>
          </Pressable>
        </View>

        {unavailableDates.length > 0 && (
          <View style={styles.datesList}>
            {unavailableDates.map((date) => (
              <View key={date} style={styles.dateChip}>
                <Ionicons name="calendar-outline" size={12} color="#BA5648" />
                <Text style={styles.dateChipText}>{date}</Text>
                <Pressable onPress={() => removeUnavailableDate(date)}>
                  <Ionicons name="close-circle" size={14} color="#BA5648" />
                </Pressable>
              </View>
            ))}
          </View>
        )}

        <Pressable
          onPress={handleSaveAvailability}
          disabled={savingAvailability}
          style={styles.saveBtn}
        >
          {savingAvailability ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.saveBtnText}>Save Schedule & Availability</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 14 },
  petModeCard: {
    backgroundColor: '#F3EEF8',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#ECE4F2',
    gap: 10,
  },
  petModeLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  petModeIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  petModeTitle: { fontSize: 13, fontWeight: '800', color: '#304439' },
  petModeSub: { fontSize: 11, color: '#777184', marginTop: 2, lineHeight: 16 },
  switchModeBtn: {
    backgroundColor: '#71579C',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  switchModeBtnText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ECE4F2',
    gap: 10,
  },
  verifiedHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#E4EFE8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  verifiedBadgeText: { fontSize: 9, fontWeight: '800', color: '#2F7C5D' },
  clinicTitle: { fontSize: 16, fontWeight: '800', color: '#304439', marginTop: 4 },
  grid2: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  credCol: { flex: 1, minWidth: '45%' },
  credColFull: { width: '100%' },
  credLabel: { fontSize: 9, fontWeight: '700', color: '#958A81', textTransform: 'uppercase' },
  credVal: { fontSize: 12, fontWeight: '700', color: '#304439', marginTop: 2 },
  credNotice: { fontSize: 10, color: '#958A81', lineHeight: 14, marginTop: 6, fontStyle: 'italic' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { fontSize: 14, fontWeight: '800', color: '#304439' },
  successMsg: { color: '#2F7C5D', fontSize: 12, fontWeight: '700', marginVertical: 4 },
  label: { fontSize: 11, fontWeight: '700', color: '#554564', marginTop: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#ECE4F2',
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    color: '#304439',
    backgroundColor: '#FAF8FC',
  },
  textArea: { minHeight: 70, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 10 },
  saveBtn: {
    backgroundColor: '#71579C',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  saveBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FAF8FC',
    padding: 12,
    borderRadius: 12,
  },
  switchTitle: { fontSize: 13, fontWeight: '800', color: '#304439' },
  switchSub: { fontSize: 10, color: '#777184', marginTop: 2, paddingRight: 6 },
  durationPills: { flexDirection: 'row', gap: 8, marginVertical: 4 },
  durationPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#FAF8FC',
    borderWidth: 1,
    borderColor: '#ECE4F2',
    alignItems: 'center',
  },
  durationPillSelected: { backgroundColor: '#71579C', borderColor: '#71579C' },
  durationPillText: { fontSize: 11, fontWeight: '700', color: '#5B477A' },
  durationPillTextSelected: { color: '#FFFFFF' },
  daysRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 4 },
  dayPill: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FAF8FC',
    borderWidth: 1,
    borderColor: '#ECE4F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayPillSelected: { backgroundColor: '#71579C', borderColor: '#71579C' },
  dayPillText: { fontSize: 11, fontWeight: '700', color: '#5B477A' },
  dayPillTextSelected: { color: '#FFFFFF' },
  addDateRow: { flexDirection: 'row', gap: 8 },
  addDateBtn: {
    backgroundColor: '#F3EEF8',
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ECE4F2',
  },
  addDateBtnText: { fontSize: 11, fontWeight: '800', color: '#71579C' },
  datesList: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  dateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FDEAE8',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  dateChipText: { fontSize: 11, fontWeight: '700', color: '#BA5648' },
});
