// Mapping of characters to Morse code for A–Z and 0–9.
// The decoder uses the reverse mapping (Morse → character).
const MORSE_CHAR_TO_CODE = {
  A: ".-",
  B: "-...",
  C: "-.-.",
  D: "-..",
  E: ".",
  F: "..-.",
  G: "--.",
  H: "....",
  I: "..",
  J: ".---",
  K: "-.-",
  L: ".-..",
  M: "--",
  N: "-.",
  O: "---",
  P: ".--.",
  Q: "--.-",
  R: ".-.",
  S: "...",
  T: "-",
  U: "..-",
  V: "...-",
  W: ".--",
  X: "-..-",
  Y: "-.--",
  Z: "--..",
  0: "-----",
  1: ".----",
  2: "..---",
  3: "...--",
  4: "....-",
  5: ".....",
  6: "-....",
  7: "--...",
  8: "---..",
  9: "----."
};

// Reverse mapping: Morse code token (e.g. ".-") → character (e.g. "A").
const MORSE_CODE_TO_CHAR = Object.keys(MORSE_CHAR_TO_CODE).reduce((acc, char) => {
  acc[MORSE_CHAR_TO_CODE[char]] = char;
  return acc;
}, {});

/**
 * Decode a Morse code string into human-readable text.
 *
 * Parsing rules:
 * - Single space separates letters.
 * - Three or more spaces separate words.
 * - New lines are treated as word separators (equivalent to three spaces).
 * - Leading and trailing whitespace are ignored.
 *
 * Decoding rules:
 * - Valid characters inside tokens: "." and "-".
 * - Unknown Morse tokens become "?".
 * - Tokens containing any invalid character cause a warning and decode to "?".
 *
 * @param {string} rawInput
 * @returns {{ decodedText: string, warnings: string[] }}
 */
function decodeMorse(rawInput) {
  const result = {
    decodedText: "",
    warnings: []
  };

  if (typeof rawInput !== "string") {
    result.warnings.push("Input must be a string.");
    return result;
  }

  if (!rawInput.trim()) {
    // Only whitespace – treated as empty input with no warnings.
    return result;
  }

  // Normalize line endings and treat each newline as a word boundary (three spaces).
  let normalized = rawInput.replace(/\r\n?/g, "\n").replace(/\n/g, "   ");
  normalized = normalized.trim();

  if (!normalized) {
    return result;
  }

  const segments = normalized.split(/(\s+)/); // split but keep space runs
  const words = [];
  let currentWord = [];
  let hasInvalidCharacters = false;
  let hasUnknownTokens = false;

  for (let i = 0; i < segments.length; i += 1) {
    const part = segments[i];
    if (!part) continue;

    if (/^\s+$/.test(part)) {
      // Space run; decide whether it is a letter or word separator.
      const spaceCount = part.length;
      if (spaceCount >= 3) {
        if (currentWord.length) {
          words.push(currentWord.join(""));
          currentWord = [];
        }
      }
      // One or two spaces are letter separators and do not need explicit handling.
      continue;
    }

    // Non-whitespace segment – should be a Morse token if valid.
    const token = part;

    if (!/^[.\-]+$/.test(token)) {
      hasInvalidCharacters = true;
      currentWord.push("?");
      continue;
    }

    const mapped = MORSE_CODE_TO_CHAR[token];
    if (!mapped) {
      hasUnknownTokens = true;
      currentWord.push("?");
    } else {
      currentWord.push(mapped);
    }
  }

  if (currentWord.length) {
    words.push(currentWord.join(""));
  }

  result.decodedText = words.join(" ");

  if (hasInvalidCharacters) {
    result.warnings.push(
      'Input contains invalid characters. Only ".", "-", spaces, and new lines are allowed. Tokens with invalid characters were decoded as "?".'
    );
  }

  if (hasUnknownTokens) {
    result.warnings.push('Some Morse sequences were not recognized and were decoded as "?".');
  }

  return result;
}

// Expose a small namespace on window for the UI layer.
window.MorseDecoder = {
  decode: decodeMorse,
  MORSE_CODE_TO_CHAR: MORSE_CODE_TO_CHAR,
  MORSE_CHAR_TO_CODE: MORSE_CHAR_TO_CODE
};
