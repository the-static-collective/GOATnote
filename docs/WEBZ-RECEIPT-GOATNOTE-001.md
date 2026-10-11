# Receipt Glass × GOATnote — source-bound human witness 001

**Draft / unmerged / not deployed.** Stacked on CAD Journal PR #13 and inherited GOATwalk, GOATrooms, GOATedges, and TIME-CUT donor branches.

## Path

1. A person opens a supported source in WEBZ Receipt Glass; WebZ verifies the source to its explicitly bounded profile.
2. A person presses **Export source + ancestry for GOATnote**. Browser downloads `webz.goatnote-receipt-handoff/v0`: original JSON text, SHA-256, precise source length, reported inspection mode, bounded step list, and a reconstructed relation graph with exact evidence postures. A packet checksum checks accidental alteration, not signer identity or cryptographic provenance. No network upload or auto-sync.
3. A person chooses **Import WebZ receipt** in GOATnote and explicitly confirms a non-replacing import. GOATnote independently rechecks the packet's SHA-256 and exact source bytes. **It does NOT independently verify native reLATTE P-256 signatures or browser operation**. A hostile party can forge an entirely new checksum-consistent packet; treat it as foreign testimony, not proof.
4. GOATnote adds one frozen source version whose text includes source addresses, qualified ancestry, witness steps and the **exact original source JSON**. Version-bound witness/question margins accompany each reported step, plus one Return Thread for future human reflection. No remote side effects or native worlds are touched.
5. Duplicate import returns the existing source without replacing future margins or Return Threads. A colliding original source with different text is refused.
6. GOATedges, GOATwalks, GOATrooms and TIME-CUT continue to own human-relational navigation separately. This import does not automatically create admitted/traversable GOATedges or inferred ancestor membership; people may explicitly create connections later.

## Time and epistemic boundary

- `created_at` in the handoff is **export time**, not event time or verified signer timestamp. GOATnote's `createdAt` is the **local import time**.
- `LOCAL_JOURNAL_VERIFIED` means WebZ reported verifying a bounded GrO two-receipt journal; GOATnote labels that as an **imported WebZ report**.
- `SIGNATURE_ONLY` reports signed-object checks without independent material/state history.
- `UNVERIFIED_ARCHIVE` carries an unsigned CANNON historic CI summary, not independently verified receipt signatures.
- `VERIFIED_OBJECT` / `REFERENCE_ONLY` / `ARCHIVE_CLAIM` and their edge counterparts remain distinguishable. Missing ancestors remain unresolved. An as-of view does not become historical authority.
- No credential leaks, private signing keys, public notebook release, or automatic P2P transfer are authorized by this design.

## Operational and privacy limit

GOATnote remains an **unencrypted browser localStorage** prototype with no automatic backup. This does not make sensitive testimony safe. Keep backups independently. Imported JSON may include information the user elects to keep locally; no raw evidence is ever automatically published to GitHub or Abundent.

## Test gates

- `node tests/webz-receipt.test.mjs`
- `node tests/cad-journal.test.mjs`
- `node tests/smoke.mjs`
- `node --check webz-receipt.mjs && node --check webz-receipt-ui.mjs`
- Existing GOATnote Walk/Room/Edge/Time-Cut tests and a real mobile/browser import run remain distinct review gates.

**LAW: VERIFIED THERE ≠ VERIFIED HERE. SOURCE ≠ MARGIN. SIGNED REFERENCE ≠ LOADED ANCESTOR. RELATION ≠ AUTHORITY. HISTORICAL CUT ≠ PRESENT CAPABILITY. IMPORT ≠ NOTEBOOK REPLACEMENT.**
