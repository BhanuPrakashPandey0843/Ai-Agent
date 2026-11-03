export const LANGUAGE_BIBLES = [
  {
    id: 'hindi',
    title: 'Hindi',
    nativeTitle: 'हिंदी',
    script: 'Devanagari',
    coverTone: 'hindi',
    translationId: 'HINIRV',
    translationName: 'Hindi Indian Revised Version',
    copyright: 'Copyright © 2017, 2018, 2019 Bridge Connectivity Solutions',
    attribution: 'Indian Revised Version Bible (Hindi), published by Bridge Connectivity Solutions.',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    sourceUrl: 'https://ebible.org/Scriptures/details.php?id=hin2017',
  },
  {
    id: 'telugu',
    title: 'Telugu',
    nativeTitle: 'తెలుగు',
    script: 'Telugu',
    coverTone: 'telugu',
    translationId: 'tel_irv',
    translationName: 'Telugu Indian Revised Version',
    copyright: 'Copyright © 2017, 2019 Bridge Connectivity Solutions',
    attribution: 'Indian Revised Version Bible (Telugu), published by Bridge Connectivity Solutions.',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    sourceUrl: 'https://ebible.org/Scriptures/details.php?id=tel2017',
  },
];

export const getLanguageBible = (languageId) =>
  LANGUAGE_BIBLES.find((language) => language.id === languageId) || null;
