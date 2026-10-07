import { petGuides, type PetGuide } from '../data/petGuides';
import { API_BASE_URL } from './auth';

export interface GuideArticle {
  id: string;
  slug: string;
  title: string;
  category: string;
  sections: Array<{ heading: string; text: string }>;
  authorName?: string;
  reviewedBy?: string;
  updatedAt?: string;
}

export async function fetchPublicGuides(): Promise<GuideArticle[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/guides`);
    if (!response.ok) throw new Error('Failed to load online guides');
    const data = await response.json();
    if (data.success && Array.isArray(data.guides) && data.guides.length > 0) {
      return data.guides as GuideArticle[];
    }
  } catch {
    // Offline or network error: return safe offline fallback
  }

  return petGuides.map((g: PetGuide) => ({
    id: g.id,
    slug: g.id,
    title: g.title,
    category: 'General Care',
    sections: g.sections,
  }));
}
