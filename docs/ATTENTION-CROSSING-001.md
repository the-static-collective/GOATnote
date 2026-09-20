# ATTENTION CROSSING — GOATnote's native human marks

A note now has a small Joyful / Useful / Curiouser / None control in its margin.
Click Whole note to identify the current note, or select at most 256 characters
in the editor and click Use selected passage. Clicking a value saves an explicit
local declaration. Merely opening a note or selecting text makes no declaration.
Each subsequent click appends a revision. None is an explicit response, not
the absence of a response; deselecting the last dimension records an unmarked
revision. Human recognition is not a claim that the text is universally valuable.

A passage mark names its exact immutable source-version ID and start/end
character offsets and preserves a bounded quote. The selected draft is saved
as a version only when the user explicitly chooses Use selected passage, using
GOATnote's existing versioning; older source versions stay unchanged. Whole-note
marks refer to the note identity. Mark history lives inside the note's
existing browser-local JSON and therefore participates in JSON backups;
it is **not** automatically sent to Workbench, Static Live, or third parties.
Browser localStorage is not encryption. Export backups regularly.

WorkBench uses a different, Workbench-owned SQLite event rail. The names and
human-declared dimensions are shared, but the local GOATnote mark is not a
Workbench receipt or evidence of synchronization. A separately reviewed
handoff is required before any cross-application ingestion.

Verification: run node tests/smoke.mjs. Browser manual smoke should cover
selecting a passage, toggling marks, revisiting a historical version, and
restoring JSON backup before merging.
