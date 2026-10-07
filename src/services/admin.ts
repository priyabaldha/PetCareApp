import { authenticatedRequest } from './auth';

export interface AdminOverview {
  petOwners: number;
  vets: number;
  admins: number;
  pets: number;
  suspendedUsers: number;
  pendingVetApplications: number;
  appointments: number;
  announcements: number;
  guides: number;
}

export interface RecentActivityItem {
  id: string;
  action: string;
  actorName: string;
  actorEmail: string;
  targetType: string;
  targetId: string;
  targetName?: string;
  reason?: string;
  createdAt: string;
}

export interface AdminOverviewResponse {
  overview: AdminOverview;
  recentActivity: RecentActivityItem[];
}

export interface AdminUserSummary {
  id: string;
  name: string;
  email: string;
  role: 'pet_owner' | 'vet' | 'admin';
  isSuspended: boolean;
  suspendedAt: string | null;
  suspendedReason: string;
  petCount: number;
  hasVetApplication: boolean;
  vetApplicationStatus: 'pending' | 'approved' | 'rejected' | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUserDetail extends AdminUserSummary {
  vetApplication?: {
    qualifications: string;
    registrationNumber: string;
    registrationCouncil: string;
    clinicName: string;
    clinicAddress: string;
    status: 'pending' | 'approved' | 'rejected';
    revision: string;
    submittedAt: string;
    reviewedAt: string | null;
    reviewReason: string;
  } | null;
  vetApplicationHistory?: Array<{
    qualifications: string;
    registrationNumber: string;
    registrationCouncil: string;
    clinicName: string;
    clinicAddress: string;
    status: 'approved' | 'rejected';
    revision: string;
    submittedAt: string;
    reviewedAt: string;
    reviewReason: string;
  }>;
  pets: Array<{
    id: string;
    name: string;
    species: string;
    breed: string;
    sex: string;
    dateOfBirth: string | null;
    weightKg: number | null;
    createdAt: string;
  }>;
}

export interface AdminPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AdminVetAppItem {
  userId: string;
  name: string;
  email: string;
  role: string;
  isSuspended: boolean;
  application: {
    qualifications: string;
    registrationNumber: string;
    registrationCouncil: string;
    clinicName: string;
    clinicAddress: string;
    revision: string;
    status: 'pending' | 'approved' | 'rejected';
    submittedAt: string;
    reviewedAt: string | null;
    reviewReason: string;
  };
  historyCount: number;
}

export interface AdminVetApplicationDetailResponse {
  application: {
    userId: string;
    name: string;
    email: string;
    role: string;
    isSuspended: boolean;
    current: {
      qualifications: string;
      registrationNumber: string;
      registrationCouncil: string;
      clinicName: string;
      clinicAddress: string;
      revision: string;
      status: string;
      submittedAt: string;
      reviewedAt: string | null;
      reviewReason: string;
    };
    history: Array<{
      qualifications: string;
      registrationNumber: string;
      registrationCouncil: string;
      clinicName: string;
      clinicAddress: string;
      revision?: string;
      status: string;
      submittedAt: string;
      reviewedAt: string;
      reviewReason: string;
    }>;
  };
}

export interface AdminPetItem {
  id: string;
  name: string;
  species: string;
  breed: string;
  sex: string;
  dateOfBirth: string | null;
  weightKg: number | null;
  createdAt: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
}

export interface AdminPetsOverview {
  totalPets: number;
  vaccinationsCount: number;
  medicationsCount: number;
  appointmentsCount: number;
  speciesBreakdown: Array<{ species: string; count: number }>;
}

export interface AdminAppointmentItem {
  id: string;
  clinicName: string;
  date: string;
  time: string;
  reason: string;
  petId: string;
  petName: string;
  petSpecies: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  createdAt: string | null;
  source: 'owner_recorded';
}

export interface AdminGuideItem {
  id: string;
  slug: string;
  title: string;
  category: string;
  status: 'published' | 'draft' | 'unpublished';
  sections: Array<{ heading: string; text: string }>;
  authorName: string;
  reviewedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminAnnouncementItem {
  id: string;
  title: string;
  content: string;
  audience: 'all' | 'pet_owners' | 'vets';
  status: 'published' | 'draft' | 'unpublished';
  priority: 'normal' | 'important' | 'urgent';
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminAuditLogItem {
  id: string;
  action: string;
  actorId: string;
  actorName: string;
  actorEmail: string;
  actorRole: string;
  targetType: string;
  targetId: string;
  targetName: string;
  reason: string;
  details?: Record<string, unknown> | null;
  createdAt: string;
}

export interface AdminCommunityStatus {
  status: string;
  message: string;
  hasLivePosts: boolean;
  hasLiveReports: boolean;
}

/* ==========================================================================
   API METHODS
   ========================================================================== */

export async function getAdminOverview(): Promise<AdminOverviewResponse> {
  const data = await authenticatedRequest('/api/admin/overview');
  return {
    overview: data.overview as AdminOverview,
    recentActivity: (data.recentActivity || []) as RecentActivityItem[],
  };
}

export async function getAdminUsers(params: {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
}): Promise<{ users: AdminUserSummary[]; pagination: AdminPagination }> {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.search) searchParams.set('search', params.search);
  if (params.role) searchParams.set('role', params.role);
  if (params.status) searchParams.set('status', params.status);

  const query = searchParams.toString();
  const data = await authenticatedRequest(
    `/api/admin/users${query ? `?${query}` : ''}`,
  );

  return {
    users: (data.users || []) as AdminUserSummary[],
    pagination: data.pagination as AdminPagination,
  };
}

export async function getAdminUserDetail(
  userId: string,
): Promise<AdminUserDetail> {
  const data = await authenticatedRequest(`/api/admin/users/${userId}`);
  return data.user as AdminUserDetail;
}

export async function suspendUser(
  userId: string,
  reason: string,
): Promise<void> {
  await authenticatedRequest(
    `/api/admin/users/${userId}/suspend`,
    'POST',
    { reason },
  );
}

export async function reactivateUser(userId: string): Promise<void> {
  await authenticatedRequest(`/api/admin/users/${userId}/reactivate`, 'POST');
}

export async function getAdminVetApplications(params: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}): Promise<{
  applications: AdminVetAppItem[];
  pagination: AdminPagination;
}> {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.status) searchParams.set('status', params.status);
  if (params.search) searchParams.set('search', params.search);

