import { API_BASE_URL, authenticatedRequest } from './auth';

export interface PublicAnnouncement {
  id: string;
  title: string;
  content: string;
  audience: string;
  priority: 'normal' | 'important' | 'urgent';
  publishedAt: string | null;
  createdAt: string;
}

export async function fetchPublicAnnouncements(): Promise<
  PublicAnnouncement[]
> {
  try {
    const data = await authenticatedRequest('/api/announcements');
    if (data.success && Array.isArray(data.announcements)) {
      return data.announcements as PublicAnnouncement[];
    }
  } catch {
    try {
      const response = await fetch(`${API_BASE_URL}/api/announcements`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.announcements)) {
          return data.announcements as PublicAnnouncement[];
        }
      }
    } catch {
      // offline / server unavailable
    }
  }
  return [];
}
