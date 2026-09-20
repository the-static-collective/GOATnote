# Architecture · v0.1

## Actual implemented boundary

The current application is one dependency-free HTML file. It stores a versioned JSON object under `goatnote-v1` in browser `localStorage`. **This is a prototype storage boundary, not a guarantee of data durability.** It does not contain accounts, networking, encryption, background sync, AI, or rich text.

Shape (abridged):

```js
{
  schema: 1,
  notes: [{
    id, title, createdAt, updatedAt, draft,
    kind?, day?, // "daily" + device-local date, optional
    versions: [{ id, text, title?, createdAt }],
    margins: [{
      id, kind, text, createdAt,
      versionId,
      anchor: null | { start, end, quote }
    }]
  }]
}
```

A new note has a first source version. Editing changes the **draft**; `Save version` or attaching a margin commits a new snapshot when source body/title differs. Viewing a historical version disables editing that version but allows additional margins. Adding a margin while reading the latest draft commits the draft before binding the margin to that version. Import currently replaces the entire local notebook after confirmation. Deletion of a note or margin is destructive.

Historical titles are preserved on versions created by the current code; legacy versions without a title fall back to the note's current title. This is a presentation fallback, **not proof of the original title**.

## Anchors and the missing relation

A margin's exact original source is `(note.id, versionId, start, end, quote)`. A later draft may contain the same string. The present **Find in current draft** operation reports a possible match only when the quote occurs exactly once. An absent or repeated match does not rebind the source. Even a unique text match is not proof of identity across versions. Future anchor tracking should record typed relation and confidence with human confirmation, leaving the original anchor immutable.

## Non-goals and cautions

- A private narrative is evidence that its author wrote the account; it is not independent verification of every described external event.
- Formatting, source chronology, narrative order, and later edits must not be silently conflated.
- Never publish notebook contents, personally identifying details about children, or third-party accounts just because they were captured.
- Never overwrite a historical entry to make its content compatible with a new reading.
- A possible quote match is not an authorized migration or canonical relation.

## Hardening plan

1. Add IndexedDB, transactional writes, clear storage failure state, legacy import/migration, quota warnings, and tested backup restore.
2. Add automated tests for autosave, version immutability, source-spanned margins, import validation, and ambiguous/absent text matches.
3. Add responsive mobile navigation, keyboard focus management, and screen-reader interaction tests.
4. Add explicit export scopes, private-by-default notebooks, and separately consented AI integrations if ever requested.

Do not claim production-grade privacy or recoverability until tested.