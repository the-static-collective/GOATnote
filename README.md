# GOATnote

**The writing stays. The margins grow.**

GOATnote is an offline-first, source-preserving notebook for free writing, notes in the margins, and **Identity Carry**: using writing to maintain, develop, protect, and carry identity without fixing a person into any one account of themselves.

## Run it

Open [index.html](index.html) in a modern browser. No build, account, API key, or AI service is required. This is an early browser prototype, **not yet a secure or production-grade archive**.

- **+ Note** opens a blank page; **Today** reopens or creates one daily page for your device's local date.
- **+ Identity Carry** creates an optional guided page. Ordinary writing does not need to follow its prompts.
- Select text in the editor and choose **+ Margin** to attach witness, question, interpretation, correction, carry, or connection beside an exact saved source version. No selection creates a whole-note margin.
- **Save version** records a read-only snapshot. You can add margins to past versions without editing their text.
- A margin's **View source** shows its original snapshot. **Find in current draft** highlights a *possible* unique exact-text match; it does not rebind or claim the two occurrences are the same.
- Search matches titles, current drafts, margin text, and quoted anchors.
- Export a **JSON backup** and test importing a copy before relying on the notebook. Import **replaces** the current notebook after confirmation.

Keyboard: Ctrl/Cmd+S saves a version; Ctrl/Cmd+Alt+M opens a margin; Ctrl/Cmd+Alt+N creates a note; Ctrl/Cmd+Alt+D opens Today.

## Data and safety

The current version stores plain-text content in this browser's `localStorage`. There is no account, cloud sync, server, encryption, or automatic off-device backup. Browser clearing, private browsing, device failure, storage exhaustion, or opening the app under another origin may make notes unavailable. **Keep regular exported backups somewhere you control. Do not treat this build as secure storage for sensitive testimony or private identity records.** Do not put private notes into the public repository.

The app makes no inference about a person's identity and contains no AI reader. Any future AI integration must be opt-in, explicitly scoped by note/passage, and must never silently promote an interpretation into source or authority.

## Source contract

1. A saved source version is immutable through the editor.
2. Every margin points to the version it was made against, with an optional exact passage quote and character offsets.
3. A margin is a later, attributable contribution, **not** an edit to or proof of the source.
4. Possible text matches across versions are suggestions only; absent or ambiguous matches must remain unresolved.
5. Event time, recording time, editorial order, and known-at time must not be silently equated.
6. The writer controls disclosure; preserving a private source does not authorize publication.

See [Identity Carry](docs/IDENTITY-CARRY.md) for the writing practice and [Architecture](docs/ARCHITECTURE.md) for data model and known limitations.

## Direction

Next engineering priority is durable, recoverable local storage (IndexedDB + migration and tested restore), mobile navigation and accessibility, anchored-margin replay with explicit ambiguity, privacy/export controls, and automated browser tests. See issues for executable slices.