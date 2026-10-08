import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import {
  grantPetSharing,
  listApprovedVets,
  listPetSharingGrants,
  revokePetSharing,
  type PetAccessGrant,
  type VetSummary,
} from '../services/vets';

interface Props {
  visible: boolean;
  petId: string;
  petName: string;
  onClose: () => void;
}

export default function PetRecordSharingModal({
  visible,
  petId,
  petName,
  onClose,
}: Props) {
  const [grants, setGrants] = useState<PetAccessGrant[]>([]);
  const [allVets, setAllVets] = useState<VetSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionBusy, setActionBusy] = useState(false);
  const [error, setError] = useState('');

  const loadSharingData = useCallback(async () => {
    if (!petId) return;
    setLoading(true);
    setError('');
    try {
      const [grantsRes, vetsRes] = await Promise.all([
        listPetSharingGrants(petId),
        listApprovedVets(),
      ]);
      setGrants(grantsRes);
      setAllVets(vetsRes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load sharing permissions.');
    } finally {
      setLoading(false);
    }
  }, [petId]);

  useEffect(() => {
    if (visible && petId) {
      void loadSharingData();
    }
  }, [visible, petId, loadSharingData]);

  async function handleRevoke(grant: PetAccessGrant) {
    Alert.alert(
      'Revoke Medical Record Access?',
      `Are you sure you want to revoke ${grant.vetName || 'the vet'}'s access to ${petName}'s medical records?`,
      [
        { text: 'Keep Access', style: 'cancel' },
        {
          text: 'Revoke Access',
          style: 'destructive',
          onPress: async () => {
            setActionBusy(true);
            try {
              await revokePetSharing(petId, grant.vetId);
              await loadSharingData();
            } catch (err) {
              Alert.alert('Could not revoke access', err instanceof Error ? err.message : 'Please retry.');
            } finally {
              setActionBusy(false);
            }
          },
        },
      ],
    );
  }

  async function handleGrant(vet: VetSummary) {
    setActionBusy(true);
    try {
      await grantPetSharing(petId, vet.vetId, 'full_history');
      await loadSharingData();
    } catch (err) {
      Alert.alert('Could not grant access', err instanceof Error ? err.message : 'Please retry.');
    } finally {
      setActionBusy(false);
    }
  }

  const activeGrants = grants.filter((g) => g.status === 'active');
  const activeVetIds = new Set(activeGrants.map((g) => g.vetId));
  const availableVetsToShare = allVets.filter((v) => !activeVetIds.has(v.vetId));

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
        {/* HEADER */}
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.closeBtn} disabled={actionBusy}>
            <Ionicons name="close" size={22} color="#304439" />
          </Pressable>
          <View style={styles.headerTitleBox}>
            <Text style={styles.headerTitle}>Medical Record Sharing</Text>
            <Text style={styles.headerSubtitle}>Pet: {petName}</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* EXPLANATION BANNER */}
          <View style={styles.infoBanner}>
            <Ionicons name="shield-checkmark" size={22} color="#71579C" />
            <View style={{ flex: 1 }}>
              <Text style={styles.infoTitle}>You Control Your Pet's Privacy</Text>
              <Text style={styles.infoText}>
                When you share records with a verified vet, they gain access to view {petName}'s
                vaccination history, medications, and clinical notes. You can revoke access at any
                time with immediate effect.
              </Text>
            </View>
          </View>

          {loading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color="#71579C" />
              <Text style={styles.loadingText}>Checking active sharing permissions…</Text>
            </View>
          ) : error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : (
            <>
              {/* ACTIVE SHARING PERMISSIONS */}
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>
                  Vets with Active Access ({activeGrants.length})
                </Text>

                {activeGrants.length === 0 ? (
                  <Text style={styles.emptyText}>
                    No vets currently have active access to {petName}'s medical history.
                  </Text>
                ) : (
                  activeGrants.map((grant) => (
                    <View key={grant.id} style={styles.grantItem}>
                      <View style={styles.grantLeft}>
                        <View style={styles.vetIconBox}>
                          <Ionicons name="medkit" size={16} color="#71579C" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.vetNameText}>{grant.vetName || 'Dr. Veterinarian'}</Text>
                          <Text style={styles.clinicText}>{grant.clinicName || 'Veterinary Clinic'}</Text>
                          <Text style={styles.grantedDateText}>
                            Granted on {grant.grantedAt.slice(0, 10)} • Scope: Full History
                          </Text>
                        </View>
                      </View>

                      <Pressable
                        onPress={() => handleRevoke(grant)}
                        disabled={actionBusy}
                        style={styles.revokeBtn}
                      >
                        <Ionicons name="lock-closed" size={13} color="#BA5648" />
                        <Text style={styles.revokeBtnText}>Revoke</Text>
                      </Pressable>
                    </View>
                  ))
                )}
              </View>

              {/* GRANT ACCESS TO OTHER VETS */}
              {availableVetsToShare.length > 0 && (
                <View style={styles.card}>
                  <Text style={styles.sectionTitle}>Share Records with Verified Vets</Text>
                  <Text style={styles.sectionSubtitle}>
                    Grant access to an approved clinic before your visit.
                  </Text>

                  {availableVetsToShare.map((vet) => (
                    <View key={vet.vetId} style={styles.grantItem}>
                      <View style={styles.grantLeft}>
                        <View style={[styles.vetIconBox, { backgroundColor: '#EFE7F6' }]}>
                          <Ionicons name="person" size={16} color="#71579C" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.vetNameText}>{vet.displayName || `Dr. ${vet.name}`}</Text>
                          <Text style={styles.clinicText}>{vet.clinicName}</Text>
                          <Text style={styles.grantedDateText}>{vet.clinicAddress || 'Verified Clinic'}</Text>
                        </View>
                      </View>

                      <Pressable
                        onPress={() => handleGrant(vet)}
                        disabled={actionBusy}
                        style={styles.grantBtn}
                      >
                        <Ionicons name="share-outline" size={14} color="#FFFFFF" />
                        <Text style={styles.grantBtnText}>Grant Access</Text>
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
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
  headerTitleBox: { alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#304439' },
  headerSubtitle: { fontSize: 11, color: '#71579C', fontWeight: '700', marginTop: 2 },
  scrollContent: { padding: 16, paddingBottom: 40, gap: 14 },
  infoBanner: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#F3EEF8',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#ECE4F2',
  },
  infoTitle: { fontSize: 13, fontWeight: '800', color: '#304439' },
  infoText: { fontSize: 11, color: '#554564', marginTop: 3, lineHeight: 16 },
  centerBox: { alignItems: 'center', paddingVertical: 30, gap: 8 },
  loadingText: { color: '#71579C', fontSize: 12 },
  errorBox: { backgroundColor: '#FBECE7', padding: 12, borderRadius: 12 },
  errorText: { color: '#BA5648', fontSize: 12 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ECE4F2',
    gap: 12,
  },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#304439' },
  sectionSubtitle: { fontSize: 11, color: '#958A81', marginTop: -6 },
  emptyText: { fontSize: 12, color: '#958A81', fontStyle: 'italic', paddingVertical: 8 },
  grantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAF8FC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ECE4F2',
    gap: 10,
  },
  grantLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  vetIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#F3EEF8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vetNameText: { fontSize: 13, fontWeight: '800', color: '#304439' },
  clinicText: { fontSize: 11, fontWeight: '700', color: '#71579C' },
  grantedDateText: { fontSize: 10, color: '#958A81', marginTop: 2 },
  revokeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FDEAE8',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  revokeBtnText: { fontSize: 10, fontWeight: '800', color: '#BA5648' },
  grantBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#71579C',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
  },
  grantBtnText: { fontSize: 10, fontWeight: '800', color: '#FFFFFF' },
});
