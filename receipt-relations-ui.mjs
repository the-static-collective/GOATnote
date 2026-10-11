/* Human-declared receipt relations. Distinct from reLATTE ancestry verification.
 * One explicit GOATnote localStorage transaction creates relation + Room membership.
 */
import {receiptRelationCandidates,prepareReceiptRelation} from './receipt-relations.mjs';
const KEY='goatnote-v1';
const $=id=>document.getElementById(id);
const el=(tag,text='')=>{const e=document.createElement(tag);if(text)e.textContent=text;return e;};
const load=()=>{const raw=localStorage.getItem(KEY);return raw?JSON.parse(raw):{schema:1,notes:[],walks:[],rooms:[],edges:[]};};
const dlg=$('receiptRelationDialog');
const source=$('rr-from'),target=$('rr-to'),room=$('rr-room'),form=$('receiptRelationForm'),message=$('rr-message');
const option=(value,label)=>{const item=el('option',label);item.value=value;return item;};
const describe=n=>(n.title||'Untitled')+' · '+n.id.slice(0,24);
const refresh=()=>{
 const c=receiptRelationCandidates(load());
 for(const select of [source,target,room])select.replaceChildren();
 source.append(option('','Select imported receipt…'));
 for(const n of c.receipts)source.append(option(n.id,describe(n)));
 target.append(option('','Choose another saved source…'));
 for(const n of c.targets)target.append(option(n.id,describe(n)));
 room.append(option('NEW','New Receipt Witness Room'));
 for(const r of c.rooms)room.append(option(r.id,r.title||r.id));
 source.disabled=!c.receipts.length;
 target.disabled=!c.targets.length;
 message.textContent=c.receipts.length?'Choose an imported receipt and a distinct saved source.':'Import a WebZ receipt first. No sources have been changed.';
};
$('openReceiptRelations').addEventListener('click',()=>{
 try{refresh();dlg.showModal();}catch(err){$('status').textContent='Receipt relations unavailable: '+String(err?.message||'invalid notebook');}
});
$('closeReceiptRelations').addEventListener('click',()=>dlg.close());
form.addEventListener('submit',e=>{
 e.preventDefault();
 try{
  const before=load(), when=new Date().toISOString(),uuid=()=>crypto.randomUUID();
  const selection={
   fromNoteId:source.value,toNoteId:target.value,roomId:room.value,
   newRoomId:uuid(),edgeId:uuid(),revisionId:uuid(),fromItemId:uuid(),
   toItemId:uuid(),edgeItemId:uuid(),recordedAt:when,
   type:$('rr-type').value,
   discoveryTrace:$('rr-discovery').value,
   evidencePath:$('rr-evidence').value,confirmed:true
  };
  const result=prepareReceiptRelation(before,selection);
  const consent=confirm(
   'Record this as a NEW HUMAN-PERCEIVED relation dated '+when+
   '? It will create a non-traversable GOATedge and place it with frozen sources in '+(
     room.value==='NEW'?'a new Receipt Witness Room':'your chosen Room'
   )+'. TIME-CUT will read its history but cannot authorize a historical crossing. Existing notes stay unchanged. Save unsaved drafts before continuing; the page will reload.'
  );
  if(!consent){message.textContent='No relation recorded.';return;}
  // Build and persist the proposed notebook in a single setItem, avoiding
  // partial commits of edge-versus-room state.
  localStorage.setItem(KEY,JSON.stringify(result.notebook));
  window.location.reload();
 }catch(err){message.textContent='Relation not recorded: '+String(err?.message||'invalid selection').slice(0,160);}
});
