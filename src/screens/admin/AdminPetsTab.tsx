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
  getAdminPets,
  getAdminPetsOverview,
  type AdminPetItem,
  type AdminPetsOverview,
  type AdminPagination,
} from '../../services/admin';

export default function AdminPetsTab() {
  const [overview, setOverview] = useState<AdminPetsOverview | null>(null);
  const [pets, setPets] = useState<AdminPetItem[]>([]);
  const [pagination, setPagination] = useState<AdminPagination>({
    page: 1,
    limit: 15,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [speciesFilter, setSpeciesFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    Promise.all([
      getAdminPetsOverview(),
      getAdminPets({
        page,
        limit: 15,
        search: search.trim() || undefined,
        species: speciesFilter !== 'all' ? speciesFilter : undefined,
      }),
    ])
      .then(([ovRes, petsRes]) => {
        if (active) {
          setOverview(ovRes);
          setPets(petsRes.pets);
          setPagination(petsRes.pagination);
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setError(
            err instanceof Error ? err.message : 'Could not load pet oversight data.',
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [page, search, speciesFilter, retry]);

  return (
    <View style={styles.container}>
      {/* AGGREGATE SUMMARY SECTION */}
      <View style={styles.summaryBox}>
        <View style={styles.summaryHeader}>
          <Ionicons name="paw-outline" size={20} color="#71579C" />
          <Text style={styles.summaryHeading}>Pet & Care Records Aggregate</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{overview?.totalPets ?? '—'}</Text>
            <Text style={styles.statLbl}>Total Pets</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNum}>
              {overview?.vaccinationsCount ?? '—'}
            </Text>
            <Text style={styles.statLbl}>Vaccines</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNum}>
              {overview?.medicationsCount ?? '—'}
            </Text>
            <Text style={styles.statLbl}>Medications</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNum}>
              {overview?.appointmentsCount ?? '—'}
            </Text>
            <Text style={styles.statLbl}>Visits Logged</Text>
          </View>
        </View>

        {/* SPECIES BREAKDOWN */}
        {overview?.speciesBreakdown && overview.speciesBreakdown.length > 0 && (
          <View style={styles.speciesBreakdown}>
            <Text style={styles.speciesBreakdownTitle}>SPECIES DISTRIBUTION:</Text>
            <View style={styles.speciesPills}>
              {overview.speciesBreakdown.map((s) => (
                <View key={s.species} style={styles.speciesPill}>
                  <Text style={styles.speciesPillText}>
                    {s.species.toUpperCase()}: {s.count}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* PRIVACY NOTICE */}
      <View style={styles.privacyBanner}>
        <Ionicons name="shield-checkmark" size={18} color="#54816A" />
        <View style={styles.flex}>
          <Text style={styles.privacyTitle}>Owner & Medical Privacy Protected</Text>
          <Text style={styles.privacyDesc}>
            Private medical records, health diagnoses, and prescriptions are
            strictly confidential to pet owners and their treating vets and are
            not accessible in platform oversight.
          </Text>
        </View>
      </View>

      {/* SEARCH AND SPECIES FILTER */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={18} color="#90809C" />
        <TextInput
          value={search}
          onChangeText={(t) => {
            setSearch(t);
            setPage(1);
          }}
          placeholder="Search by pet name, breed, or species..."
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

      <View style={styles.speciesFilterRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.speciesChips}
        >
          {['all', 'dog', 'cat', 'bird', 'rabbit', 'other'].map((sp) => (
            <Pressable
              key={sp}
              onPress={() => {
                setSpeciesFilter(sp);
                setPage(1);
              }}
              style={[
                styles.chip,
                speciesFilter === sp && styles.chipSelected,
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  speciesFilter === sp && styles.chipTextSelected,
                ]}
              >
                {sp === 'all'
                  ? 'All Species'
                  : sp.charAt(0).toUpperCase() + sp.slice(1) + 's'}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* PETS LIST */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#71579C" />
          <Text style={styles.loadingText}>Loading pet records...</Text>
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
      ) : pets.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="paw-outline" size={36} color="#A89EAF" />
          <Text style={styles.emptyTitle}>No pet profiles found</Text>
          <Text style={styles.emptySub}>
            Try changing the search query or species filter.
          </Text>
        </View>
      ) : (
        <View style={styles.listContainer}>
          <Text style={styles.resultsCount}>
            Showing {pets.length} of {pagination.total} pet profiles (Page{' '}
            {pagination.page} of {pagination.totalPages})
          </Text>

          {pets.map((pet) => (
            <View key={pet.id} style={styles.petCard}>
              <View style={styles.petCardHeader}>
                <View style={styles.petIconBox}>
                  <Ionicons
                    name={
                      pet.species === 'dog'
                        ? 'paw'
                        : pet.species === 'cat'
                        ? 'paw-outline'
                        : 'leaf-outline'
                    }
                    size={20}
                    color="#71579C"
                  />
                </View>
                <View style={styles.petMainInfo}>
                  <Text style={styles.petName}>{pet.name}</Text>
                  <Text style={styles.petBreed}>
                    {pet.species.toUpperCase()} • {pet.breed || 'Unknown breed'} •{' '}
                    {pet.sex}
                  </Text>
                </View>
                {pet.weightKg !== null && (
                  <View style={styles.weightBadge}>
                    <Text style={styles.weightText}>{pet.weightKg} kg</Text>
                  </View>
                )}
              </View>

              <View style={styles.petDetailsRow}>
                {pet.dateOfBirth && (
                  <View style={styles.metaItem}>
                    <Ionicons name="calendar-outline" size={13} color="#8F809A" />
                    <Text style={styles.metaText}>DOB: {pet.dateOfBirth}</Text>
                  </View>
                )}
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={13} color="#8F809A" />
                  <Text style={styles.metaText}>
                    Registered {new Date(pet.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>

              {/* OWNER REFERENCE */}
              <View style={styles.ownerBox}>
                <Ionicons name="person-outline" size={14} color="#71579C" />
                <Text style={styles.ownerText}>
                  Owner: <Text style={styles.bold}>{pet.ownerName}</Text> ({pet.ownerEmail})
                </Text>
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
  summaryBox: {
    backgroundColor: '#EEE6F6',
    borderRadius: 22,
    padding: 16,
    marginBottom: 12,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  summaryHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: '#534268',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNum: {
    fontSize: 18,
    fontWeight: '800',
    color: '#71579C',
  },
  statLbl: {
    fontSize: 9,
    color: '#8C7C99',
    marginTop: 2,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 25,
    backgroundColor: '#ECE3F3',
  },
  speciesBreakdown: {
    marginTop: 12,
  },
  speciesBreakdownTitle: {
    fontSize: 8,
    fontWeight: '800',
    color: '#847395',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  speciesPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  speciesPill: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  speciesPillText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#65537B',
  },
  privacyBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E6F3EC',
    borderRadius: 14,
    padding: 12,
    gap: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#D2E8DC',
  },
  privacyTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#34614A',
  },
  privacyDesc: {
    fontSize: 10,
    color: '#527B66',
    lineHeight: 15,
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
  speciesFilterRow: {
    marginBottom: 10,
  },
  speciesChips: {
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
  petCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EAE2F1',
    padding: 16,
    marginBottom: 12,
  },
  petCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  petIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#F3EEF9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  petMainInfo: {
    flex: 1,
  },
  petName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#342542',
  },
  petBreed: {
    fontSize: 11,
    color: '#847492',
    marginTop: 2,
  },
  weightBadge: {
    backgroundColor: '#F9F1E7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  weightText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#9C6F34',
  },
  petDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 10,
    color: '#8F809A',
  },
  ownerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF8FC',
    borderRadius: 10,
    padding: 8,
    marginTop: 10,
    gap: 6,
  },
  ownerText: {
    fontSize: 11,
    color: '#655474',
  },
  bold: {
    fontWeight: '700',
    color: '#40334E',
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
