# Morse Decoder

Morse Decoder is a small, production-quality single-page web app that converts Morse code into readable text.  
It is built with **vanilla HTML, CSS, and JavaScript** and is ready to be served from any static host, including **Firebase Hosting**.

---

## Project structure

```text
morse-decoder/
  index.html    # Main single-page app
  style.css     # Layout and visual styling
  script.js     # UI wiring and event handling
  morse.js      # Core Morse decoding logic and mapping
  firebase.json # Firebase Hosting configuration
  README.md     # This documentation
```

---

## Running the app locally

You can open the app directly in a browser, or serve it from a simple static server.

### Option 1: Open directly

1. Locate the `morse-decoder` folder.
2. Open `index.html` in your browser (double-click or drag it into the browser window).

This is enough for basic usage, since there is no build step and no backend.

### Option 2: Serve via a local HTTP server

This is closer to how it will run in production and is useful for testing clipboard permissions.

Using Node.js:

```bash
npm install -g serve
serve .
```

Then open the printed local URL in your browser.

> Any static HTTP server that can serve the contents of `morse-decoder/` will work.

---

## Firebase Hosting deployment

This project is designed to be deployed as a static site on **Firebase Hosting**.

### Prerequisites

- Node.js and npm installed.
- A Google account.
- Firebase CLI installed globally:

```bash
npm install -g firebase-tools
```

### 1. Log in to Firebase

```bash
firebase login
```

Follow the browser flow to authorize the CLI.

### 2. Initialize a Firebase project (once per repo)

From the parent directory, move into `morse-decoder`:

```bash
cd morse-decoder
```

If you have **not** initialized hosting before, run:

```bash
firebase init hosting
```

When prompted:

- **Select a Firebase project**: Choose an existing project or create a new one.
- **Public directory**: `.`  
  (Use `.` so Firebase serves `index.html` and the other files from this folder.)
- **Configure as a single-page app**: Either `y` or `n` is fine for this simple SPA.
- **Overwrite files**: If Firebase offers to overwrite `firebase.json` or `index.html`, you can safely answer `n` to keep the versions in this repo.

If you have already initialized hosting and just cloned this project, you can skip `firebase init hosting` and only ensure that `.firebaserc` points at your desired Firebase project.

The included `firebase.json` is:

```json
{
  "hosting": {
    "public": ".",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "headers": [
      {
        "source": "/(.*)",
        "headers": [
          {
            "key": "X-Content-Type-Options",
            "value": "nosniff"
          }
        ]
      }
    ]
  }
}
```

### 3. Deploy

Once initialized and linked to a Firebase project, deploy to Hosting:

```bash
firebase deploy --only hosting
```

The CLI will print a **Hosting URL** where your Morse Decoder app is live (for example, `https://your-project-id.web.app`).

---

## Parsing and decoding approach

The core decoding logic lives in `morse.js` and is exposed via a small `window.MorseDecoder` namespace for the UI to consume.

- **Character mapping**  
  - A mapping is defined for **A–Z** and **0–9**: `MORSE_CHAR_TO_CODE`.  
  - A reverse map `MORSE_CODE_TO_CHAR` is generated so decoding can efficiently go from Morse tokens to characters.

- **Parsing rules** (input → tokens)
  - The raw input string is normalized:
    - `\r\n` / `\r` are converted to `\n`.
    - Each newline `\n` is treated as a **word separator** and replaced with **three spaces**.
    - The full string is trimmed to remove leading and trailing whitespace.
  - The normalized string is split by a regex that **preserves whitespace segments**: `split(/(\s+)/)`.  
    This yields an array of either:
    - Whitespace segments (one or more spaces), or
    - Non-whitespace segments (Morse tokens or invalid tokens).
  - For each whitespace segment:
    - If it has **three or more spaces**, it is treated as a **word separator**. The current word (if any) is committed and a new word starts.
    - If it has **one or two spaces**, it is treated as a **letter separator** within the current word.

- **Decoding rules** (tokens → characters)
  - Each non-whitespace segment is interpreted as a token:
    - If it matches `^[.\-]+$`, it is a **candidate Morse token**.
      - If it exists in `MORSE_CODE_TO_CHAR`, the corresponding **uppercase** character is appended.
      - If it does *not* exist in the map, it is considered an **unknown Morse sequence** and decoded as `"?"`.
    - If it does **not** match `^[.\-]+$`, it contains at least one **invalid character** and is decoded as `"?"`.
  - Words are built from sequences of decoded letters and then joined with a single space, preserving word boundaries.

- **Output rules**
  - All decoded characters are uppercase (A–Z, 0–9, or `?`).
  - Word boundaries are preserved based on the **three-space / newline** rules.
  - The decoder returns an object:  
    - `decodedText`: the final decoded string.  
    - `warnings`: an array of user-facing validation messages.

---

## Edge cases handled

- **Leading/trailing whitespace**  
  - Ignored during normalization. They do not produce extra words or letters.

- **Multiple spaces between tokens**
  - Single or double spaces are treated as **letter separators**.
  - Three or more spaces are treated as **word separators**.
  - Long runs of spaces between words still produce exactly one space in the final decoded output.

- **Newlines**
  - Newline characters are treated as word separators by converting them to three spaces internally.
  - This means each newline behaves like a gap between words.

- **Unknown Morse tokens**
  - Any valid-looking Morse token (only `"."` and `"-"`) that does not appear in the mapping is decoded as `"?"`.
  - A warning message is added: *"Some Morse sequences were not recognized and were decoded as '?'."*

- **Invalid characters**
  - Any character other than `"."`, `"-"`, space, or newline within a non-whitespace segment marks that segment as invalid.
  - The entire segment is decoded as `"?"`.
  - A warning message is added:  
    *"Input contains invalid characters. Only '.', '-', spaces, and new lines are allowed. Tokens with invalid characters were decoded as '?'."*

- **Empty or whitespace-only input**
  - Produces an empty decoded string with no warnings.
  - The UI shows a gentle hint explaining how to enter Morse code.

---

## UI behavior overview

- **Morse Input** (`textarea`)
  - Users type or paste Morse code using `"."` and `"-"`, with:
    - Single spaces between letters.
    - Three spaces or new lines between words.

- **Decoded Output** (`pre`)
  - Displays the decoded uppercase text.
  - Updated whenever the user clicks **Decode**.

- **Buttons**
  - **Decode**: Runs the decoder and updates the output and message area.
  - **Clear**: Clears the input, output, and any messages.
  - **Copy Output**: Copies the decoded output to the clipboard using the modern Clipboard API when available, with a fallback using `document.execCommand("copy")`.

- **Validation / message area**
  - Shows hints, warnings about invalid characters, and information about copy success or failure.
  - Messages are concise and user-friendly, guiding users to correct their input.

---

## Notes

- There is **no build process**; the app is pure static assets.
- You can integrate this Morse decoder into a larger project by reusing the logic exported from `morse.js` (`window.MorseDecoder.decode`).
