import React, { useEffect, useRef, useState } from 'react';
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
  getAdminVetApplications,
  getAdminVetApplicationDetail,
  type AdminVetAppItem,
  type AdminPagination,
} from '../../services/admin';
import { reviewVetApplication } from '../../services/vetApplications';

export default function AdminVetApplicationsTab() {
  const [applications, setApplications] = useState<AdminVetAppItem[]>([]);
  const [pagination, setPagination] = useState<AdminPagination>({
    page: 1,
    limit: 15,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [retry, setRetry] = useState(0);

  // Review modal state
  const [reviewingApp, setReviewingApp] = useState<AdminVetAppItem | null>(null);
  const [decision, setDecision] = useState<'approved' | 'rejected'>('approved');
  const [reviewReason, setReviewReason] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');

  // History modal state
  const [historyApplicantId, setHistoryApplicantId] = useState<string | null>(
    null,
  );
  const [applicantDetail, setApplicantDetail] = useState<{
    name: string;
    email: string;
    history: Array<{
      qualifications: string;
      registrationNumber: string;
      registrationCouncil: string;
      clinicName: string;
      clinicAddress: string;
      status: string;
      revision?: string;
      submittedAt: string;
      reviewedAt: string;
      reviewReason: string;
    }>;
  } | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    getAdminVetApplications({
      page,
      limit: 15,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      search: search.trim() || undefined,
    })
      .then((res) => {
        if (active) {
          setApplications(res.applications);
          setPagination(res.pagination);
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setError(
            err instanceof Error ? err.message : 'Could not load applications.',
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [page, statusFilter, search, retry]);

  async function openHistory(userId: string) {
    setHistoryApplicantId(userId);
    setLoadingHistory(true);
    setApplicantDetail(null);

    try {
      const res = await getAdminVetApplicationDetail(userId);
      if (mounted.current) {
        setApplicantDetail({
          name: res.application.name,
          email: res.application.email,
          history: res.application.history,
        });
      }
    } catch {
      // ignore
    } finally {
      if (mounted.current) setLoadingHistory(false);
    }
  }

  async function handleSubmitReview() {
    if (!reviewingApp) return;
    const reason = reviewReason.trim();

    if (decision === 'rejected' && reason.length < 5) {
      setReviewError(
        'Rejection reason is required (at least 5 characters to guide the applicant).',
      );
      return;
    }

    setSubmittingReview(true);
    setReviewError('');

    try {
      await reviewVetApplication(
        reviewingApp.userId,
        reviewingApp.application.revision,
        decision,
        reason,
      );

      if (mounted.current) {
        Alert.alert(
          'Decision Recorded',
          decision === 'approved'
            ? `${reviewingApp.name}'s account has been granted the Vet role.`
            : `Application for ${reviewingApp.name} was rejected. They can correct their details and resubmit.`,
        );
        setReviewingApp(null);
        setReviewReason('');
        setRetry((v) => v + 1);
      }
    } catch (err) {
      if (mounted.current) {
        setReviewError(
          err instanceof Error ? err.message : 'Failed to confirm decision.',
        );
      }
    } finally {
      if (mounted.current) setSubmittingReview(false);
    }
  }

  return (
    <View style={styles.container}>
      {/* SEARCH AND FILTER TABS */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={18} color="#90809C" />
        <TextInput
          value={search}
          onChangeText={(t) => {
            setSearch(t);
            setPage(1);
          }}
          placeholder="Search by applicant, clinic or reg number..."
          placeholderTextColor="#A899B1"
          style={styles.searchInput}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color="#A899B1" />
          </Pressable>
        )}
      </View>

      <View style={styles.statusTabs}>
        {[
          { key: 'all', label: 'All Applications' },
          { key: 'pending', label: 'Pending Review' },
          { key: 'approved', label: 'Approved Vets' },
          { key: 'rejected', label: 'Rejected / Changes' },
        ].map((tab) => (
          <Pressable
            key={tab.key}
            onPress={() => {
              setStatusFilter(tab.key);
              setPage(1);
            }}
            style={[
              styles.statusTab,
              statusFilter === tab.key && styles.statusTabSelected,
            ]}
          >
            <Text
              style={[
                styles.statusTabText,
                statusFilter === tab.key && styles.statusTabTextSelected,
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* APPLICATIONS LIST */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#71579C" />
          <Text style={styles.loadingText}>Loading applications...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle-outline" size={28} color="#B95B4B" />
          <Text style={styles.errorText}>{error}</Text>
          <Pressable
            onPress={() => setRetry((v) => v + 1)}
            style={styles.retryButton}
          >
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : applications.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="clipboard-outline" size={36} color="#A89EAF" />
          <Text style={styles.emptyTitle}>No applications found</Text>
          <Text style={styles.emptySub}>
            No vet applications match the current filter or search criteria.
          </Text>
        </View>
      ) : (
        <View style={styles.listContainer}>
          <Text style={styles.resultsCount}>
            Showing {applications.length} of {pagination.total} applications (Page{' '}
            {pagination.page} of {pagination.totalPages})
          </Text>

          {applications.map((item) => {
            const app = item.application;
            const isPending = app.status === 'pending';

            return (
              <View key={`${item.userId}-${app.revision}`} style={styles.appCard}>
                <View style={styles.appCardHeader}>
                  <View style={styles.applicantInfo}>
                    <Text style={styles.applicantName}>{item.name}</Text>
                    <Text style={styles.applicantEmail}>{item.email}</Text>
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      app.status === 'approved'
                        ? styles.statusBadgeApproved
                        : app.status === 'rejected'
                        ? styles.statusBadgeRejected
                        : styles.statusBadgePending,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        app.status === 'approved'
                          ? styles.statusTextApproved
                          : app.status === 'rejected'
                          ? styles.statusTextRejected
                          : styles.statusTextPending,
                      ]}
                    >
                      {app.status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                {/* SUBMITTED / REVIEWED DATES */}
                <View style={styles.dateRow}>
                  <Text style={styles.dateText}>
                    Submitted: {new Date(app.submittedAt).toLocaleString()}
                  </Text>
                  {app.reviewedAt && (
                    <Text style={styles.dateText}>
                      Reviewed: {new Date(app.reviewedAt).toLocaleString()}
                    </Text>
                  )}
                </View>

                {/* APPLICATION CREDENTIALS DETAILS */}
                <View style={styles.credentialsBox}>
                  <View style={styles.credField}>
                    <Text style={styles.credLabel}>QUALIFICATIONS</Text>
                    <Text style={styles.credValue}>{app.qualifications}</Text>
                  </View>

                  <View style={styles.credRow}>
                    <View style={styles.credHalf}>
                      <Text style={styles.credLabel}>REGISTRATION NUMBER</Text>
                      <Text style={styles.credValue}>
                        {app.registrationNumber}
                      </Text>
                    </View>
                    <View style={styles.credHalf}>
                      <Text style={styles.credLabel}>COUNCIL / AUTHORITY</Text>
                      <Text style={styles.credValue}>
                        {app.registrationCouncil}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.credField}>
                    <Text style={styles.credLabel}>CLINIC</Text>
                    <Text style={styles.credValue}>{app.clinicName}</Text>
                    <Text style={styles.credSub}>{app.clinicAddress}</Text>
                  </View>

                  {!!app.reviewReason && (
                    <View style={styles.reviewNoteBox}>
                      <Text style={styles.reviewNoteLabel}>Review Decision Note:</Text>
                      <Text style={styles.reviewNoteText}>
                        {app.reviewReason}
                      </Text>
                    </View>
                  )}
                </View>

                {/* BOTTOM ACTIONS */}
                <View style={styles.appActionsRow}>
                  {item.historyCount > 0 && (
                    <Pressable
                      onPress={() => openHistory(item.userId)}
                      style={styles.historyBtn}
                    >
                      <Ionicons name="time-outline" size={14} color="#71579C" />
                      <Text style={styles.historyBtnText}>
                        History ({item.historyCount})
                      </Text>
                    </Pressable>
                  )}

                  {isPending && (
                    <View style={styles.decisionBtns}>
                      <Pressable
                        onPress={() => {
                          setReviewingApp(item);
                          setDecision('rejected');
                          setReviewReason('');
                          setReviewError('');
                        }}
                        style={styles.rejectBtn}
                      >
                        <Text style={styles.rejectBtnText}>Reject...</Text>
                      </Pressable>

                      <Pressable
                        onPress={() => {
                          setReviewingApp(item);
                          setDecision('approved');
                          setReviewReason('');
                          setReviewError('');
                        }}
                        style={styles.approveBtn}
                      >
                        <Ionicons
                          name="checkmark"
                          size={14}
                          color="#FFFFFF"
                        />
                        <Text style={styles.approveBtnText}>Approve Vet</Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              </View>
            );
          })}

          {/* PAGINATION */}
          <View style={styles.paginationControls}>
            <Pressable
              onPress={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              style={[styles.pageBtn, page <= 1 && styles.pageBtnDisabled]}
            >
              <Ionicons
                name="chevron-back"
                size={16}
                color={page <= 1 ? '#A89DB0' : '#71579C'}
              />
              <Text
                style={[
                  styles.pageBtnText,
                  page <= 1 && styles.pageBtnTextDisabled,
                ]}
              >
                Previous
              </Text>
            </Pressable>

            <Text style={styles.pageIndicator}>
              Page {pagination.page} / {pagination.totalPages}
            </Text>

            <Pressable
              onPress={() =>
                setPage((p) => Math.min(pagination.totalPages, p + 1))
              }
              disabled={page >= pagination.totalPages}
              style={[
                styles.pageBtn,
                page >= pagination.totalPages && styles.pageBtnDisabled,
              ]}
            >
              <Text
                style={[
                  styles.pageBtnText,
                  page >= pagination.totalPages && styles.pageBtnTextDisabled,
                ]}
              >
                Next
              </Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={page >= pagination.totalPages ? '#A89DB0' : '#71579C'}
              />
            </Pressable>
          </View>
        </View>
      )}

      {/* REVIEW DECISION MODAL */}
      <Modal
        visible={reviewingApp !== null}
        animationType="fade"
        transparent
        onRequestClose={() => setReviewingApp(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.reviewDialog}>
            <View style={styles.reviewDialogHeader}>
              <Ionicons
                name={
                  decision === 'approved'
                    ? 'shield-checkmark-outline'
                    : 'close-circle-outline'
                }
                size={24}
                color={decision === 'approved' ? '#54816A' : '#BA5648'}
              />
              <Text style={styles.reviewDialogTitle}>
                {decision === 'approved'
                  ? `Approve ${reviewingApp?.name} as Vet?`
                  : `Reject ${reviewingApp?.name}'s Application?`}
              </Text>
            </View>

            <Text style={styles.reviewDialogDesc}>
              {decision === 'approved'
                ? `Granting Vet access changes ${reviewingApp?.name}'s account role to Vet. Self-reported credentials: ${reviewingApp?.application.registrationNumber} (${reviewingApp?.application.registrationCouncil}).`
                : `Explain what details need correction. ${reviewingApp?.name} will receive this feedback and can resubmit.`}
            </Text>

            <Text style={styles.inputLabel}>
              {decision === 'approved'
                ? 'Review Note (Optional)'
                : 'Correction / Rejection Reason * (Min 5 chars)'}
            </Text>
            <TextInput
              value={reviewReason}
              onChangeText={setReviewReason}
              placeholder={
                decision === 'approved'
                  ? 'Optional approval note for audit log...'
                  : 'Specify what requires correction (e.g. invalid registration number)...'
              }
              placeholderTextColor="#A899B1"
              multiline
              numberOfLines={3}
              maxLength={1000}
              style={styles.reviewInput}
            />

            {!!reviewError && (
              <Text style={styles.dialogErrorText}>{reviewError}</Text>
            )}

            <View style={styles.reviewDialogActions}>
              <Pressable
                onPress={() => setReviewingApp(null)}
                disabled={submittingReview}
                style={styles.cancelBtn}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>

              <Pressable
                onPress={handleSubmitReview}
                disabled={
                  submittingReview ||
                  (decision === 'rejected' && reviewReason.trim().length < 5)
                }
                style={[
                  decision === 'approved'
                    ? styles.confirmApproveBtn
                    : styles.confirmRejectBtn,
                  (submittingReview ||
                    (decision === 'rejected' &&
                      reviewReason.trim().length < 5)) &&
                    styles.btnDisabled,
                ]}
              >
                {submittingReview ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.confirmBtnText}>
                    {decision === 'approved' ? 'Confirm Approval' : 'Reject'}
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* REVIEW HISTORY MODAL */}
      <Modal
        visible={historyApplicantId !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setHistoryApplicantId(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Application History</Text>
                <Text style={styles.modalSub}>{applicantDetail?.name}</Text>
              </View>
              <Pressable
                onPress={() => setHistoryApplicantId(null)}
                style={styles.closeBtn}
              >
                <Ionicons name="close" size={22} color="#453852" />
              </Pressable>
            </View>

            {loadingHistory ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="large" color="#71579C" />
                <Text style={styles.loadingText}>Loading review history...</Text>
              </View>
            ) : applicantDetail && applicantDetail.history.length > 0 ? (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.historyList}
              >
                {applicantDetail.history.map((h, index) => (
                  <View key={`${h.revision}-${index}`} style={styles.historyItemCard}>
                    <View style={styles.historyItemTop}>
                      <View
                        style={[
                          styles.statusBadge,
                          h.status === 'approved'
                            ? styles.statusBadgeApproved
                            : styles.statusBadgeRejected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusBadgeText,
                            h.status === 'approved'
                              ? styles.statusTextApproved
                              : styles.statusTextRejected,
                          ]}
                        >
                          {h.status.toUpperCase()}
                        </Text>
                      </View>
                      <Text style={styles.dateText}>
                        {new Date(h.reviewedAt).toLocaleDateString()}
                      </Text>
                    </View>

                    <Text style={styles.credSub}>
                      Clinic: {h.clinicName} • Reg: {h.registrationNumber}
                    </Text>

                    {!!h.reviewReason && (
                      <View style={styles.reviewNoteBox}>
                        <Text style={styles.reviewNoteLabel}>Admin Note:</Text>
                        <Text style={styles.reviewNoteText}>
                          {h.reviewReason}
                        </Text>
                      </View>
                    )}
                  </View>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyTitle}>No prior review entries.</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%' },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#ECE4F2',
    paddingHorizontal: 12,
    height: 46,
    gap: 8,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    color: '#433451',
    fontSize: 13,
  },
  statusTabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  statusTab: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECE4F2',
  },
  statusTabSelected: {
    backgroundColor: '#71579C',
    borderColor: '#71579C',
  },
  statusTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#71579C',
  },
  statusTabTextSelected: {
    color: '#FFFFFF',
  },
  listContainer: {
    marginTop: 4,
  },
  resultsCount: {
    fontSize: 11,
    color: '#8F809A',
    marginBottom: 10,
  },
  appCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EAE2F1',
    padding: 16,
    marginBottom: 14,
  },
  appCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  applicantInfo: {
    flex: 1,
    marginRight: 10,
  },
  applicantName: {
    color: '#342542',
    fontSize: 16,
    fontWeight: '800',
  },
  applicantEmail: {
    color: '#847492',
    fontSize: 12,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgePending: { backgroundColor: '#FFF0C9' },
  statusBadgeApproved: { backgroundColor: '#E2F0E8' },
  statusBadgeRejected: { backgroundColor: '#FDEAE8' },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusTextPending: { color: '#976A17' },
  statusTextApproved: { color: '#386D51' },
  statusTextRejected: { color: '#BA5648' },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    marginBottom: 10,
  },
  dateText: {
    fontSize: 10,
    color: '#9E8FA9',
  },
  credentialsBox: {
    backgroundColor: '#FAF8FC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F0EAF6',
    padding: 12,
    gap: 8,
  },
  credField: {},
  credRow: {
    flexDirection: 'row',
    gap: 12,
  },
  credHalf: {
    flex: 1,
  },
  credLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#9585A2',
    letterSpacing: 0.6,
  },
  credValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#443553',
    marginTop: 2,
  },
  credSub: {
    fontSize: 11,
    color: '#7B6C89',
    marginTop: 1,
  },
  reviewNoteBox: {
    backgroundColor: '#F7EDFA',
    borderRadius: 8,
    padding: 8,
    marginTop: 4,
  },
  reviewNoteLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#71579C',
  },
  reviewNoteText: {
    fontSize: 11,
    color: '#554465',
    marginTop: 2,
  },
  appActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F4EDFA',
  },
  historyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#F3EEF9',
    borderRadius: 8,
  },
  historyBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#71579C',
  },
  decisionBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 'auto',
  },
  rejectBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#FDEAE8',
  },
  rejectBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#BA5648',
  },
  approveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#54816A',
  },
  approveBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  paginationControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingVertical: 10,
  },
  pageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECE4F2',
  },
  pageBtnDisabled: {
    opacity: 0.5,
  },
  pageBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#71579C',
  },
  pageBtnTextDisabled: {
    color: '#A89DB0',
  },
  pageIndicator: {
    fontSize: 11,
    fontWeight: '700',
    color: '#847492',
  },
  centerBox: {
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 12,
    color: '#8F809A',
  },
  errorBox: {
    padding: 24,
    backgroundColor: '#FBECE7',
    borderRadius: 16,
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    color: '#BA5648',
    fontSize: 12,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#BA5648',
    marginTop: 6,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  emptyBox: {
    padding: 40,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#51425F',
  },
  emptySub: {
    fontSize: 11,
    color: '#9E8EA8',
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(25, 18, 32, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  reviewDialog: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
  },
  reviewDialogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  reviewDialogTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#342542',
  },
  reviewDialogDesc: {
    fontSize: 12,
    color: '#7C6F86',
    lineHeight: 18,
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#554664',
    marginBottom: 6,
  },
  reviewInput: {
    minHeight: 70,
    borderWidth: 1,
    borderColor: '#E5DCEC',
    borderRadius: 12,
    padding: 10,
    fontSize: 12,
    color: '#453852',
    backgroundColor: '#FAF8FC',
    textAlignVertical: 'top',
  },
  dialogErrorText: {
    color: '#BA5648',
    fontSize: 11,
    marginTop: 6,
  },
  reviewDialogActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 16,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#F0EAF6',
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#71579C',
  },
  confirmApproveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#54816A',
  },
  confirmRejectBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#BA5648',
  },
  confirmBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  modalContent: {
    width: '100%',
    maxWidth: 550,
    maxHeight: '80%',
    backgroundColor: '#F9F7F2',
    borderRadius: 24,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EAE2F1',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#342542',
  },
  modalSub: {
    fontSize: 12,
    color: '#847492',
  },
  closeBtn: {
    padding: 4,
  },
  modalLoading: {
    padding: 30,
    alignItems: 'center',
    gap: 10,
  },
  historyList: {
    paddingVertical: 14,
  },
  historyItemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EAE2F1',
    marginBottom: 10,
  },
  historyItemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
});
