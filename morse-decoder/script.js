function $(id) {
  return document.getElementById(id);
}

function setOutput(text) {
  const outputEl = $("decodedOutput");
  outputEl.textContent = text || "";
}

function clearMessages() {
  const messageArea = $("messageArea");
  messageArea.innerHTML = "";
}

function showMessage(type, label, body) {
  const messageArea = $("messageArea");
  const container = document.createElement("div");
  container.className = `message ${type}`;

  const labelSpan = document.createElement("span");
  labelSpan.className = "label";
  labelSpan.textContent = label;

  const bodySpan = document.createElement("span");
  bodySpan.className = "body";
  bodySpan.textContent = body;

  container.appendChild(labelSpan);
  container.appendChild(bodySpan);
  messageArea.innerHTML = "";
  messageArea.appendChild(container);
}

function handleDecode() {
  const input = $("morseInput").value;
  clearMessages();

  const { decodedText, warnings } = window.MorseDecoder.decode(input);
  setOutput(decodedText);

  if (!input.trim()) {
    showMessage("info", "Hint", "Enter Morse code using '.', '-' and spaces, then click Decode.");
    return;
  }

  if (!decodedText) {
    showMessage("info", "No Output", "No letters could be decoded from the current input.");
  }

  if (warnings.length) {
    showMessage("error", "Check Input", warnings.join(" "));
  }
}

function handleClear() {
  $("morseInput").value = "";
  setOutput("");
  clearMessages();
}

function handleCopy() {
  const text = $("decodedOutput").textContent || "";
  clearMessages();

  if (!text) {
    showMessage("info", "Nothing to Copy", "Decode some Morse code first, then try again.");
    return;
  }

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard
      .writeText(text)
      .then(function () {
        showMessage("info", "Copied", "Decoded output has been copied to your clipboard.");
      })
      .catch(function () {
        showMessage("error", "Copy Failed", "Unable to access clipboard. Please try again.");
      });
  } else {
    // Fallback for older browsers – select text within the output area.
    try {
      const range = document.createRange();
      const outputEl = $("decodedOutput");
      range.selectNodeContents(outputEl);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      const successful = document.execCommand("copy");
      selection.removeAllRanges();

      if (successful) {
        showMessage("info", "Copied", "Decoded output has been copied to your clipboard.");
      } else {
        showMessage(
          "error",
          "Copy Failed",
          "Your browser does not support automatic copying. Please select and copy manually."
        );
      }
    } catch (e) {
      showMessage(
        "error",
        "Copy Failed",
        "Your browser does not support automatic copying. Please select and copy manually."
      );
    }
  }
}

document.addEventListener("DOMContentLoaded", function () {
  $("decodeButton").addEventListener("click", handleDecode);
  $("clearButton").addEventListener("click", handleClear);
  $("copyButton").addEventListener("click", handleCopy);

  $("morseInput").addEventListener("keydown", function (event) {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "enter") {
      event.preventDefault();
      handleDecode();
    }
  });
});
