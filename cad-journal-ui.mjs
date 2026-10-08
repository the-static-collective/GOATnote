/* GOATnote-owned opt-in CAD journal intake.
 * Import adds one source note: it does not overwrite the notebook and
 * cannot by itself verify reLATTE signatures. Selection is explicit.
 */
import { mergeCadJournal, verifyCadJournalHandoff } from "./cad-journal.mjs";

const button = document.getElementById("importCadJournal");
const picker = document.getElementById("cadJournalFile");
const status = document.getElementById("status");
const KEY = "goatnote-v1";

button.addEventListener("click", () => picker.click());
picker.addEventListener("change", async () => {
  const file = picker.files?.[0];
  picker.value = "";
  if (!file) return;
  try {
    if (file.size > 250_000) throw Error("CAD_HANDOFF_FILE_TOO_LARGE");
    const handoff = JSON.parse(await file.text());
    verifyCadJournalHandoff(handoff);
    const record = localStorage.getItem(KEY);
    const db = record ? JSON.parse(record) :
      { schema:1, notes:[], walks:[], rooms:[], edges:[] };
    // The human explicitly selects one validated handoff, not a bulk
    // replacement backup. A decline causes no change to localStorage.
    const consent = confirm(
      "Add this CAD decision journal as a new GOATnote source version with " +
      "witness/question margins and a Return Thread? Existing notes are kept. " +
      "GOATnote has NOT independently verified the claimed reLATTE signatures."
    );
    if (!consent) return;
    const merged = mergeCadJournal(db, handoff, true);
    if (merged.added) {
      localStorage.setItem(KEY, JSON.stringify(merged.notebook));
      // Restart only the browser UI. No network transport or OS action.
      window.location.reload();
    } else {
      status.textContent = "That CAD source is already in GOATnote.";
    }
  } catch (error) {
    status.textContent = "CAD journal import refused.";
    alert("GOATnote refused this CAD handoff: " +
          String(error?.message || error).slice(0,120));
  }
});
