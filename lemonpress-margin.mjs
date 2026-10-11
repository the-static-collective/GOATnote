/* GOATnote × LemonPRESS, selected-margin carrier v0.
 * Deliberate single-margin disclosure. No batch export or hidden-note crawl.
 * This is a human reading, not inherited source/admission authority.
 */
export const PRESS_MARGIN_SCHEMA='goatnote.lemonpress-margin/v0';
export const PRESS_MARGIN_POSTURE='PRIVATE_UNADMITTED_CANDIDATE';
const encoder=new TextEncoder();
const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const fail=(valid,message)=>{if(!valid)throw Error(message)};
const iso=v=>typeof v==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(v)&&
 !Number.isNaN(new Date(v).getTime());
const bounded=(s,n)=>typeof s==='string'&&s.length>0&&s.length<=n;
const canonical=x=>x===null||typeof x!=='object'?JSON.stringify(x):
 Array.isArray(x)?'['+x.map(canonical).join(',')+']':
 '{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+canonical(x[k])).join(',')+'}';
const digest=async text=>'sha256:'+Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(text))),
 n=>n.toString(16).padStart(2,'0')).join('');
const allowedKinds=['witness','question','interpretation','correction','carry','connection'];
const allowedStatus=['perceived','proposed','admitted','weakened','refused','unresolved'];
const exactAddress=(addr,noteId,versionId)=>object(addr)&&addr.noteId===noteId&&
 addr.versionId===versionId&&(addr.anchor==null);
export function listPressMarginChoices(db){
 fail(object(db)&&db.schema===1&&Array.isArray(db.notes),'INVALID_GOATNOTE');
 const notes=db.notes.map(n=>({
  id:n.id,title:n.title||'Untitled',margins:Array.isArray(n.margins)?n.margins.filter(m=>{
   const v=n.versions?.find(v=>v.id===m.versionId);
   return v&&object(m.anchor)&&Number.isInteger(m.anchor.start)&&
    Number.isInteger(m.anchor.end)&&m.anchor.end>m.anchor.start&&m.anchor.start>=0&&
    typeof m.anchor.quote==='string'&&v.text.slice(m.anchor.start,m.anchor.end)===m.anchor.quote;
  }).map(m=>({id:m.id,versionId:m.versionId,kind:m.kind,
   label:String(m.kind||'margin')+' · '+String(m.anchor.quote).slice(0,72)})):[]
 })).filter(n=>n.margins.length);
 return notes;
}
export function listPressEdges(db,noteId,versionId){
 const edges=Array.isArray(db.edges)?db.edges:[];
 return edges.filter(e=>(exactAddress(e.from,noteId,versionId)||
  exactAddress(e.to,noteId,versionId))&&allowedStatus.includes(e.status))
  .map(e=>({id:e.id,label:(e.type||'relation')+' · '+e.status}));
}
export async function makePressMarginCarrier(db,{noteId,marginId,edgeId=null,selectedAt=new Date().toISOString()}={}){
 fail(object(db)&&db.schema===1&&Array.isArray(db.notes),'INVALID_GOATNOTE');
 fail(iso(selectedAt),'INVALID_SELECTION_TIME');
 const note=db.notes.find(n=>n.id===noteId);
 fail(note&&Array.isArray(note.versions)&&Array.isArray(note.margins),'UNRESOLVED_SOURCE_NOTE');
 const margin=note.margins.find(m=>m.id===marginId);
 const version=margin&&note.versions.find(v=>v.id===margin.versionId);
 fail(margin&&version&&typeof version.text==='string','UNRESOLVED_SAVED_SOURCE');
 const a=margin.anchor;
 fail(object(a)&&Number.isInteger(a.start)&&Number.isInteger(a.end)&&a.start>=0&&
  a.end>a.start&&a.end<=version.text.length&&
  bounded(a.quote,2000)&&version.text.slice(a.start,a.end)===a.quote,
  'EXACT_SOURCE_PASSAGE_REQUIRED');
 fail(allowedKinds.includes(margin.kind)&&bounded(margin.text,6000)&&
  bounded(margin.id,256)&&bounded(version.id,256)&&bounded(note.id,256)&&
  bounded(note.title,300),'INVALID_SELECTED_MARGIN');
 fail(iso(margin.createdAt),'INVALID_MARGIN_TIMESTAMP');
 const source={
  note_id:note.id,version_id:version.id,version_sha256:await digest(version.text),
  title:note.title,excerpt:a.quote,excerpt_start:a.start,excerpt_end:a.end,
  excerpt_sha256:await digest(a.quote),version_body_disclosed:false
 };
 const reading={margin_id:margin.id,kind:margin.kind,text:margin.text,recorded_at:margin.createdAt};
 let relation=null;
 if(edgeId!==null){
  const edge=Array.isArray(db.edges)?db.edges.find(e=>e.id===edgeId):null;
  fail(edge&&(exactAddress(edge.from,note.id,version.id)||
    exactAddress(edge.to,note.id,version.id)),'RELATION_NOT_BOUND_TO_SELECTED_SOURCE');
  fail(bounded(edge.id,256)&&bounded(edge.type,120)&&
   allowedStatus.includes(edge.status)&&iso(edge.firstPerceivedAt)&&
   bounded(edge.discoveryTrace,2000)&&bounded(edge.evidencePath,2000),
   'INVALID_HUMAN_RELATION');
  relation={
   edge_id:edge.id,relation_type:edge.type,first_perceived_at:edge.firstPerceivedAt,
   recorded_current_status:edge.status,discovery_trace:edge.discoveryTrace,
   evidence_path:edge.evidencePath,read_only:true,
   locally_admitted_means_press_admitted:false
  };
 }
 const unsigned={
  schema:PRESS_MARGIN_SCHEMA,posture:PRESS_MARGIN_POSTURE,
  selection:{selected_at:selectedAt,method:'HUMAN_EXPLICIT_ONE_MARGIN',
   scope:'LOCAL_DOWNLOAD_ONLY',publication_grant:false},
  source,reading,relation,
  authority:{goatnote_margin_is_source:false,press_admission:false,
   house_release:false,signer_authenticated:false,version_bytes_included:false}
 };
 const checksum=await digest('GOATNOTE-LEMONPRESS-MARGIN-001|'+canonical(unsigned));
 const packet={...unsigned,checksum};
 fail(encoder.encode(JSON.stringify(packet)).length<=32768,'MARGIN_CARRIER_TOO_LARGE');
 return packet;
}
