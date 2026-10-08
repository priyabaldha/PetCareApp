import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import {
  getVetPatient,
  getVetPatientHistory,
  type PatientSharedHistory,
  type VetConsultation,
  type VetPatient,
} from '../../services/vets';

import VetConsultationModal from './VetConsultationModal';
import VetPrescriptionModal from './VetPrescriptionModal';
import VetVaccinationModal from './VetVaccinationModal';

interface Props {
  visible: boolean;
  petId: string | null;
  onClose: () => void;
}

type DetailTab = 'overview' | 'history' | 'consultations' | 'prescriptions' | 'vaccines';

export default function VetPatientDetailModal({ visible, petId, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');
  const [patientData, setPatientData] = useState<{
    patient: VetPatient;
    consultations: VetConsultation[];
  } | null>(null);
  const [history, setHistory] = useState<PatientSharedHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [historyRestricted, setHistoryRestricted] = useState(false);

  const [consultModalOpen, setConsultModalOpen] = useState(false);
  const [selectedConsult, setSelectedConsult] = useState<VetConsultation | null>(null);
  const [rxModalOpen, setRxModalOpen] = useState(false);
  const [vaxModalOpen, setVaxModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    if (!petId) return;
    setLoading(true);
    setError('');
    setHistoryRestricted(false);

    try {
      const res = await getVetPatient(petId);
      setPatientData(res);

      if (res.patient.accessScope === 'full_history') {
        try {
          const hist = await getVetPatientHistory(petId);
          setHistory(hist);
        } catch {
          setHistoryRestricted(true);
        }
      } else {
        setHistoryRestricted(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load patient details.');
    } finally {
      setLoading(false);
    }
  }, [petId]);

  useEffect(() => {
    if (visible && petId) {
      setActiveTab('overview');
      void loadData();
    }
  }, [visible, petId, loadData]);

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
        {/* HEADER */}
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="arrow-back" size={20} color="#304439" />
          </Pressable>
          <View style={styles.headerTitleBox}>
            <Text style={styles.headerTitle}>
              {patientData?.patient.name || 'Patient Profile'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {patientData?.patient.species.toUpperCase()} • {patientData?.patient.breed || 'Mixed Breed'}
            </Text>
          </View>
          <View style={{ width: 36 }} />
        </View>

        {/* HORIZONTAL TAB BAR */}
        <View style={styles.tabBarWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabBarScroll}
          >
            {[
              { key: 'overview', label: 'Overview', icon: 'paw-outline' },
              { key: 'consultations', label: 'Consultations', icon: 'document-text-outline' },
              { key: 'prescriptions', label: 'Prescriptions', icon: 'medical-outline' },
              { key: 'vaccines', label: 'Vaccines', icon: 'medkit-outline' },
              { key: 'history', label: 'Shared History', icon: 'folder-open-outline' },
            ].map((tab) => {
              const selected = activeTab === tab.key;
              return (
                <Pressable
                  key={tab.key}
                  onPress={() => setActiveTab(tab.key as DetailTab)}
                  style={[styles.tabPill, selected && styles.tabPillSelected]}
                >
                  <Ionicons
                    name={tab.icon as any}
                    size={14}
                    color={selected ? '#FFFFFF' : '#71579C'}
                  />
                  <Text
                    style={[styles.tabPillText, selected && styles.tabPillTextSelected]}
                  >
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color="#71579C" />
            <Text style={styles.loadingText}>Loading patient medical chart…</Text>
          </View>
        ) : error ? (
          <View style={styles.centerState}>
            <Ionicons name="alert-circle-outline" size={32} color="#BA5648" />
            <Text style={styles.errorTitle}>Could not open chart</Text>
            <Text style={styles.errorSubtitle}>{error}</Text>
            <Pressable onPress={loadData} style={styles.retryBtn}>
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl refreshing={loading} onRefresh={loadData} tintColor="#71579C" />
            }
          >
            {/* ACTION TOOLBAR */}
            <View style={styles.actionToolbar}>
              <Pressable
                onPress={() => {
                  setSelectedConsult(null);
                  setConsultModalOpen(true);
                }}
                style={styles.actionBtnPrimary}
              >
                <Ionicons name="document-text" size={15} color="#FFFFFF" />
                <Text style={styles.actionBtnTextPrimary}>+ Consultation</Text>
              </Pressable>

              <Pressable
                onPress={() => setRxModalOpen(true)}
                style={styles.actionBtnSecondary}
              >
                <Ionicons name="medical" size={15} color="#71579C" />
                <Text style={styles.actionBtnTextSecondary}>+ Prescription</Text>
              </Pressable>

              <Pressable
                onPress={() => setVaxModalOpen(true)}
                style={styles.actionBtnSecondary}
              >
                <Ionicons name="medkit" size={15} color="#71579C" />
                <Text style={styles.actionBtnTextSecondary}>+ Vaccine</Text>
              </Pressable>
            </View>

            {/* TAB: OVERVIEW */}
            {activeTab === 'overview' && (
              <View style={styles.tabContent}>
                {/* PATIENT INFO CARD */}
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Ionicons name="information-circle-outline" size={18} color="#71579C" />
                    <Text style={styles.cardTitle}>Patient & Owner Information</Text>
                  </View>

                  <View style={styles.grid2}>
                    <View style={styles.infoCol}>
                      <Text style={styles.infoLabel}>Species / Breed</Text>
                      <Text style={styles.infoVal}>
                        {patientData?.patient.species} • {patientData?.patient.breed || 'N/A'}
                      </Text>
                    </View>
                    <View style={styles.infoCol}>
                      <Text style={styles.infoLabel}>Sex</Text>
                      <Text style={styles.infoVal}>{patientData?.patient.sex}</Text>
                    </View>
                    <View style={styles.infoCol}>
                      <Text style={styles.infoLabel}>Date of Birth</Text>
                      <Text style={styles.infoVal}>{patientData?.patient.dateOfBirth || 'Not specified'}</Text>
                    </View>
                    <View style={styles.infoCol}>
                      <Text style={styles.infoLabel}>Weight</Text>
                      <Text style={styles.infoVal}>
                        {patientData?.patient.weightKg ? `${patientData.patient.weightKg} kg` : 'Not recorded'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.infoCol}>
                    <Text style={styles.infoLabel}>Owner Details</Text>
                    <Text style={styles.ownerNameText}>{patientData?.patient.ownerName}</Text>
                    <Text style={styles.ownerContactText}>{patientData?.patient.ownerEmail}</Text>
                  </View>

                  <View style={styles.accessBadgeRow}>
                    <Ionicons
                      name={patientData?.patient.accessScope === 'full_history' ? 'shield-checkmark' : 'lock-closed'}
                      size={14}
                      color={patientData?.patient.accessScope === 'full_history' ? '#2F7C5D' : '#976A17'}
                    />
                    <Text style={styles.accessBadgeText}>
                      {patientData?.patient.accessScope === 'full_history'
                        ? 'Full Clinical History Sharing Granted by Owner'
                        : 'Consultation Access Only (Full History Not Shared)'}
                    </Text>
                  </View>
                </View>

                {/* RECENT CONSULTATIONS */}
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Recent Consultations</Text>
                  {patientData?.consultations.length === 0 ? (
                    <Text style={styles.emptyNote}>No consultations recorded yet.</Text>
                  ) : (
                    patientData?.consultations.slice(0, 3).map((c) => (
                      <Pressable
                        key={c.id}
                        onPress={() => {
                          setSelectedConsult(c);
                          setConsultModalOpen(true);
                        }}
                        style={styles.consultSnippet}
                      >
                        <View style={styles.consultSnippetTop}>
                          <Text style={styles.consultDate}>{c.visitDate}</Text>
                          <View
                            style={[
                              styles.statusTag,
                              c.status === 'finalized' ? styles.statusFinalized : styles.statusDraft,
                            ]}
                          >
                            <Text
                              style={[
                                styles.statusTagText,
                                c.status === 'finalized' ? styles.statusFinalizedText : styles.statusDraftText,
                              ]}
                            >
                              {c.status.toUpperCase()}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.consultDiag}>Diagnosis: {c.diagnosis || 'Draft in progress'}</Text>
                        <Text style={styles.consultPlan} numberOfLines={2}>
                          {c.treatmentPlan || c.symptoms}
                        </Text>
                      </Pressable>
                    ))
                  )}
                </View>
              </View>
            )}

            {/* TAB: CONSULTATIONS */}
            {activeTab === 'consultations' && (
              <View style={styles.tabContent}>
                {patientData?.consultations.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <Ionicons name="document-text-outline" size={28} color="#71579C" />
                    <Text style={styles.emptyCardTitle}>No consultations yet</Text>
                    <Text style={styles.emptyCardSub}>
                      Record examination notes, diagnosis, and treatment plans.
                    </Text>
                    <Pressable
                      onPress={() => {
                        setSelectedConsult(null);
                        setConsultModalOpen(true);
                      }}
                      style={styles.emptyCardBtn}
                    >
                      <Text style={styles.emptyCardBtnText}>+ Start First Consultation</Text>
                    </Pressable>
                  </View>
                ) : (
                  patientData?.consultations.map((c) => (
                    <View key={c.id} style={styles.card}>
                      <View style={styles.consultSnippetTop}>
                        <Text style={styles.consultDate}>{c.visitDate}</Text>
                        <View
                          style={[
                            styles.statusTag,
                            c.status === 'finalized' ? styles.statusFinalized : styles.statusDraft,
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusTagText,
                              c.status === 'finalized' ? styles.statusFinalizedText : styles.statusDraftText,
                            ]}
                          >
                            {c.status.toUpperCase()}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.detailBlock}>
                        <Text style={styles.detailBlockLabel}>Reason / Symptoms</Text>
                        <Text style={styles.detailBlockVal}>{c.symptoms}</Text>
                      </View>

                      {c.examinationNotes ? (
                        <View style={styles.detailBlock}>
                          <Text style={styles.detailBlockLabel}>Examination Notes</Text>
                          <Text style={styles.detailBlockVal}>{c.examinationNotes}</Text>
                        </View>
                      ) : null}

                      <View style={styles.detailBlock}>
                        <Text style={styles.detailBlockLabel}>Diagnosis</Text>
                        <Text style={styles.detailBlockValBold}>{c.diagnosis || 'Pending'}</Text>
                      </View>

                      <View style={styles.detailBlock}>
                        <Text style={styles.detailBlockLabel}>Treatment Plan</Text>
                        <Text style={styles.detailBlockVal}>{c.treatmentPlan}</Text>
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
                        <View style={styles.amendmentsSection}>
                          <Text style={styles.amendmentsTitle}>Clinical Amendments</Text>
                          {c.amendments.map((a, i) => (
                            <View key={i} style={styles.amendmentItem}>
                              <Text style={styles.amendmentDate}>{a.amendedAt.slice(0, 10)}</Text>
                              <Text style={styles.amendmentNote}>{a.note}</Text>
                            </View>
                          ))}
                        </View>
                      )}

                      <Pressable
                        onPress={() => {
                          setSelectedConsult(c);
                          setConsultModalOpen(true);
                        }}
                        style={styles.cardActionBtn}
                      >
                        <Text style={styles.cardActionBtnText}>
                          {c.status === 'draft' ? 'Edit Draft →' : '+ Add Clinical Amendment'}
                        </Text>
                      </Pressable>
                    </View>
                  ))
                )}
              </View>
            )}

            {/* TAB: PRESCRIPTIONS */}
            {activeTab === 'prescriptions' && (
              <View style={styles.tabContent}>
                {history?.prescriptions.length === 0 || !history ? (
                  <View style={styles.emptyCard}>
                    <Ionicons name="medical-outline" size={28} color="#71579C" />
                    <Text style={styles.emptyCardTitle}>No active prescriptions</Text>
                    <Text style={styles.emptyCardSub}>
                      Issue structured medication instructions and dosages.
                    </Text>
                    <Pressable
                      onPress={() => setRxModalOpen(true)}
                      style={styles.emptyCardBtn}
                    >
                      <Text style={styles.emptyCardBtnText}>+ Issue Prescription</Text>
                    </Pressable>
                  </View>
                ) : (
                  history.prescriptions.map((rx) => (
                    <View key={rx.id} style={styles.card}>
                      <View style={styles.consultSnippetTop}>
                        <Text style={styles.rxMedicineName}>{rx.medicineName}</Text>
                        <View style={styles.rxBadge}>
                          <Text style={styles.rxBadgeText}>{rx.status.toUpperCase()}</Text>
                        </View>
                      </View>
                      <Text style={styles.rxDosage}>Dosage: {rx.dosage} ({rx.route})</Text>
                      <Text style={styles.rxFreq}>Frequency: {rx.frequency}</Text>
                      <Text style={styles.rxDates}>
                        Course: {rx.startDate} {rx.endDate ? `to ${rx.endDate}` : '(Ongoing)'}
                      </Text>
                      {rx.instructions ? (
                        <Text style={styles.rxInstructions}>Instructions: {rx.instructions}</Text>
                      ) : null}
                    </View>
                  ))
                )}
              </View>
            )}

            {/* TAB: VACCINES */}
            {activeTab === 'vaccines' && (
              <View style={styles.tabContent}>
                {history?.vaccinations.length === 0 || !history ? (
                  <View style={styles.emptyCard}>
                    <Ionicons name="medkit-outline" size={28} color="#71579C" />
                    <Text style={styles.emptyCardTitle}>No vaccines recorded</Text>
                    <Text style={styles.emptyCardSub}>
                      Record administered core/non-core vaccines and next due dates.
                    </Text>
                    <Pressable
                      onPress={() => setVaxModalOpen(true)}
                      style={styles.emptyCardBtn}
                    >
                      <Text style={styles.emptyCardBtnText}>+ Record Vaccine</Text>
                    </Pressable>
                  </View>
                ) : (
                  history.vaccinations.map((v) => (
                    <View key={v.id} style={styles.card}>
                      <View style={styles.consultSnippetTop}>
                        <Text style={styles.vaxName}>{v.vaccineName}</Text>
                        {v.isVetAuthored && (
                          <View style={styles.vaxAuthoredBadge}>
                            <Text style={styles.vaxAuthoredText}>VET RECORDED</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.vaxDate}>Administered: {v.dateAdministered}</Text>
                      {v.nextDueDate && (
                        <Text style={styles.vaxNextDue}>Next Due Date: {v.nextDueDate}</Text>
                      )}
                      {v.batchNumber ? (
                        <Text style={styles.vaxBatch}>Batch No: {v.batchNumber}</Text>
                      ) : null}
                      {v.notes ? <Text style={styles.vaxNotes}>{v.notes}</Text> : null}
                    </View>
                  ))
                )}
              </View>
            )}

            {/* TAB: SHARED HISTORY */}
            {activeTab === 'history' && (
              <View style={styles.tabContent}>
                {historyRestricted ? (
                  <View style={styles.restrictedCard}>
                    <Ionicons name="lock-closed" size={32} color="#BA5648" />
                    <Text style={styles.restrictedTitle}>Access Restricted</Text>
                    <Text style={styles.restrictedSub}>
                      The pet owner has not shared historical medical notes for this pet, or sharing was
                      revoked. Only consultations and direct prescriptions recorded by you are accessible.
                    </Text>
                  </View>
                ) : (
                  <>
                    <View style={styles.card}>
                      <Text style={styles.cardTitle}>Owner-Entered Health Notes</Text>
                      {history?.healthNotes.length === 0 ? (
                        <Text style={styles.emptyNote}>No owner notes entered.</Text>
                      ) : (
                        history?.healthNotes.map((h) => (
                          <View key={h.id} style={styles.historyItem}>
                            <Text style={styles.historyDate}>{h.visitDate} • {h.clinicName}</Text>
                            <Text style={styles.historySymptoms}>Symptoms: {h.symptoms}</Text>
                            {h.diagnosis ? <Text style={styles.historyDiag}>Diagnosis: {h.diagnosis}</Text> : null}
                          </View>
                        ))
                      )}
                    </View>

                    <View style={styles.card}>
                      <Text style={styles.cardTitle}>Active & Past Medications</Text>
                      {history?.medications.length === 0 ? (
                        <Text style={styles.emptyNote}>No medications recorded.</Text>
                      ) : (
                        history?.medications.map((m) => (
                          <View key={m.id} style={styles.historyItem}>
                            <Text style={styles.historyMedName}>{m.medicineName} ({m.status})</Text>
                            <Text style={styles.historyMedDetail}>{m.dosage} • {m.frequency}</Text>
                            <Text style={styles.historyMedDates}>{m.startDate} {m.endDate ? `to ${m.endDate}` : ''}</Text>
                          </View>
                        ))
                      )}
                    </View>
                  </>
                )}
              </View>
            )}
          </ScrollView>
        )}

        {/* MODALS */}
        {petId && (
          <>
            <VetConsultationModal
              visible={consultModalOpen}
              petId={petId}
              petName={patientData?.patient.name || 'Patient'}
              existingConsultation={selectedConsult}
              onClose={() => setConsultModalOpen(false)}
              onSuccess={loadData}
            />

            <VetPrescriptionModal
              visible={rxModalOpen}
              petId={petId}
              petName={patientData?.patient.name || 'Patient'}
              onClose={() => setRxModalOpen(false)}
              onSuccess={loadData}
            />

            <VetVaccinationModal
              visible={vaxModalOpen}
              petId={petId}
              petName={patientData?.patient.name || 'Patient'}
              onClose={() => setVaxModalOpen(false)}
              onSuccess={loadData}
            />
          </>
        )}
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
  tabBarWrapper: {
    backgroundColor: '#F9F7F2',
    borderBottomWidth: 1,
    borderBottomColor: '#ECE4F2',
    paddingVertical: 8,
  },
  tabBarScroll: { paddingHorizontal: 16, gap: 8 },
  tabPill: {
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
  tabPillSelected: { backgroundColor: '#71579C', borderColor: '#71579C' },
  tabPillText: { fontSize: 11, fontWeight: '700', color: '#5B477A' },
  tabPillTextSelected: { color: '#FFFFFF' },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 10 },
  loadingText: { color: '#71579C', fontSize: 12, fontWeight: '700' },
  errorTitle: { fontSize: 15, fontWeight: '800', color: '#BA5648' },
  errorSubtitle: { fontSize: 12, color: '#777184', textAlign: 'center' },
  retryBtn: { marginTop: 10, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#71579C', borderRadius: 10 },
  retryText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  actionToolbar: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  actionBtnPrimary: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#71579C',
    paddingVertical: 10,
    borderRadius: 12,
  },
  actionBtnTextPrimary: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  actionBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F3EEF8',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ECE4F2',
  },
  actionBtnTextSecondary: { color: '#71579C', fontSize: 11, fontWeight: '800' },
  tabContent: { gap: 14 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ECE4F2',
    gap: 10,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  cardTitle: { fontSize: 14, fontWeight: '800', color: '#304439' },
  grid2: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  infoCol: { flex: 1, minWidth: '45%' },
  infoLabel: { fontSize: 10, fontWeight: '700', color: '#958A81', textTransform: 'uppercase' },
  infoVal: { fontSize: 12, fontWeight: '700', color: '#304439', marginTop: 2 },
  ownerNameText: { fontSize: 13, fontWeight: '800', color: '#304439', marginTop: 2 },
  ownerContactText: { fontSize: 11, color: '#71579C', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#F0EAF5', marginVertical: 6 },
  accessBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F4EEF9',
    padding: 10,
    borderRadius: 10,
    marginTop: 4,
  },
  accessBadgeText: { fontSize: 10, fontWeight: '700', color: '#5B477A', flex: 1 },
  emptyNote: { fontSize: 12, color: '#958A81', fontStyle: 'italic', marginVertical: 6 },
  consultSnippet: {
    backgroundColor: '#FAF8FC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ECE4F2',
    gap: 4,
  },
  consultSnippetTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  consultDate: { fontSize: 12, fontWeight: '800', color: '#304439' },
  statusTag: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  statusTagText: { fontSize: 9, fontWeight: '800' },
  statusFinalized: { backgroundColor: '#E4EFE8' },
  statusFinalizedText: { color: '#2F7C5D', fontSize: 9, fontWeight: '800' },
  statusDraft: { backgroundColor: '#FFF0C9' },
  statusDraftText: { color: '#976A17', fontSize: 9, fontWeight: '800' },
  consultDiag: { fontSize: 12, fontWeight: '700', color: '#71579C' },
  consultPlan: { fontSize: 11, color: '#777184', lineHeight: 16 },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#ECE4F2',
  },
  emptyCardTitle: { fontSize: 15, fontWeight: '800', color: '#304439' },
  emptyCardSub: { fontSize: 11, color: '#958A81', textAlign: 'center', lineHeight: 16 },
  emptyCardBtn: {
    marginTop: 8,
    backgroundColor: '#71579C',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  emptyCardBtnText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  detailBlock: { gap: 2, marginTop: 4 },
  detailBlockLabel: { fontSize: 10, fontWeight: '700', color: '#958A81', textTransform: 'uppercase' },
  detailBlockVal: { fontSize: 12, color: '#304439', lineHeight: 18 },
  detailBlockValBold: { fontSize: 13, fontWeight: '800', color: '#71579C' },
  followUpBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F3EEF8',
    padding: 10,
    borderRadius: 10,
    marginTop: 6,
  },
  followUpText: { fontSize: 11, fontWeight: '700', color: '#5B477A', flex: 1 },
  amendmentsSection: {
    backgroundColor: '#FAF8FC',
    borderRadius: 10,
    padding: 10,
    marginTop: 6,
    gap: 6,
    borderWidth: 1,
    borderColor: '#ECE4F2',
  },
  amendmentsTitle: { fontSize: 11, fontWeight: '800', color: '#71579C' },
  amendmentItem: { borderLeftWidth: 2, borderLeftColor: '#71579C', paddingLeft: 8 },
  amendmentDate: { fontSize: 9, fontWeight: '700', color: '#958A81' },
  amendmentNote: { fontSize: 11, color: '#304439', marginTop: 1 },
  cardActionBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    marginTop: 4,
  },
  cardActionBtnText: { fontSize: 11, fontWeight: '800', color: '#71579C' },
  rxMedicineName: { fontSize: 14, fontWeight: '800', color: '#304439' },
  rxBadge: { backgroundColor: '#E4EFE8', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  rxBadgeText: { color: '#2F7C5D', fontSize: 9, fontWeight: '800' },
  rxDosage: { fontSize: 12, fontWeight: '700', color: '#71579C', marginTop: 2 },
  rxFreq: { fontSize: 11, color: '#554564' },
  rxDates: { fontSize: 10, color: '#958A81', marginTop: 2 },
  rxInstructions: { fontSize: 11, color: '#304439', backgroundColor: '#FAF8FC', padding: 8, borderRadius: 8, marginTop: 4 },
  vaxName: { fontSize: 14, fontWeight: '800', color: '#304439' },
  vaxAuthoredBadge: { backgroundColor: '#F3EEF8', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  vaxAuthoredText: { color: '#71579C', fontSize: 8, fontWeight: '800' },
  vaxDate: { fontSize: 11, color: '#554564', marginTop: 2 },
  vaxNextDue: { fontSize: 11, fontWeight: '700', color: '#71579C' },
  vaxBatch: { fontSize: 10, color: '#958A81' },
  vaxNotes: { fontSize: 11, color: '#777184', marginTop: 2 },
  restrictedCard: {
    backgroundColor: '#FDEAE8',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  restrictedTitle: { fontSize: 15, fontWeight: '800', color: '#BA5648' },
  restrictedSub: { fontSize: 11, color: '#777184', textAlign: 'center', lineHeight: 18 },
  historyItem: {
    backgroundColor: '#FAF8FC',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ECE4F2',
    gap: 2,
    marginBottom: 6,
  },
  historyDate: { fontSize: 10, fontWeight: '700', color: '#958A81' },
  historySymptoms: { fontSize: 11, color: '#304439' },
  historyDiag: { fontSize: 11, fontWeight: '700', color: '#71579C' },
  historyMedName: { fontSize: 12, fontWeight: '800', color: '#304439' },
  historyMedDetail: { fontSize: 11, color: '#554564' },
  historyMedDates: { fontSize: 10, color: '#958A81' },
});
