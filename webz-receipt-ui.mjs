/* Selected WEBZ receipt handoff, distinct from replacing notebook backups.
 * The reader checks integrity, NOT native reLATTE signatures or owner identity.
 */
import {mergeWebzReceipt,verifyWebzHandoff} from './webz-receipt.mjs';
const button=document.getElementById('importWebzReceipt');
const picker=document.getElementById('webzReceiptFile');
const status=document.getElementById('status');
const KEY='goatnote-v1';
button.addEventListener('click',()=>picker.click());
picker.addEventListener('change',async()=>{
 const file=picker.files?.[0];picker.value='';
 if(!file)return;
 try{
  if(file.size>220000)throw Error('WEBZ_HANDOFF_TOO_LARGE');
  const packet=JSON.parse(await file.text());
  await verifyWebzHandoff(packet);
  const consent=confirm('Add this WebZ receipt witness as a frozen GOATnote source, with source-anchored witness/question margins and a Return Thread? Existing notes stay. GOATnote has only checked handoff/source checksums, NOT original reLATTE signatures or real-world signer identity. Save unsaved drafts before continuing: this will reload the notebook.');
  if(!consent)return;
  const previous=localStorage.getItem(KEY);
  const db=previous?JSON.parse(previous):{schema:1,notes:[],walks:[],rooms:[],edges:[]};
  const merged=await mergeWebzReceipt(db,packet,true);
  if(merged.added){
   localStorage.setItem(KEY,JSON.stringify(merged.notebook));
   window.location.reload();
  }else status.textContent='Receipt source already present. Later human margins and Return Threads were preserved.';
 }catch(err){
  status.textContent='Receipt handoff refused: '+String(err?.message||'INVALID_HANDOFF').slice(0,120);
 }
});
