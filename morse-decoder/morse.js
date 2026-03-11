// Mapping: character (A–Z, 0–9) → Morse code. Used by encodeText().
var MORSE_CHAR_TO_CODE = {
  A: ".-", B: "-...", C: "-.-.", D: "-..", E: ".", F: "..-.", G: "--.", H: "....",
  I: "..", J: ".---", K: "-.-", L: ".-..", M: "--", N: "-.", O: "---", P: ".--.",
  Q: "--.-", R: ".-.", S: "...", T: "-", U: "..-", V: "...-", W: ".--", X: "-..-",
  Y: "-.--", Z: "--..",
  0: "-----", 1: ".----", 2: "..---", 3: "...--", 4: "....-", 5: ".....",
  6: "-....", 7: "--...", 8: "---..", 9: "----."
};

// Reverse mapping: Morse token - character. Used by decodeMorse().
var MORSE_CODE_TO_CHAR = {};
var charKey;
for (charKey in MORSE_CHAR_TO_CODE) {
  if (MORSE_CHAR_TO_CODE.hasOwnProperty(charKey)) {
    MORSE_CODE_TO_CHAR[MORSE_CHAR_TO_CODE[charKey]] = charKey;
  }
}


//Convert normal text to Morse code.
 
function encodeText(rawInput) {
  var result = { encodedText: "", warnings: [] };
  if (typeof rawInput !== "string") {
    result.warnings.push("Input must be a string.");
    return result;
  }
  var trimmed = rawInput.trim();
  if (!trimmed) return result;

  var upper = trimmed.toUpperCase();
  var words = upper.split(/\s+/);
  var encodedWords = [];
  var hasUnknown = false;
  var w, i, c, code;

  for (w = 0; w < words.length; w++) {
    var word = words[w];
    var parts = [];
    for (i = 0; i < word.length; i++) {
      c = word[i];
      code = MORSE_CHAR_TO_CODE[c];
      if (code !== undefined) {
        parts.push(code);
      } else {
        parts.push("?");
        hasUnknown = true;
      }
    }
    encodedWords.push(parts.join(" "));
  }
  result.encodedText = encodedWords.join("   ");
  if (hasUnknown) {
    result.warnings.push('Some characters were not in A–Z, 0–9 and were encoded as "?".');
  }
  return result;
}

/**
 * Decode Morse code to text. Single space = letter, 3+ spaces = word separator.
 * @param {string} rawInput
 * @returns {{ decodedText: string, warnings: string[] }}
 */
function decodeMorse(rawInput) {
  var result = { decodedText: "", warnings: [] };
  if (typeof rawInput !== "string") {
    result.warnings.push("Input must be a string.");
    return result;
  }
  if (!rawInput.trim()) return result;

  var normalized = rawInput.replace(/\r\n?/g, "\n").replace(/\n/g, "   ").trim();
  if (!normalized) return result;

  var segments = normalized.split(/(\s+)/);
  var words = [];
  var currentWord = [];
  var hasInvalid = false;
  var hasUnknown = false;
  var part, mapped, i;

  for (i = 0; i < segments.length; i++) {
    part = segments[i];
    if (!part) continue;
    if (/^\s+$/.test(part)) {
      if (part.length >= 3 && currentWord.length) {
        words.push(currentWord.join(""));
        currentWord = [];
      }
      continue;
    }
    if (!/^[.\-]+$/.test(part)) {
      hasInvalid = true;
      currentWord.push("?");
      continue;
    }
    mapped = MORSE_CODE_TO_CHAR[part];
    if (mapped === undefined) {
      hasUnknown = true;
      currentWord.push("?");
    } else {
      currentWord.push(mapped);
    }
  }
  if (currentWord.length) words.push(currentWord.join(""));
  result.decodedText = words.join(" ");
  if (hasInvalid) result.warnings.push('Invalid characters in Morse; those tokens shown as "?".');
  if (hasUnknown) result.warnings.push('Unknown Morse sequences shown as "?".');
  return result;
}

// Expose for UI – must exist before script.js runs
window.MorseDecoder = {
  decode: decodeMorse,
  encode: encodeText,
  MORSE_CODE_TO_CHAR: MORSE_CODE_TO_CHAR,
  MORSE_CHAR_TO_CODE: MORSE_CHAR_TO_CODE
};
