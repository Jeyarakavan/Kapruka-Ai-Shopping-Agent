import en from './en.js';
import si from './si.js';
import ta from './ta.js';
import tanglish from './tanglish.js';

const dictionaries = { en, si, ta, tanglish };

/**
 * Detect language based on message text
 */
export function detectLanguage(text) {
  if (!text) return 'en';

  const cleanText = text.toLowerCase().trim();

  // Simple script character matching
  const hasSinhala = /[\u0d80-\u0dff]/.test(text);
  const hasTamil = /[\u0b80-\u0bff]/.test(text);

  if (hasSinhala) return 'si';
  if (hasTamil) return 'ta';

  // Tanglish/Singlish keyword heuristics
  const tanglishKeywords = [
    'karanna', 'daanna', 'neda', 'mokakda', 'oyage', 'oyaage', 'ekak', 'thiyenawa', 'puluwan', 'naha', 'nehe',
    'koheda', 'kiyada', 'wenna', 'kalin', 'one', 'kannako', 'dhenna', 'yenna', 'pannunga', 'saapuda'
  ];

  if (tanglishKeywords.some(keyword => cleanText.includes(keyword))) {
    return 'tanglish';
  }

  return 'en';
}

/**
 * Get translations dictionary for detected language
 */
export function getTranslations(lang = 'en') {
  return dictionaries[lang] || dictionaries.en;
}

/**
 * T(key, lang) helper
 */
export function translate(key, lang = 'en') {
  const dict = getTranslations(lang);
  return dict[key] || en[key] || key;
}
