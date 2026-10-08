# GOATnote CAD Journal 001 — Source, Margins, Return

This experimental **GOATnote-owned journal adapter** accepts a selected,
locally verified Static-OS CAD-005 signed-evidence handoff.

GOATnote does NOT sign reLATTE crossings or inspect private AI reasoning.
Its job is to keep original evidence intact while witness, question,
interpretation, correction and Return Thread notes can accumulate later.

## End-to-end authority

1. STATIC OS compiles a new geometry or feature-branch experiment and
   verifies original CAD source, OCCT STEP readback and recorded decision trace.
2. Native reLATTE signs the crossing over exact CAD/decision evidence;
   the independent receiver returns signed RECEIVE then HOLD, effect NONE.
3. STATIC OS cold-verifies those native signatures and file bytes, and
   prepares an exact, bounded GOATnote handoff file.
4. A person deliberately chooses "Import CAD journal" in GOATnote and
   reviews a scoped, non-replacing import confirmation.
5. GOATnote creates one source note with one immutable saved version, twelve
   anchored margins (six witnesses/six unresolved questions), and a Return
   Thread (question/carry). The original app's free writing and other notes
   are not modified. Repeating the same crossing never duplicates a note.
6. Future human margins and Return Thread additions remain GOATnote-owned.
   Retrying the same source import must preserve those additions and cannot
   rewrite the original source version.
7. No cross-app sync, backdoor journal append, note publication, hardware
   fabrication, owner admission, or automatic import is implied.

## What's in the source page

- Exact source sketch, solid manifest and trace identifiers.
- Signed native reLATTE crossing and both receipt addresses.
- Six declared CAD decision events in source order.
- The retained alternatives, rationale codes and observable outcomes.
- Prominent qualifications: native verification reported by the STATIC OS
  source; GOATnote itself has **not** independently run P-256 signature
  verification. HOLD does **not** give fabrication authority.

Those six decision records are an inspectable *declared history*, not an
AI model's private chain of thought, nor proof that a historical Leonardo
manuscript contains the resulting modern mechanism.

## Import and backup safety

GOATnote uses schema 1 and localStorage, not encrypted durable storage.
Importing a CAD journal is distinct from the existing whole-notebook
JSON **replacement backup import**: this path adds ONE source note,
requires explicit opt-in, refuses occupied source/version IDs with changed
contents, and never wipes a notebook.

This browser prototype is not appropriate for secret testimony or
private data without separately implemented privacy safeguards.
No sensitive content should be committed into the public repository.

The CAD handoff is capped at 250 kB in the UI. Do not mistake its
self-declared "native checked" marker for an authenticated signing chain
when an untrusted file is imported; the real validation occurs in
STATIC OS with the pinned native reLATTE verifier before exporting.
A future GOATnote-hosted native verification module could strengthen
its importer boundary separately.

The source version's timestamp is inherited from the real signed
crossing's created_at value. It is NOT the occurrence time of the
engineering events, the manuscript creation time, or the import time.

## Tests

    node tests/cad-journal.test.mjs
    node tests/smoke.mjs

Checks: exact schema, timestamp shape, six event order, predecessor links,
version-bound quote ranges, witness/question categories, Return Threads,
full source immutability, idempotence without deleting later human margins,
explicit import approval, HOLD/authority laundering refusals, forgery of
claimed hidden thoughts and extra commands.

Next: the STATIC OS feature-tree branch passes two alternative feature
candidate experiments with separate reLATTE source histories, and each
selected crossing can be a separate GOATnote source version or note.
Future shared chronology/time-cut must not resurrect old fabrication
grants.

## Laws

    GOATNOTE SOURCE != LATER MARGIN
    SOURCE QUOTE != UPDATED DRAFT
    QUESTION MARGIN != DESIGN APPROVAL
    RETURN THREAD != SOURCE MUTATION
    REPLAY != SECOND IMPORT
    SIGNED CROSSING != SIGNATURE CHECKED BY GOATNOTE
    HOLD != FABRICATION GRANT
    DECLARED DESIGN DECISION != PRIVATE CHAIN OF THOUGHT
    IMPORT != NOTEBOOK REPLACEMENT
    PRIVATE NOTE != PUBLIC REPOSITORY ARTIFACT
