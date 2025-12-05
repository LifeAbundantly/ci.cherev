let tableInput;
let tableSend;
let tablePanel;
let panelMessages;
let panelClose;

let panelOpenedOnce = false;

function openPanel() {
  if (!tablePanel) return;
  tablePanel.classList.add("open");
  panelOpenedOnce = true;
}

function closePanel() {
  if (!tablePanel) return;
  tablePanel.classList.remove("open");
}

function appendMessage(role, text) {
  if (!panelMessages) return;

  const row = document.createElement("div");
  row.className = "message-row";

  const label = document.createElement("div");
  label.className = "message-label";
  label.textContent = role === "you" ? "You" : "Table";

  const bubble = document.createElement("div");
  bubble.className = "message-bubble" + (role === "table" ? " table" : "");
  bubble.textContent = text;

  row.appendChild(label);
  row.appendChild(bubble);
  panelMessages.appendChild(row);

  panelMessages.scrollTop = panelMessages.scrollHeight;
}

function handleSend() {
  if (!tableInput) return;

  const value = tableInput.value.trim();
  if (!value) return;

  appendMessage("you", value);
  tableInput.value = "";

  if (!panelOpenedOnce) {
    openPanel();
  }

  setTimeout(() => {
    const gentleReply =
      "The Table has received your vision. This space will help you build it, one step at a time.";
    appendMessage("table", gentleReply);
  }, 500);
}

document.addEventListener("DOMContentLoaded", () => {
  tableInput = document.getElementById("tableInput");
  tableSend = document.getElementById("tableSend");
  tablePanel = document.getElementById("tablePanel");
  panelMessages = document.getElementById("panelMessages");
  panelClose = document.getElementById("panelClose");

  if (tableSend) {
    tableSend.addEventListener("click", handleSend);
  }

  if (tableInput) {
    tableInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        handleSend();
      }
    });
  }

  if (panelClose) {
    panelClose.addEventListener("click", closePanel);
  }
});
