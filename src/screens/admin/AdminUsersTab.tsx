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
  getAdminUsers,
  getAdminUserDetail,
  suspendUser,
  reactivateUser,
  type AdminUserSummary,
  type AdminUserDetail,
  type AdminPagination,
} from '../../services/admin';
import type { AuthUser } from '../../services/auth';

interface Props {
  currentUser: AuthUser;
}

export default function AdminUsersTab({ currentUser }: Props) {
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [pagination, setPagination] = useState<AdminPagination>({
    page: 1,
    limit: 15,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [retry, setRetry] = useState(0);

  // User Detail modal state
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [detailUser, setDetailUser] = useState<AdminUserDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState('');

  // Suspend action modal state
  const [suspendingUser, setSuspendingUser] =
    useState<AdminUserSummary | AdminUserDetail | null>(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState('');

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

    getAdminUsers({
      page,
      limit: 15,
      search: search.trim() || undefined,
      role: roleFilter !== 'all' ? roleFilter : undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
    })
      .then((res) => {
        if (active) {
          setUsers(res.users);
          setPagination(res.pagination);
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setError(
            err instanceof Error ? err.message : 'Could not load users list.',
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [page, search, roleFilter, statusFilter, retry]);

  async function openUserDetail(userId: string) {
    setSelectedUserId(userId);
    setLoadingDetail(true);
    setDetailError('');
    setDetailUser(null);

    try {
      const res = await getAdminUserDetail(userId);
      if (mounted.current) setDetailUser(res);
    } catch (err) {
      if (mounted.current) {
        setDetailError(
          err instanceof Error ? err.message : 'Failed to load user details.',
        );
      }
    } finally {
      if (mounted.current) setLoadingDetail(false);
    }
  }

  async function handleConfirmSuspend() {
    if (!suspendingUser) return;
    const reason = suspendReason.trim();

    if (reason.length < 5) {
      setActionError('Reason must contain at least 5 characters.');
      return;
    }

    setActionBusy(true);
    setActionError('');

    try {
      await suspendUser(suspendingUser.id, reason);
      if (mounted.current) {
        Alert.alert(
          'Account Suspended',
          `${suspendingUser.name} has been suspended. All active sessions were closed.`,
        );
        setSuspendingUser(null);
        setSuspendReason('');
        if (selectedUserId === suspendingUser.id) {
          setSelectedUserId(null);
        }
        setRetry((v) => v + 1);
      }
    } catch (err) {
      if (mounted.current) {
        setActionError(
          err instanceof Error ? err.message : 'Failed to suspend user.',
        );
      }
    } finally {
      if (mounted.current) setActionBusy(false);
    }
  }

  async function handleConfirmReactivate(user: AdminUserSummary | AdminUserDetail) {
    Alert.alert(
      'Reactivate Account',
      `Restore full access for ${user.name}? They will be able to sign in again.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reactivate',
          onPress: async () => {
            setActionBusy(true);
            try {
              await reactivateUser(user.id);
              Alert.alert('Account Reactivated', `${user.name} can now sign in.`);
              if (selectedUserId === user.id) {
                openUserDetail(user.id);
              }
              setRetry((v) => v + 1);
            } catch (err) {
              Alert.alert(
                'Reactivation Failed',
                err instanceof Error ? err.message : 'Could not reactivate account.',
              );
            } finally {
              setActionBusy(false);
            }
          },
        },
      ],
    );
  }

  return (
    <View style={styles.container}>
      {/* SEARCH AND FILTERS */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={18} color="#90809C" />
        <TextInput
          value={search}
          onChangeText={(t) => {
            setSearch(t);
            setPage(1);
          }}
          placeholder="Search users by name or email..."
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

      {/* FILTER CHIPS */}
      <View style={styles.filterSection}>
        <Text style={styles.filterSectionLabel}>ROLE:</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterChips}
        >
          {['all', 'pet_owner', 'vet', 'admin'].map((r) => (
            <Pressable
              key={r}
              onPress={() => {
                setRoleFilter(r);
                setPage(1);
              }}
              style={[
                styles.chip,
                roleFilter === r && styles.chipSelected,
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  roleFilter === r && styles.chipTextSelected,
                ]}
              >
                {r === 'all'
                  ? 'All Roles'
                  : r === 'pet_owner'
                  ? 'Pet Owners'
                  : r === 'vet'
                  ? 'Vets'
                  : 'Admins'}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <View style={styles.filterSection}>
        <Text style={styles.filterSectionLabel}>STATUS:</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterChips}
        >
          {['all', 'active', 'suspended'].map((s) => (
            <Pressable
              key={s}
              onPress={() => {
                setStatusFilter(s);
                setPage(1);
              }}
              style={[
                styles.chip,
                statusFilter === s && styles.chipSelected,
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  statusFilter === s && styles.chipTextSelected,
                ]}
              >
                {s === 'all'
                  ? 'All Status'
                  : s === 'active'
                  ? 'Active Only'
                  : 'Suspended Only'}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* USERS LIST */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#71579C" />
          <Text style={styles.loadingText}>Loading accounts...</Text>
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
      ) : users.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="people-outline" size={36} color="#A89EAF" />
          <Text style={styles.emptyTitle}>No matching accounts</Text>
          <Text style={styles.emptySub}>
            Try clearing the search query or adjusting role and status filters.
          </Text>
        </View>
      ) : (
        <View style={styles.listContainer}>
          <Text style={styles.resultsCount}>
            Showing {users.length} of {pagination.total} accounts (Page{' '}
            {pagination.page} of {pagination.totalPages})
          </Text>

          {users.map((u) => {
            const isSelf = u.id === currentUser.id;

            return (
              <View key={u.id} style={styles.userCard}>
                <View style={styles.userCardTop}>
                  <View style={styles.userCardInfo}>
                    <Text style={styles.userName}>{u.name}</Text>
                    <Text style={styles.userEmail}>{u.email}</Text>
                  </View>

                  <View style={styles.badgesRow}>
                    <View
                      style={[
                        styles.roleBadge,
                        u.role === 'admin'
                          ? styles.roleAdmin
                          : u.role === 'vet'
                          ? styles.roleVet
                          : styles.roleOwner,
                      ]}
                    >
                      <Text style={styles.roleBadgeText}>
                        {u.role.replace('_', ' ').toUpperCase()}
                      </Text>
                    </View>

                    {u.isSuspended ? (
                      <View style={styles.statusSuspended}>
                        <Text style={styles.statusSuspendedText}>SUSPENDED</Text>
                      </View>
                    ) : (
                      <View style={styles.statusActive}>
                        <Text style={styles.statusActiveText}>ACTIVE</Text>
                      </View>
                    )}
                  </View>
                </View>

                <View style={styles.userMetaRow}>
                  <View style={styles.metaItem}>
                    <Ionicons name="paw-outline" size={14} color="#8F809A" />
                    <Text style={styles.metaText}>{u.petCount} pets</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="time-outline" size={14} color="#8F809A" />
                    <Text style={styles.metaText}>
                      Joined {new Date(u.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                </View>

                {u.isSuspended && !!u.suspendedReason && (
                  <View style={styles.suspendedReasonBox}>
                    <Text style={styles.suspendedReasonTitle}>Reason:</Text>
                    <Text style={styles.suspendedReasonText}>
                      {u.suspendedReason}
                    </Text>
                  </View>
                )}

                <View style={styles.userCardActions}>
                  <Pressable
                    onPress={() => openUserDetail(u.id)}
                    style={styles.viewDetailBtn}
                  >
                    <Text style={styles.viewDetailText}>View Details</Text>
                  </Pressable>

                  {!isSelf && (
                    <>
                      {u.isSuspended ? (
                        <Pressable
                          onPress={() => handleConfirmReactivate(u)}
                          disabled={actionBusy}
                          style={styles.reactivateBtn}
                        >
                          <Text style={styles.reactivateText}>Reactivate</Text>
                        </Pressable>
                      ) : (
                        <Pressable
                          onPress={() => {
                            setSuspendingUser(u);
                            setSuspendReason('');
                            setActionError('');
                          }}
                          disabled={actionBusy}
                          style={styles.suspendBtn}
                        >
                          <Text style={styles.suspendText}>Suspend</Text>
                        </Pressable>
                      )}
                    </>
                  )}
                  {isSelf && (
                    <View style={styles.selfTag}>
                      <Text style={styles.selfTagText}>Your Account</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}

          {/* PAGINATION CONTROLS */}
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

      {/* USER DETAIL MODAL */}
      <Modal
        visible={selectedUserId !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedUserId(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>User Account Details</Text>
              <Pressable
                onPress={() => setSelectedUserId(null)}
                style={styles.closeBtn}
              >
                <Ionicons name="close" size={22} color="#453852" />
              </Pressable>
            </View>

            {loadingDetail ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="large" color="#71579C" />
                <Text style={styles.loadingText}>Fetching account details...</Text>
              </View>
            ) : detailError ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{detailError}</Text>
              </View>
            ) : detailUser ? (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.detailScroll}
              >
                <View style={styles.detailHeaderBox}>
                  <Text style={styles.detailName}>{detailUser.name}</Text>
                  <Text style={styles.detailEmail}>{detailUser.email}</Text>
                  <View style={styles.badgesRow}>
                    <View style={styles.roleBadge}>
                      <Text style={styles.roleBadgeText}>
                        {detailUser.role.replace('_', ' ').toUpperCase()}
                      </Text>
                    </View>
                    {detailUser.isSuspended ? (
                      <View style={styles.statusSuspended}>
                        <Text style={styles.statusSuspendedText}>SUSPENDED</Text>
                      </View>
                    ) : (
                      <View style={styles.statusActive}>
                        <Text style={styles.statusActiveText}>ACTIVE</Text>
                      </View>
                    )}
                  </View>
                </View>

                {detailUser.isSuspended && (
                  <View style={styles.suspendedReasonBox}>
                    <Text style={styles.suspendedReasonTitle}>
                      Suspension Reason:
                    </Text>
                    <Text style={styles.suspendedReasonText}>
                      {detailUser.suspendedReason || 'No reason specified'}
                    </Text>
                    {!!detailUser.suspendedAt && (
                      <Text style={styles.metaText}>
                        Suspended on:{' '}
                        {new Date(detailUser.suspendedAt).toLocaleString()}
                      </Text>
                    )}
                  </View>
                )}

                {/* VET APPLICATION DETAILS IF ANY */}
                {detailUser.vetApplication && (
                  <View style={styles.detailSection}>
                    <Text style={styles.sectionHeading}>Vet Application</Text>
                    <View style={styles.infoCard}>
                      <Text style={styles.infoLabel}>Status</Text>
                      <Text style={styles.infoValue}>
                        {detailUser.vetApplication.status.toUpperCase()}
                      </Text>

                      <Text style={styles.infoLabel}>Qualifications</Text>
                      <Text style={styles.infoValue}>
                        {detailUser.vetApplication.qualifications}
                      </Text>

                      <Text style={styles.infoLabel}>Registration No.</Text>
                      <Text style={styles.infoValue}>
                        {detailUser.vetApplication.registrationNumber}
                      </Text>

                      <Text style={styles.infoLabel}>Council / Authority</Text>
                      <Text style={styles.infoValue}>
                        {detailUser.vetApplication.registrationCouncil}
                      </Text>

                      <Text style={styles.infoLabel}>Clinic Name</Text>
                      <Text style={styles.infoValue}>
                        {detailUser.vetApplication.clinicName}
                      </Text>

                      <Text style={styles.infoLabel}>Clinic Address</Text>
                      <Text style={styles.infoValue}>
                        {detailUser.vetApplication.clinicAddress}
                      </Text>

                      {!!detailUser.vetApplication.reviewReason && (
                        <>
                          <Text style={styles.infoLabel}>Review Note</Text>
                          <Text style={styles.infoValue}>
                            {detailUser.vetApplication.reviewReason}
                          </Text>
                        </>
                      )}
                    </View>
                  </View>
                )}

                {/* REGISTERED PETS (Basic overview - private health records excluded) */}
                <View style={styles.detailSection}>
                  <Text style={styles.sectionHeading}>
                    Registered Pets ({detailUser.pets.length})
                  </Text>
                  <Text style={styles.privacyNote}>
                    🔒 Owner Privacy: Confidential medical diagnoses, notes and
                    prescriptions are private to pet owners and clinics.
                  </Text>

                  {detailUser.pets.length === 0 ? (
                    <Text style={styles.noItemsText}>No registered pets.</Text>
                  ) : (
                    detailUser.pets.map((p) => (
                      <View key={p.id} style={styles.petItemCard}>
                        <View style={styles.petIconBox}>
                          <Ionicons name="paw" size={18} color="#71579C" />
                        </View>
                        <View style={styles.petItemInfo}>
                          <Text style={styles.petItemName}>{p.name}</Text>
                          <Text style={styles.petItemSub}>
                            {p.species.toUpperCase()} • {p.breed || 'Unknown breed'} •{' '}
                            {p.sex}
                          </Text>
                          {p.dateOfBirth && (
                            <Text style={styles.petItemDob}>
                              DOB: {p.dateOfBirth}
                            </Text>
                          )}
                        </View>
                      </View>
                    ))
                  )}
                </View>

                {/* MODAL ACTIONS */}
                <View style={styles.modalActionRow}>
                  {detailUser.id !== currentUser.id && (
                    <>
                      {detailUser.isSuspended ? (
                        <Pressable
                          onPress={() => handleConfirmReactivate(detailUser)}
                          style={styles.reactivateModalBtn}
                        >
                          <Text style={styles.reactivateText}>
                            Reactivate Account
                          </Text>
                        </Pressable>
                      ) : (
                        <Pressable
                          onPress={() => {
                            setSuspendingUser(detailUser);
                            setSuspendReason('');
                            setActionError('');
                          }}
                          style={styles.suspendModalBtn}
                        >
                          <Text style={styles.suspendText}>Suspend Account</Text>
                        </Pressable>
                      )}
                    </>
                  )}
                </View>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>

      {/* SUSPEND REASON INPUT MODAL */}
      <Modal
        visible={suspendingUser !== null}
        animationType="fade"
        transparent
        onRequestClose={() => setSuspendingUser(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.suspendDialog}>
            <View style={styles.suspendDialogHeader}>
              <Ionicons name="warning-outline" size={24} color="#BA5648" />
              <Text style={styles.suspendDialogTitle}>
                Suspend {suspendingUser?.name}?
              </Text>
            </View>

            <Text style={styles.suspendDialogDesc}>
              Suspending this account will immediately revoke all active
              sessions and prevent sign-in until an administrator reactivates
              it.
            </Text>

            <Text style={styles.inputLabel}>Reason for suspension *</Text>
            <TextInput
              value={suspendReason}
              onChangeText={setSuspendReason}
              placeholder="Explain why this account is being suspended (min 5 chars)..."
              placeholderTextColor="#A899B1"
              multiline
              numberOfLines={3}
              maxLength={500}
              style={styles.suspendInput}
            />

            {!!actionError && (
              <Text style={styles.dialogErrorText}>{actionError}</Text>
            )}

            <View style={styles.suspendDialogActions}>
              <Pressable
                onPress={() => setSuspendingUser(null)}
                disabled={actionBusy}
                style={styles.cancelBtn}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>

              <Pressable
                onPress={handleConfirmSuspend}
                disabled={actionBusy || suspendReason.trim().length < 5}
                style={[
                  styles.confirmSuspendBtn,
                  (actionBusy || suspendReason.trim().length < 5) &&
                    styles.btnDisabled,
                ]}
              >
                {actionBusy ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.confirmSuspendText}>Confirm Suspension</Text>
                )}
              </Pressable>
            </View>
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
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    color: '#433451',
    fontSize: 13,
  },
  filterSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  filterSectionLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#90809C',
    letterSpacing: 0.8,
    width: 55,
  },
  filterChips: {
    gap: 6,
    paddingVertical: 2,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECE4F2',
  },
  chipSelected: {
    backgroundColor: '#71579C',
    borderColor: '#71579C',
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#71579C',
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  listContainer: {
    marginTop: 10,
  },
  resultsCount: {
    fontSize: 11,
    color: '#8F809A',
    marginBottom: 10,
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EAE2F1',
    padding: 16,
    marginBottom: 12,
  },
  userCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  userCardInfo: {
    flex: 1,
    marginRight: 10,
  },
  userName: {
    color: '#342542',
    fontSize: 15,
    fontWeight: '800',
  },
  userEmail: {
    color: '#847492',
    fontSize: 12,
    marginTop: 2,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#EEE6F6',
  },
  roleAdmin: { backgroundColor: '#E4ECF8' },
  roleVet: { backgroundColor: '#E2F0E8' },
  roleOwner: { backgroundColor: '#EEE6F6' },
  roleBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#5B477A',
  },
  statusActive: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#E5F4EB',
  },
  statusActiveText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#3D7D54',
  },
  statusSuspended: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#FDEAE8',
  },
  statusSuspendedText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#BA5648',
  },
  userMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    color: '#8F809A',
  },
  suspendedReasonBox: {
    backgroundColor: '#FDF3F1',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#BA5648',
  },
  suspendedReasonTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#BA5648',
  },
  suspendedReasonText: {
    fontSize: 11,
    color: '#6E4841',
    marginTop: 2,
  },
  userCardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F4EDFA',
  },
  viewDetailBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 9,
    backgroundColor: '#F3EEF9',
  },
  viewDetailText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#71579C',
  },
  suspendBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 9,
    backgroundColor: '#FDEAE8',
  },
  suspendText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#BA5648',
  },
  reactivateBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 9,
    backgroundColor: '#E5F4EB',
  },
  reactivateText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#3D7D54',
  },
  selfTag: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F0EBF7',
  },
  selfTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#87739F',
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
  modalContent: {
    width: '100%',
    maxWidth: 550,
    maxHeight: '85%',
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
  closeBtn: {
    padding: 4,
  },
  modalLoading: {
    padding: 30,
    alignItems: 'center',
    gap: 10,
  },
  detailScroll: {
    paddingVertical: 14,
  },
  detailHeaderBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EAE2F1',
    marginBottom: 14,
  },
  detailName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#342542',
  },
  detailEmail: {
    fontSize: 13,
    color: '#847492',
    marginTop: 3,
    marginBottom: 10,
  },
  detailSection: {
    marginTop: 10,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: '#463855',
    marginBottom: 6,
  },
  privacyNote: {
    fontSize: 10,
    color: '#7D6F88',
    lineHeight: 15,
    backgroundColor: '#EBE5F3',
    padding: 8,
    borderRadius: 8,
    marginBottom: 10,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EAE2F1',
  },
  infoLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#9585A2',
    letterSpacing: 0.5,
    marginTop: 8,
  },
  infoValue: {
    fontSize: 12,
    color: '#433451',
    marginTop: 2,
  },
  petItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EAE2F1',
    marginBottom: 8,
    gap: 10,
  },
  petIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EEE6F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  petItemInfo: {
    flex: 1,
  },
  petItemName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#342542',
  },
  petItemSub: {
    fontSize: 11,
    color: '#847492',
    marginTop: 1,
  },
  petItemDob: {
    fontSize: 10,
    color: '#9A8AA6',
    marginTop: 2,
  },
  noItemsText: {
    fontSize: 12,
    color: '#9E8EA8',
    fontStyle: 'italic',
    paddingVertical: 6,
  },
  modalActionRow: {
    marginTop: 18,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  suspendModalBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#FDEAE8',
  },
  reactivateModalBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#E5F4EB',
  },
  suspendDialog: {
    width: '100%',
    maxWidth: 450,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
  },
  suspendDialogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  suspendDialogTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#BA5648',
  },
  suspendDialogDesc: {
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
  suspendInput: {
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
  suspendDialogActions: {
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
  confirmSuspendBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#BA5648',
  },
  confirmSuspendText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  btnDisabled: {
    opacity: 0.5,
  },
});
