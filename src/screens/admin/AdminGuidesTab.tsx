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
  getAdminGuides,
  createAdminGuide,
  updateAdminGuide,
  publishAdminGuide,
  unpublishAdminGuide,
  deleteAdminGuide,
  type AdminGuideItem,
} from '../../services/admin';

export default function AdminGuidesTab() {
  const [guides, setGuides] = useState<AdminGuideItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [retry, setRetry] = useState(0);

  // Guide Editor Modal State
  const [editingGuide, setEditingGuide] = useState<AdminGuideItem | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('General Care');
  const [formSlug, setFormSlug] = useState('');
  const [formAuthor, setFormAuthor] = useState('JEEVA Care Team');
  const [formReviewedBy, setFormReviewedBy] = useState('Veterinary Advisory');
  const [formSections, setFormSections] = useState<
    Array<{ heading: string; text: string }>
  >([{ heading: '', text: '' }]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

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

    getAdminGuides({
      search: search.trim() || undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      category: categoryFilter !== 'all' ? categoryFilter : undefined,
    })
      .then((res) => {
        if (active) setGuides(res);
      })
      .catch((err: unknown) => {
        if (active) {
          setError(
            err instanceof Error ? err.message : 'Could not load care guides.',
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [search, statusFilter, categoryFilter, retry]);

  function openCreateModal() {
    setEditingGuide(null);
    setIsCreating(true);
    setFormTitle('');
    setFormCategory('General Care');
    setFormSlug('');
    setFormAuthor('JEEVA Editorial Team');
    setFormReviewedBy('Veterinary Advisory');
    setFormSections([{ heading: '', text: '' }]);
    setSaveError('');
  }

  function openEditModal(g: AdminGuideItem) {
    setIsCreating(false);
    setEditingGuide(g);
    setFormTitle(g.title);
    setFormCategory(g.category);
    setFormSlug(g.slug);
    setFormAuthor(g.authorName || 'JEEVA Editorial');
    setFormReviewedBy(g.reviewedBy || 'Veterinary Advisory');
    setFormSections(
      g.sections.length > 0
        ? g.sections.map((s) => ({ ...s }))
        : [{ heading: '', text: '' }],
    );
    setSaveError('');
  }

  function addSection() {
    setFormSections((cur) => [...cur, { heading: '', text: '' }]);
  }

  function updateSection(
    index: number,
    field: 'heading' | 'text',
    value: string,
  ) {
    setFormSections((cur) => {
      const next = [...cur];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }

  function removeSection(index: number) {
    if (formSections.length <= 1) return;
    setFormSections((cur) => cur.filter((_, i) => i !== index));
  }

  async function handleSaveGuide() {
    const title = formTitle.trim();
    const category = formCategory.trim();

    if (title.length < 3) {
      setSaveError('Title must be at least 3 characters.');
      return;
    }

    if (category.length < 2) {
      setSaveError('Category is required.');
      return;
    }

    const validSections = formSections
      .map((s) => ({ heading: s.heading.trim(), text: s.text.trim() }))
      .filter((s) => s.heading.length > 0 && s.text.length > 0);

    if (validSections.length === 0) {
      setSaveError('Provide at least one complete section with a heading and text.');
      return;
    }

    setSaving(true);
    setSaveError('');

    try {
      if (isCreating) {
        await createAdminGuide({
          title,
          category,
          slug: formSlug.trim() || undefined,
          authorName: formAuthor.trim() || undefined,
          reviewedBy: formReviewedBy.trim() || undefined,
          sections: validSections,
        });
        Alert.alert('Guide Created', `"${title}" has been saved as a draft.`);
      } else if (editingGuide) {
        await updateAdminGuide(editingGuide.id, {
          title,
          category,
          authorName: formAuthor.trim() || undefined,
          reviewedBy: formReviewedBy.trim() || undefined,
          sections: validSections,
        });
        Alert.alert('Guide Updated', `"${title}" has been updated.`);
      }

      if (mounted.current) {
        setIsCreating(false);
        setEditingGuide(null);
        setRetry((v) => v + 1);
      }
    } catch (err) {
      if (mounted.current) {
        setSaveError(
          err instanceof Error ? err.message : 'Failed to save guide.',
        );
      }
    } finally {
      if (mounted.current) setSaving(false);
    }
  }

  async function handleTogglePublish(g: AdminGuideItem) {
    const willPublish = g.status !== 'published';
    Alert.alert(
      willPublish ? 'Publish Guide' : 'Unpublish Guide',
      willPublish
        ? `Make "${g.title}" visible to all pet owners across the app?`
        : `Hide "${g.title}" from explore and home recommendations?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: willPublish ? 'Publish' : 'Unpublish',
          onPress: async () => {
            try {
              if (willPublish) {
                await publishAdminGuide(g.id);
              } else {
                await unpublishAdminGuide(g.id);
              }
              setRetry((v) => v + 1);
            } catch (err) {
              Alert.alert(
                'Action Failed',
                err instanceof Error ? err.message : 'Could not update status.',
              );
            }
          },
        },
      ],
    );
  }

  async function handleDeleteGuide(g: AdminGuideItem) {
    Alert.alert(
      'Delete Guide',
      `Permanently delete the guide "${g.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAdminGuide(g.id);
              Alert.alert('Guide Deleted', `"${g.title}" was removed.`);
              setRetry((v) => v + 1);
            } catch (err) {
              Alert.alert(
                'Delete Failed',
                err instanceof Error ? err.message : 'Could not delete guide.',
              );
            }
          },
        },
      ],
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER WITH CREATE ACTION */}
      <View style={styles.topActionsRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color="#90809C" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search care guides..."
            placeholderTextColor="#A899B1"
            style={styles.searchInput}
            autoCapitalize="none"
          />
        </View>

        <Pressable onPress={openCreateModal} style={styles.createBtn}>
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <Text style={styles.createBtnText}>New Guide</Text>
        </Pressable>
      </View>

      {/* FILTER TABS */}
      <View style={styles.filtersRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterChips}
        >
          {['all', 'published', 'draft', 'unpublished'].map((st) => (
            <Pressable
              key={st}
              onPress={() => setStatusFilter(st)}
              style={[
                styles.chip,
                statusFilter === st && styles.chipSelected,
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  statusFilter === st && styles.chipTextSelected,
                ]}
              >
                {st === 'all'
                  ? 'All Status'
                  : st.charAt(0).toUpperCase() + st.slice(1)}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* GUIDES LIST */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#71579C" />
          <Text style={styles.loadingText}>Loading care guides...</Text>
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
      ) : guides.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="book-outline" size={36} color="#A89EAF" />
          <Text style={styles.emptyTitle}>No care guides found</Text>
          <Text style={styles.emptySub}>
            Create your first article or adjust filters.
          </Text>
        </View>
      ) : (
        <View style={styles.listContainer}>
          <Text style={styles.resultsCount}>
            {guides.length} care articles available
          </Text>

          {guides.map((g) => (
            <View key={g.id} style={styles.guideCard}>
              <View style={styles.guideCardTop}>
                <View style={styles.guideHeaderInfo}>
                  <Text style={styles.guideTitle}>{g.title}</Text>
                  <Text style={styles.guideSlug}>slug: {g.slug}</Text>
                </View>

                <View style={styles.badgeGroup}>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText}>{g.category}</Text>
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      g.status === 'published'
                        ? styles.statusPublished
                        : g.status === 'draft'
                        ? styles.statusDraft
                        : styles.statusUnpublished,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        g.status === 'published'
                          ? styles.statusTextPublished
                          : g.status === 'draft'
                          ? styles.statusTextDraft
                          : styles.statusTextUnpublished,
                      ]}
                    >
                      {g.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.guideMeta}>
                  {g.sections.length} sections • By {g.authorName || 'Editorial'} •{' '}
                  {g.reviewedBy || 'Advisory Approved'}
                </Text>
              </View>

              {/* ACTION BUTTONS */}
              <View style={styles.actionsRow}>
                <Pressable
                  onPress={() => handleTogglePublish(g)}
                  style={[
                    styles.actionBtn,
                    g.status === 'published'
                      ? styles.unpublishBtn
                      : styles.publishBtn,
                  ]}
                >
                  <Ionicons
                    name={
                      g.status === 'published'
                        ? 'eye-off-outline'
                        : 'globe-outline'
                    }
                    size={14}
                    color={g.status === 'published' ? '#BA5648' : '#54816A'}
                  />
                  <Text
                    style={[
                      styles.actionBtnText,
                      g.status === 'published'
                        ? styles.unpublishBtnText
                        : styles.publishBtnText,
                    ]}
                  >
                    {g.status === 'published' ? 'Unpublish' : 'Publish'}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => openEditModal(g)}
                  style={[styles.actionBtn, styles.editBtn]}
                >
                  <Ionicons name="pencil-outline" size={14} color="#71579C" />
                  <Text style={styles.editBtnText}>Edit</Text>
                </Pressable>

                <Pressable
                  onPress={() => handleDeleteGuide(g)}
                  style={[styles.actionBtn, styles.deleteBtn]}
                >
                  <Ionicons name="trash-outline" size={14} color="#BA5648" />
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* CREATE / EDIT GUIDE MODAL */}
      <Modal
        visible={isCreating || editingGuide !== null}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setIsCreating(false);
          setEditingGuide(null);
        }}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isCreating ? 'Create Care Guide' : 'Edit Care Guide'}
              </Text>
              <Pressable
                onPress={() => {
                  setIsCreating(false);
                  setEditingGuide(null);
                }}
                style={styles.closeBtn}
              >
                <Ionicons name="close" size={22} color="#453852" />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.formScroll}
            >
              <Text style={styles.inputLabel}>Article Title *</Text>
              <TextInput
                value={formTitle}
                onChangeText={setFormTitle}
                placeholder="e.g. Food and everyday feeding"
                placeholderTextColor="#A899B1"
                style={styles.textInput}
              />

              <View style={styles.formRow}>
                <View style={styles.formHalf}>
                  <Text style={styles.inputLabel}>Category *</Text>
                  <TextInput
                    value={formCategory}
                    onChangeText={setFormCategory}
                    placeholder="e.g. Nutrition, Grooming"
                    placeholderTextColor="#A899B1"
                    style={styles.textInput}
                  />
                </View>

                {isCreating && (
                  <View style={styles.formHalf}>
                    <Text style={styles.inputLabel}>Slug (optional)</Text>
                    <TextInput
                      value={formSlug}
                      onChangeText={setFormSlug}
                      placeholder="e.g. nutrition"
                      placeholderTextColor="#A899B1"
                      autoCapitalize="none"
                      style={styles.textInput}
                    />
                  </View>
                )}
              </View>

              <View style={styles.formRow}>
                <View style={styles.formHalf}>
                  <Text style={styles.inputLabel}>Author / Team</Text>
                  <TextInput
                    value={formAuthor}
                    onChangeText={setFormAuthor}
                    placeholder="e.g. JEEVA Clinical Care"
                    placeholderTextColor="#A899B1"
                    style={styles.textInput}
                  />
                </View>
                <View style={styles.formHalf}>
                  <Text style={styles.inputLabel}>Reviewed By</Text>
                  <TextInput
                    value={formReviewedBy}
                    onChangeText={setFormReviewedBy}
                    placeholder="e.g. Veterinary Council"
                    placeholderTextColor="#A899B1"
                    style={styles.textInput}
                  />
                </View>
              </View>

              {/* SECTIONS BUILDER */}
              <View style={styles.sectionsHeaderRow}>
                <Text style={styles.sectionHeading}>
                  Sections ({formSections.length})
                </Text>
                <Pressable onPress={addSection} style={styles.addSectionBtn}>
                  <Ionicons name="add" size={14} color="#71579C" />
                  <Text style={styles.addSectionText}>Add Section</Text>
                </Pressable>
              </View>

              {formSections.map((sec, idx) => (
                <View key={idx} style={styles.sectionFormCard}>
                  <View style={styles.sectionCardHeader}>
                    <Text style={styles.sectionCardIndex}>
                      Section #{idx + 1}
                    </Text>
                    {formSections.length > 1 && (
                      <Pressable onPress={() => removeSection(idx)}>
                        <Ionicons
                          name="close-circle-outline"
                          size={18}
                          color="#BA5648"
                        />
                      </Pressable>
                    )}
                  </View>

                  <TextInput
                    value={sec.heading}
                    onChangeText={(val) => updateSection(idx, 'heading', val)}
                    placeholder="Section heading (e.g. Choose food for your pet)"
                    placeholderTextColor="#A899B1"
                    style={styles.sectionHeadingInput}
                  />

                  <TextInput
                    value={sec.text}
                    onChangeText={(val) => updateSection(idx, 'text', val)}
                    placeholder="Section text and recommendations..."
                    placeholderTextColor="#A899B1"
                    multiline
                    numberOfLines={3}
                    style={styles.sectionTextInput}
                  />
                </View>
              ))}

              {!!saveError && (
                <Text style={styles.dialogErrorText}>{saveError}</Text>
              )}

              <View style={styles.modalActionRow}>
                <Pressable
                  onPress={() => {
                    setIsCreating(false);
                    setEditingGuide(null);
                  }}
                  disabled={saving}
                  style={styles.cancelBtn}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </Pressable>

                <Pressable
                  onPress={handleSaveGuide}
                  disabled={saving}
                  style={[styles.saveBtn, saving && styles.btnDisabled]}
                >
                  {saving ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.saveBtnText}>
                      {isCreating ? 'Create Guide' : 'Save Changes'}
                    </Text>
                  )}
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%' },
  topActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#ECE4F2',
    paddingHorizontal: 12,
    height: 46,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: '#433451',
    fontSize: 13,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#71579C',
    paddingHorizontal: 14,
    height: 46,
    borderRadius: 14,
  },
  createBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  filtersRow: {
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
  guideCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EAE2F1',
    padding: 16,
    marginBottom: 12,
  },
  guideCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  guideHeaderInfo: {
    flex: 1,
    marginRight: 10,
  },
  guideTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#342542',
  },
  guideSlug: {
    fontSize: 10,
    color: '#9E8FA9',
    marginTop: 2,
  },
  badgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryBadge: {
    backgroundColor: '#EEE6F6',
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#71579C',
  },
  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusPublished: { backgroundColor: '#E2F0E8' },
  statusDraft: { backgroundColor: '#FFF0C9' },
  statusUnpublished: { backgroundColor: '#ECE7F2' },
  statusText: {
    fontSize: 8,
    fontWeight: '800',
  },
  statusTextPublished: { color: '#3B7356' },
  statusTextDraft: { color: '#976A17' },
  statusTextUnpublished: { color: '#7E6F8C' },
  metaRow: {
    marginTop: 8,
  },
  guideMeta: {
    fontSize: 11,
    color: '#847492',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F5EFF9',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  publishBtn: { backgroundColor: '#E5F4EB' },
  publishBtnText: { color: '#3D7D54', fontSize: 11, fontWeight: '700' },
  unpublishBtn: { backgroundColor: '#FDEAE8' },
  unpublishBtnText: { color: '#BA5648', fontSize: 11, fontWeight: '700' },
  editBtn: { backgroundColor: '#F3EEF9' },
  editBtnText: { color: '#71579C', fontSize: 11, fontWeight: '700' },
  deleteBtn: { backgroundColor: '#FDEAE8', paddingHorizontal: 8 },
  actionBtnText: { fontSize: 11, fontWeight: '700' },
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
    maxHeight: '90%',
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
  formScroll: {
    paddingVertical: 14,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#554664',
    marginBottom: 4,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5DCEC',
    borderRadius: 12,
    padding: 10,
    fontSize: 12,
    color: '#453852',
    backgroundColor: '#FFFFFF',
    marginBottom: 10,
  },
  formRow: {
    flexDirection: 'row',
    gap: 10,
  },
  formHalf: {
    flex: 1,
  },
  sectionsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 8,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#463855',
  },
  addSectionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#EEE6F6',
    borderRadius: 8,
  },
  addSectionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#71579C',
  },
  sectionFormCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EAE2F1',
    marginBottom: 10,
  },
  sectionCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionCardIndex: {
    fontSize: 10,
    fontWeight: '800',
    color: '#847395',
  },
  sectionHeadingInput: {
    borderWidth: 1,
    borderColor: '#ECE4F2',
    borderRadius: 10,
    padding: 8,
    fontSize: 12,
    fontWeight: '700',
    color: '#342542',
    backgroundColor: '#FAF8FC',
    marginBottom: 8,
  },
  sectionTextInput: {
    borderWidth: 1,
    borderColor: '#ECE4F2',
    borderRadius: 10,
    padding: 8,
    fontSize: 12,
    color: '#554664',
    backgroundColor: '#FAF8FC',
    minHeight: 60,
    textAlignVertical: 'top',
  },
  dialogErrorText: {
    color: '#BA5648',
    fontSize: 11,
    marginTop: 6,
    textAlign: 'center',
  },
  modalActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 16,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F0EAF6',
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#71579C',
  },
  saveBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#71579C',
  },
  saveBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  btnDisabled: {
    opacity: 0.5,
  },
});
