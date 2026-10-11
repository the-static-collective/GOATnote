/* GOATnote Recovery Gate 003.
 * No file import writes until explicit user action into an EMPTY notebook.
 * Ordinary full-notebook replacement remains a separate native action.
 */
import {BYTE_LIMIT,sealRecovery,inspectRecovery,prepareRestore} from './recovery.mjs';
const KEY='goatnote-v1';
const $=id=>document.getElementById(id);
const modal=$('goatRecoveryDialog'),pick=$('grc-file'),result=$('grc-result'),typed=$('grc-word'),
 restore=$('grc-restore'),preview=$('grc-preview');
const empty=()=>({schema:1,notes:[],walks:[],rooms:[],edges:[]});
let staged=null;
function current(){
 const raw=localStorage.getItem(KEY);
 return raw?JSON.parse(raw):empty();
}
function reset(note='Choose a backup file for a read-only inspection.'){
 staged=null;typed.value='';restore.disabled=true;preview.hidden=true;
 result.textContent=note;
}
function download(json,filename){
 const blob=new Blob([json],{type:'application/json;charset=utf-8'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
}
$('openRecovery').addEventListener('click',()=>{reset();modal.showModal();});
$('grc-close').addEventListener('click',()=>modal.close());
$('grc-export').addEventListener('click',async()=>{
 try{
  // Existing inline editor first synchronously flushes any unsaved draft.
  const api=window.GOATnoteWalkAPI;
  if(typeof api?.getNotebookSnapshot!=='function')throw Error('NOTEBOOK_SNAPSHOT_UNAVAILABLE');
  const {bundle,report}=await sealRecovery(api.getNotebookSnapshot());
  download(JSON.stringify(bundle,null,2)+'\n','GOATnote-recovery-'+new Date().toISOString().slice(0,10)+'.json');
  result.textContent='Downloaded a complete, locally self-checksummed backup: '+
   report.noteCount+' notes; '+report.edgeCount+' edges; '+report.roomCount+' Rooms. '+
   'Keep the file somewhere YOU control. It is plain text, not encrypted or authenticated.';
 }catch(e){result.textContent='Backup export refused: '+String(e?.message||e).slice(0,160);}
});
pick.addEventListener('change',async()=>{
 const file=pick.files?.[0];pick.value='';reset('Inspecting selected file locally…');
 if(!file)return;
 if(file.size>BYTE_LIMIT){reset('Refused: backup exceeds 8 MiB limit.');return;}
 try{
  const inspection=await inspectRecovery(await file.text());
  staged=inspection;
  const r=inspection.report;
  const existing=current();
  const occupied=existing.notes.length||existing.edges.length||existing.rooms.length||existing.walks.length;
  const warning=occupied?
   'This browser already has a notebook. Safe restore here is blocked; export your current notebook first. Use the separate native Import backup for an intentional replacement.':
   'This browser notebook is empty. You may restore these exact checked source records after typing RESTORE.';
  result.textContent=inspection.integrity+' · '+r.noteCount+' notes, '+r.versionCount+
   ' saved versions, '+r.marginCount+' margins, '+r.threadCount+' Return Threads, '+
   r.edgeCount+' edges, '+r.roomCount+' Rooms, '+r.walkCount+' Walks, '+
   r.humanReceiptRelations+' receipt relationships. '+
   r.unresolvedCount+' unresolved addresses preserved, not rebound. '+warning;
  preview.hidden=false;
  restore.disabled=!!occupied;
  if(occupied)typed.disabled=true;else typed.disabled=false;
  update();
 }catch(e){reset('Recovery inspection refused: '+String(e?.message||e).slice(0,160));}
});
function update(){
 restore.disabled=!staged||typed.disabled||typed.value.trim()!=='RESTORE';
}
typed.addEventListener('input',update);
restore.addEventListener('click',()=>{
 if(!staged||typed.value.trim()!=='RESTORE')return;
 try{
  const db=prepareRestore(staged,current(),{approved:true,emptyOnly:true});
  if(!confirm('Restore this inspected notebook into this EMPTY browser? This is local-only, and the source backup file remains yours. No receipt authority is granted.'))return;
  // One localStorage write; no piecemeal source/edge/room restoration.
  localStorage.setItem(KEY,JSON.stringify(db));
  window.location.reload();
 }catch(e){result.textContent='Restore refused: '+String(e?.message||e).slice(0,160);}
});
