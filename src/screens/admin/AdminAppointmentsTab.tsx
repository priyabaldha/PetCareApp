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
  getAdminAppointments,
  type AdminAppointmentItem,
  type AdminPagination,
} from '../../services/admin';

export default function AdminAppointmentsTab() {
  const [appointments, setAppointments] = useState<AdminAppointmentItem[]>([]);
  const [pagination, setPagination] = useState<AdminPagination>({
    page: 1,
    limit: 15,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [timeframe, setTimeframe] = useState('all');
  const [page, setPage] = useState(1);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    getAdminAppointments({
      page,
      limit: 15,
      search: search.trim() || undefined,
      timeframe: timeframe !== 'all' ? timeframe : undefined,
    })
      .then((res) => {
        if (active) {
          setAppointments(res.appointments);
          setPagination(res.pagination);
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : 'Could not load appointment records.',
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [page, search, timeframe, retry]);

  return (
    <View style={styles.container}>
      {/* EXPLANATORY ARCHITECTURE BADGE */}
      <View style={styles.banner}>
        <Ionicons name="information-circle-outline" size={20} color="#71579C" />
        <View style={styles.flex}>
          <Text style={styles.bannerTitle}>Owner-Entered Clinic Records</Text>
          <Text style={styles.bannerDesc}>
            These are personal visit logs entered directly by pet owners to
            track upcoming and past clinic visits. They are not direct booking
            reservations with veterinary clinics.
          </Text>
        </View>
      </View>

      {/* SEARCH AND TIMEFRAME FILTERS */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={18} color="#90809C" />
        <TextInput
          value={search}
          onChangeText={(t) => {
            setSearch(t);
            setPage(1);
          }}
          placeholder="Search by clinic, reason, or pet name..."
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

      <View style={styles.timeframeRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.timeframeChips}
        >
          {[
            { key: 'all', label: 'All Records' },
            { key: 'upcoming', label: 'Upcoming Visits' },
            { key: 'past', label: 'Past Visits' },
          ].map((tf) => (
            <Pressable
              key={tf.key}
              onPress={() => {
                setTimeframe(tf.key);
                setPage(1);
              }}
              style={[
                styles.chip,
                timeframe === tf.key && styles.chipSelected,
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  timeframe === tf.key && styles.chipTextSelected,
                ]}
              >
                {tf.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* APPOINTMENTS LIST */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#71579C" />
          <Text style={styles.loadingText}>Loading appointment records...</Text>
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
      ) : appointments.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="calendar-outline" size={36} color="#A89EAF" />
          <Text style={styles.emptyTitle}>No appointments found</Text>
          <Text style={styles.emptySub}>
            No owner-entered appointment logs match the current query.
          </Text>
        </View>
      ) : (
        <View style={styles.listContainer}>
          <Text style={styles.resultsCount}>
            Showing {appointments.length} of {pagination.total} records (Page{' '}
            {pagination.page} of {pagination.totalPages})
          </Text>

          {appointments.map((apt) => (
            <View key={apt.id} style={styles.aptCard}>
              <View style={styles.aptCardTop}>
                <View style={styles.aptIconBox}>
                  <Ionicons name="calendar" size={18} color="#71579C" />
                </View>
                <View style={styles.aptHeaderInfo}>
                  <Text style={styles.clinicName}>{apt.clinicName}</Text>
                  <Text style={styles.reasonText}>{apt.reason}</Text>
                </View>
                <View style={styles.sourceTag}>
                  <Text style={styles.sourceTagText}>OWNER LOG</Text>
                </View>
              </View>

              <View style={styles.dateTimeBox}>
                <View style={styles.metaItem}>
                  <Ionicons name="calendar-outline" size={13} color="#71579C" />
                  <Text style={styles.dateTimeText}>
                    Date: {new Date(apt.date).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={13} color="#71579C" />
                  <Text style={styles.dateTimeText}>Time: {apt.time}</Text>
                </View>
              </View>

              <View style={styles.petOwnerRow}>
                <View style={styles.metaItem}>
                  <Ionicons name="paw-outline" size={13} color="#8F809A" />
                  <Text style={styles.petOwnerText}>
                    Pet: <Text style={styles.bold}>{apt.petName}</Text> (
                    {apt.petSpecies})
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="person-outline" size={13} color="#8F809A" />
                  <Text style={styles.petOwnerText}>
                    Owner: <Text style={styles.bold}>{apt.ownerName}</Text>
                  </Text>
                </View>
              </View>
            </View>
          ))}

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
  banner: {
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
  bannerTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#55426A',
  },
  bannerDesc: {
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
  timeframeRow: {
    marginBottom: 10,
  },
  timeframeChips: {
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
  aptCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EAE2F1',
    padding: 16,
    marginBottom: 12,
  },
  aptCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  aptIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F3EEF9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aptHeaderInfo: {
    flex: 1,
  },
  clinicName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#342542',
  },
  reasonText: {
    fontSize: 11,
    color: '#847492',
    marginTop: 1,
  },
  sourceTag: {
    backgroundColor: '#F0EAF6',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  sourceTagText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#71579C',
    letterSpacing: 0.5,
  },
  dateTimeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF8FC',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    gap: 16,
  },
  dateTimeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#55426A',
  },
  petOwnerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F5EFF9',
  },
  petOwnerText: {
    fontSize: 11,
    color: '#7B6C89',
  },
  bold: {
    fontWeight: '700',
    color: '#40334E',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
