/**
 * Romanization to Nepali Devanagari converter
 * Converts phonetic English input to Nepali script
 * Example: "thali" → "थाली", "chamcha" → "चम्चा"
 */

// Nepali vowels (स्वर)
const vowels = {
  'a': 'अ', 'aa': 'आ', 'i': 'इ', 'ii': 'ई', 'u': 'उ', 'uu': 'ऊ',
  'e': 'ए', 'ai': 'ऐ', 'o': 'ओ', 'au': 'औ',
  'ri': 'ऋ', 'rri': 'ॠ'
};

// Nepali consonants (व्यञ्जन)
const consonants = {
  'k': 'क', 'kh': 'ख', 'g': 'ग', 'gh': 'घ', 'ng': 'ङ',
  'ch': 'च', 'chh': 'छ', 'j': 'ज', 'jh': 'झ', 'ny': 'ञ',
  't': 'त', 'th': 'थ', 'd': 'द', 'dh': 'ध', 'n': 'न',
  'p': 'प', 'ph': 'फ', 'b': 'ब', 'bh': 'भ', 'm': 'म',
  'y': 'य', 'r': 'र', 'l': 'ल', 'w': 'व', 'v': 'व',
  'sh': 'श', 's': 'स', 'h': 'ह',
  'ksh': 'क्ष', 'tr': 'त्र', 'gy': 'ज्ञ'
};

// Vowel modifiers (मात्रा) - when vowel comes after consonant
const vowelModifiers = {
  'a': '', 'aa': 'ा', 'i': 'ि', 'ii': 'ी', 'u': 'ु', 'uu': 'ू',
  'e': 'े', 'ai': 'ै', 'o': 'ो', 'au': 'ौ',
  'ri': 'ृ', 'rri': 'ॄ'
};

// Special characters
const special = {
  '0': '०', '1': '१', '2': '२', '3': '३', '4': '४',
  '5': '५', '6': '६', '7': '७', '8': '८', '9': '९',
  '.': '।', '..': '॥', '~': '्', // halant (्)
};

// Common word mappings for shop items (bypass phonetic conversion)
const commonWords = {
  // Utensils
  'plate': 'प्लेट',
  'thali': 'थाली',
  'spoon': 'चम्चा',
  'chamcha': 'चम्चा',
  'glass': 'गिलास',
  'gilas': 'गिलास',
  'bowl': 'कटोरी',
  'katori': 'कटोरी',
  'cup': 'कप',
  'pan': 'प्यान',
  'cooker': 'कुकर',
  'kettle': 'केतली',
  'jug': 'जग',
  'bottle': 'बोतल',
  'thermos': 'थर्मस',
  'flask': 'फ्लास्क',
  
  // Materials
  'steel': 'स्टिल',
  'brass': 'पीतल',
  'pital': 'पीतल',
  'plastic': 'प्लास्टिक',
  'aluminum': 'एल्युमिनियम',
  'copper': 'तामा',
  'tama': 'तामा',
  'iron': 'फलाम',
  'phalam': 'फलाम',
  
  // Sizes
  'large': 'ठूलो',
  'thulo': 'ठूलो',
  'small': 'सानो',
  'sano': 'सानो',
  'medium': 'मध्यम',
  'madhyam': 'मध्यम',
  'big': 'ठूलो',
  'choto': 'सानो',
  
  // Religious items
  'diya': 'दियो',
  'diyo': 'दियो',
  'kalash': 'कलश',
  'agarbatti': 'अगरबत्ती',
  'dhup': 'धूप',
  'thali': 'थाली',
  
  // Kitchen
  'knife': 'चक्कु',
  'chakku': 'चक्कु',
  'fork': 'काँटा',
  'kanta': 'काँटा',
  'ladle': 'खोर',
  'khor': 'खोर',
  'tawa': 'तवा',
  'kadhai': 'कढाई',
  'kadai': 'कढाई',
  'belan': 'बेलन',
  'chakla': 'चकला',
  
  // Cleaning
  'bucket': 'बाल्टिन',
  'baltin': 'बाल्टिन',
  'mug': 'मग',
  'brush': 'ब्रस',
  'broom': 'कुचो',
  'kucho': 'कुचो',
  'jhadu': 'झाडू',
  'soap': 'साबुन',
  'sabun': 'साबुन',
  
  // Misc
  'set': 'सेट',
  'piece': 'थान',
  'than': 'थान',
  'dozen': 'दर्जन',
  'darjan': 'दर्जन',
  'pack': 'प्याक',
  'box': 'बक्स',
  'new': 'नयाँ',
  'naya': 'नयाँ',
  'purano': 'पुरानो',
  'old': 'पुरानो',
};

