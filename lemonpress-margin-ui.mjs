/* Human-triggered one-margin export to a private LemonPRESS editorial candidate.
 * No source-version body, whole notebook, or unrelated margin is carried.
 */
import {listPressMarginChoices,listPressEdges,makePressMarginCarrier}
 from './lemonpress-margin.mjs';
const $=id=>document.getElementById(id),key='goatnote-v1';
const dialog=$('lemonPressDialog'),source=$('lpm-note'),margin=$('lpm-margin'),
 relation=$('lpm-edge'),status=$('lpm-status');
const option=(value,label)=>{const o=document.createElement('option');o.value=value;o.textContent=label;return o;};
const load=()=>JSON.parse(localStorage.getItem(key)||'{"schema":1,"notes":[],"edges":[],"walks":[],"rooms":[]}');
let choices=[];
function populateMargins(){
 const found=choices.find(n=>n.id===source.value);
 margin.replaceChildren(option('','Select one anchored margin…'));
 if(found)for(const m of found.margins)margin.append(option(m.id,m.label));
 populateEdges();
}
function populateEdges(){
 const n=load().notes.find(n=>n.id===source.value),m=n?.margins?.find(m=>m.id===margin.value);
 relation.replaceChildren(option('','No relation disclosed'));
 if(m)for(const e of listPressEdges(load(),n.id,m.versionId))relation.append(option(e.id,e.label));
}
$('openLemonPress').addEventListener('click',()=>{
 try{
  choices=listPressMarginChoices(load());
  source.replaceChildren(option('','Select source note…'));
  for(const n of choices)source.append(option(n.id,n.title));
  margin.replaceChildren(option('','Select margin…'));relation.replaceChildren(option('','No relation disclosed'));
  status.textContent='Select an exact saved passage with one human margin. No file is sent to a server.';
  dialog.showModal();
 }catch(e){$('status').textContent='LemonPRESS preparation refused: '+String(e.message).slice(0,120);}
});
$('lpm-close').addEventListener('click',()=>dialog.close());
source.addEventListener('change',populateMargins);
margin.addEventListener('change',populateEdges);
$('lpm-export').addEventListener('click',async()=>{
 if(!source.value||!margin.value){status.textContent='Choose a source and a specific margin.';return;}
 try{
  const label=source.selectedOptions[0]?.textContent||'Selected source';
  const confirmText='Download one selected quote and one human margin from "'+label+
   '" as a PRIVATE LemonPRESS editorial candidate? '+
   (relation.value?'The selected human relation discovery text will be disclosed too. ':'No relation will be included. ')+
   'The full source version and unrelated private notes stay in this browser. '+
   'The file is unencrypted and grants NO house admission or publication.';
  if(!confirm(confirmText)){status.textContent='Disclosure declined. Nothing exported.';return;}
  // Re-read after consent; no stale captured selection can silently mutate source.
  const packet=await makePressMarginCarrier(load(),{
   noteId:source.value,marginId:margin.value,edgeId:relation.value||null
  });
  const data=JSON.stringify(packet,null,2)+'\n';
  const blob=new Blob([data],{type:'application/json;charset=utf-8'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download='GOATnote-LemonPRESS-'+packet.checksum.slice(7,19)+'.json';
  document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
  status.textContent='Private selected-margin candidate downloaded. Nothing was published, admitted, or sent to LemonPRESS.';
 }catch(e){status.textContent='Candidate refused: '+String(e?.message||e).slice(0,160);}
});
