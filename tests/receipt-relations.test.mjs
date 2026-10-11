import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {prepareReceiptRelation,receiptRelationCandidates} from '../receipt-relations.mjs';
const d='a'.repeat(64);
const receipt={
 id:'receipt-note',title:'Imported original receipt',draft:'later human edited draft',
 versions:[{id:'webz-source-'+d,text:'frozen exact import',createdAt:'2026-10-10T10:00:00.000Z'},
           {id:'later-edit',text:'a later interpretation',createdAt:'2026-10-11T08:00:00.000Z'}],
 margins:[],webzReceipt:{source_sha256:'sha256:'+d,imported_from:'EXPLICIT_WEBZ_HANDOFF'}
};
const human={id:'human-note',title:'A distinct notebook source',draft:'changed draft',
 versions:[{id:'human-v0',text:'original writing',createdAt:'2026-10-09T10:00:00.000Z'}],margins:[]};
const old={id:'old-private-note',title:'Secret free writing',draft:'leave this untouched',
 versions:[{id:'old-v0',text:'original'}],margins:[]};
const db={schema:1,notes:[receipt,human,old],edges:[],rooms:[],walks:[]};
const at='2026-10-11T15:00:00.000Z';
const choose={fromNoteId:'receipt-note',toNoteId:'human-note',roomId:'NEW',newRoomId:'receipt-room',
 edgeId:'receipt-edge',revisionId:'first-revision',fromItemId:'source-a',toItemId:'source-b',
 edgeItemId:'edge-placement',recordedAt:at,type:'echoes',
 discoveryTrace:'Human noticed the shared motif after reading the sources',
 evidencePath:'Frozen receipt digest and original human note; resemblance is only proposed',
 confirmed:true};
