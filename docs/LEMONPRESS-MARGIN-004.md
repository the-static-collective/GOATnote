# GOATnote × LemonPRESS 004 — One Margin, One Private Candidate

**Draft experiment, not merged or deployed.** Stacks on Recovery Gate 003 and earlier Receipt Glass / GOATedges / TIME-CUT work.

## The crossing

A person selects one **exact anchored passage** in one GOATnote immutable saved version, selects **one margin attached to that version**, and may optionally select one native GOATedge sharing that exact source version. A confirmation specifies exactly what will leave the browser. A plain-text file is downloaded for a separate LemonPRESS editorial intake.

This is **not** export of the notebook, Return Threads, source document body, other margins, other note text, or an entire GOATroom. The only disclosed source words are the chosen exact passage quote, plus a version SHA-256 *declaration* based on the saved source text. The receiving Press cannot recompute this full source-version hash because the full source text is deliberately withheld. It can independently verify the excerpt hash and entire packet checksum. Neither establishes signer identity.

## Carrier: goatnote.lemonpress-margin/v0

- Explicit human-selected source note ID, immutable version ID, quote offsets, quote and SHA-256; source-version SHA-256 with full source omitted.
- One human margin kind, text, ID, and recorded timestamp.
- Optional human relation type, first-perceived timestamp, status as of selection, discovery trace and evidence path.
- Explicit false admission, publication, rights grant, external authentication, and source mutation fields.
- Local-only download time and unsigned self-checksum.
- Strict field and size caps; no automatic or bulk export.

The marginal commentary is a later person's observation, not the source's original claim. Current GOATedge local admission never implies LemonPRESS editorial admission. Discovery time does not become occurrence time.

## What the importer may do

The separate LemonPRESS experiment receives this JSON only after a person independently supplies a local file to its CLI, checks packet and excerpt consistency, then composes a private editorial manuscript and metadata candidate. No action in GOATnote pushes a file into a GitHub branch or automatically publishes on Abundent.

The export is not encrypted; the user chooses whether and where to keep it, and should not export private or sensitive text inadvertently.

## Browser / CI gates

- Node 24: tests/lemonpress-margin.test.mjs tests exact anchored passage, optional relation, scope, refusals, no modification and no source/body leak.
- Real touch-enabled Chromium: tests/lemonpress_margin_browser.py at root and nested route tests decline then confirm, downloads the packet, checks exactly one margin and no other note bodies or threads, no outside HTTP requests.
- Inherited source history and Recovery Gate 003 tests remain independent.
- Physical Android acceptance is NOT performed. Manual review of mobile selection, file save, file privacy, and importer remains necessary before release.

**MARGIN ≠ SOURCE. RELATION ≠ AUTHORITY. SELECTED QUOTE ≠ FULL SOURCE. DOWNLOAD ≠ SUBMISSION. CANDIDATE ≠ PUBLICATION.**
