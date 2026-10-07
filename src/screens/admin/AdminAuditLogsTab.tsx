import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  getAdminAuditLogs,
  type AdminAuditLogItem,
  type AdminPagination,
} from '../../services/admin';

export default function AdminAuditLogsTab() {
  const [logs, setLogs] = useState<AdminAuditLogItem[]>([]);
  const [pagination, setPagination] = useState<AdminPagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [targetTypeFilter, setTargetTypeFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    getAdminAuditLogs({
      page,
      limit: 20,
      search: search.trim() || undefined,
      targetType: targetTypeFilter !== 'all' ? targetTypeFilter : undefined,
    })
      .then((res) => {
        if (active) {
          setLogs(res.logs);
          setPagination(res.pagination);
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setError(
            err instanceof Error ? err.message : 'Could not load audit logs.',
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [page, search, targetTypeFilter, retry]);

  return (
    <View style={styles.container}>
      {/* HEADER EXPLANATION */}
      <View style={styles.headerBox}>
        <Ionicons name="shield-checkmark-outline" size={20} color="#71579C" />
        <View style={styles.flex}>
          <Text style={styles.headerTitle}>System & Governance Audit Trail</Text>
          <Text style={styles.headerSub}>
            Tamper-evident record of administrator actions, vet credential
            decisions, content changes and user suspensions.
          </Text>
        </View>
      </View>

      {/* SEARCH & FILTERS */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={18} color="#90809C" />
        <TextInput
          value={search}
          onChangeText={(t) => {
            setSearch(t);
            setPage(1);
          }}
          placeholder="Search by actor, target or reason..."
          placeholderTextColor="#A899B1"
          style={styles.searchInput}
          autoCapitalize="none"
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color="#A899B1" />
          </Pressable>
        )}
      </View>

      <View style={styles.filterRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterChips}
        >
          {[
            { key: 'all', label: 'All Records' },
            { key: 'vet_application', label: 'Vet Decisions' },
            { key: 'user', label: 'User Actions' },
            { key: 'guide', label: 'Guide Edits' },
            { key: 'announcement', label: 'Announcements' },
          ].map((tf) => (
            <Pressable
              key={tf.key}
              onPress={() => {
                setTargetTypeFilter(tf.key);
                setPage(1);
              }}
              style={[
                styles.chip,
                targetTypeFilter === tf.key && styles.chipSelected,
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  targetTypeFilter === tf.key && styles.chipTextSelected,
                ]}
              >
                {tf.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* AUDIT LOGS TIMELINE */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#71579C" />
          <Text style={styles.loadingText}>Loading audit events...</Text>
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
      ) : logs.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="shield-outline" size={36} color="#A89EAF" />
          <Text style={styles.emptyTitle}>No audit records found</Text>
          <Text style={styles.emptySub}>
            No events match the selected search query or category.
          </Text>
        </View>
      ) : (
        <View style={styles.listContainer}>
          <Text style={styles.resultsCount}>
            Showing {logs.length} of {pagination.total} events (Page{' '}
            {pagination.page} of {pagination.totalPages})
          </Text>

          {logs.map((log) => {
            const isNegative =
              log.action.includes('suspend') || log.action.includes('reject');
            const isPositive =
              log.action.includes('approved') ||
              log.action.includes('published') ||
              log.action.includes('reactivate');

            return (
              <View key={log.id} style={styles.logCard}>
                <View style={styles.logCardTop}>
                  <View
                    style={[
                      styles.actionBadge,
                      isNegative
                        ? styles.badgeNegative
                        : isPositive
                        ? styles.badgePositive
                        : styles.badgeNeutral,
                    ]}
                  >
                    <Text
                      style={[
                        styles.actionBadgeText,
                        isNegative
                          ? styles.textNegative
                          : isPositive
                          ? styles.textPositive
                          : styles.textNeutral,
                      ]}
                    >
                      {log.action.replace(/_/g, ' ').toUpperCase()}
                    </Text>
                  </View>

                  <Text style={styles.timestampText}>
                    {new Date(log.createdAt).toLocaleString()}
                  </Text>
                </View>

                <View style={styles.actorTargetBox}>
                  <Text style={styles.actorText}>
                    Actor: <Text style={styles.bold}>{log.actorName}</Text> (
                    {log.actorEmail})
                  </Text>
                  <Text style={styles.targetText}>
                    Target ({log.targetType}):{' '}
                    <Text style={styles.bold}>
                      {log.targetName || log.targetId}
                    </Text>
                  </Text>
                </View>

                {!!log.reason && (
                  <View style={styles.reasonBox}>
                    <Text style={styles.reasonLabel}>Reason / Note:</Text>
                    <Text style={styles.reasonText}>"{log.reason}"</Text>
                  </View>
                )}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%' },
  flex: { flex: 1 },
  headerBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F3EEF9',
    borderRadius: 16,
    padding: 14,
    gap: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E7DCF2',
  },
  headerTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#55426A',
  },
  headerSub: {
    fontSize: 11,
    color: '#76648C',
    lineHeight: 16,
    marginTop: 2,
  },
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
  filterRow: {
    marginBottom: 10,
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
    marginTop: 4,
  },
  resultsCount: {
    fontSize: 11,
    color: '#8F809A',
    marginBottom: 10,
  },
  logCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAE2F1',
    padding: 14,
    marginBottom: 10,
  },
  logCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeNegative: { backgroundColor: '#FDEAE8' },
  badgePositive: { backgroundColor: '#E2F0E8' },
  badgeNeutral: { backgroundColor: '#EEE6F6' },
  actionBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  textNegative: { color: '#BA5648' },
  textPositive: { color: '#386D51' },
  textNeutral: { color: '#71579C' },
  timestampText: {
    fontSize: 10,
    color: '#9E8FA9',
  },
  actorTargetBox: {
    gap: 2,
  },
  actorText: {
    fontSize: 11,
    color: '#655474',
  },
  targetText: {
    fontSize: 11,
    color: '#655474',
  },
  bold: {
    fontWeight: '700',
    color: '#342542',
  },
  reasonBox: {
    backgroundColor: '#FAF8FC',
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
  },
  reasonLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#847395',
  },
  reasonText: {
    fontSize: 11,
    fontStyle: 'italic',
    color: '#554465',
    marginTop: 2,
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
});
