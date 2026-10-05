# TIME-CUT 001 · Same Room, Different Staircases

**Status:** experimental browser instrument on `experiment/timecut-001`.

TIME-CUT reconstructs the recorded relation topology of a current GOATroom as of a chosen date and time.

It intentionally holds the Room's current membership constant while changing only the edge-state view.

This is not a claim about what reality was at that time. It is a reconstruction of what the saved relation record says had been perceived, proposed, admitted, weakened, refused, or left unresolved by that cut.

## Governing laws

**CUT ≠ OCCURRENCE TIME**

**AS-OF VIEW ≠ HISTORICAL OMNISCIENCE**

**AS-OF ADMISSION ≠ CURRENT AUTHORITY**

**EDGE BIRTHDAY ≠ ENDPOINT BIRTHDAY**

**HISTORY MAY REMAIN ANCHORED WHILE REACHABILITY CHANGES**

## Why Room membership is held constant

TIME-CUT 001 is a topology experiment, not yet a full historical replay of the Room object.

The current Room's source addresses and Walk doors are held in place so that one variable can change cleanly:

> Which relation-state was available at this cut?

This lets the same Room be compared across cuts without silently implying that present-day Room membership already existed in the past.

Every Time Cut therefore states:

`current-room-membership-held-constant`

Future work can add historical Room-membership replay as a separate operation.

## Edge state at a cut

For an edge with:

- `firstPerceivedAt`
- `createdAt`
- append-only `history[]`

the historical state is reconstructed using these rules.

### Before first perception

`not-yet-perceived`

The current Room may contain the edge address, but the scrubbed topology shows that no staircase had yet been perceived at that cut.

### After first perception, before any recorded revision

The edge is shown as:

`perceived`

Confidence is left unrecorded rather than inferred.

A later status is not projected backward.

### After recorded revisions

Use the latest revision whose timestamp is less than or equal to the cut.

A revision snapshot can preserve:

- status
- confidence
- relation type
- discovery trace
- evidence path
- first-perceived time
- FROM endpoint
- TO endpoint

Older edge-history records created before TIME-CUT may lack some snapshot fields. Those fields fall back to the current edge record and should not be mistaken for independently reconstructed historical values.

## Read-only authority boundary

TIME-CUT is deliberately non-operational.

A historical edge may display:

**STAIRCASE ADMITTED AT THIS CUT · READ ONLY**

But TIME-CUT never exposes a historical crossing action.

Why:

```text
admitted in the past
!=
admitted now
```

An edge that was admitted in June and refused in October must not regain present crossing authority merely because the user scrubs back to June.

The historical view can inspect the present edge record, but it cannot resurrect an old permission state.

## Event stepping

The instrument can step to nearby edge events:

- first-perceived birthdays
- edge revision timestamps

Controls:

- PREV EVENT
- NOW
- NEXT EVENT
- direct date/time input
- click a nearby event

Events are limited to edges currently addressed by the selected Room.

## Room display

At each cut:

### Source occupants

Current Room source addresses remain visible and are explicitly labeled as present Room occupants held constant for the experiment.

### Walk occupants

Current Room Walk doors also remain visible and held constant.

### Edge occupants

Each current Room edge reference is rendered according to the cut:

- not yet perceived
- perceived
- proposed
- admitted
- weakened
- refused
- unresolved
- missing edge

A future edge may remain visible as a ghost card labeled:

**NO STAIRCASE AT THIS CUT**

This is a comparison aid, not a claim that the past observer knew about the future relation.

## Edge revision snapshots

STAIRCASE 001 now records richer append-only revision snapshots.

New revision records preserve:

- current status
- current confidence
- relation type
- discovery trace
- evidence path
- first-perceived timestamp
- FROM endpoint
- TO endpoint
- revision note

Endpoint changes and first-perceived-time changes now count as revisions.

This makes future Time Cuts more attributable.

## Export

TIME-CUT can export:

### JSON

Schema:

`goatnote.timecut.v1`

The export includes:

- generation time
- cut time
- Room identity
- explicit reconstruction posture
- status counts
- current Room occupants
- historical edge state at the cut
- current endpoint-resolution state

### Markdown

A readable derivative preserving the cut, laws, occupants, and reconstructed staircase states.

Neither export is a restorable GOATnote backup.

## Backup compatibility

GOATnote remains `schema: 1`.

Edge history remains optional so older backups continue to load.

Import validation now accepts legacy history entries and richer TIME-CUT snapshot entries.

## Architecture

**GOATnote preserves source.**

**GOATedges preserves relation formation.**

**GOATwalk preserves ordered traversal.**

**GOATrooms preserves places.**

**TIME-CUT preserves a read-only view of how recorded reachability changed.**

## Next seams

- dual-view comparison: Cut A beside Cut B
- animate edge birthdays and revision events
- historical Room-membership replay as a separate layer
- relation-diff receipts between two cuts
- MEMENTO edition: "How this Room changed"
- DVOTE walk through the current topology with receipts
- hostile replay: compare a historically proposed route to the later refused/admitted outcome
- House formation: detect candidate stable structures across multiple time cuts without automatically admitting them
