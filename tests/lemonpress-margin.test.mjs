import assert from 'node:assert/strict';
import {listPressMarginChoices,listPressEdges,makePressMarginCarrier} from '../lemonpress-margin.mjs';
import {readFileSync} from 'node:fs';
const stamp='2026-10-11T16:30:00.000Z';
const content='A hidden preface. The house takes attendance. A private ending.';
const quote='The house takes attendance.';
const start=content.indexOf(quote);
const source={
 id:'receipt-note',title:'Reading of old receipt',draft:'my unsaved draft',
 versions:[{id:'frozen-original',text:content,createdAt:'2026-10-09T12:00:00.000Z'},
  {id:'new-saved-version',text:'Later alternative draft',createdAt:'2026-10-10T12:00:00.000Z'}],
 margins:[{id:'margin-1',kind:'question',text:'When did this become visible?',versionId:'frozen-original',
  anchor:{start,end:start+quote.length,quote},createdAt:'2026-10-11T15:00:00.000Z'},
  {id:'margin-whole',kind:'witness',text:'Whole note should not be exported',
   versionId:'frozen-original',anchor:null,createdAt:stamp},
  {id:'margin-drift',kind:'witness',text:'Broken passage must not be exported',
   versionId:'frozen-original',anchor:{start:0,end:4,quote:'NOPE'},createdAt:stamp}],
 returnThreads:[{id:'private-thread',sourceVersionId:'frozen-original',entries:[{id:'secret',text:'SECRET_THREAD'}]}]
};
const privateNote={id:'another-private-note',title:'UNSELECTED_SECRET_TITLE',draft:'PRIVATE_DOCUMENT_BODY',
 versions:[{id:'hidden-v1',text:'UNSELECTED_FULL_BODY'}],margins:[]};
const relation={id:'edge-1',from:{noteId:'receipt-note',versionId:'frozen-original',anchor:null},
 to:{noteId:'another-private-note',versionId:'hidden-v1',anchor:null},
 status:'perceived',type:'echoes',firstPerceivedAt:'2026-10-11T14:00:00.000Z',
 discoveryTrace:'Discovered the juxtaposition later',evidencePath:'Anchored note and a separate source'};
const db={schema:1,notes:[source,privateNote],edges:[relation],rooms:[],walks:[]};
const choices=listPressMarginChoices(db);
assert.equal(choices.length,1);
assert.deepEqual(choices[0].margins.map(m=>m.id),['margin-1']);
const edges=listPressEdges(db,'receipt-note','frozen-original');
assert.equal(edges.length,1);
assert.throws(()=>listPressMarginChoices({schema:2,notes:[]}),/INVALID_GOATNOTE/);
const packet=await makePressMarginCarrier(db,{noteId:'receipt-note',marginId:'margin-1',edgeId:'edge-1',selectedAt:stamp});
assert.equal(packet.posture,'PRIVATE_UNADMITTED_CANDIDATE');
assert.equal(packet.source.excerpt,quote);
assert.equal(packet.source.excerpt_start,start);
assert.equal(packet.source.version_body_disclosed,false);
assert.equal(packet.reading.text,'When did this become visible?');
assert.equal(packet.relation.first_perceived_at,'2026-10-11T14:00:00.000Z');
assert.equal(packet.relation.recorded_current_status,'perceived');
assert.equal(packet.selection.publication_grant,false);
assert.equal(packet.authority.press_admission,false);
assert.equal(packet.authority.house_release,false);
assert.match(packet.checksum,/^sha256:[a-f0-9]{64}$/);
const raw=JSON.stringify(packet);
assert.ok(!raw.includes('PRIVATE_DOCUMENT_BODY'));
assert.ok(!raw.includes('UNSELECTED_SECRET_TITLE'));
assert.ok(!raw.includes('UNSELECTED_FULL_BODY'));
assert.ok(!raw.includes('SECRET_THREAD'));
assert.ok(!raw.includes('A hidden preface.'));
assert.ok(!raw.includes('A private ending.'));
assert.ok(!raw.includes('Whole note should not be exported'));
assert.ok(!raw.includes('my unsaved draft'));
const withoutEdge=await makePressMarginCarrier(db,{noteId:'receipt-note',marginId:'margin-1',selectedAt:stamp});
assert.equal(withoutEdge.relation,null);
assert.ok(!JSON.stringify(withoutEdge).includes('Discovered the juxtaposition later'));
assert.notEqual(withoutEdge.checksum,packet.checksum);
await assert.rejects(makePressMarginCarrier(db,{noteId:'receipt-note',marginId:'margin-whole',selectedAt:stamp}),/EXACT_SOURCE_PASSAGE/);
await assert.rejects(makePressMarginCarrier(db,{noteId:'receipt-note',marginId:'margin-drift',selectedAt:stamp}),/EXACT_SOURCE_PASSAGE/);
await assert.rejects(makePressMarginCarrier(db,{noteId:'another-private-note',marginId:'margin-1',selectedAt:stamp}),/UNRESOLVED/);
await assert.rejects(makePressMarginCarrier(db,{noteId:'receipt-note',marginId:'margin-1',edgeId:'unrelated',selectedAt:stamp}),/RELATION_NOT_BOUND/);
await assert.rejects(makePressMarginCarrier(db,{noteId:'receipt-note',marginId:'margin-1',selectedAt:'last week'}),/INVALID_SELECTION_TIME/);
assert.deepEqual(db.notes[0],source,'pure exporter never mutates source or margins');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const ui=readFileSync(new URL('../lemonpress-margin-ui.mjs',import.meta.url),'utf8');
const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
assert.match(html,/id="openLemonPress"/);
assert.match(html,/id="lpm-edge"/);
assert.match(ui,/confirm\(/);
assert.match(ui,/makePressMarginCarrier\(load\(\)/);
assert.doesNotMatch(ui,/fetch\(|sendBeacon\(|WebSocket/);
assert.match(sw,/lemonpress-margin.mjs/);
console.log('GOATnote LemonPRESS margin: exact source quote, one reading, opt-in relation, privacy scope, refusal, no press admission PASS');
