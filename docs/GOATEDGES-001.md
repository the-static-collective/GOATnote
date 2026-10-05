# STAIRCASE 001 / GOATedges · Relations have formation history

**Status:** experimental browser instrument on `experiment/goatedges-001`.

GOATedges makes a relation a first-class addressable object.

A source can exist before a relation to another source is noticed. A relation can be noticed before it is evidenced. Evidence can later admit, weaken, refuse, or leave that relation unresolved.

The edge therefore has a history that is distinct from the histories of its endpoints.

## Governing laws

**EDGE BIRTHDAY ≠ ENDPOINT BIRTHDAY**

**DISCOVERY TRACE ≠ EVIDENCE PATH**

**POSSIBLE RELATION ≠ PERCEIVED RELATION ≠ ADMITTED RELATION ≠ AUTHORITATIVE RELATION**

**VISIBLE EDGE ≠ TRAVERSABLE EDGE**

**RELATION ≠ AUTHORITY**

## Edge record

An edge preserves:

- stable edge identity
- exact FROM source address
- exact TO source address
- relation type
- first-perceived timestamp
- discovery trace
- evidence path
- confidence
- current status
- created / updated timestamps
- append-only revision history

Endpoints use the same source-address grammar as GOATwalk / GOATrooms:

- note ID
- immutable saved-version ID
- note title at binding time
- optional exact passage quote + start/end offsets

The edge never owns or rewrites endpoint source.

## Status

STAIRCASE 001 supports:

- **perceived** — the relation was noticed
- **proposed** — it has been made an explicit candidate
- **admitted** — currently accepted for traversal
- **weakened** — still preserved, but confidence or support has decreased
- **refused** — explicitly not admitted
- **unresolved** — retained without present disposition

Changing status does not erase prior state.

Each meaningful revision appends a history record with:

- revision ID
- timestamp
- resulting status
- resulting confidence
- optional revision note

The current record may change. Formation history remains.

## Discovery trace and evidence path

The edge requires both fields.

**Discovery trace** answers:

> What caused this relation to be noticed?

**Evidence path** answers:

> What source, receipt, experiment, or reasoning currently supports admission?

For a merely perceived relation, explicit `none yet` is preferable to silently equating discovery with evidence.

## Traversal

Only an edge whose current status is **admitted** and whose TO endpoint still resolves exactly is traversable.

Any edge may still be inspected.

This is intentional:

```text
edge exists
!=
edge is admitted
!=
edge is traversable
```

A refused or weakened edge is not deleted merely because it is not traversable.

## GOATrooms

Any edge may inhabit a Room as a **STAIRCASE** card.

A Room can therefore contain:

- source addresses
- Walk doors
- relation objects

Room placement does not grant edge authority.

An admitted edge exposes **CROSS TO TARGET**.

Other statuses remain visible and inspectable but non-traversable.

If an edge is deleted, Room references remain as unresolved edge addresses.

## GOATwalk

A Walk may include an edge as a stop.

An edge stop can display:

- relation type
- status
- FROM → TO labels
- first-perceived time
- confidence
- discovery trace / evidence path in export

The edge can be inspected at any status.

Only an admitted edge exposes **CROSS TO TARGET**.

A Walk's editorial inclusion of an edge does not itself admit the edge.

## Missing endpoint behavior

Each endpoint is resolved against the immutable source address it was bound to.

Possible endpoint failures:

- missing note
- missing saved version
- exact passage mismatch

GOATedges does not search for similar source and silently rebind.

An edge may remain present even when an endpoint becomes unresolved.

## Deletion

Deleting an edge does not delete either endpoint.

Existing Room and Walk references to that edge become unresolved and remain visible.

This preserves the distinction between:

- relation object
- source endpoints
- compositions that once addressed the relation

## Backup compatibility

GOATnote remains `schema: 1`.

New optional top-level collection:

`edges: []`

Old backups without `edges` load with an empty edge collection.

Import validates:

- both endpoint addresses
- type
- first-perceived time
- discovery trace
- evidence path
- confidence
- status
- created / updated timestamps
- edge references in Rooms and Walks

Normal GOATnote JSON backup includes edges automatically.

## Relation to ThoughtNodes

STAIRCASE 001 operationalizes the older candidate:

> **A relation may be younger than both nodes it connects.**

The source field can therefore remain stable while its edgemap develops over time.

The implementation does not assume that every plausible relation deserves admission. It explicitly preserves refusal and uncertainty.

The older compression becomes executable:

```text
FIELD
  source addresses / possible inhabitants

ROUTES
  admitted and inspectable relations

STABLE FORMS
  later compositions that may survive multiple routes
```

The metaphor is not evidence. The edge record is the accountable unit.

## Architecture

**GOATnote preserves source.**

**GOATedges preserves relation formation.**

**GOATwalk preserves ordered traversal.**

**GOATrooms preserves places that gather source, routes, and relations.**

## Next seams

- edge-to-edge relations
- relation birthdays as a replayable timeline
- Room snapshots at different edgemap cuts
- proposed / admitted topology overlays
- independent rediscovery receipts
- edge-specific hostile controls and counterevidence
- DVOTE receipts for actual edge crossings
- MEMENTO editions of relation formation history
- higher-order "House" structures admitted only after repeated independent compositions
