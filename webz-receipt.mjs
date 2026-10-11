/* GOATnote × WEBZ-RECEIPT-GLASS-002.
 * An explicit, source-frozen third-party witness import.
 * A user-controlled import never grants receiver authority or claims GOATnote
 * independently verified reLATTE P-256 signatures.
 */
export const SCHEMA='webz.goatnote-receipt-handoff/v0';
const enc=new TextEncoder();
const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
function exact(v,keys){
 if(!object(v)||Object.keys(v).length!==keys.length||keys.some(k=>!Object.hasOwn(v,k)))throw Error('EXACT_HANDOFF_FIELDS_REQUIRED');
}
function canonical(v){
 if(v===null||typeof v!=='object')return JSON.stringify(v);
 if(Array.isArray(v))return '['+v.map(canonical).join(',')+']';
 return '{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}';
}
const hash=async s=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(s))),n=>n.toString(16).padStart(2,'0')).join('');
const safe=(yes,why)=>{if(!yes)throw Error(why);};
const kinds=['gro.abundent-signed-receiver/v0','relatte.crossing-envelope/v0','relatte.receipt/v0','cannon.branch-work-receipt/v0'];
const statuses=['VERIFIED_OBJECT','REFERENCE_ONLY','ARCHIVE_CLAIM'];
const links=['VERIFIED_JOURNAL_LINK','SIGNED_REFERENCE_ONLY','ARCHIVE_CLAIM'];
const modes=['SIGNATURE_ONLY','LOCAL_JOURNAL_VERIFIED','UNVERIFIED_ARCHIVE'];
export async function verifyWebzHandoff(packet){
 exact(packet,['schema','origin','authority','created_at','source','inspection','ancestry','checksum']);
 safe(packet.schema===SCHEMA&&packet.origin==='WEBZ_USER_EXPLICIT_EXPORT'&&packet.authority==='NO_AUTHORITY_TRANSFER','INVALID_HANDOFF_AUTHORITY');
 safe(typeof packet.created_at==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(packet.created_at),'INVALID_HANDOFF_TIME');
 const {checksum,...unsigned}=packet;
 safe(typeof checksum==='string'&&/^sha256:[a-f0-9]{64}$/.test(checksum),'INVALID_HANDOFF_CHECKSUM');
 safe(checksum==='sha256:'+await hash('WEBZ-GOATNOTE-RECEIPT-001|'+canonical(unsigned)),'HANDOFF_CHECKSUM_MISMATCH');
 const s=packet.source;
 exact(s,['schema','bytes','sha256','json']);
 safe(kinds.includes(s.schema)&&typeof s.json==='string'&&Number.isInteger(s.bytes)&&s.bytes>0&&s.bytes<=131072&&enc.encode(s.json).length===s.bytes,'INVALID_SOURCE_BYTES');
 safe(/^sha256:[a-f0-9]{64}$/.test(s.sha256)&&s.sha256==='sha256:'+await hash(s.json),'SOURCE_BYTES_CHANGED');
 let src;
 try{src=JSON.parse(s.json);}catch{throw Error('INVALID_SOURCE_JSON');}
 safe(object(src)&&src.schema===s.schema,'SOURCE_SCHEMA_MISMATCH');
 const i=packet.inspection;
 exact(i,['type','mode','cryptographic_verification','fields','steps']);
 safe(typeof i.type==='string'&&i.type.length<=120&&modes.includes(i.mode)&&
   i.cryptographic_verification===(i.mode!=='UNVERIFIED_ARCHIVE')&&object(i.fields)&&
   Object.keys(i.fields).length<=30&&Array.isArray(i.steps)&&i.steps.length>0&&i.steps.length<=20,'UNSUPPORTED_INSPECTION');
 const profile={
  'gro.abundent-signed-receiver/v0':['GrO signed local journal','LOCAL_JOURNAL_VERIFIED'],
  'relatte.crossing-envelope/v0':['reLATTE signed crossing','SIGNATURE_ONLY'],
  'relatte.receipt/v0':['reLATTE signed receipt','SIGNATURE_ONLY'],
  'cannon.branch-work-receipt/v0':['CANNON archived run report','UNVERIFIED_ARCHIVE']
 }[s.schema];
 safe(i.type===profile[0]&&i.mode===profile[1],'SOURCE_INSPECTION_PROFILE_MISMATCH');
 for(const step of i.steps){
  exact(step,['stage','id','detail']);
  safe(typeof step.stage==='string'&&step.stage.length<=120&&
  typeof step.id==='string'&&step.id.length<=256&&
  typeof step.detail==='string'&&step.detail.length<=1500,'INVALID_INSPECTION_STEP');
 }
 const a=packet.ancestry;
 exact(a,['schema','reconstruction','nodes','edges','missing','historical_crossing_authorized']);
 safe(a.schema==='webz/receipt-ancestry/v0'&&a.reconstruction==='BOUND_ONLY_TO_SUPPLIED_EVIDENCE'&&
  a.historical_crossing_authorized===false&&typeof a.missing==='string'&&a.missing.length<=512&&
  Array.isArray(a.nodes)&&a.nodes.length>0&&a.nodes.length<=32&&
  Array.isArray(a.edges)&&a.edges.length<=32,'INVALID_ANCESTRY');
 const ids=new Set();
 for(const n of a.nodes){
  exact(n,['id','label','posture']);
  safe(typeof n.id==='string'&&n.id.length>0&&n.id.length<=256&&
   typeof n.label==='string'&&n.label.length<=120&&statuses.includes(n.posture)&&!ids.has(n.id),'BAD_ANCESTRY_NODE');
  ids.add(n.id);
 }
 for(const e of a.edges){
  exact(e,['from','to','relation','posture']);
  safe(ids.has(e.from)&&ids.has(e.to)&&typeof e.relation==='string'&&e.relation.length<=90&&links.includes(e.posture),'BAD_ANCESTRY_LINK');
 }
 // Cryptographic integrity of an unsigned handoff is NOT authentication.
 // An attacker can alter everything and recompute both SHA-256 checksums.
 return packet;
}
const short=s=>s.replace(/[\r\n\t]/g,' ').slice(0,1000);
export async function projectWebzReceiptNote(packet){
 const h=await verifyWebzHandoff(packet),s=h.source,i=h.inspection,a=h.ancestry;
 const stem=s.sha256.slice(7);
 const id='webz-receipt-'+stem,versionId='webz-source-'+stem;
 const at=new Date().toISOString(); // Local import time, not signed occurrence time.
 const lines=[
  'WEBZ → GOATnote · source-bound receipt witness',
  'SOURCE IS FROZEN; ALL VERIFICATION POSTURES ARE IMPORTED CLAIMS',
  'Source schema: '+s.schema,
  'Original source SHA-256: '+s.sha256,
  'WEBZ reported mode: '+i.mode,
  'GOATnote independently checked: handoff checksum and original source SHA-256 ONLY.',
  'GOATnote did NOT independently verify ECDSA signatures, personhood, admission, state or remote custody.',
  'This imported source is not authority over either original world.',
  'Packet export time (not occurrence): '+h.created_at,
  '',
  'WEBZ reported steps:'
 ];
 const anchors=[];
 for(let index=0;index<i.steps.length;index++){
  const x=i.steps[index];
  const line=(index+1)+'. '+short(x.stage)+' — '+short(x.id);
  const start=lines.join('\n').length+1;
  lines.push(line);
  anchors.push({start,end:start+line.length,quote:line});
 }
 lines.push('','WEBZ reported ancestry (relationships are separately qualified):');
 for(const e of a.edges)lines.push(short(e.from)+' → '+short(e.to)+' : '+short(e.relation)+' ['+e.posture+']');
 lines.push('','UNRESOLVED: '+a.missing,'',
   'Exact source JSON (byte-for-byte UTF-8 text of the imported WEBZ source):','',s.json);
 const body=lines.join('\n');
 const margins=i.steps.flatMap((x,k)=>[
  {id:'webz-witness-'+stem+'-'+k,kind:'witness',text:'Imported WEBZ observation (not independently verified by GOATnote): '+short(x.detail),
   versionId,anchor:anchors[k],createdAt:at},
  {id:'webz-question-'+stem+'-'+k,kind:'question',
   text:'What can independently corroborate this step, including missing bytes, signer identity, and world-local authority?',
   versionId,anchor:anchors[k],createdAt:at}
 ]);
 const thread={id:'webz-return-'+stem,sourceVersionId:versionId,createdAt:at,entries:[
  {id:'webz-return-question-'+stem,kind:'question',text:'Which ancestor, contradiction, or missing independent witness should be examined next?',createdAt:at},
  {id:'webz-return-carry-'+stem,kind:'carry',text:'Keep raw evidence, imported verification claims, later notes and local authority distinct. No automatic traversal.',createdAt:at}
 ]};
 return {id,title:'Receipt witness · '+stem.slice(0,12),createdAt:at,updatedAt:at,
  draft:body,versions:[{id:versionId,title:'Original imported source',text:body,createdAt:at}],
  margins,returnThreads:[thread],
  webzReceipt:{source_sha256:s.sha256,source_schema:s.schema,
   reported_mode:i.mode,goatnote_signature_verified:false,human_signer_authenticated:false,
   imported_from:'EXPLICIT_WEBZ_HANDOFF',evidence_relation_posture:'NO_AUTHORITY_TRANSFER'}
 };
}
export async function mergeWebzReceipt(db,packet,consented=false){
 safe(consented===true,'EXPLICIT_IMPORT_REQUIRED');
 safe(object(db)&&db.schema===1&&Array.isArray(db.notes),'INVALID_NOTEBOOK');
 const note=await projectWebzReceiptNote(packet);
 const present=db.notes.find(n=>n.id===note.id);
 if(present){
  safe(Array.isArray(present.versions)&&
   present.versions.some(v=>v.id===note.versions[0].id&&v.text===note.versions[0].text)&&
   present.webzReceipt?.source_sha256===note.webzReceipt.source_sha256,
   'SOURCE_COLLISION_OR_CHANGED_RECORD');
  return {notebook:db,added:false,noteId:note.id};
 }
 safe(!db.notes.some(n=>n.versions?.some(v=>v.id===note.versions[0].id)),'VERSION_ID_COLLISION');
 return {notebook:{...db,notes:[note,...db.notes]},added:true,noteId:note.id};
}