/**
 * Convert romanized text to Nepali Devanagari
 * @param {string} input - Romanized Nepali text (e.g., "steel thali")
 * @returns {string} - Nepali Devanagari text (e.g., "स्टिल थाली")
 */
export function romanizeToNepali(input) {
  if (!input || typeof input !== 'string') return '';
  
  const text = input.toLowerCase().trim();
  
  // Handle empty or whitespace-only input
  if (!text) return '';
  
  // Split into words
  const words = text.split(/\s+/);
  const convertedWords = [];
  
  for (let word of words) {
    // Check if word exists in common words dictionary
    if (commonWords[word]) {
      convertedWords.push(commonWords[word]);
      continue;
    }
    
    // Otherwise, do phonetic conversion
    const converted = phoneticConvert(word);
    convertedWords.push(converted);
  }
  
  return convertedWords.join(' ');
}

/**
 * Phonetic conversion for words not in dictionary
 * @param {string} word - Single word to convert
 * @returns {string} - Converted Nepali word
 */
function phoneticConvert(word) {
  let result = '';
  let i = 0;
  
  while (i < word.length) {
    let matched = false;
    
    // Try to match longer sequences first (3 chars, then 2, then 1)
    for (let len = 3; len >= 1; len--) {
      const substr = word.substring(i, i + len);
      
      // Try consonant + vowel combination
      if (len >= 2) {
        // Check consonant (2 chars) + vowel
        const cons2 = word.substring(i, i + 2);
        const cons1 = word.substring(i, i + 1);
        
        if (consonants[cons2]) {
          // Found 2-char consonant
          const nextStart = i + 2;
          const vowel = getNextVowel(word, nextStart);
          
          if (vowel) {
            result += consonants[cons2] + (vowelModifiers[vowel] || '');
            i = nextStart + vowel.length;
            matched = true;
            break;
          } else {
            result += consonants[cons2] + '्'; // halant
            i = nextStart;
            matched = true;
            break;
          }
        } else if (consonants[cons1]) {
          // Found 1-char consonant
          const nextStart = i + 1;
          const vowel = getNextVowel(word, nextStart);
          
          if (vowel) {
            result += consonants[cons1] + (vowelModifiers[vowel] || '');
            i = nextStart + vowel.length;
            matched = true;
            break;
          } else {
            result += consonants[cons1] + '्'; // halant
            i = nextStart;
            matched = true;
            break;
          }
        }
      }
      
      // Try standalone vowel
      if (vowels[substr]) {
        result += vowels[substr];
        i += len;
        matched = true;
        break;
      }
      
      // Try number
      if (special[substr]) {
        result += special[substr];
        i += len;
        matched = true;
        break;
      }
    }
    
    if (!matched) {
      // Keep original character if no match
      result += word[i];
      i++;
    }
  }
  
  return result;
}

/**
 * Get next vowel sound from position in word
 * @param {string} word - Word being converted
 * @param {number} start - Starting position
 * @returns {string|null} - Vowel sound or null
 */
function getNextVowel(word, start) {
  if (start >= word.length) return null;
  
  // Try 2-char vowels first
  for (let len = 2; len >= 1; len--) {
    const substr = word.substring(start, start + len);
    if (vowels[substr]) {
      return substr;
    }
  }
  
  return null;
}

/**
 * Get suggestions for partial input (autocomplete feature)
 * @param {string} input - Partial word
 * @returns {Array} - Array of {romanized, nepali} suggestions
 */
export function getSuggestions(input) {
  if (!input || input.length < 2) return [];
  
  const text = input.toLowerCase().trim();
  const suggestions = [];
  
  for (const [roman, nepali] of Object.entries(commonWords)) {
    if (roman.startsWith(text)) {
      suggestions.push({ romanized: roman, nepali });
    }
  }
  
  return suggestions.slice(0, 5); // Max 5 suggestions
}

/**
 * Check if text looks like romanized Nepali (uses common patterns)
 * @param {string} text - Text to check
 * @returns {boolean} - True if likely romanized Nepali
 */
export function isLikelyRomanizedNepali(text) {
  if (!text) return false;
  
  const lower = text.toLowerCase();
  
  // Check if any word matches common Nepali words
  const words = lower.split(/\s+/);
  for (const word of words) {
    if (commonWords[word]) return true;
  }
  
  // Check for common Nepali phonetic patterns
  const nepaliPatterns = [
    /[kg]h/, // kh, gh
    /chh?/, // ch, chh
    /th/, // th
    /dh/, // dh
    /ph/, // ph
    /bh/, // bh
    /ny/, // ny
    /sh/, // sh
  ];
  
  for (const pattern of nepaliPatterns) {
    if (pattern.test(lower)) return true;
  }
  
  return false;
}

export default romanizeToNepali;