  const query = searchParams.toString();
  const data = await authenticatedRequest(
    `/api/admin/vet-applications${query ? `?${query}` : ''}`,
  );

  return {
    applications: (data.applications || []) as AdminVetAppItem[],
    pagination: data.pagination as AdminPagination,
  };
}

export async function getAdminVetApplicationDetail(
  userId: string,
): Promise<AdminVetApplicationDetailResponse> {
  const data = await authenticatedRequest(
    `/api/admin/vet-applications/${userId}`,
  );
  return data as unknown as AdminVetApplicationDetailResponse;
}

export async function getAdminPetsOverview(): Promise<AdminPetsOverview> {
  const data = await authenticatedRequest('/api/admin/pets/overview');
  return data.overview as AdminPetsOverview;
}

export async function getAdminPets(params: {
  page?: number;
  limit?: number;
  search?: string;
  species?: string;
}): Promise<{ pets: AdminPetItem[]; pagination: AdminPagination }> {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.search) searchParams.set('search', params.search);
  if (params.species) searchParams.set('species', params.species);

  const query = searchParams.toString();
  const data = await authenticatedRequest(
    `/api/admin/pets${query ? `?${query}` : ''}`,
  );

  return {
    pets: (data.pets || []) as AdminPetItem[],
    pagination: data.pagination as AdminPagination,
  };
}

export async function getAdminAppointments(params: {
  page?: number;
  limit?: number;
  search?: string;
  timeframe?: string;
}): Promise<{
  appointments: AdminAppointmentItem[];
  pagination: AdminPagination;
}> {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.search) searchParams.set('search', params.search);
  if (params.timeframe) searchParams.set('timeframe', params.timeframe);

  const query = searchParams.toString();
  const data = await authenticatedRequest(
    `/api/admin/appointments${query ? `?${query}` : ''}`,
  );

  return {
    appointments: (data.appointments || []) as AdminAppointmentItem[],
    pagination: data.pagination as AdminPagination,
  };
}

