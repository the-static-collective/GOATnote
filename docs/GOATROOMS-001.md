# GOATrooms 001 · Places without forced sequence

**Status:** experimental browser instrument on `experiment/goatrooms-001`.

GOATrooms adds a spatial composition layer above GOATnote source and GOATwalk routes.

A Room is an unordered place that can contain:

- exact addresses into saved GOATnote source
- exact passage addresses into saved GOATnote source
- doors into GOATwalk routes

A Room does not own the source it contains and does not impose a canonical reading order.

## Governing laws

**ROOM ≠ ROUTE**

**PLACEMENT ≠ CHRONOLOGY**

**ADJACENCY ≠ CAUSATION**

**ORDER ≠ SOURCE**

Putting two source addresses beside each other in a Room does not claim that the underlying events were simultaneous, causally related, or recorded in that order.

## Room structure

A Room is stored in the existing GOATnote notebook object:

```json
{
  "id": "room-id",
  "title": "Front Room",
  "createdAt": "timestamp",
  "updatedAt": "timestamp",
  "items": []
}
```

Room items are either source addresses or Walk doors.

### Source item

```json
{
  "id": "item-id",
  "kind": "source",
  "noteId": "note-id",
  "versionId": "saved-version-id",
  "noteTitleAtAdd": "Title when placed",
  "anchor": {
    "start": 10,
    "end": 42,
    "quote": "exact selected source"
  },
  "addedAt": "timestamp"
}
```

`anchor` is null for a whole-note source.

### Walk door

```json
{
  "id": "item-id",
  "kind": "walk",
  "walkId": "walk-id",
  "walkTitleAtAdd": "Title when placed",
  "addedAt": "timestamp"
}
```

A Walk door refers to the Walk by identity. The Room does not copy the Walk's stops.

## Room instrument

GOATrooms 001 provides:

- **+ To Room** from the normal GOATnote surface
- create and enter Rooms
- place the current whole source or exact selected passage
- add an existing Walk as a door
- open exact source from a source item
- enter a Walk through its door
- remove an item without deleting its source
- delete a Room without deleting notes or Walks
- export a human-readable Room Markdown rendering

A Room is intentionally shown as a field of cards rather than numbered stops.

## Nested Walks

GOATwalk now supports Walk stops whose kind is `walk`.

A parent Walk may contain a door into another Walk.

GOATwalk prevents creating a direct or indirect cycle:

- A cannot contain A.
- If B already reaches A, A cannot add B.
- Existing unrelated nested Walks remain valid.

Traversal uses an explicit parent stack.

When a reader enters a child Walk:

1. the parent Walk and current stop are held
2. the child begins at its first stop
3. finishing the child returns to the parent
4. traversal resumes at the next parent stop
5. nested returns can unwind through multiple levels

The traversal stack is runtime state only. It does not rewrite Walk structure.

## Missing targets

Source items preserve the GOATwalk unresolved states:

- missing note
- missing saved version
- anchor mismatch

Walk doors can also become:

- missing Walk

GOATrooms and GOATwalk do not silently redirect unresolved addresses.

## Backup compatibility

GOATnote remains `schema: 1`.

New optional top-level collection:

`rooms: []`

Old backups without `rooms` import as an empty Room collection.

Walk validation now accepts both legacy/source stops and nested Walk-door stops.

Room validation accepts source items and Walk-door items.

The normal JSON backup includes Rooms automatically because it serializes the notebook object.

## Exports

Room Markdown export is a readable derivative, not a restorable backup.

It may include source text from multiple notes. Review it before sharing.

A Walk door is represented as a door/reference in Room export rather than recursively flattening all of its source material.

## Architecture

**GOATnote preserves source.**

**GOATwalk preserves routes through source.**

**GOATrooms preserves places that gather source and routes.**

A source may inhabit many Rooms and many Walks at once without duplication of authority.

## Next seams

- address Return Thread entries as Room occupants
- address margins as Room occupants
- Room-to-Room doors
- optional manual spatial positions inside a Room
- named objects / loci within Rooms for deliberate memory-palace practice
- explicit DVOTE traversal receipts for entering a Walk or visiting a Room
- MEMENTO editions composed from one chosen Room without claiming the Room is chronology
