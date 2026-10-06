export interface PetGuide {
  id: string;
  title: string;
  sections: {
    heading: string;
    text: string;
  }[];
}

export const petGuides: PetGuide[] = [
  {
    id: 'nutrition',
    title: 'Food and everyday feeding',
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
    id: 'health',
    title: 'Organise your pet’s health records',
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
    id: 'grooming',
    title: 'Gentle grooming for dogs',
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
    id: 'exercise',
    title: 'Exercise and play for dogs',
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
    id: 'daily-care',
    title: 'Your everyday care checklist',
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
    id: 'adoption',
    title: 'Preparing for adoption',
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

export function findPetGuide(id: string) {
  return petGuides.find((guide) => guide.id === id) ?? null;
}

export const careTips = [
  'Keep your clinic’s contact details easy to find.',
  'Update vaccination dates after each visit.',
  'Agree on a care routine with everyone looking after your pet.',
  'Keep prescriptions and clinic documents together.',
];