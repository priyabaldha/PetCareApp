import type { ObjectId } from 'mongodb';
import { database } from '../database.ts';

export interface GuideSection {
  heading: string;
  text: string;
}

export interface Guide {
  _id?: ObjectId;
  slug: string;
  title: string;
  category: string;
  status: 'published' | 'draft' | 'unpublished';
  sections: GuideSection[];
  authorName?: string;
  reviewedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const guidesCollection = database.collection<Guide>('guides');

const DEFAULT_GUIDES: Omit<Guide, '_id' | 'createdAt' | 'updatedAt'>[] = [
  {
    slug: 'nutrition',
    title: 'Food and everyday feeding',
    category: 'Nutrition',
    status: 'published',
    authorName: 'JEEVA Veterinary Team',
    reviewedBy: 'Veterinary Council Approved',
    sections: [
      {
        heading: 'Choose food for your pet',
        text: 'Food should suit your pet’s species and life stage. Ask your vet about an appropriate diet and portion size for your individual pet.',
      },
      {
        heading: 'Keep water available',
        text: 'Provide fresh drinking water and clean food and water bowls regularly.',
      },
      {
        heading: 'Keep useful notes',
        text: 'Write down the food name, usual portions and any feeding instructions so everyone caring for your pet follows the same routine.',
      },
    ],
  },
  {
    slug: 'health',
    title: 'Organise your pet’s health records',
    category: 'Health & Safety',
    status: 'published',
    authorName: 'JEEVA Clinical Care',
    reviewedBy: 'Veterinary Council Approved',
    sections: [
      {
        heading: 'Vaccination history',
        text: 'Record the vaccine name and date given. Enter the next due date provided by your vet rather than guessing a schedule.',
      },
      {
        heading: 'Plan visits',
        text: 'Save the clinic, appointment date, time and reason in JEEVA. Recording an appointment does not book it with the clinic.',
      },
      {
        heading: 'Prepare your questions',
        text: 'Before a visit, note changes you have noticed and questions you want to discuss. Keep prescriptions and clinic documents together.',
      },
    ],
  },
  {
    slug: 'grooming',
    title: 'Gentle grooming for dogs',
    category: 'Grooming',
    status: 'published',
    authorName: 'JEEVA Care Team',
    reviewedBy: 'Professional Groomer Reviewed',
    sections: [
      {
        heading: 'Brush regularly',
        text: 'Regular brushing helps remove loose hair and dirt and prevent tangles. Choose a brush suited to your dog’s coat.',
      },
      {
        heading: 'Keep sessions comfortable',
        text: 'Use short, gentle sessions. Ask a groomer or vet for help with difficult tangles or grooming tasks you are unsure about.',
      },
      {
        heading: 'Individual needs',
        text: 'Bathing and coat-care needs vary. Ask your vet or groomer for a routine suited to your dog rather than using one fixed schedule for every pet.',
      },
    ],
  },
  {
    slug: 'exercise',
    title: 'Exercise and play for dogs',
    category: 'Activity',
    status: 'published',
    authorName: 'JEEVA Care Team',
    reviewedBy: 'Canine Behaviour Specialist',
    sections: [
      {
        heading: 'Match activity to your dog',
        text: 'Exercise needs vary with age, breed and health. Ask your vet what level of activity suits your dog.',
      },
      {
        heading: 'Make room for play',
        text: 'Supervised play provides physical activity and mental stimulation. Choose activities your dog enjoys and can manage comfortably.',
      },
      {
        heading: 'Plan a routine',
        text: 'Agree who handles walks and play sessions. Keep the routine practical for everyone caring for your dog.',
      },
    ],
  },
  {
    slug: 'daily-care',
    title: 'Your everyday care checklist',
    category: 'General Care',
    status: 'published',
    authorName: 'JEEVA Care Team',
    reviewedBy: 'Veterinary Council Approved',
    sections: [
      {
        heading: 'Morning check',
        text: 'Check drinking water, follow the feeding routine and look at any appointments or vaccination due dates you have saved.',
      },
      {
        heading: 'Care together',
        text: 'Share feeding, cleaning and activity responsibilities with the people looking after your pet.',
      },
      {
        heading: 'Keep details current',
        text: 'Update your pet’s profile when information changes. Keep your clinic’s contact details somewhere easy to find.',
      },
    ],
  },
  {
    slug: 'adoption',
    title: 'Preparing for adoption',
    category: 'Adoption',
    status: 'published',
    authorName: 'JEEVA Welfare Team',
    reviewedBy: 'Animal Shelter Advisory',
    sections: [
      {
        heading: 'Plan the commitment',
        text: 'Consider daily care time, ongoing costs, available space and who will provide care when you are away.',
      },
      {
        heading: 'Ask the shelter',
        text: 'Ask about the animal’s history, routine, behaviour and available health records. Discuss how the animal might fit your household.',
      },
      {
        heading: 'Prepare the handover',
        text: 'Collect the shelter’s contact details, care instructions and documents. This guide does not provide live adoption listings.',
      },
    ],
  },
];

export async function createGuideIndexes(): Promise<void> {
  await guidesCollection.createIndex(
    { slug: 1 },
    { unique: true, name: 'unique_guide_slug' },
  );
  await guidesCollection.createIndex(
    { category: 1, status: 1 },
    { name: 'guide_category_status' },
  );
  await guidesCollection.createIndex(
    { status: 1, createdAt: -1 },
    { name: 'guide_status_created' },
  );
}

export async function initializeGuides(): Promise<void> {
  const count = await guidesCollection.countDocuments();
  if (count === 0) {
    const now = new Date();
    const toInsert = DEFAULT_GUIDES.map((guide) => ({
      ...guide,
      createdAt: now,
      updatedAt: now,
    }));
    await guidesCollection.insertMany(toInsert);
    console.log(`Seeded ${toInsert.length} default pet guides.`);
  }
}