export async function getAdminGuides(params?: {
  category?: string;
  status?: string;
  search?: string;
}): Promise<AdminGuideItem[]> {
  const searchParams = new URLSearchParams();
  if (params?.category) searchParams.set('category', params.category);
  if (params?.status) searchParams.set('status', params.status);
  if (params?.search) searchParams.set('search', params.search);

  const query = searchParams.toString();
  const data = await authenticatedRequest(
    `/api/admin/guides${query ? `?${query}` : ''}`,
  );
  return (data.guides || []) as AdminGuideItem[];
}

export async function createAdminGuide(guide: {
  title: string;
  slug?: string;
  category: string;
  sections: Array<{ heading: string; text: string }>;
  authorName?: string;
  reviewedBy?: string;
}): Promise<AdminGuideItem> {
  const data = await authenticatedRequest(
    '/api/admin/guides',
    'POST',
    guide,
  );
  return data.guide as AdminGuideItem;
}

export async function updateAdminGuide(
  id: string,
  guide: Partial<{
    title: string;
    category: string;
    sections: Array<{ heading: string; text: string }>;
    authorName?: string;
    reviewedBy?: string;
  }>,
): Promise<AdminGuideItem> {
  const data = await authenticatedRequest(
    `/api/admin/guides/${id}`,
    'PATCH',
    guide,
  );
  return data.guide as AdminGuideItem;
}

export async function publishAdminGuide(id: string): Promise<void> {
  await authenticatedRequest(`/api/admin/guides/${id}/publish`, 'POST');
}

export async function unpublishAdminGuide(id: string): Promise<void> {
  await authenticatedRequest(`/api/admin/guides/${id}/unpublish`, 'POST');
}

export async function deleteAdminGuide(id: string): Promise<void> {
  await authenticatedRequest(`/api/admin/guides/${id}`, 'DELETE');
}

export async function getAdminAnnouncements(): Promise<
  AdminAnnouncementItem[]
> {
  const data = await authenticatedRequest('/api/admin/announcements');
  return (data.announcements || []) as AdminAnnouncementItem[];
}

export async function createAdminAnnouncement(announcement: {
  title: string;
  content: string;
  audience: 'all' | 'pet_owners' | 'vets';
  priority: 'normal' | 'important' | 'urgent';
}): Promise<AdminAnnouncementItem> {
  const data = await authenticatedRequest(
    '/api/admin/announcements',
    'POST',
    announcement,
  );
  return data.announcement as AdminAnnouncementItem;
}

export async function updateAdminAnnouncement(
  id: string,
  announcement: Partial<{
    title: string;
    content: string;
    audience: 'all' | 'pet_owners' | 'vets';
    priority: 'normal' | 'important' | 'urgent';
  }>,
): Promise<AdminAnnouncementItem> {
  const data = await authenticatedRequest(
    `/api/admin/announcements/${id}`,
    'PATCH',
    announcement,
  );
  return data.announcement as AdminAnnouncementItem;
}

export async function publishAdminAnnouncement(id: string): Promise<void> {
  await authenticatedRequest(`/api/admin/announcements/${id}/publish`, 'POST');
}

export async function unpublishAdminAnnouncement(id: string): Promise<void> {
  await authenticatedRequest(`/api/admin/announcements/${id}/unpublish`, 'POST');
}

export async function deleteAdminAnnouncement(id: string): Promise<void> {
  await authenticatedRequest(`/api/admin/announcements/${id}`, 'DELETE');
}

export async function getAdminAuditLogs(params: {
  page?: number;
  limit?: number;
  action?: string;
  targetType?: string;
  search?: string;
}): Promise<{ logs: AdminAuditLogItem[]; pagination: AdminPagination }> {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.action) searchParams.set('action', params.action);
  if (params.targetType) searchParams.set('targetType', params.targetType);
  if (params.search) searchParams.set('search', params.search);

  const query = searchParams.toString();
  const data = await authenticatedRequest(
    `/api/admin/audit-logs${query ? `?${query}` : ''}`,
  );

  return {
    logs: (data.logs || []) as AdminAuditLogItem[],
    pagination: data.pagination as AdminPagination,
  };
}

export async function getAdminCommunityStatus(): Promise<AdminCommunityStatus> {
  const data = await authenticatedRequest('/api/admin/community/status');
  return data as unknown as AdminCommunityStatus;
}