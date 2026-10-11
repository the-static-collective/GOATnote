/* GOATnote Receipt Relations 002.
 * Human-declared relation formation between frozen saved sources.
 * No reLATTE verification, source rewriting, automatic admission, or backdating.
 */
export const RELATION_SCHEMA='goatnote.receipt-relation/v0';
const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const requireIt=(x,reason)=>{if(!x)throw Error(reason);};
const iso=s=>typeof s==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(s)&&!Number.isNaN(Date.parse(s));
const clean=(x,max,label)=>{requireIt(typeof x==='string'&&x.trim().length>0&&x.trim().length<=max,'INVALID_'+label);return x.trim();};
const noteById=(db,id)=>db.notes.find(n=>n.id===id);
const head=n=>Array.isArray(n?.versions)&&n.versions.length?n.versions[n.versions.length-1]:null;
const sourceVersion=n=>{
 if(n.webzReceipt?.imported_from!=='EXPLICIT_WEBZ_HANDOFF')return head(n);
 const hash=n.webzReceipt.source_sha256;
 if(typeof hash!=='string'||!/^sha256:[a-f0-9]{64}$/.test(hash))return null;
 return n.versions?.find(v=>v.id==='webz-source-'+hash.slice(7))||null;
};
const address=n=>{
 const v=sourceVersion(n);
 requireIt(v&&typeof v.id==='string'&&typeof v.text==='string','NO_FROZEN_SOURCE');
 return {noteId:n.id,versionId:v.id,noteTitleAtAdd:n.title||'Untitled',anchor:null};
};
const sourceItem=(id,n,when)=>({id,kind:'source',noteId:n.id,versionId:sourceVersion(n).id,noteTitleAtAdd:n.title||'Untitled',anchor:null,addedAt:when});
const matches=(a,b)=>a.kind==='source'&&a.noteId===b.noteId&&a.versionId===b.versionId&&a.anchor===null;
export function receiptRelationCandidates(db){
 requireIt(object(db)&&db.schema===1&&Array.isArray(db.notes),'INVALID_GOATNOTE_DB');
 const notes=db.notes.filter(n=>typeof n.id==='string'&&sourceVersion(n)&&typeof sourceVersion(n).text==='string');
 return {receipts:notes.filter(n=>n.webzReceipt?.imported_from==='EXPLICIT_WEBZ_HANDOFF'&&
 typeof n.webzReceipt.source_sha256==='string'),targets:notes,
 rooms:Array.isArray(db.rooms)?db.rooms:[]};
}
export function prepareReceiptRelation(db,selection){
 const {receipts,targets,rooms}=receiptRelationCandidates(db);
 requireIt(Array.isArray(db.edges),'MISSING_EDGE_LIBRARY');
 requireIt(object(selection),'MISSING_HUMAN_SELECTION');
 const from=receipts.find(n=>n.id===selection.fromNoteId);
 const to=targets.find(n=>n.id===selection.toNoteId);
 requireIt(!!from&&!!to,'MISSING_SOURCE_NOTE');
 requireIt(from.id!==to.id,'SAME_SOURCE_ADDRESS');
 requireIt(selection.confirmed===true,'HUMAN_CONFIRMATION_REQUIRED');
 const when=clean(selection.recordedAt,40,'RECORD_TIME');
 requireIt(iso(when),'INVALID_RECORD_TIME');
 // Time is the local human recording clock, NOT signed source or occurrence time.
 const type=clean(selection.type,120,'RELATION_TYPE');
 const trace=clean(selection.discoveryTrace,2000,'DISCOVERY_TRACE');
 const path=clean(selection.evidencePath,2000,'EVIDENCE_PATH');
 const edgeId=clean(selection.edgeId,100,'EDGE_ID');
 const revisionId=clean(selection.revisionId,100,'REVISION_ID');
 const idA=clean(selection.fromItemId,100,'ROOM_SOURCE_ID');
 const idB=clean(selection.toItemId,100,'ROOM_TARGET_ID');
 const idEdge=clean(selection.edgeItemId,100,'ROOM_EDGE_ID');
 requireIt(!db.edges.some(e=>e.id===edgeId),'EDGE_ID_COLLISION');
 const edge={
  id:edgeId,from:address(from),to:address(to),type,
  firstPerceivedAt:when,discoveryTrace:trace,evidencePath:path,
  confidence:'low',status:'perceived',createdAt:when,updatedAt:when,
  receiptRelation:{
   schema:RELATION_SCHEMA,
   observedAt:when,
   sourceReceiptNoteId:from.id,
   sourceReceiptVersionId:sourceVersion(from).id,
   sourceReceiptSha256:from.webzReceipt.source_sha256,
   disclosure:'HUMAN_DECLARATION_ONLY',
   originalEndpointsLocked:true,
   relatteAuthority:'NONE'
  },
  history:[]
 };
 edge.history.push({id:revisionId,at:when,kind:'created',status:edge.status,
  confidence:edge.confidence,type,discoveryTrace:trace,evidencePath:path,
  firstPerceivedAt:when,
  from:structuredClone(edge.from),to:structuredClone(edge.to),
  note:'Human first perceived this connection at local record time; no claim of source-time knowledge or reLATTE admission.'
 });
 const newRooms=rooms.map(r=>({...r,items:[...r.items]}));
 let room;
 if(selection.roomId==='NEW'){
  const roomId=clean(selection.newRoomId,100,'ROOM_ID');
  requireIt(!newRooms.some(r=>r.id===roomId),'ROOM_ID_COLLISION');
  room={id:roomId,title:'Receipt Witness Room',createdAt:when,updatedAt:when,items:[]};
  newRooms.push(room);
 }else{
  room=newRooms.find(r=>r.id===selection.roomId);
  requireIt(!!room&&Array.isArray(room.items),'MISSING_SELECTED_ROOM');
 }
 const newItems=[sourceItem(idA,from,when),sourceItem(idB,to,when)];
 for(const item of newItems)if(!room.items.some(existing=>matches(existing,item)))room.items.push(item);
 room.items.push({id:idEdge,kind:'edge',edgeId:edge.id,edgeTypeAtAdd:edge.type,addedAt:when});
 room.updatedAt=when;
 const notebook={...db,edges:[...db.edges,edge],rooms:newRooms};
 return {notebook,edgeId,roomId:room.id,firstPerceivedAt:when,status:'perceived',
  admitted:false,receiptOwnerAuthority:false};
}