const candidates=receiptRelationCandidates(db);
assert.equal(candidates.receipts.length,1);
assert.equal(candidates.targets.length,3);
assert.throws(()=>prepareReceiptRelation(db,{...choose,confirmed:false}),/HUMAN_CONFIRMATION/);
assert.throws(()=>prepareReceiptRelation(db,{...choose,fromNoteId:'human-note'}),/MISSING_SOURCE_NOTE/);
assert.throws(()=>prepareReceiptRelation(db,{...choose,toNoteId:'receipt-note'}),/SAME_SOURCE/);
assert.throws(()=>prepareReceiptRelation(db,{...choose,recordedAt:'not-time'}),/INVALID_RECORD_TIME/);
const built=prepareReceiptRelation(db,choose);
const {notebook,edgeId,roomId}=built;
assert.equal(db.edges.length,0);
assert.equal(db.rooms.length,0);
assert.equal(db.notes[0].versions.length,2);
assert.deepEqual(notebook.notes,db.notes);
assert.equal(notebook.walks,db.walks);
assert.equal(notebook.edges.length,1);
assert.equal(notebook.rooms.length,1);
assert.equal(edgeId,'receipt-edge');
assert.equal(roomId,'receipt-room');
const edge=notebook.edges[0],room=notebook.rooms[0];
assert.equal(edge.status,'perceived');
assert.equal(edge.confidence,'low');
assert.equal(edge.receiptRelation.observedAt,at);
assert.equal(edge.receiptRelation.relatteAuthority,'NONE');
assert.equal(edge.from.versionId,'webz-source-'+d,'pin original frozen receipt, never later edited draft');
assert.equal(edge.to.versionId,'human-v0');
assert.equal(edge.history.length,1);
assert.equal(edge.history[0].at,at);
assert.equal(edge.history[0].status,'perceived');
assert.equal(edge.history[0].firstPerceivedAt,at);
assert.equal(room.items.filter(x=>x.kind==='source').length,2);
assert.equal(room.items.filter(x=>x.kind==='edge').length,1);
assert.equal(room.items.at(-1).edgeId,edge.id);
// GOATedges and GOATtime installed into a tiny, renderless browser facade.
// The real native as-of algorithms are executed, not reimplemented.
const stub=()=>({
  addEventListener(){},setAttribute(){},append(){},appendChild(){},
  close(){},showModal(){},querySelector(){return stub();},
  replaceChildren(){},get classList(){return {add(){},remove(){}};}
});
const document={createElement(){return stub();},querySelector(){return null;},body:{append(){}}};
const window={
 GOATnoteWalkAPI:{uid:()=> 'new-id',stamp:()=>at,getEdges:()=>notebook.edges,
 saveEdges(){},resolveStop:()=>({status:'exact'}),openStop(){return true;}},
 GOATroomsAPI:{getRooms:()=>notebook.rooms},
 GOATwalkAPI:{getWalk:()=>null}
};
const context=vm.createContext({window,document,Date,JSON,Set,Map,console,alert(){}});
for(const name of ['goatedges.js','goattime.js']){
 const script=readFileSync(new URL('../'+name,import.meta.url),'utf8');
 new vm.Script(script,{filename:name}).runInContext(context);
}
assert.ok(window.GOATedgesAPI);
assert.ok(window.GOATtimeAPI);
assert.equal(window.GOATedgesAPI.isTraversable(edge),false);
const before=window.GOATtimeAPI.snapshot(room.id,'2026-10-11T14:59:59.999Z');
const atCut=window.GOATtimeAPI.snapshot(room.id,at);
assert.equal(before.items.find(x=>x.kind==='edge').historical.status,'not-yet-perceived');
assert.equal(atCut.items.find(x=>x.kind==='edge').historical.status,'perceived');
assert.equal(atCut.items.filter(x=>x.kind==='source').length,2);
const later='2026-10-12T15:00:00.000Z';
edge.status='admitted';edge.updatedAt=later;
edge.history.push({...edge.history[0],id:'later-revision',at:later,kind:'revision',status:'admitted',note:'Human later admitted navigation.'});
const historical=window.GOATtimeAPI.snapshot(room.id,at);
const after=window.GOATtimeAPI.snapshot(room.id,later);
assert.equal(historical.items.find(x=>x.kind==='edge').historical.status,'perceived');
assert.equal(after.items.find(x=>x.kind==='edge').historical.status,'admitted');
assert.equal(historical.items.find(x=>x.kind==='edge').historical.recordedAt,at);
const another=prepareReceiptRelation(notebook,{...choose,edgeId:'second-edge',revisionId:'second-revision',
 roomId:room.id,edgeItemId:'second-placement',recordedAt:'2026-10-13T15:00:00.000Z'});
assert.equal(another.notebook.rooms[0].items.filter(x=>x.kind==='source').length,2,'no duplicate frozen source placements');
assert.equal(another.notebook.rooms[0].items.filter(x=>x.kind==='edge').length,2,'plural human interpretations coexist');
assert.throws(()=>prepareReceiptRelation(db,{...choose,roomId:'missing-room'}),/MISSING_SELECTED_ROOM/);
const edgeUi=readFileSync(new URL('../goatedges.js',import.meta.url),'utf8');
const importer=readFileSync(new URL('../receipt-relations-ui.mjs',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
assert.match(edgeUi,/originalEndpointsLocked===true/);
assert.match(edgeUi,/Receipt relation birthday and original endpoints are immutable/);
assert.match(importer,/localStorage.setItem\(KEY,JSON.stringify\(result.notebook\)\)/);
assert.match(importer,/confirm\(/);
assert.doesNotMatch(importer,/fetch\(|sendBeacon\(|WebSocket/);
assert.match(html,/id="openReceiptRelations"/);
assert.match(html,/id="rr-discovery"/);
assert.match(sw,/receipt-relations.mjs/);
console.log('RECEIPT-RELATIONS-002: native GOATedges and TIME-CUT temporal witness, original source pinning, Room placement, refusal and consent PASS');
