export const LANGUAGE_BIBLES = [
  {
    id: 'hindi',
    title: 'Hindi Bible',
    nativeTitle: 'हिन्दी बाइबल',
    script: 'Devanagari',
    coverTone: 'hindi',
  },
  {
    id: 'telugu',
    title: 'Telugu Bible',
    nativeTitle: 'తెలుగు బైబిల్',
    script: 'Telugu',
    coverTone: 'telugu',
  },
];

export const getLanguageBible = (languageId) =>
  LANGUAGE_BIBLES.find((language) => language.id === languageId) || null;
