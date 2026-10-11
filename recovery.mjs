/* GOATnote RECOVERY-GATE-003.
 * Durable manual file transport of the complete browser notebook.
 * SHA-256 is a self-check for altered bytes, never signer authentication.
 * Pure module: no storage, network, cookies, keys, authority or auto import.
 */
export const RECOVERY_SCHEMA='goatnote.recovery-bundle/v0';
export const POSTURE='SELF_CHECKSUM_NOT_AUTHENTICATED';
export const BYTE_LIMIT=8*1024*1024;
const te=new TextEncoder();
const obj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const check=(v,message)=>{if(!v)throw Error(message);};
const time=s=>typeof s==='string'&&!Number.isNaN(Date.parse(s));
const bounded=(s,max)=>typeof s==='string'&&s.length<=max;
const id=s=>bounded(s,256)&&s.length>0;
const stamp=s=>typeof s==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(s)&&time(s);
const exact=(x,names)=>{
 check(obj(x)&&Object.keys(x).length===names.length&&names.every(n=>Object.hasOwn(x,n)),'RECOVERY_UNEXPECTED_FIELDS');
};
const canonical=x=>{
 if(x===null||typeof x!=='object')return JSON.stringify(x);
 if(Array.isArray(x))return '['+x.map(canonical).join(',')+']';
 return '{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+canonical(x[k])).join(',')+'}';
};
const hex=async s=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',te.encode(s))),n=>n.toString(16).padStart(2,'0')).join('');
const legalStatus=new Set(['perceived','proposed','admitted','weakened','refused','unresolved']);
const legalConfidence=new Set(['low','medium','high']);
const address=x=>obj(x)&&id(x.noteId)&&id(x.versionId)&&bounded(x.noteTitleAtAdd,256)&&
 (x.anchor==null||(obj(x.anchor)&&Number.isInteger(x.anchor.start)&&
 Number.isInteger(x.anchor.end)&&x.anchor.start>=0&&x.anchor.end>x.anchor.start&&
 bounded(x.anchor.quote,4096)&&x.anchor.quote.length===x.anchor.end-x.anchor.start));
const event=x=>obj(x)&&id(x.id)&&time(x.at)&&bounded(x.kind,100)&&legalStatus.has(x.status)&&
 legalConfidence.has(x.confidence)&&(!x.from||address(x.from))&&(!x.to||address(x.to));
