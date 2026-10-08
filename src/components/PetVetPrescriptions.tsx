import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import {
  listPetPrescriptions,
  type VetPrescription,
} from '../services/vets';

interface Props {
  petId: string;
}

export default function PetVetPrescriptions({ petId }: Props) {
  const [prescriptions, setPrescriptions] = useState<VetPrescription[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPrescriptions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listPetPrescriptions(petId);
      setPrescriptions(res);
    } catch {
      // Ignored if none
    } finally {
      setLoading(false);
    }
  }, [petId]);

  useEffect(() => {
    void loadPrescriptions();
  }, [loadPrescriptions]);

  if (loading) {
    return (
      <View style={styles.card}>
        <ActivityIndicator size="small" color="#71579C" />
      </View>
    );
  }

  if (prescriptions.length === 0) {
    return null;
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="medical" size={20} color="#71579C" />
          <Text style={styles.title}>Prescriptions & Medications</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{prescriptions.length}</Text>
        </View>
      </View>

      <Text style={styles.subtitle}>
        Active and past medication regimens prescribed by verified veterinarians.
      </Text>

      {prescriptions.map((rx) => (
        <View key={rx.id} style={styles.rxCard}>
          <View style={styles.rxTop}>
            <Text style={styles.rxName}>{rx.medicineName}</Text>
            <View style={styles.statusPill}>
              <Text style={styles.statusPillText}>{rx.status.toUpperCase()}</Text>
            </View>
          </View>

          <Text style={styles.rxDosage}>
            Dosage: {rx.dosage} • {rx.route} ({rx.frequency})
          </Text>

          <Text style={styles.rxVet}>
            Prescribed by Dr. {rx.vetName} ({rx.clinicName})
          </Text>

          <Text style={styles.rxDates}>
            Duration: {rx.startDate} {rx.endDate ? `to ${rx.endDate}` : '(Ongoing)'}
          </Text>

          {rx.instructions ? (
            <View style={styles.instructionsBox}>
              <Ionicons name="information-circle-outline" size={14} color="#71579C" />
              <Text style={styles.instructionsText}>{rx.instructions}</Text>
            </View>
          ) : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#ECE8E0',
    gap: 12,
    marginBottom: 20,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 16, fontWeight: '800', color: '#20352F' },
  badge: { backgroundColor: '#EEE6F6', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeText: { fontSize: 11, fontWeight: '800', color: '#71579C' },
  subtitle: { fontSize: 12, color: '#85827B', lineHeight: 17, marginTop: -4 },
  rxCard: {
    backgroundColor: '#FAF8FC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#ECE4F2',
    gap: 4,
  },
  rxTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rxName: { fontSize: 14, fontWeight: '800', color: '#304439' },
  statusPill: { backgroundColor: '#E4EFE8', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  statusPillText: { color: '#2F7C5D', fontSize: 9, fontWeight: '800' },
  rxDosage: { fontSize: 12, fontWeight: '700', color: '#71579C', marginTop: 2 },
  rxVet: { fontSize: 11, color: '#554564' },
  rxDates: { fontSize: 10, color: '#958A81', marginTop: 1 },
  instructionsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: 8,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#ECE4F2',
  },
  instructionsText: { fontSize: 11, color: '#304439', flex: 1 },
});
