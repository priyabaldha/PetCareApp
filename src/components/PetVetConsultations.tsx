import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import {
  listPetConsultations,
  type VetConsultation,
} from '../services/vets';

interface Props {
  petId: string;
}

export default function PetVetConsultations({ petId }: Props) {
  const [consultations, setConsultations] = useState<VetConsultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadConsultations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listPetConsultations(petId);
      setConsultations(res);
      if (res.length > 0 && !expandedId) {
        setExpandedId(res[0]!.id);
      }
    } catch {
      // Ignored if none
    } finally {
      setLoading(false);
    }
  }, [petId, expandedId]);

  useEffect(() => {
    void loadConsultations();
  }, [loadConsultations]);

  if (loading) {
    return (
      <View style={styles.card}>
        <ActivityIndicator size="small" color="#71579C" />
      </View>
    );
  }

  if (consultations.length === 0) {
    return null; // Only show section when clinical consultations exist
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="document-text" size={20} color="#71579C" />
          <Text style={styles.title}>Veterinary Clinical Records</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{consultations.length}</Text>
        </View>
      </View>

      <Text style={styles.subtitle}>
        Clinical notes and diagnoses published by your attending veterinary doctors.
      </Text>

      {consultations.map((c) => {
        const isExpanded = expandedId === c.id;

        return (
          <View key={c.id} style={styles.consultItem}>
            <Pressable
              onPress={() => setExpandedId(isExpanded ? null : c.id)}
              style={styles.consultTop}
            >
              <View style={{ flex: 1 }}>
                <View style={styles.dateRow}>
                  <Text style={styles.visitDate}>{c.visitDate}</Text>
                  <Text style={styles.vetDoctor}>• Dr. {c.vetName}</Text>
                </View>
                <Text style={styles.clinicName}>{c.clinicName}</Text>
                <Text style={styles.diagTitle}>Diagnosis: {c.diagnosis}</Text>
              </View>

              <Ionicons
                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                size={18}
                color="#71579C"
              />
            </Pressable>

            {isExpanded && (
              <View style={styles.consultDetails}>
                <View style={styles.fieldBlock}>
                  <Text style={styles.fieldLabel}>Reason for Visit / Symptoms</Text>
                  <Text style={styles.fieldVal}>{c.symptoms}</Text>
                </View>

                {c.examinationNotes ? (
                  <View style={styles.fieldBlock}>
                    <Text style={styles.fieldLabel}>Examination Findings</Text>
                    <Text style={styles.fieldVal}>{c.examinationNotes}</Text>
                  </View>
                ) : null}

                <View style={styles.fieldBlock}>
                  <Text style={styles.fieldLabel}>Prescribed Treatment Plan</Text>
                  <Text style={styles.fieldVal}>{c.treatmentPlan}</Text>
                </View>

                {c.followUpDate ? (
                  <View style={styles.followUpBox}>
                    <Ionicons name="calendar-outline" size={14} color="#71579C" />
                    <Text style={styles.followUpText}>
                      Follow-up suggested on {c.followUpDate}
                      {c.followUpInstructions ? `: ${c.followUpInstructions}` : ''}
                    </Text>
                  </View>
                ) : null}

                {c.amendments.length > 0 && (
                  <View style={styles.amendmentsBox}>
                    <Text style={styles.amendmentsTitle}>Post-Consultation Amendments</Text>
                    {c.amendments.map((a, i) => (
                      <View key={i} style={styles.amendmentRow}>
                        <Text style={styles.amendmentDate}>{a.amendedAt.slice(0, 10)}</Text>
                        <Text style={styles.amendmentNote}>{a.note}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>
        );
      })}
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
  consultItem: {
    backgroundColor: '#FAF8FC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#ECE4F2',
    overflow: 'hidden',
  },
  consultTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  visitDate: { fontSize: 13, fontWeight: '800', color: '#304439' },
  vetDoctor: { fontSize: 12, fontWeight: '700', color: '#71579C' },
  clinicName: { fontSize: 11, color: '#958A81', marginTop: 1 },
  diagTitle: { fontSize: 12, fontWeight: '800', color: '#304439', marginTop: 4 },
  consultDetails: {
    padding: 14,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: '#F0EAF5',
    gap: 8,
  },
  fieldBlock: { gap: 2, marginTop: 4 },
  fieldLabel: { fontSize: 9, fontWeight: '800', color: '#71579C', textTransform: 'uppercase' },
  fieldVal: { fontSize: 12, color: '#304439', lineHeight: 18 },
  followUpBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F3EEF8',
    padding: 10,
    borderRadius: 10,
    marginTop: 4,
  },
  followUpText: { fontSize: 11, fontWeight: '700', color: '#5B477A', flex: 1 },
  amendmentsBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ECE4F2',
    gap: 4,
    marginTop: 4,
  },
  amendmentsTitle: { fontSize: 10, fontWeight: '800', color: '#71579C' },
  amendmentRow: { borderLeftWidth: 2, borderLeftColor: '#71579C', paddingLeft: 8, marginTop: 2 },
  amendmentDate: { fontSize: 9, fontWeight: '700', color: '#958A81' },
  amendmentNote: { fontSize: 11, color: '#304439' },
});