export function inspectNotebook(db){
 check(obj(db)&&db.schema===1&&Array.isArray(db.notes)&&Array.isArray(db.edges)&&
  Array.isArray(db.rooms)&&Array.isArray(db.walks),'RECOVERY_SCHEMA_1_REQUIRED');
 check(db.notes.length<=100000&&db.edges.length<=100000&&
  db.rooms.length<=50000&&db.walks.length<=50000,'RECOVERY_COLLECTION_LIMIT');
 const noteMap=new Map(),edgeMap=new Map(),unresolved=[];
 let versions=0,margins=0,threads=0,receiptSources=0,receiptRelations=0;
 for(const n of db.notes){
  check(obj(n)&&id(n.id)&&!noteMap.has(n.id)&&bounded(n.title,4096)&&
   bounded(n.draft,2*1024*1024)&&Array.isArray(n.versions)&&n.versions.length>0&&
   Array.isArray(n.margins),'INVALID_RECOVERY_NOTE');
  const versionMap=new Map();
  for(const v of n.versions){
   check(obj(v)&&id(v.id)&&!versionMap.has(v.id)&&bounded(v.text,2*1024*1024),'INVALID_RECOVERY_VERSION');
   versionMap.set(v.id,v);versions++;
  }
  for(const m of n.margins){
   check(obj(m)&&id(m.id)&&id(m.versionId)&&bounded(m.text,32768),'INVALID_RECOVERY_MARGIN');
   const v=versionMap.get(m.versionId);
   if(!v){unresolved.push('margin:missing-source-version:'+m.versionId);}
   else if(m.anchor!=null){
    check(obj(m.anchor)&&Number.isInteger(m.anchor.start)&&Number.isInteger(m.anchor.end)&&
      typeof m.anchor.quote==='string'&&m.anchor.start>=0&&m.anchor.end>m.anchor.start,'INVALID_RECOVERY_MARGIN_ANCHOR');
    if(v.text.slice(m.anchor.start,m.anchor.end)!==m.anchor.quote)unresolved.push('margin:anchor-mismatch:'+m.id);
   }
   margins++;
  }
  if(n.returnThreads!==undefined){
   check(Array.isArray(n.returnThreads),'INVALID_RETURN_THREADS');
   for(const t of n.returnThreads){
    check(obj(t)&&id(t.id)&&id(t.sourceVersionId)&&Array.isArray(t.entries),'INVALID_RETURN_THREAD');
    if(!versionMap.has(t.sourceVersionId))unresolved.push('thread:missing-source-version:'+t.id);
    threads++;
   }
  }
  if(n.webzReceipt!==undefined){
   const wr=n.webzReceipt;
   check(obj(wr)&&wr.imported_from==='EXPLICIT_WEBZ_HANDOFF'&&
    /^sha256:[a-f0-9]{64}$/.test(wr.source_sha256||'')&&
    versionMap.has('webz-source-'+wr.source_sha256.slice(7))&&
    wr.goatnote_signature_verified===false&&wr.human_signer_authenticated===false,
    'WEBZ_FROZEN_SOURCE_INCONSISTENT');
   receiptSources++;
  }
  noteMap.set(n.id,{note:n,versions:versionMap});
 }
 for(const e of db.edges){
  check(obj(e)&&id(e.id)&&!edgeMap.has(e.id)&&address(e.from)&&address(e.to)&&
   legalStatus.has(e.status)&&legalConfidence.has(e.confidence)&&time(e.firstPerceivedAt)&&
   bounded(e.type,500)&&Array.isArray(e.history||[]),'INVALID_RECOVERY_EDGE');
  for(const endpoint of [e.from,e.to]){
   const n=noteMap.get(endpoint.noteId),v=n?.versions.get(endpoint.versionId);
   if(!v)unresolved.push('edge:unresolved-endpoint:'+e.id+':'+endpoint.noteId);
   else if(endpoint.anchor!=null&&v.text.slice(endpoint.anchor.start,endpoint.anchor.end)!==endpoint.anchor.quote)
    unresolved.push('edge:anchor-mismatch:'+e.id);
  }
  for(const h of e.history||[])check(event(h),'INVALID_RECOVERY_EDGE_REVISION');
  if(e.receiptRelation!==undefined){
   const r=e.receiptRelation,from=noteMap.get(e.from.noteId);
   check(obj(r)&&r.schema==='goatnote.receipt-relation/v0'&&r.originalEndpointsLocked===true&&
    r.relatteAuthority==='NONE'&&r.disclosure==='HUMAN_DECLARATION_ONLY'&&
    stamp(r.observedAt)&&r.observedAt===e.firstPerceivedAt&&
    r.sourceReceiptNoteId===e.from.noteId&&r.sourceReceiptVersionId===e.from.versionId&&
    r.sourceReceiptSha256===from?.note.webzReceipt?.source_sha256&&
    (e.history||[]).length>0&&e.history[0].at===r.observedAt&&
    e.history[0].status==='perceived'&&e.history[0].kind==='created'&&
    canonical(e.history[0].from)===canonical(e.from)&&
    canonical(e.history[0].to)===canonical(e.to),
    'RECEIPT_RELATION_SOURCE_OR_BIRTH_CHANGED');
   receiptRelations++;
  }
  edgeMap.set(e.id,e);
 }
 const seenRooms=new Set();
 for(const room of db.rooms){
  check(obj(room)&&id(room.id)&&!seenRooms.has(room.id)&&
   bounded(room.title,4096)&&Array.isArray(room.items),'INVALID_RECOVERY_ROOM');
  seenRooms.add(room.id);
  for(const item of room.items){
   check(obj(item)&&id(item.id),'INVALID_RECOVERY_ROOM_ITEM');
   if(item.kind==='edge'&&!edgeMap.has(item.edgeId))unresolved.push('room:missing-edge:'+item.edgeId);
   else if(item.kind==='source'){
    const n=noteMap.get(item.noteId);
    if(!n?.versions.has(item.versionId))unresolved.push('room:missing-source:'+item.noteId);
   }
   else if(item.kind!=='edge'&&item.kind!=='walk'&&item.kind!=='source'&&item.kind!==undefined)
    throw Error('INVALID_RECOVERY_ROOM_ITEM_KIND');
  }
 }
 const walkMap=new Map();
 for(const w of db.walks){
  check(obj(w)&&id(w.id)&&!walkMap.has(w.id)&&Array.isArray(w.stops),'INVALID_RECOVERY_WALK');
  walkMap.set(w.id,w);
 }
 for(const w of db.walks){
  for(const stop of w.stops){
   check(obj(stop)&&id(stop.id),'INVALID_RECOVERY_WALK_STOP');
   if(stop.kind==='edge'&&!edgeMap.has(stop.edgeId))unresolved.push('walk:missing-edge:'+stop.edgeId);
   else if(stop.kind==='walk'&&!walkMap.has(stop.walkId))unresolved.push('walk:missing-walk:'+stop.walkId);
   else if(stop.kind==='source'||stop.kind===undefined){
    if(!noteMap.get(stop.noteId)?.versions.has(stop.versionId))unresolved.push('walk:missing-source:'+stop.noteId);
   }
  }
 }
 for(const room of db.rooms)for(const item of room.items)
  if(item.kind==='walk'&&!walkMap.has(item.walkId))unresolved.push('room:missing-walk:'+item.walkId);
 check(unresolved.length<=20000,'UNRESOLVED_REFERENCE_LIMIT');
 return Object.freeze({schema:'goatnote.recovery-inspection/v0',noteCount:db.notes.length,
  versionCount:versions,marginCount:margins,threadCount:threads,edgeCount:db.edges.length,
  roomCount:db.rooms.length,walkCount:db.walks.length,webzReceiptSources:receiptSources,
  humanReceiptRelations:receiptRelations,unresolvedCount:unresolved.length,
  unresolved:unresolved.slice(0,12),authority:'NO_EXTERNAL_AUTHORITY'});
}
export async function sealRecovery(db,createdAt=new Date().toISOString()){
 const report=inspectNotebook(db);
 check(stamp(createdAt),'INVALID_RECOVERY_EXPORT_TIME');
 const notebook=JSON.parse(JSON.stringify(db));
 const body={schema:RECOVERY_SCHEMA,posture:POSTURE,created_at:createdAt,notebook};
 check(te.encode(JSON.stringify(body)).length<=BYTE_LIMIT,'RECOVERY_IMPORT_LIMIT_8MB');
 return {bundle:{...body,checksum:'sha256:'+await hex('GOATNOTE-RECOVERY-001|'+canonical(body))},report};
}
export async function inspectRecovery(raw){
 check(typeof raw==='string'&&te.encode(raw).length<=BYTE_LIMIT,'RECOVERY_IMPORT_LIMIT_8MB');
 let parsed;
 try{parsed=JSON.parse(raw);}catch{throw Error('RECOVERY_JSON_INVALID');}
 let notebook=parsed,integrity='LEGACY_UNSIGNED_BACKUP';
 if(parsed?.schema===RECOVERY_SCHEMA){
  exact(parsed,['schema','posture','created_at','notebook','checksum']);
  const {checksum,...body}=parsed;
  check(parsed.posture===POSTURE&&stamp(parsed.created_at)&&
   typeof checksum==='string'&&/^sha256:[a-f0-9]{64}$/.test(checksum),
   'RECOVERY_BUNDLE_INVALID');
  check('sha256:'+await hex('GOATNOTE-RECOVERY-001|'+canonical(body))===checksum,
   'RECOVERY_CHECKSUM_MISMATCH');
  integrity='SELF_CHECKSUM_VALID_NOT_AUTHENTICATED';
  notebook=parsed.notebook;
 }
 const report=inspectNotebook(notebook);
 return {notebook,report,integrity};
}
export function prepareRestore(staged,current,{approved=false,emptyOnly=true}={}){
 check(approved===true,'RESTORE_EXPLICIT_APPROVAL_REQUIRED');
 check(staged?.notebook&&staged.report,'RESTORE_NOT_INSPECTED');
 inspectNotebook(staged.notebook);
 inspectNotebook(current);
 if(emptyOnly)check(current.notes.length===0&&current.edges.length===0&&
  current.rooms.length===0&&current.walks.length===0,'RESTORE_REQUIRES_EMPTY_NOTEBOOK');
 return JSON.parse(JSON.stringify(staged.notebook));
}
