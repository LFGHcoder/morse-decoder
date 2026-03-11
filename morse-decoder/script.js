(function () {
  "use strict";

  var HISTORY_KEY = "morseDecoderHistory";
  var HISTORY_MAX = 5;

  function el(id) {
    return document.getElementById(id);
  }

  var elements = {};
  function cacheElements() {
    elements.morseInput = el("morseInput");
    elements.decodedOutput = el("decodedOutput");
    elements.messageArea = el("messageArea");
    elements.inputLabel = el("inputLabel");
    elements.outputLabel = el("outputLabel");
    elements.historyList = el("historyList");
    elements.modeDecode = el("modeDecode");
    elements.modeEncode = el("modeEncode");
    elements.decodeButton = el("decodeButton");
    elements.encodeButton = el("encodeButton");
    elements.clearButton = el("clearButton");
    elements.copyButton = el("copyButton");
    elements.playButton = el("playButton");
  }

  var isDecodeMode = true;

  function setOutput(text) {
    if (elements.decodedOutput) {
      elements.decodedOutput.textContent = text == null ? "" : String(text);
    }
  }

  function getInput() {
    return elements.morseInput ? elements.morseInput.value : "";
  }

  function getOutput() {
    return elements.decodedOutput ? (elements.decodedOutput.textContent || "").trim() : "";
  }

  function outputHasMorse(str) {
    if (!str) return false;
    return /[.\-]/.test(str);
  }

  function updatePlayButtonState() {
    var btn = elements.playButton;
    if (!btn) return;
    var out = getOutput();
    var hasMorse = outputHasMorse(out);
    btn.disabled = !hasMorse;
  }

  function clearMessages() {
    if (elements.messageArea) elements.messageArea.innerHTML = "";
  }

  function showMessage(type, label, body) {
    if (!elements.messageArea) return;
    elements.messageArea.innerHTML = "";
    var div = document.createElement("div");
    div.className = "message " + type;
    var lbl = document.createElement("span");
    lbl.className = "label";
    lbl.textContent = label;
    var b = document.createElement("span");
    b.className = "body";
    b.textContent = body;
    div.appendChild(lbl);
    div.appendChild(b);
    elements.messageArea.appendChild(div);
  }

  function updateModeUI() {
    if (elements.modeDecode) {
      elements.modeDecode.classList.toggle("active", isDecodeMode);
      elements.modeDecode.setAttribute("aria-pressed", isDecodeMode ? "true" : "false");
    }
    if (elements.modeEncode) {
      elements.modeEncode.classList.toggle("active", !isDecodeMode);
      elements.modeEncode.setAttribute("aria-pressed", !isDecodeMode ? "true" : "false");
    }
    if (elements.inputLabel) {
      elements.inputLabel.textContent = isDecodeMode ? "Morse Input" : "Text Input";
    }
    if (elements.outputLabel) {
      elements.outputLabel.textContent = isDecodeMode ? "Decoded Output" : "Morse Output";
    }
    if (elements.morseInput) {
      elements.morseInput.placeholder = isDecodeMode
        ? "Type Morse (e.g. .... . .-.. .-.. ---)"
        : "Type text (e.g. HELLO WORLD)";
    }
  }

  function loadHistory() {
    try {
      var raw = localStorage.getItem(HISTORY_KEY);
      if (raw != null && raw !== "") {
        var arr = JSON.parse(raw);
        return Array.isArray(arr) ? arr : [];
      }
    } catch (e) {}
    return [];
  }

  function saveHistory(entries) {
    if (!Array.isArray(entries)) return;
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
    } catch (e) {}
  }

  function addToHistory(inputStr, outputStr) {
    var inp = (inputStr == null ? "" : String(inputStr)).trim();
    var out = (outputStr == null ? "" : String(outputStr)).trim();
    if (inp === "" && out === "") return;

    var entries = loadHistory();
    entries = entries.slice();
    entries.unshift({ input: inp, output: out });
    if (entries.length > HISTORY_MAX) {
      entries = entries.slice(0, HISTORY_MAX);
    }
    saveHistory(entries);
    renderHistory(entries);
  }

  function renderHistory(entries) {
    var list = elements.historyList;
    if (!list) return;
    list.innerHTML = "";
    var toShow;
    if (Array.isArray(entries) && entries.length > 0) {
      toShow = entries;
    } else {
      toShow = loadHistory();
    }
    if (toShow.length === 0) {
      var emptyLi = document.createElement("li");
      emptyLi.className = "history-item history-empty";
      emptyLi.textContent = "No translations yet.";
      list.appendChild(emptyLi);
      return;
    }
    for (var i = 0; i < toShow.length; i++) {
      var item = toShow[i];
      var li = document.createElement("li");
      li.className = "history-item";
      li.appendChild(document.createTextNode(item.input != null ? String(item.input) : ""));
      var arrow = document.createElement("span");
      arrow.className = "arrow";
      arrow.textContent = " → ";
      li.appendChild(arrow);
      li.appendChild(document.createTextNode(item.output != null ? String(item.output) : ""));
      list.appendChild(li);
    }
  }

  function doDecode() {
    var api = window.MorseDecoder;
    if (!api || typeof api.decode !== "function") {
      showMessage("error", "Error", "Decoder not loaded. Refresh the page.");
      return;
    }
    var input = getInput();
    clearMessages();
    var result = api.decode(input);
    setOutput(result.decodedText);
    if (result.decodedText) {
      addToHistory(input, result.decodedText);
    }
    updatePlayButtonState();
    if (!input.trim()) {
      showMessage("info", "Hint", "Enter Morse code (dots and dashes) then click Decode.");
    } else if (result.warnings && result.warnings.length) {
      showMessage("error", "Check Input", result.warnings.join(" "));
    }
  }

  function doEncode() {
    var api = window.MorseDecoder;
    if (!api || typeof api.encode !== "function") {
      showMessage("error", "Error", "Encoder not loaded. Refresh the page.");
      return;
    }
    var input = getInput();
    clearMessages();
    var result = api.encode(input);
    setOutput(result.encodedText);
    if (result.encodedText) {
      addToHistory(input, result.encodedText);
    }
    updatePlayButtonState();
    if (!input.trim()) {
      showMessage("info", "Hint", "Enter text (A–Z, 0–9) then click Encode.");
    } else if (result.warnings && result.warnings.length) {
      showMessage("error", "Check Input", result.warnings.join(" "));
    }
  }

  function onClear() {
    if (elements.morseInput) elements.morseInput.value = "";
    setOutput("");
    clearMessages();
    updatePlayButtonState();
  }

  function onCopy() {
    var text = elements.decodedOutput ? (elements.decodedOutput.textContent || "").trim() : "";
    clearMessages();
    if (!text) {
      showMessage("info", "Nothing to copy", "Decode or encode something first.");
      return;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        function () {
          var btn = elements.copyButton;
          if (btn) {
            var orig = btn.textContent;
            btn.textContent = "✓ Copied!";
            btn.classList.add("copied");
            setTimeout(function () {
              btn.textContent = orig;
              btn.classList.remove("copied");
            }, 2000);
          }
        },
        function () {
          showMessage("error", "Copy failed", "Could not access clipboard.");
        }
      );
    } else {
      showMessage("error", "Copy failed", "Clipboard API not available.");
    }
  }

  function onInputLive() {
    if (!isDecodeMode) return;
    var api = window.MorseDecoder;
    if (!api || typeof api.decode !== "function") return;
    var input = getInput();
    var result = api.decode(input);
    setOutput(result.decodedText);
    updatePlayButtonState();
  }

  /**
   * Play Morse code string using Web Audio API.
   * Dot = 100ms beep, Dash = 300ms beep, space = letter pause (200ms), "/" or 2+ spaces = word pause (450ms).
   * Sine wave ~650 Hz, short fade in/out to avoid clicks.
   * audioContext must be created in a user gesture (e.g. click handler).
   * Returns a Promise that resolves when playback finishes.
   */
  function playMorseSound(morseString, audioCtx) {
    if (!morseString || !outputHasMorse(morseString)) {
      return Promise.resolve();
    }
    if (!audioCtx) {
      return Promise.resolve();
    }
    return new Promise(function (resolve) {

      var freq = 650;
      var dotMs = 100;
      var dashMs = 300;
      var symbolGapMs = 100;
      var letterGapMs = 200;
      var wordGapMs = 450;
      var fadeMs = 8;

      var gainNode = audioCtx.createGain();
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.connect(audioCtx.destination);

      var osc = audioCtx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      osc.connect(gainNode);

      function runSchedule() {
        var t = audioCtx.currentTime;
        osc.start(t);

        function beep(durationMs) {
          var d = durationMs / 1000;
          var f = fadeMs / 1000;
          gainNode.gain.setValueAtTime(0, t);
          gainNode.gain.linearRampToValueAtTime(0.3, t + f);
          gainNode.gain.setValueAtTime(0.3, t + d - f);
          gainNode.gain.linearRampToValueAtTime(0, t + d);
          t += d;
        }

        function silence(durationMs) {
          t += durationMs / 1000;
        }

        var i = 0;
        var spaceCount = 0;
        while (i < morseString.length) {
          var ch = morseString[i];
        if (ch === ".") {
          if (spaceCount === 1) silence(letterGapMs);
          else if (spaceCount >= 2) silence(wordGapMs);
          spaceCount = 0;
          beep(dotMs);
          silence(symbolGapMs);
        } else if (ch === "-") {
          if (spaceCount === 1) silence(letterGapMs);
          else if (spaceCount >= 2) silence(wordGapMs);
          spaceCount = 0;
          beep(dashMs);
          silence(symbolGapMs);
        } else if (ch === "/") {
          spaceCount = 0;
          silence(wordGapMs);
        } else if (ch === " " || ch === "\n") {
            spaceCount++;
          } else {
            spaceCount = 0;
          }
          i++;
        }

        var totalMs = Math.max(100, (t - audioCtx.currentTime) * 1000 + 100);
        setTimeout(function () {
          try {
            osc.stop(t + 0.01);
            osc.disconnect();
            gainNode.disconnect();
          } catch (err) {}
          resolve();
        }, totalMs);
      }

      if (audioCtx.state === "suspended") {
        audioCtx.resume().then(runSchedule).catch(function () { resolve(); });
      } else {
        runSchedule();
      }
    });
  }

  function onPlay() {
    var out = getOutput();
    if (!outputHasMorse(out)) return;
    var btn = elements.playButton;
    if (btn) btn.disabled = true;

    var AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      if (btn) updatePlayButtonState();
      return;
    }
    var audioCtx = new AudioContextClass();

    playMorseSound(out, audioCtx).then(function () {
      if (btn) updatePlayButtonState();
    });
  }

  function init() {
    cacheElements();
    isDecodeMode = true;
    updateModeUI();

    // Initial render of history from localStorage
    renderHistory(loadHistory());
    updatePlayButtonState();

    if (elements.modeDecode) {
      elements.modeDecode.addEventListener("click", function () {
        isDecodeMode = true;
        updateModeUI();
        onInputLive();
      });
    }
    if (elements.modeEncode) {
      elements.modeEncode.addEventListener("click", function () {
        isDecodeMode = false;
        updateModeUI();
      });
    }

    if (elements.decodeButton) {
      elements.decodeButton.addEventListener("click", function () {
        doDecode();
      });
    }
    if (elements.encodeButton) {
      elements.encodeButton.addEventListener("click", function () {
        doEncode();
      });
    }
    if (elements.clearButton) {
      elements.clearButton.addEventListener("click", onClear);
    }
    if (elements.copyButton) {
      elements.copyButton.addEventListener("click", onCopy);
    }
    if (elements.playButton) {
      elements.playButton.addEventListener("click", onPlay);
    }
    if (elements.morseInput) {
      elements.morseInput.addEventListener("input", onInputLive);
      elements.morseInput.addEventListener("keydown", function (e) {
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
          e.preventDefault();
          if (isDecodeMode) doDecode(); else doEncode();
        }
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
