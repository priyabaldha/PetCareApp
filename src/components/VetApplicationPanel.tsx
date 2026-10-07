import { useCallback, useEffect, useRef, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import {
  getMyVetApplication,
  getPendingVetApplications,
  reviewVetApplication,
  submitVetApplication,
} from '../services/vetApplications';

import type {
  PendingVetApplication,
  VetApplication,
  VetApplicationInput,
} from '../services/vetApplications';

const fields: {
  key: keyof VetApplicationInput;
  label: string;
  placeholder: string;
  max: number;
  multiline?: boolean;
}[] = [
  {
    key: 'qualifications',
    label: 'Qualifications',
    placeholder: 'Your veterinary qualifications',
    max: 300,
  },
  {
    key: 'registrationNumber',
    label: 'Registration number',
    placeholder: 'Your professional registration number',
    max: 100,
  },
  {
    key: 'registrationCouncil',
    label: 'Registration council / authority',
    placeholder: 'Authority that issued your registration',
    max: 200,
  },
  {
    key: 'clinicName',
    label: 'Clinic name',
    placeholder: 'Name of your clinic',
    max: 150,
  },
  {
    key: 'clinicAddress',
    label: 'Clinic address',
    placeholder: 'Address, city, state and postal code',
    max: 500,
    multiline: true,
  },
];

function emptyForm(): VetApplicationInput {
  return {
    qualifications: '',
    registrationNumber: '',
    registrationCouncil: '',
    clinicName: '',
    clinicAddress: '',
  };
}

function message(error: unknown) {
  return error instanceof Error ? error.message : 'Please try again.';
}

function ApplicationDetails({
  application,
}: {
  application: VetApplication;
}) {
  return (
    <View style={styles.details}>
      {fields.map((field) => (
        <View key={field.key} style={styles.detail}>
          <Text style={styles.label}>{field.label}</Text>
          <Text style={styles.detailText}>
            {application[field.key]}
          </Text>
        </View>
      ))}
    </View>
  );
}

export default function VetApplicationPanel({
  disabled = false,
}: {
  disabled?: boolean;
}) {
  const [application, setApplication] = useState<VetApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  const [form, setForm] = useState<VetApplicationInput>(emptyForm);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const mounted = useRef(false);
  const busy = useRef(false);
  const version = useRef(0);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      version.current += 1;
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (busy.current) return;

      let active = true;
      const request = ++version.current;

      setLoading(true);
      setError('');

      getMyVetApplication()
        .then((result) => {
          if (active && request === version.current) {
            setApplication(result);

            if (result?.status === 'pending' || result?.status === 'approved') {
              setEditing(false);
            }
          }
        })
        .catch((failure: unknown) => {
          if (active && request === version.current) {
            setError(message(failure));
          }
        })
        .finally(() => {
          if (active && request === version.current) {
            setLoading(false);
          }
        });

      return () => {
        active = false;
      };
    }, [retry]),
  );

  function openForm() {
    if (disabled || busy.current || loading || error) return;

    if (
      application &&
      application.status !== 'rejected'
    ) {
      return;
    }

    setForm(
      application
        ? {
            qualifications: application.qualifications,
            registrationNumber: application.registrationNumber,
            registrationCouncil: application.registrationCouncil,
            clinicName: application.clinicName,
            clinicAddress: application.clinicAddress,
          }
        : emptyForm(),
    );

    setSaveError('');
    setEditing(true);
  }

  async function submit() {
    if (disabled || busy.current || loading || error) return;

    for (const field of fields) {
      if (form[field.key].trim().length < 2) {
        setSaveError(`${field.label} must contain at least 2 characters.`);
        return;
      }
    }

    busy.current = true;
    version.current += 1;
    setSaving(true);
    setSaveError('');

    try {
      const result = await submitVetApplication(form);

      if (mounted.current) {
        setApplication(result);
        setEditing(false);
      }
    } catch (failure: unknown) {
      if (mounted.current) {
        setSaveError(
          `${message(failure)} Check the refreshed status before retrying.`,
        );
      }
    } finally {
      busy.current = false;

      if (mounted.current) {
        setSaving(false);
        setRetry((value) => value + 1);
      }
    }
  }

  return (
    <View style={styles.panel}>
      <View style={styles.heading}>
        <View style={styles.icon}>
          <Ionicons name="medkit-outline" size={25} color="#71579C" />
        </View>
        <View style={styles.flex}>
          <Text style={styles.eyebrow}>JOIN AS A PROFESSIONAL</Text>
          <Text style={styles.title}>Become a JEEVA Vet</Text>
        </View>
      </View>

      <Text style={styles.description}>
        Submit your professional details for Admin review. Your
        account stays a Pet Owner until approved.
      </Text>

      {loading ? (
        <ActivityIndicator color="#71579C" style={styles.space} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <>
          {application && (
            <View style={styles.statusCard}>
              <Text style={styles.statusTitle}>
                {application.status === 'pending'
                  ? 'Application pending'
                  : application.status === 'approved'
                    ? 'Application approved'
                    : 'Changes needed'}
              </Text>

              <Text style={styles.description}>
                {application.status === 'pending'
                  ? 'Your details are waiting for Admin review.'
                  : application.status === 'approved'
                    ? 'Sign out and sign in again to open your Vet account.'
                    : application.reviewReason}
              </Text>

              <ApplicationDetails application={application} />
            </View>
          )}

          {!editing &&
            (!application || application.status === 'rejected') && (
              <Pressable
                onPress={openForm}
                disabled={disabled}
                accessibilityRole="button"
                style={[styles.primary, disabled && styles.disabled]}
              >
                <Text style={styles.primaryText}>
                  {application ? 'Correct and resubmit' : 'Apply as a Vet'}
                </Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </Pressable>
            )}

          {editing && (
            <View style={styles.form}>
              <Text style={styles.formTitle}>Professional details</Text>
              <Text style={styles.description}>All fields are required.</Text>

              {fields.map((field) => (
                <View key={field.key} style={styles.field}>
                  <Text style={styles.label}>{field.label}</Text>
                  <TextInput
                    value={form[field.key]}
                    onChangeText={(value) =>
                      setForm((current) => ({
                        ...current,
                        [field.key]: value,
                      }))
                    }
                    placeholder={field.placeholder}
                    placeholderTextColor="#A899B1"
                    maxLength={field.max}
                    editable={!saving && !disabled}
                    multiline={field.multiline}
                    autoCorrect={false}
                    textAlignVertical={field.multiline ? 'top' : 'center'}
                    accessibilityLabel={field.label}
                    style={[
                      styles.input,
                      field.multiline && styles.multiline,
                    ]}
                  />
                </View>
              ))}

              {!!saveError && (
                <Text accessibilityRole="alert" style={styles.error}>
                  {saveError}
                </Text>
              )}

              <View style={styles.actions}>
                <Pressable
                  onPress={() => setEditing(false)}
                  disabled={saving || disabled}
                  accessibilityRole="button"
                  style={styles.secondary}
                >
                  <Text style={styles.secondaryText}>Cancel</Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    void submit();
                  }}
                  disabled={saving || disabled || loading}
                  accessibilityRole="button"
                  style={[
                    styles.primary,
                    (saving || disabled || loading) && styles.disabled,
                  ]}
                >
                  <Text style={styles.primaryText}>
                    {saving ? 'Submitting…' : 'Submit application'}
                  </Text>
                </Pressable>
              </View>
            </View>
          )}
        </>
      )}

      <Pressable
        onPress={() => setRetry((value) => value + 1)}
        disabled={loading || saving || disabled}
        accessibilityRole="button"
        style={styles.refresh}
      >
        <Ionicons name="refresh-outline" size={16} color="#71579C" />
        <Text style={styles.secondaryText}>Refresh application status</Text>
      </Pressable>
    </View>
  );
}

