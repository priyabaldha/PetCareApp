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
  getAdminAnnouncements,
  createAdminAnnouncement,
  updateAdminAnnouncement,
  publishAdminAnnouncement,
  unpublishAdminAnnouncement,
  deleteAdminAnnouncement,
  type AdminAnnouncementItem,
} from '../../services/admin';

export default function AdminAnnouncementsTab() {
  const [announcements, setAnnouncements] = useState<
    AdminAnnouncementItem[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  // Editor modal state
  const [isCreating, setIsCreating] = useState(false);
  const [editingItem, setEditingItem] = useState<AdminAnnouncementItem | null>(
    null,
  );
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formAudience, setFormAudience] = useState<
    'all' | 'pet_owners' | 'vets'
  >('all');
  const [formPriority, setFormPriority] = useState<
    'normal' | 'important' | 'urgent'
  >('normal');
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

    getAdminAnnouncements()
      .then((res) => {
        if (active) setAnnouncements(res);
      })
      .catch((err: unknown) => {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : 'Could not load announcements.',
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [retry]);

  function openCreateModal() {
    setEditingItem(null);
    setIsCreating(true);
    setFormTitle('');
    setFormContent('');
    setFormAudience('all');
    setFormPriority('normal');
    setSaveError('');
  }

  function openEditModal(a: AdminAnnouncementItem) {
    setIsCreating(false);
    setEditingItem(a);
    setFormTitle(a.title);
    setFormContent(a.content);
    setFormAudience(a.audience);
    setFormPriority(a.priority);
    setSaveError('');
  }

  async function handleSaveAnnouncement() {
    const title = formTitle.trim();
    const content = formContent.trim();

    if (title.length < 3) {
      setSaveError('Title must contain at least 3 characters.');
      return;
    }

    if (content.length < 5) {
      setSaveError('Content must contain at least 5 characters.');
      return;
    }

    setSaving(true);
    setSaveError('');

    try {
      if (isCreating) {
        await createAdminAnnouncement({
          title,
          content,
          audience: formAudience,
          priority: formPriority,
        });
        Alert.alert(
          'Announcement Created',
          `"${title}" is saved as a draft. You can publish it when ready.`,
        );
      } else if (editingItem) {
        await updateAdminAnnouncement(editingItem.id, {
          title,
          content,
          audience: formAudience,
          priority: formPriority,
        });
        Alert.alert('Announcement Updated', `"${title}" has been updated.`);
      }

      if (mounted.current) {
        setIsCreating(false);
        setEditingItem(null);
        setRetry((v) => v + 1);
      }
    } catch (err) {
      if (mounted.current) {
        setSaveError(
          err instanceof Error ? err.message : 'Failed to save announcement.',
        );
      }
    } finally {
      if (mounted.current) setSaving(false);
    }
  }

  async function handleTogglePublish(a: AdminAnnouncementItem) {
    const willPublish = a.status !== 'published';
    Alert.alert(
      willPublish ? 'Publish Announcement' : 'Unpublish Announcement',
      willPublish
        ? `Broadcast "${a.title}" to ${
            a.audience === 'all'
              ? 'all users'
              : a.audience === 'pet_owners'
              ? 'all pet owners'
              : 'all veterinarians'
          }?`
        : `Remove "${a.title}" from user announcement feeds?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: willPublish ? 'Publish' : 'Unpublish',
          onPress: async () => {
            try {
              if (willPublish) {
                await publishAdminAnnouncement(a.id);
              } else {
                await unpublishAdminAnnouncement(a.id);
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

  async function handleDelete(a: AdminAnnouncementItem) {
    Alert.alert(
      'Delete Announcement',
      `Permanently delete "${a.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAdminAnnouncement(a.id);
              Alert.alert('Deleted', `"${a.title}" was deleted.`);
              setRetry((v) => v + 1);
            } catch (err) {
              Alert.alert(
                'Delete Failed',
                err instanceof Error ? err.message : 'Could not delete.',
              );
            }
          },
        },
      ],
    );
  }

  return (
    <View style={styles.container}>
      {/* TOP HEADER & ACTION */}
      <View style={styles.topActionsRow}>
        <View style={styles.flex}>
          <Text style={styles.sectionTitle}>In-App Announcements</Text>
          <Text style={styles.sectionSubtitle}>
            Broadcast platform updates, care notices and alerts
          </Text>
        </View>

        <Pressable onPress={openCreateModal} style={styles.createBtn}>
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <Text style={styles.createBtnText}>New Notice</Text>
        </Pressable>
      </View>

      {/* ANNOUNCEMENTS LIST */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#71579C" />
          <Text style={styles.loadingText}>Loading announcements...</Text>
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
      ) : announcements.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="megaphone-outline" size={36} color="#A89EAF" />
          <Text style={styles.emptyTitle}>No announcements yet</Text>
          <Text style={styles.emptySub}>
            Create an in-app notice to communicate system updates or important
            veterinary news.
          </Text>
        </View>
      ) : (
        <View style={styles.listContainer}>
          {announcements.map((item) => (
            <View key={item.id} style={styles.announcementCard}>
              <View style={styles.announcementTop}>
                <View style={styles.titleArea}>
                  <Text style={styles.announcementTitle}>{item.title}</Text>
                  <Text style={styles.dateText}>
                    Created: {new Date(item.createdAt).toLocaleDateString()}
                    {item.publishedAt &&
                      ` • Published: ${new Date(item.publishedAt).toLocaleDateString()}`}
                  </Text>
                </View>

                <View style={styles.badgeColumn}>
                  <View
                    style={[
                      styles.statusBadge,
                      item.status === 'published'
                        ? styles.statusPublished
                        : item.status === 'draft'
                        ? styles.statusDraft
                        : styles.statusUnpublished,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        item.status === 'published'
                          ? styles.statusTextPublished
                          : item.status === 'draft'
                          ? styles.statusTextDraft
                          : styles.statusTextUnpublished,
                      ]}
                    >
                      {item.status.toUpperCase()}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.priorityBadge,
                      item.priority === 'urgent'
                        ? styles.priorityUrgent
                        : item.priority === 'important'
                        ? styles.priorityImportant
                        : styles.priorityNormal,
                    ]}
                  >
                    <Text
                      style={[
                        styles.priorityText,
                        item.priority === 'urgent'
                          ? styles.priorityTextUrgent
                          : item.priority === 'important'
                          ? styles.priorityTextImportant
                          : styles.priorityTextNormal,
                      ]}
                    >
                      {item.priority.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>

              <Text style={styles.contentText}>{item.content}</Text>

              <View style={styles.audienceRow}>
                <Ionicons name="people-outline" size={13} color="#71579C" />
                <Text style={styles.audienceText}>
                  Audience:{' '}
                  <Text style={styles.bold}>
                    {item.audience === 'all'
                      ? 'All Users'
                      : item.audience === 'pet_owners'
                      ? 'Pet Owners Only'
                      : 'Veterinarians Only'}
                  </Text>
                </Text>
              </View>

              {/* ACTIONS */}
              <View style={styles.actionsRow}>
                <Pressable
                  onPress={() => handleTogglePublish(item)}
                  style={[
                    styles.actionBtn,
                    item.status === 'published'
                      ? styles.unpublishBtn
                      : styles.publishBtn,
                  ]}
                >
                  <Ionicons
                    name={
                      item.status === 'published'
                        ? 'eye-off-outline'
                        : 'paper-plane-outline'
                    }
                    size={14}
                    color={item.status === 'published' ? '#BA5648' : '#54816A'}
                  />
                  <Text
                    style={[
                      styles.actionBtnText,
                      item.status === 'published'
                        ? styles.unpublishBtnText
                        : styles.publishBtnText,
                    ]}
                  >
                    {item.status === 'published' ? 'Unpublish' : 'Publish'}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => openEditModal(item)}
                  style={[styles.actionBtn, styles.editBtn]}
                >
                  <Ionicons name="pencil-outline" size={14} color="#71579C" />
                  <Text style={styles.editBtnText}>Edit</Text>
                </Pressable>

                <Pressable
                  onPress={() => handleDelete(item)}
                  style={[styles.actionBtn, styles.deleteBtn]}
                >
                  <Ionicons name="trash-outline" size={14} color="#BA5648" />
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* CREATE / EDIT ANNOUNCEMENT MODAL */}
      <Modal
        visible={isCreating || editingItem !== null}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setIsCreating(false);
          setEditingItem(null);
        }}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isCreating ? 'Create In-App Notice' : 'Edit Notice'}
              </Text>
              <Pressable
                onPress={() => {
                  setIsCreating(false);
                  setEditingItem(null);
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
              <Text style={styles.inputLabel}>Notice Headline *</Text>
              <TextInput
                value={formTitle}
                onChangeText={setFormTitle}
                placeholder="e.g. Scheduled Maintenance / Rabies Awareness Week"
                placeholderTextColor="#A899B1"
                style={styles.textInput}
              />

              <Text style={styles.inputLabel}>Message Content *</Text>
              <TextInput
                value={formContent}
                onChangeText={setFormContent}
                placeholder="Write the full announcement message here..."
                placeholderTextColor="#A899B1"
                multiline
                numberOfLines={4}
                style={styles.contentInput}
              />

              {/* AUDIENCE SELECTOR */}
              <Text style={styles.inputLabel}>Audience</Text>
              <View style={styles.selectorRow}>
                {[
                  { key: 'all', label: 'All Users' },
                  { key: 'pet_owners', label: 'Pet Owners' },
                  { key: 'vets', label: 'Veterinarians' },
                ].map((aud) => (
                  <Pressable
                    key={aud.key}
                    onPress={() =>
                      setFormAudience(
                        aud.key as 'all' | 'pet_owners' | 'vets',
                      )
                    }
                    style={[
                      styles.selectorChip,
                      formAudience === aud.key && styles.selectorChipSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.selectorChipText,
                        formAudience === aud.key &&
                          styles.selectorChipTextSelected,
                      ]}
                    >
                      {aud.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* PRIORITY SELECTOR */}
              <Text style={styles.inputLabel}>Priority Level</Text>
              <View style={styles.selectorRow}>
                {[
                  { key: 'normal', label: 'Normal' },
                  { key: 'important', label: 'Important' },
                  { key: 'urgent', label: 'Urgent Alert' },
                ].map((pr) => (
                  <Pressable
                    key={pr.key}
                    onPress={() =>
                      setFormPriority(
                        pr.key as 'normal' | 'important' | 'urgent',
                      )
                    }
                    style={[
                      styles.selectorChip,
                      formPriority === pr.key && styles.selectorChipSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.selectorChipText,
                        formPriority === pr.key &&
                          styles.selectorChipTextSelected,
                      ]}
                    >
                      {pr.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {!!saveError && (
                <Text style={styles.dialogErrorText}>{saveError}</Text>
              )}

              <View style={styles.modalActionRow}>
                <Pressable
                  onPress={() => {
                    setIsCreating(false);
                    setEditingItem(null);
                  }}
                  disabled={saving}
                  style={styles.cancelBtn}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </Pressable>

                <Pressable
                  onPress={handleSaveAnnouncement}
                  disabled={saving}
                  style={[styles.saveBtn, saving && styles.btnDisabled]}
                >
                  {saving ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.saveBtnText}>
                      {isCreating ? 'Save Draft' : 'Save Changes'}
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
  flex: { flex: 1 },
  topActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitle: {
    color: '#304439',
    fontSize: 18,
    fontWeight: '800',
  },
  sectionSubtitle: {
    color: '#958A81',
    fontSize: 11,
    marginTop: 2,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#71579C',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  createBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  listContainer: {
    marginTop: 4,
  },
  announcementCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EAE2F1',
    padding: 16,
    marginBottom: 12,
  },
  announcementTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleArea: {
    flex: 1,
    marginRight: 10,
  },
  announcementTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#342542',
  },
  dateText: {
    fontSize: 10,
    color: '#9E8FA9',
    marginTop: 3,
  },
  badgeColumn: {
    alignItems: 'flex-end',
    gap: 4,
  },
  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusPublished: { backgroundColor: '#E2F0E8' },
  statusDraft: { backgroundColor: '#FFF0C9' },
  statusUnpublished: { backgroundColor: '#ECE7F2' },
  statusText: { fontSize: 8, fontWeight: '800' },
  statusTextPublished: { color: '#3B7356' },
  statusTextDraft: { color: '#976A17' },
  statusTextUnpublished: { color: '#7E6F8C' },
  priorityBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  priorityNormal: { backgroundColor: '#EEE6F6' },
  priorityImportant: { backgroundColor: '#FFF0C9' },
  priorityUrgent: { backgroundColor: '#FDEAE8' },
  priorityText: { fontSize: 8, fontWeight: '800' },
  priorityTextNormal: { color: '#71579C' },
  priorityTextImportant: { color: '#976A17' },
  priorityTextUrgent: { color: '#BA5648' },
  contentText: {
    fontSize: 12,
    color: '#554664',
    lineHeight: 18,
    marginTop: 10,
  },
  audienceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FAF8FC',
    padding: 8,
    borderRadius: 8,
    marginTop: 10,
  },
  audienceText: {
    fontSize: 11,
    color: '#71579C',
  },
  bold: {
    fontWeight: '700',
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
    marginTop: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5DCEC',
    borderRadius: 12,
    padding: 10,
    fontSize: 12,
    color: '#453852',
    backgroundColor: '#FFFFFF',
  },
  contentInput: {
    borderWidth: 1,
    borderColor: '#E5DCEC',
    borderRadius: 12,
    padding: 10,
    fontSize: 12,
    color: '#453852',
    backgroundColor: '#FFFFFF',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  selectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  selectorChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECE4F2',
  },
  selectorChipSelected: {
    backgroundColor: '#71579C',
    borderColor: '#71579C',
  },
  selectorChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#71579C',
  },
  selectorChipTextSelected: {
    color: '#FFFFFF',
  },
  dialogErrorText: {
    color: '#BA5648',
    fontSize: 11,
    marginTop: 8,
    textAlign: 'center',
  },
  modalActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 20,
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
