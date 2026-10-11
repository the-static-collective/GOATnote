import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {verifyWebzHandoff,projectWebzReceiptNote,mergeWebzReceipt} from '../webz-receipt.mjs';
const hash=s=>createHash('sha256').update(s).digest('hex');
const canonical=v=>v===null||typeof v!=='object'?JSON.stringify(v):Array.isArray(v)?'['+v.map(canonical).join(',')+']':'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}';
const sha='relatte-crossing-v0:'+'a'.repeat(64),received='relatte-receipt-v0:'+'b'.repeat(64),held='relatte-receipt-v0:'+'c'.repeat(64);
const source={schema:'cannon.branch-work-receipt/v0',crossing_id:sha,receive_receipt_id:received,disposition_receipt_id:held,disposition:'HOLD'};
const raw=JSON.stringify(source);
const unsigned={
 schema:'webz.goatnote-receipt-handoff/v0',
 origin:'WEBZ_USER_EXPLICIT_EXPORT',authority:'NO_AUTHORITY_TRANSFER',
 created_at:'2026-10-11T12:00:00.000Z',
 source:{schema:source.schema,bytes:Buffer.byteLength(raw),sha256:'sha256:'+hash(raw),json:raw},
 inspection:{type:'CANNON archived run report',mode:'UNVERIFIED_ARCHIVE',cryptographic_verification:false,
  fields:{crossing_id:sha,receive_receipt_id:received,hold_receipt_id:held},
  steps:[{stage:'SOURCE CLAIM',id:sha,detail:'CI archive asserts a source job; reader did not execute it.'},
         {stage:'REPORTED HOLD',id:held,detail:'Not independently signature-verified.'}]},
 ancestry:{schema:'webz/receipt-ancestry/v0',reconstruction:'BOUND_ONLY_TO_SUPPLIED_EVIDENCE',
  nodes:[{id:sha,label:'Archived crossing ID',posture:'ARCHIVE_CLAIM'},
         {id:received,label:'Archived RECEIVE ID',posture:'ARCHIVE_CLAIM'},
         {id:held,label:'Archived HOLD ID',posture:'ARCHIVE_CLAIM'}],
  edges:[{from:sha,to:received,relation:'reported-receive',posture:'ARCHIVE_CLAIM'},
         {from:received,to:held,relation:'reported-hold',posture:'ARCHIVE_CLAIM'}],
  missing:'Unretrieved ancestors remain unresolved',historical_crossing_authorized:false}
};
const packet={...unsigned,checksum:'sha256:'+hash('WEBZ-GOATNOTE-RECEIPT-001|'+canonical(unsigned))};
assert.deepEqual(await verifyWebzHandoff(packet),packet);
const note=await projectWebzReceiptNote(packet);
assert.equal(note.versions.length,1);
assert.equal(note.margins.length,4);
assert.equal(note.returnThreads[0].entries.length,2);
assert.match(note.draft,/NOT independently verify ECDSA signatures/);
assert.match(note.draft,/Exact source JSON/);
assert.ok(note.draft.includes(raw));
assert.equal(note.webzReceipt.goatnote_signature_verified,false);
for(const margin of note.margins){
 assert.equal(margin.versionId,note.versions[0].id);
 assert.equal(note.versions[0].text.slice(margin.anchor.start,margin.anchor.end),margin.anchor.quote);
}
const own={id:'private-human-note',title:'Owned writing',draft:'UNTOUCHED',versions:[{id:'historic',text:'Never rewrite'}],margins:[]};
const db={schema:1,notes:[own],walks:[],rooms:[],edges:[]};
await assert.rejects(mergeWebzReceipt(db,packet),/EXPLICIT_IMPORT/);
const added=await mergeWebzReceipt(db,packet,true);
assert.equal(added.added,true);
assert.equal(db.notes.length,1);
assert.deepEqual(added.notebook.notes[1],own);
const decorated=structuredClone(added.notebook);
decorated.notes[0].margins.push({id:'human-margin',kind:'interpretation',text:'Later human sensemaking',versionId:note.versions[0].id});
const again=await mergeWebzReceipt(decorated,packet,true);
assert.equal(again.added,false);
assert.deepEqual(again.notebook,decorated);
const wrong=structuredClone(decorated);wrong.notes[0].versions[0].text='modified history';
await assert.rejects(mergeWebzReceipt(wrong,packet,true),/SOURCE_COLLISION/);
const mutated=structuredClone(packet);mutated.source.json+=' ';
await assert.rejects(verifyWebzHandoff(mutated),/CHECKSUM/);
const wrongIdentity=structuredClone(packet);wrongIdentity.inspection.mode='LOCAL_JOURNAL_VERIFIED';
wrongIdentity.inspection.cryptographic_verification=true;
const {checksum,...bare}=wrongIdentity;
wrongIdentity.checksum='sha256:'+hash('WEBZ-GOATNOTE-RECEIPT-001|'+canonical(bare));
await assert.rejects(verifyWebzHandoff(wrongIdentity),/PROFILE_MISMATCH/);
const fakeAuthority=structuredClone(packet);fakeAuthority.authority='RECEIVER_ADMITTED';
await assert.rejects(verifyWebzHandoff(fakeAuthority));
const badEdge=structuredClone(packet);badEdge.ancestry.edges[0].to='unknown-particular';
const {checksum:unused,...bareEdge}=badEdge;
badEdge.checksum='sha256:'+hash('WEBZ-GOATNOTE-RECEIPT-001|'+canonical(bareEdge));
await assert.rejects(verifyWebzHandoff(badEdge),/BAD_ANCESTRY_LINK/);
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const ui=readFileSync(new URL('../webz-receipt-ui.mjs',import.meta.url),'utf8');
const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
assert.match(html,/id="importWebzReceipt"/);
assert.match(html,/webz-receipt-ui.mjs/);
assert.match(ui,/confirm\(/);
assert.match(ui,/mergeWebzReceipt\(db,packet,true\)/);
assert.doesNotMatch(ui,/fetch\(|sendBeacon\(|WebSocket/);
assert.match(sw,/webz-receipt.mjs/);
assert.match(sw,/webz-receipt-ui.mjs/);
console.log('GOATnote WebZ receipt handoff: source checksum, anchored witness/question, Return Thread, consent, no authority and no replacement verified');
