export const AGE_GROUPS = [
  {
    id: '2-4',
    label: '2-4 years',
    subtitle: 'Simple words, cozy adventures',
  },
  {
    id: '5-7',
    label: '5-7 years',
    subtitle: 'Playful journeys with light problem-solving',
  },
  {
    id: '8-10',
    label: '8-10 years',
    subtitle: 'Bigger quests, more imagination',
  },
];

export const CHARACTER_CATEGORIES = [
  {
    id: 'animals',
    label: 'Animals',
    emoji: '🐾',
    byAge: {
      '2-4': ['Bunny 🐰', 'Puppy 🐶', 'Kitten 🐱', 'Turtle 🐢', 'Elephant 🐘'],
      '5-7': ['Lion 🦁', 'Monkey 🐒', 'Fox 🦊', 'Bear 🐻', 'Deer 🦌'],
      '8-10': ['Eagle 🦅', 'Wolf 🐺', 'Dolphin 🐬', 'Panther 🐆', 'Owl 🦉'],
    },
  },
  {
    id: 'space',
    label: 'Space & Sci-Fi',
    emoji: '🚀',
    byAge: {
      '2-4': ['Friendly Alien 👽', 'Little Rocket 🚀'],
      '5-7': ['Astronaut 👨‍🚀', 'Robot 🤖', 'Space Dog 🐶🚀'],
      '8-10': ['Space Explorer', 'AI Robot', 'Galactic Captain'],
    },
  },
  {
    id: 'vehicles',
    label: 'Vehicles & Construction',
    emoji: '🚧',
    byAge: {
      '2-4': ['Dump Truck 🚚', 'Fire Truck 🚒', 'Police Car 🚓'],
      '5-7': ['Bulldozer 🚜', 'Crane 🏗️', 'Garbage Truck'],
      '8-10': ['Rescue Helicopter 🚁', 'Race Car 🏎️', 'Engineering Robot'],
    },
  },
  {
    id: 'fantasy',
    label: 'Fantasy & Fictional',
    emoji: '🧚',
    byAge: {
      '2-4': ['Fairy 🧚', 'Princess 👸'],
      '5-7': ['Wizard 🧙', 'Dragon (friendly) 🐉', 'Superhero 🦸'],
      '8-10': ['Time Traveler', 'Shadow Ninja', 'Elemental Mage '],
    },
  },
  {
    id: 'objects',
    label: 'Everyday Objects',
    emoji: '🏠',
    byAge: {
      '2-4': ['Talking Teddy 🧸', 'Magic Ball '],
      '5-7': ['Talking Pencil ✏️', 'Smart Clock ⏰', 'Magic Backpack 🎒'],
      '8-10': ['AI Book ', 'Invisible Cloak', 'Time Machine'],
    },
  },
];

export const MORAL_OPTIONS_BY_AGE = {
  '2-4': ['Sharing is good', 'Be kind', 'Help others', 'Say thank you', 'Clean up toys'],
  '5-7': [
    'Friendship matters',
    'Honesty is important',
    "Don't give up",
    'Be brave',
    'Listen to parents',
  ],
  '8-10': [
    'Teamwork wins',
    'Respect differences',
    'Solve problems calmly',
    'Take responsibility',
    'Believe in yourself',
  ],
};

export const THEME_CATEGORIES = [
  {
    id: 'adventure',
    label: 'Adventure',
    options: ['Treasure hunt', 'Space mission', 'Jungle journey'],
  },
  {
    id: 'emotional',
    label: 'Emotional',
    options: ['Overcoming fear', 'Making friends', 'Dealing with mistakes'],
  },
  {
    id: 'educational',
    label: 'Educational',
    options: ['Numbers', 'Nature', 'Science basics'],
  },
];

export const TONE_OPTIONS = [
  { id: 'bedtime', label: 'Bedtime', emoji: '😴' },
  { id: 'fun', label: 'Fun', emoji: '😄' },
  { id: 'adventure', label: 'Adventure', emoji: '⚡' },
];

export function getThemeCategoryById(categoryId) {
  return THEME_CATEGORIES.find((category) => category.id === categoryId) || null;
}

export function getToneById(toneId) {
  return TONE_OPTIONS.find((tone) => tone.id === toneId) || null;
}

export function getCharacterCategoryById(categoryId) {
  return CHARACTER_CATEGORIES.find((category) => category.id === categoryId) || null;
}

export function getCharacterEntriesForAge(ageId) {
  return CHARACTER_CATEGORIES.flatMap((category) =>
    (category.byAge[ageId] || []).map((character) => ({
      categoryId: category.id,
      categoryLabel: category.label,
      character,
    }))
  );
}
