# GOATnote Recovery Gate 003 — the notebook survives the browser

**Status: experimental, draft, unmerged, not deployed.** Stacks on Receipt Relations PR #15. Does not change reLATTE, WebZ, or source authority.

## Why

GOATnote currently stores writing, frozen versions, anchored margins, Return Threads, Walks, Rooms, GOATedges revisions, and TIME-CUT birthdays in one browser-local schema-1 notebook. Browser storage is a **working copy**, not a durable archive. A cleared browser, lost device, new origin, private mode or quota problem can remove it.

## Three explicit actions

1. **Download witnessed backup.** GOATnote flushes the current editor draft and serializes the complete schema-1 notebook into a goatnote.recovery-bundle/v0 JSON file. It includes a SHA-256 self-checksum over a canonically serialized bundle, including its export timestamp. The browser downloads locally; no network transmission or cloud copy is created.
2. **Inspect backup.** Select either the new witnessed bundle or a legacy whole-notebook schema-1 JSON backup. The browser performs read-only structural checks and displays source/version, margin, thread, edge, Room, Walk, and unresolved-reference counts. The checksum detects alteration since export, but does not authenticate the author. A dishonest sender can create a new checksum-consistent bundle.
3. **Restore checked notebook.** Only if the destination browser notebook is empty. The person types RESTORE and explicitly confirms. One localStorage write installs the complete validated notebook, followed by a reload. This refuses silent overwrite. GOATnote's existing Import backup control remains separate and potentially destructive; export before invoking it.

No file is automatically imported. The restored backup file remains outside the browser under the user's control. JSON is never executed as commands.

## Validation

- Unique note, saved-version, edge, Room, and Walk IDs; bounded lengths and structural checks.
- Exact WebZ frozen-source version ID consistent with source SHA-256 metadata. The displayed GOATnote source text is a projection and its version name does not independently authenticate reLATTE signatures.
- Margin anchors checked against exact saved versions. Missing or broken older references remain unresolved; they are not silently rebound.
- Receipt relationship birth timestamp, source reference, pinned source version, and initial perceived revision must be retained. Human status revisions remain separate.
- Room and Walk missing edge/source/Walk targets remain unresolved. No automatic repair or traversal.
- Full notebook source records, margins, Return Threads and history remain byte-equivalent at JSON-data level across witnessed export/restore.
- Eight MiB single-page input cap. Larger notebooks need future streaming support, not silent truncation.

## Automated gates

tests/recovery-gate.test.mjs covers witnessed/legacy roundtrip, source immutability, anchor checking, deep notebook equality, birthday consistency, tamper refusal, missing references and no occupied overwrite.

tests/recovery_browser.py uses real touch-enabled mobile Chromium emulation at both root and nested URLs to exercise actual receipt-relation creation, export, an occupied-notebook refusal, tampering in a fresh profile, deliberate restoration to an empty profile, source/margin/thread/Walk/Room equality, TIME-CUT before/at the relation birthday, no auto admission, and no third-party requests.

**This is not a physical Android device test.** It cannot prove cross-browser downloads, OS filesystem preservation, device-loss survival, permission behavior, actual storage quota behavior, or end-user accessibility. Those remain release HOLDs until manually verified.

## Real-device acceptance checklist — NOT performed

1. On the intended Android phone/browser, create a disposable synthetic receipt, note, edge and TIME-CUT Room.
2. Download a witnessed backup. Verify the actual JSON file exists outside the browser and store a second, independently chosen copy.
3. Open GOATnote in an isolated empty browser profile. Inspect the file, check the reported counts and checksum qualification, type RESTORE and confirm.
4. Verify the original frozen source, margins, Return Threads, Walk, Room, and TIME-CUT before/after view match the source.
5. Check occupied-note refusal and altered-backup rejection without changing the existing notebook.
6. Test airplane mode after first install, opening from a different origin, browser-data clearing, and device storage pressure using disposable notes.
7. If any gate fails, keep the draft unmerged and the original independent file safe.

## Safety boundaries

- Browser localStorage and downloaded JSON remain **unencrypted plain text**. This is not safe secret testimony storage.
- SHA-256 is a self-consistency witness, not source identity, legal ownership, or network authority.
- The app cannot promise unsaved edits survived if browser storage fails.
- Legacy raw JSON cannot detect structurally valid source rewriting without a separate trusted source hash.
- No server, sync, private key, reLATTE grant or automatic publication introduced.

**SOURCE != MARGIN. BACKUP != CLOUD SYNC. RESTORED FILE != TRUSTED SIGNER. RELATION BIRTH != SOURCE BIRTH. HISTORY REPLAY != AUTHORITY.**
