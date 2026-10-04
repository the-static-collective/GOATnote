# GOATwalk 001 · Multiple orders through stable source

**Status:** experimental browser instrument on `experiment/goatwalk-001`.

GOATwalk turns notes and exact passages into reusable stops that can be arranged into many different routes without moving, copying, or rewriting the source.

The core laws are:

**ORDER ≠ SOURCE**

**A ROUTE THROUGH A NOTE IS NOT THE NOTE**

A note may appear in many Walks. The same saved source version may appear multiple times in one Walk. Different Walks may overlap heavily without becoming duplicates.

## First instrument

GOATwalk 001 implements:

1. select a passage, or leave nothing selected for the whole note
2. choose **+ To Walk** or open the Walk editor and choose **+ CURRENT SOURCE**
3. add the addressed source to an existing Walk or create a new one
4. reorder stops with explicit up/down controls
5. write optional transition text between stops
6. choose **WALK IT** to traverse the arranged route
7. open the exact frozen source from any resolvable stop
8. export a human-readable Markdown rendering of a Walk

Walk modes currently act as reader-owned labels:

- Free Walk
- Story
- Plan
- Memory Room
- Playlist

Mode does not change source authority.

## Stop address

A stop stores an address, not a copy of the source:

```json
{
  "id": "stop-id",
  "noteId": "note-id",
  "versionId": "saved-version-id",
  "noteTitleAtAdd": "Title when added",
  "anchor": {
    "start": 120,
    "end": 188,
    "quote": "exact selected source"
  },
  "transition": "route-local words after this stop",
  "addedAt": "timestamp"
}
```

`anchor` is null for a whole-note stop.

The quoted passage and offsets are locators against one immutable saved source version. They are not a request to search newer drafts for similar text.

## Source resolution

A stop has four possible resolution states:

- **exact** — source note and saved version exist, and any passage anchor matches exactly
- **missing-note** — the source note was deleted
- **missing-version** — the referenced version is unavailable
- **anchor-mismatch** — the saved version exists but the stored offsets no longer contain the exact quoted passage

GOATwalk does not silently rebind an unresolved stop.

Deleting a source note does not silently remove its appearances from Walks. The route retains the unresolved address so missing source remains visible.

## Route-local transitions

Transition text belongs to the Walk stop, not to the note or source version.

This permits the same source to participate in different compositions:

- memoir transition in one Walk
- task dependency in a Plan
- spatial cue in a Memory Room
- liner-note bridge in a Playlist

Editing a transition does not edit the source.

## Storage and backup

GOATnote remains `schema: 1`.

A top-level optional `walks` array is added. Existing backups without `walks` load with an empty Walk library.

The normal GOATnote JSON backup includes Walk addresses and transitions because it serializes the notebook object. Walks do not duplicate source text in the backup.

Markdown Walk export is a readable derivative: it renders the resolved source text in route order and is **not** a restorable notebook backup.

## Branch donors

GOATwalk 001 is built cleanly from current `main`, but several experimental branches supplied useful laws and mechanisms.

### `feature/return-thread-001-20260920`

This work became current main and established source-bound re-entry: later contributions can return to a frozen source without editing it.

### `feat/attention-crossing-goatnote-001`

Donated the exact passage-address grammar: immutable source-version ID + start/end offsets + bounded quote, created only by an explicit human selection.

### `feat/attention-crossing-goatnote-return-002`

Reinforced explicit handoff: selecting and exporting one addressed target is different from scanning or synchronizing the notebook.

### `experiment/composable-occurrence-return-001`

Reinforced relation-as-object rather than rewrite: a later `connect`, `carry`, `correct`, or `reconsider` relation does not alter historical source.

GOATwalk takes those ideas one level outward: **the order itself becomes a separate compositional object.**

## Privacy and limits

GOATwalk inherits GOATnote's current localStorage limitations. It is not encrypted, synced, or a durable archive.

Walks can reveal sensitive relationships among otherwise separate notes. A Walk export may disclose source text from multiple notes. Review exports before sharing them.

Walk order is editorial order. It is not automatically event chronology, recording chronology, causal order, or proof that adjacent sources are related outside the route.

## Next seams

- nested Walk stops: a Walk may address another Walk
- named Rooms containing multiple stops
- multiple alternate routes through one Memory Room
- Return Thread entries as addressable stops
- margins as addressable stops
- explicit DVOTE crossing: turn a Walk into a traversable campaign without transferring source authority
- MEMENTO receipts from walking a route
- Composer recommendations for possible neighboring stops, always subject to **RECOMMENDATION ≠ SELECTION**
