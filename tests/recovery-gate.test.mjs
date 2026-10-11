import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {BYTE_LIMIT,inspectNotebook,inspectRecovery,sealRecovery,prepareRestore} from '../recovery.mjs';
import {prepareReceiptRelation} from '../receipt-relations.mjs';
const hash='a'.repeat(64);
const observed='2026-10-11T11:15:00.000Z';
const frozen='webz-source-'+hash;
const notes=[
 {id:'receipt-note',title:'Imported WebZ source',draft:'later interpretation',
  versions:[{id:frozen,title:'Frozen witness',text:'First source — ordinary human reading',createdAt:'2026-10-10T10:00:00.000Z'},
   {id:'later-1',text:'later interpretation',createdAt:observed}],margins:[
    {id:'anchored',versionId:frozen,kind:'witness',
     text:'A human observed a phrase later.',createdAt:observed,
     anchor:{start:0,end:12,quote:'First source'}}],
  returnThreads:[{id:'return-1',sourceVersionId:frozen,createdAt:observed,
   entries:[{id:'question-1',kind:'question',text:'How did this relationship become known?',createdAt:observed}]}],
  webzReceipt:{source_sha256:'sha256:'+hash,source_schema:'cannon.branch-work-receipt/v0',
   reported_mode:'UNVERIFIED_ARCHIVE',goatnote_signature_verified:false,
   human_signer_authenticated:false,imported_from:'EXPLICIT_WEBZ_HANDOFF',
   evidence_relation_posture:'NO_AUTHORITY_TRANSFER'}},
 {id:'human-note',title:'Human source',draft:'separate memory',
  versions:[{id:'human-v0',text:'separate memory',createdAt:'2026-10-08T10:00:00.000Z'}],
  margins:[],returnThreads:[]}
];
const seed={schema:1,notes,edges:[],rooms:[],walks:[
 {id:'walk-1',title:'A route',mode:'story',createdAt:observed,updatedAt:observed,
  stops:[{id:'walk-stop-1',kind:'source',noteId:'receipt-note',
   versionId:frozen,noteTitleAtAdd:'Imported WebZ source',anchor:null,
   transition:'a later walk',addedAt:observed}]}
]};
const choice={fromNoteId:'receipt-note',toNoteId:'human-note',roomId:'NEW',
 newRoomId:'room-1',edgeId:'edge-1',revisionId:'event-1',fromItemId:'room-from',
 toItemId:'room-to',edgeItemId:'room-edge',recordedAt:observed,type:'echoes',
 discoveryTrace:'I first perceived the connection today',
 evidencePath:'Source of note A and note B are distinct',confirmed:true};
const db=prepareReceiptRelation(seed,choice).notebook;
const snapshot=JSON.stringify(db);
const report=inspectNotebook(db);
assert.equal(report.schema,'goatnote.recovery-inspection/v0');
assert.equal(report.noteCount,2);
assert.equal(report.versionCount,3);
assert.equal(report.marginCount,1);
assert.equal(report.threadCount,1);
assert.equal(report.edgeCount,1);
assert.equal(report.roomCount,1);
assert.equal(report.walkCount,1);
assert.equal(report.webzReceiptSources,1);
assert.equal(report.humanReceiptRelations,1);
assert.equal(report.unresolvedCount,0);
const witnessed=await sealRecovery(db,observed);
assert.equal(JSON.stringify(db),snapshot,'source-owned notebook was not mutated by sealing');
assert.equal(witnessed.bundle.schema,'goatnote.recovery-bundle/v0');
assert.equal(witnessed.bundle.posture,'SELF_CHECKSUM_NOT_AUTHENTICATED');
const raw=JSON.stringify(witnessed.bundle);
const verified=await inspectRecovery(raw);
assert.equal(verified.integrity,'SELF_CHECKSUM_VALID_NOT_AUTHENTICATED');
assert.deepEqual(verified.notebook,db);
assert.equal(verified.report.unresolvedCount,0);
const legacy=await inspectRecovery(JSON.stringify(db));
assert.equal(legacy.integrity,'LEGACY_UNSIGNED_BACKUP');
assert.deepEqual(legacy.notebook,db);
const empty={schema:1,notes:[],edges:[],rooms:[],walks:[]};
assert.throws(()=>prepareRestore(verified,empty),/EXPLICIT/);
const restored=prepareRestore(verified,empty,{approved:true});
assert.deepEqual(restored,db);
assert.notEqual(restored,db);
assert.equal(restored.notes[0].versions[0].text,'First source — ordinary human reading');
assert.equal(restored.edges[0].receiptRelation.observedAt,observed);
assert.equal(restored.edges[0].history[0].status,'perceived');
assert.equal(restored.rooms[0].items.filter(x=>x.kind==='source').length,2);
assert.equal(restored.walks[0].stops[0].versionId,frozen);
assert.throws(()=>prepareRestore(verified,db,{approved:true}),/EMPTY_NOTEBOOK/);
const tampered=JSON.parse(raw);
tampered.notebook.notes[0].versions[0].text='SILENT REWRITE';
await assert.rejects(inspectRecovery(JSON.stringify(tampered)),/CHECKSUM/);
const alteredClock=structuredClone(db);
alteredClock.edges[0].receiptRelation.observedAt='2022-01-01T00:00:00.000Z';
assert.throws(()=>inspectNotebook(alteredClock),/SOURCE_OR_BIRTH_CHANGED/);
const changedRef=structuredClone(db);
changedRef.edges[0].from.versionId='later-1';
assert.throws(()=>inspectNotebook(changedRef),/SOURCE_OR_BIRTH_CHANGED/);
const missing=structuredClone(db);
missing.rooms[0].items.push({id:'missing-edge-item',kind:'edge',edgeId:'unknown-edge',addedAt:observed});
missing.walks[0].stops.push({id:'missing-walk-item',kind:'walk',walkId:'vanished-walk',addedAt:observed});
const observedMissing=inspectNotebook(missing);
assert.equal(observedMissing.unresolvedCount,2);
assert.match(observedMissing.unresolved.join(' '),/missing-edge/);
assert.match(observedMissing.unresolved.join(' '),/missing-walk/);
const intact=structuredClone(db);
intact.notes.push(structuredClone(db.notes[0]));
assert.throws(()=>inspectNotebook(intact),/INVALID_RECOVERY_NOTE/);
const forged=structuredClone(db);
forged.notes[0].webzReceipt.goatnote_signature_verified=true;
assert.throws(()=>inspectNotebook(forged),/WEBZ_FROZEN_SOURCE_INCONSISTENT/);
await assert.rejects(inspectRecovery(' '.repeat(BYTE_LIMIT+1)),/LIMIT_8MB/);
const ui=readFileSync(new URL('../recovery-ui.mjs',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
assert.match(ui,/prepareRestore\(staged,current\(\),\{approved:true,emptyOnly:true\}\)/);
assert.match(ui,/getNotebookSnapshot/);
assert.match(html,/id="openRecovery"/);
assert.match(html,/id="grc-restore"/);
assert.match(sw,/recovery.mjs/);
assert.match(sw,/recovery-ui.mjs/);
assert.doesNotMatch(ui,/fetch\(|sendBeacon\(|WebSocket/);
console.log('Recovery Gate 003: witnessed+legacy full roundtrip, frozen source, margin, Return Thread, relation birth, GOATroom, GOATwalk, tamper refusal, no occupied overwrite PASSED');