// Used by the Admin dashboard.
export function AdminVetApplications({
  onReviewed,
}: {
  onReviewed: () => void;
}) {
  const [applications, setApplications] = useState<PendingVetApplication[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [reviewing, setReviewing] = useState<string | null>(null);

  const mounted = useRef(false);
  const busy = useRef(false);
  const version = useRef(0);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      version.current += 1;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const request = ++version.current;

    setLoading(true);
    setError('');

    getPendingVetApplications()
      .then((result) => {
        if (active && request === version.current) {
          setApplications(result.applications);
          setHasMore(result.hasMore);
        }
      })
      .catch((failure: unknown) => {
        if (active && request === version.current) {
          setError(message(failure));
        }
      })
      .finally(() => {
        if (active && request === version.current) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [retry]);

  async function review(
    applicant: PendingVetApplication,
    decision: 'approved' | 'rejected',
    reason: string,
  ) {
    if (busy.current || !mounted.current) return;

    busy.current = true;
    version.current += 1;
    setReviewing(applicant.userId);
    setError('');

    try {
      await reviewVetApplication(
        applicant.userId,
        applicant.application.revision,
        decision,
        reason,
      );

      if (mounted.current) {
        setApplications((current) =>
          current.filter((item) => item.userId !== applicant.userId),
        );
        onReviewed();
      }
    } catch (failure: unknown) {
      if (mounted.current) {
        Alert.alert(
          'Could not confirm review',
          `${message(failure)} The queue will refresh before another review.`,
        );
      }
    } finally {
      busy.current = false;

      if (mounted.current) {
        setReviewing(null);
        setRetry((value) => value + 1);
      }
    }
  }

  function confirmReview(
    applicant: PendingVetApplication,
    decision: 'approved' | 'rejected',
    reason: string,
  ) {
    if (busy.current || loading) return;

    if (decision === 'rejected' && reason.trim().length < 5) {
      Alert.alert(
        'Reason required',
        'Explain what needs correcting using at least 5 characters.',
      );
      return;
    }

    Alert.alert(
      decision === 'approved' ? 'Approve Vet access?' : 'Reject application?',
      decision === 'approved'
        ? `Confirm you reviewed ${applicant.name}’s professional details. Their account will change from Pet Owner to Vet.`
        : `Send this reason to ${applicant.name}:\n\n${reason.trim()}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: decision === 'approved' ? 'Approve' : 'Reject',
          style: decision === 'rejected' ? 'destructive' : 'default',
          onPress: () => {
            void review(applicant, decision, reason.trim());
          },
        },
      ],
    );
  }

  return (
    <View style={styles.panel}>
      <View style={styles.heading}>
        <View style={styles.icon}>
          <Ionicons name="clipboard-outline" size={24} color="#71579C" />
        </View>
        <View style={styles.flex}>
          <Text style={styles.eyebrow}>PROFESSIONAL ACCESS</Text>
          <Text style={styles.title}>Vet applications</Text>
        </View>
      </View>

      <Text style={styles.description}>
        Review professional details before granting Vet access.
        Registration details are self-reported; this app does not
        automatically verify credentials.
      </Text>

      <Pressable
        onPress={() => setRetry((value) => value + 1)}
        disabled={loading || reviewing !== null}
        accessibilityRole="button"
        style={styles.refresh}
      >
        <Ionicons name="refresh-outline" size={16} color="#71579C" />
        <Text style={styles.secondaryText}>Refresh queue</Text>
      </Pressable>

      {loading ? (
        <ActivityIndicator color="#71579C" style={styles.space} />
      ) : error ? (
        <Text accessibilityRole="alert" style={styles.error}>{error}</Text>
      ) : applications.length === 0 ? (
        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>All caught up</Text>
          <Text style={styles.description}>No pending applications.</Text>
        </View>
      ) : (
        <>
          {hasMore && (
            <Text style={styles.description}>
              Showing the oldest 50 applications. More will appear
              as you review and refresh.
            </Text>
          )}

          {applications.map((applicant) => (
            <ReviewCard
              key={`${applicant.userId}:${applicant.application.revision}`}
              applicant={applicant}
              disabled={reviewing !== null}
              reviewing={reviewing === applicant.userId}
              onReview={(decision, reason) =>
                confirmReview(applicant, decision, reason)
              }
            />
          ))}
        </>
      )}
    </View>
  );
}

function ReviewCard({
  applicant,
  disabled,
  reviewing,
  onReview,
}: {
  applicant: PendingVetApplication;
  disabled: boolean;
  reviewing: boolean;
  onReview: (decision: 'approved' | 'rejected', reason: string) => void;
}) {
  const [reason, setReason] = useState('');

  return (
    <View style={styles.reviewCard}>
      <Text style={styles.formTitle}>{applicant.name}</Text>
      <Text style={styles.description}>{applicant.email}</Text>

      <Text style={styles.date}>
        Submitted: {new Date(applicant.application.submittedAt).toLocaleString()}
      </Text>

      <ApplicationDetails application={applicant.application} />

      <Text style={styles.label}>
        Review note — required for rejection
      </Text>

      <TextInput
        value={reason}
        onChangeText={setReason}
        editable={!disabled}
        maxLength={1000}
        multiline
        textAlignVertical="top"
        placeholder="Explain your decision or what needs correcting."
        placeholderTextColor="#A899B1"
        accessibilityLabel="Review reason"
        style={[styles.input, styles.multiline]}
      />

      <View style={styles.actions}>
        <Pressable
          onPress={() => onReview('rejected', reason)}
          disabled={disabled}
          accessibilityRole="button"
          style={[styles.reject, disabled && styles.disabled]}
        >
          <Text style={styles.rejectText}>Reject</Text>
        </Pressable>

        <Pressable
          onPress={() => onReview('approved', reason)}
          disabled={disabled}
          accessibilityRole="button"
          style={[styles.primary, disabled && styles.disabled]}
        >
          <Text style={styles.primaryText}>
            {reviewing ? 'Saving…' : 'Approve Vet'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    marginTop: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAE2F1',
    borderRadius: 24,
    padding: 18,
  },
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  icon: {
    width: 48,
    height: 53,
    borderRadius: 16,
    backgroundColor: '#EEE7F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: { flex: 1 },
  eyebrow: {
    color: '#A08BAC',
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: 1,
  },
  title: {
    color: '#4F3F60',
    fontSize: 19,
    fontWeight: '800',
    marginTop: 5,
  },
  description: {
    color: '#97889F',
    fontSize: 12,
    lineHeight: 20,
    marginTop: 5,
  },
  primary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    paddingHorizontal: 15,
    backgroundColor: '#71579C',
    borderRadius: 13,
    marginTop: 12,
  },
  primaryText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  secondary: {
    paddingVertical: 13,
    paddingHorizontal: 15,
    borderRadius: 13,
    backgroundColor: '#F0EAF6',
    marginTop: 12,
  },
  secondaryText: { color: '#71579C', fontSize: 11, fontWeight: '800' },
  disabled: { opacity: 0.45 },
  statusCard: {
    backgroundColor: '#F5F0FA',
    padding: 15,
    borderRadius: 17,
    marginTop: 16,
  },
  statusTitle: { color: '#71579C', fontSize: 15, fontWeight: '800' },
  details: { marginTop: 15 },
  detail: { marginBottom: 12 },
  label: {
    color: '#8C759F',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
  },
  detailText: { color: '#64566F', fontSize: 13, lineHeight: 21 },
  form: { marginTop: 20 },
  formTitle: { color: '#51425F', fontSize: 17, fontWeight: '800' },
  field: { marginTop: 16 },
  input: {
    minHeight: 47,
    borderWidth: 1,
    borderColor: '#E5DCEC',
    borderRadius: 12,
    backgroundColor: '#FBF9FD',
    color: '#5C4C6A',
    padding: 12,
    fontSize: 13,
  },
  multiline: { minHeight: 95, lineHeight: 20 },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  refresh: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 13,
    marginTop: 8,
  },
  error: { color: '#B96757', fontSize: 12, lineHeight: 20, marginTop: 12 },
  space: { marginVertical: 20 },
  reviewCard: {
    padding: 15,
    borderRadius: 18,
    backgroundColor: '#FCFAFE',
    borderWidth: 1,
    borderColor: '#EAE2F1',
    marginTop: 14,
  },
  date: { color: '#A393AE', fontSize: 10, marginTop: 9 },
  reject: {
    backgroundColor: '#FAEBE6',
    paddingVertical: 13,
    paddingHorizontal: 15,
    borderRadius: 13,
    marginTop: 12,
  },
  rejectText: { color: '#B96757', fontSize: 12, fontWeight: '800' },
});