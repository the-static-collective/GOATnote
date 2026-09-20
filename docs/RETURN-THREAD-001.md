# Return Thread 001 · Source-bound re-entry

**Status:** implemented prototype; local to the GOATnote browser notebook. This is an optional writing instrument, not an assessment of personal identity, an evidence verifier, or an automatic handoff to Workbench.

## Use

1. Open a note or a historical version. Select **+ Open a Return Thread**. If you start from the current draft, the note saves a source version first when the draft has changed.
2. Choose **Reflection**, **Question**, or **Carry** and write one contribution. No full template is required.
3. Use **Return to thread** to append a later contribution. Existing entries and the source version are not edited.
4. Use **View original source** to read the exact frozen source text in a read-only view, even if the current draft differs.
5. Search includes Return Thread text. JSON backup/import and readable single-note Markdown export include threads.

A thread is scoped to one note and one immutable `sourceVersionId`. The first contribution starts it, and subsequent entries append with separate IDs and recording timestamps. Different or incompatible readings can coexist; no entry is promoted to an external fact merely by being saved. The writer may choose to leave a thread open indefinitely.

## Storage contract

The existing `schema: 1` notebook remains compatible with pre-thread notes, which may omit `returnThreads`. New notes initialize an empty array. Each thread has `{ id, sourceVersionId, createdAt, entries: [{ id, kind, text, createdAt }] }`. Supported kinds are `reflection`, `question`, and `carry`. Import rejects malformed thread structures and missing source-version references before replacement. Source versions and original entries are not edited by thread actions.

Return Threads are **not** per-keystroke Formation Trace capture. They record only the voluntary entries the writer submits. Their timestamps indicate the recording time, not independently verified occurrence time.

## Limits and next tests

This is still `localStorage` with no account, encryption, sync, guaranteed recovery, or external permission system. A JSON backup must be restored and checked before it can be trusted. Deleting a whole note deletes its threads too. There is no standalone thread deletion, passage-level thread anchor, automated linking across versions, automatic Workbench transfer, or external recipient confirmation.

The dependency-free Node smoke test exercises source binding, append-only re-entry, question retention, search, and read-only original-source viewing. Real-browser interaction, actual storage failures, import/export roundtrips, accessibility, and durable-storage migration require separate tests.

## Workbench boundary

A later Workbench adapter may accept an **explicitly selected, reviewed export**. Do not scan notebook storage, silently publish private sources, equate a writing reflection with a verified event, or replace Workbench/project-native receipt identity with a GOATnote thread ID.
