import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { VetPatient } from '../../services/vets';

interface Props {
  patients: VetPatient[];
  loading: boolean;
  onOpenPatient: (petId: string) => void;
}

export default function VetPatientsTab({
  patients,
  loading,
  onOpenPatient,
}: Props) {
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = patients.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.species.toLowerCase().includes(q) ||
      p.breed.toLowerCase().includes(q) ||
      p.ownerName.toLowerCase().includes(q) ||
      p.ownerEmail.toLowerCase().includes(q)
    );
  });

  return (
    <View style={styles.container}>
      {/* SEARCH BOX */}
      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={17} color="#958A81" />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search patient name, species, breed, owner..."
          placeholderTextColor="#958A81"
        />
        {searchQuery ? (
          <Pressable onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={16} color="#958A81" />
          </Pressable>
        ) : null}
      </View>

      {/* PATIENT LIST */}
      {filtered.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="paw-outline" size={32} color="#71579C" />
          <Text style={styles.emptyTitle}>
            {searchQuery ? 'No matching patients found' : 'No patients on record yet'}
          </Text>
          <Text style={styles.emptySub}>
            Patients appear here automatically when pet owners book visits or grant record sharing access to you.
          </Text>
        </View>
      ) : (
        filtered.map((patient) => {
          const hasFullAccess = patient.accessScope === 'full_history';

          return (
            <Pressable
              key={patient.petId}
              onPress={() => onOpenPatient(patient.petId)}
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            >
              <View style={styles.cardHeader}>
                <View style={styles.petIconBox}>
                  <Ionicons name="paw" size={18} color="#71579C" />
                </View>

                <View style={styles.petInfoBox}>
                  <View style={styles.petTitleRow}>
                    <Text style={styles.petName}>{patient.name}</Text>
                    <Text style={styles.petMeta}>
                      {patient.species} • {patient.breed || 'Mixed'}
                    </Text>
                  </View>
                  <Text style={styles.ownerText}>
                    Owner: {patient.ownerName} ({patient.ownerEmail})
                  </Text>
                </View>

                <Ionicons name="chevron-forward" size={18} color="#AAA59C" />
              </View>

              <View style={styles.divider} />

              <View style={styles.cardFooter}>
                <View style={styles.visitInfo}>
                  <Ionicons name="calendar-outline" size={13} color="#71579C" />
                  <Text style={styles.visitText}>
                    {patient.lastVisitDate
                      ? `Last visit: ${patient.lastVisitDate}`
                      : 'No previous visits'}
                  </Text>
                </View>

                <View
                  style={[
                    styles.accessPill,
                    hasFullAccess ? styles.accessPillFull : styles.accessPillBasic,
                  ]}
                >
                  <Ionicons
                    name={hasFullAccess ? 'shield-checkmark' : 'lock-closed'}
                    size={11}
                    color={hasFullAccess ? '#2F7C5D' : '#976A17'}
                  />
                  <Text
                    style={[
                      styles.accessPillText,
                      hasFullAccess ? styles.accessPillTextFull : styles.accessPillTextBasic,
                    ]}
                  >
                    {hasFullAccess ? 'Full History Shared' : 'Basic Access'}
                  </Text>
                </View>
              </View>
            </Pressable>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 14 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#ECE4F2',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 13, color: '#304439' },
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
    gap: 10,
  },
  cardPressed: { backgroundColor: '#FAF8FC' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  petIconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#F3EEF8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  petInfoBox: { flex: 1, gap: 2 },
  petTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  petName: { fontSize: 15, fontWeight: '800', color: '#304439' },
  petMeta: { fontSize: 11, color: '#71579C', textTransform: 'capitalize' },
  ownerText: { fontSize: 11, color: '#777184' },
  divider: { height: 1, backgroundColor: '#F0EAF5' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  visitInfo: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  visitText: { fontSize: 11, color: '#554564', fontWeight: '600' },
  accessPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  accessPillFull: { backgroundColor: '#E4EFE8' },
  accessPillTextFull: { color: '#2F7C5D', fontSize: 9, fontWeight: '800' },
  accessPillBasic: { backgroundColor: '#FFF0C9' },
  accessPillTextBasic: { color: '#976A17', fontSize: 9, fontWeight: '800' },
  accessPillText: { fontSize: 9, fontWeight: '800' },
});
