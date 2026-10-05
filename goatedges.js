(()=>{
'use strict';
const core=window.GOATnoteWalkAPI;
if(!core)return;

const uid=core.uid, stamp=core.stamp;
let editingEdgeId=null;
let heldFrom=null, heldTo=null;

const el=(tag,attrs={},text='')=>{
  const node=document.createElement(tag);
  for(const [k,v] of Object.entries(attrs)){
    if(k==='class')node.className=v;
    else if(k==='type')node.type=v;
    else if(k==='value')node.value=v;
    else node.setAttribute(k,v);
  }
  if(text)node.textContent=text;
  return node;
};
const edges=()=>core.getEdges();
const save=()=>core.saveEdges(edges());
const edgeById=id=>edges().find(e=>e.id===id)||null;
const clip=(s,n=96)=>String(s||'').replace(/\s+/g,' ').trim().slice(0,n)+(String(s||'').replace(/\s+/g,' ').trim().length>n?'…':'');
const statusLabel=s=>({perceived:'Perceived',proposed:'Proposed',admitted:'Admitted',weakened:'Weakened',refused:'Refused',unresolved:'Unresolved'}[s]||s);
const statusRank=s=>({admitted:5,proposed:4,perceived:3,weakened:2,unresolved:1,refused:0}[s]??-1);
const endpointLabel=e=>e.anchor?('“'+clip(e.anchor.quote,70)+'”'):(e.noteTitleAtAdd||'Whole note');

function copyEndpoint(target){
  return {
    noteId:target.noteId,
    versionId:target.versionId,
    noteTitleAtAdd:target.noteTitle||'Untitled',
    anchor:target.anchor?{start:target.anchor.start,end:target.anchor.end,quote:target.anchor.quote}:null
  };
}
function resolveEndpoint(endpoint){
  return core.resolveStop({
    id:'edge-endpoint',
    noteId:endpoint.noteId,
    versionId:endpoint.versionId,
    anchor:endpoint.anchor||null
  });
}
function isTraversable(edge){
  return !!edge&&edge.status==='admitted'&&resolveEndpoint(edge.to).status==='exact';
}
function history(edge){
  return Array.isArray(edge.history)?edge.history:[];
}
function appendRevision(edge,kind,note=''){
  if(!Array.isArray(edge.history))edge.history=[];
  edge.history.push({
    id:uid(),
    at:stamp(),
    kind,
    status:edge.status,
    confidence:edge.confidence,
    note:String(note||'')
  });
}
function captureCurrent(){
  const target=core.captureTarget();
  if(!target)throw Error('Open a note first.');
  return copyEndpoint(target);
}

function injectHeader(){
  const actions=document.querySelector('header .actions');
  if(!actions)return;
  const open=el('button',{id:'goatedge-open'},'Edges');
  const exportBtn=document.getElementById('exportBtn');
  actions.insertBefore(open,exportBtn||null);
  open.addEventListener('click',()=>openDialog());
}

const dialog=el('dialog',{id:'goatedge-dialog','aria-labelledby':'ge-title'});
dialog.innerHTML=`
  <div class="ge-shell">
    <header class="ge-head">
      <div><div class="ge-eyebrow">STAIRCASE 001 / GOATedges</div><h2 id="ge-title">Relations</h2></div>
      <button type="button" id="ge-close" aria-label="Close GOATedges">×</button>
    </header>
    <section id="ge-list-view"></section>
    <section id="ge-edit-view" hidden></section>
  </div>`;
document.body.append(dialog);
dialog.querySelector('#ge-close').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});

function openDialog(edgeId=null){
  if(!dialog.open)dialog.showModal();
  if(edgeId){editingEdgeId=edgeId;renderEditor(edgeById(edgeId));}
  else renderList();
}

function renderList(){
  editingEdgeId=null;heldFrom=null;heldTo=null;
  const list=dialog.querySelector('#ge-list-view'),edit=dialog.querySelector('#ge-edit-view');
  list.hidden=false;edit.hidden=true;
  dialog.querySelector('#ge-title').textContent='Relations';
  list.replaceChildren();

  const intro=el('div',{class:'ge-intro'});
  intro.append(
    el('p',{},'Relations have birthdays. A visible edge is not automatically an admitted or traversable edge.'),
    el('p',{class:'ge-law'},'PROXIMITY ≠ RELATION · VISIBLE EDGE ≠ TRAVERSABLE EDGE · RELATION ≠ AUTHORITY')
  );
  const create=el('button',{type:'button',class:'primary'},'+ NEW EDGE');
  create.addEventListener('click',()=>renderEditor(null));
  intro.append(create);list.append(intro);

  const grid=el('div',{class:'ge-grid'});
  if(!edges().length)grid.append(el('p',{class:'muted'},'No edges yet. Hold two exact source addresses to make a relation inspectable.'));
  [...edges()].sort((a,b)=>statusRank(b.status)-statusRank(a.status)||new Date(b.updatedAt)-new Date(a.updatedAt)).forEach(edge=>{
    const from=resolveEndpoint(edge.from),to=resolveEndpoint(edge.to);
    const card=el('article',{class:'ge-card status-'+edge.status});
    card.append(
      el('div',{class:'ge-topline'},statusLabel(edge.status)+' · '+edge.confidence+' confidence'),
      el('h3',{},edge.type),
      el('div',{class:'ge-path'},(edge.from.noteTitleAtAdd||'Source')+' → '+(edge.to.noteTitleAtAdd||'Target'))
    );
    const meta=el('p',{class:'ge-meta'},'First perceived '+new Date(edge.firstPerceivedAt).toLocaleString()+' · '+history(edge).length+' revision'+(history(edge).length===1?'':'s'));
    card.append(meta);
    if(from.status!=='exact'||to.status!=='exact')card.append(el('p',{class:'ge-warning'},'One or both endpoint addresses are unresolved. The edge is preserved but cannot repair itself.'));
    const row=el('div',{class:'ge-row'});
    const inspect=el('button',{type:'button'},'INSPECT');inspect.addEventListener('click',()=>{editingEdgeId=edge.id;renderEditor(edge);});
    const cross=el('button',{type:'button',class:'primary'},isTraversable(edge)?'CROSS TO TARGET':'NOT TRAVERSABLE');
    cross.disabled=!isTraversable(edge);
    cross.addEventListener('click',()=>{if(core.openStop({...edge.to,id:'edge-to'}))dialog.close();});
    row.append(inspect,cross);card.append(row);grid.append(card);
  });
  list.append(grid);
}

function endpointCard(label,endpoint,side){
  const box=el('div',{class:'ge-endpoint'});
  box.append(el('div',{class:'ge-eyebrow'},label));
  if(endpoint){
    const resolved=resolveEndpoint(endpoint);
    box.append(el('strong',{},endpoint.noteTitleAtAdd||resolved.note?.title||'Missing source'));
    box.append(el('p',{},endpoint.anchor?'“'+clip(endpoint.anchor.quote,120)+'”':'Whole saved source'));
    if(resolved.status!=='exact')box.append(el('p',{class:'ge-warning'},'This held address is unresolved.'));
  }else{
    box.append(el('p',{class:'muted'},'Nothing held yet.'));
  }
  const hold=el('button',{type:'button'},'HOLD CURRENT AS '+side);
  hold.addEventListener('click',()=>{
    try{
      const target=captureCurrent();
      if(side==='FROM')heldFrom=target;else heldTo=target;
      renderEditor(editingEdgeId?edgeById(editingEdgeId):null);
    }catch(err){alert(err.message||'Could not hold source.');}
  });
  box.append(hold);return box;
}

function renderEditor(edge){
  const list=dialog.querySelector('#ge-list-view'),root=dialog.querySelector('#ge-edit-view');
  list.hidden=true;root.hidden=false;
  dialog.querySelector('#ge-title').textContent=edge?'Inspect / revise edge':'New edge';
  root.replaceChildren();

  if(edge){
    heldFrom=heldFrom||copyEndpoint(edge.from);
    heldTo=heldTo||copyEndpoint(edge.to);
  }

  const back=el('button',{type:'button'},'← ALL EDGES');back.addEventListener('click',renderList);
  root.append(back);
  root.append(el('p',{class:'ge-law'},'EDGE BIRTHDAY ≠ ENDPOINT BIRTHDAY · DISCOVERY TRACE ≠ EVIDENCE PATH'));

  const endpoints=el('div',{class:'ge-endpoints'});
  endpoints.append(endpointCard('FROM',heldFrom,'FROM'),endpointCard('TO',heldTo,'TO'));
  root.append(endpoints);

  const form=el('form',{class:'ge-form'});
  const type=el('input',{type:'text',maxlength:'120',placeholder:'Relation type — e.g. echoes, depends on, contradicts…','aria-label':'Relation type',value:edge?.type||''});
  const perceived=el('input',{type:'datetime-local','aria-label':'First perceived at'});
  const d=edge?new Date(edge.firstPerceivedAt):new Date();
  const local=new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16);
  perceived.value=local;

  const status=el('select',{'aria-label':'Edge status'});
  ['perceived','proposed','admitted','weakened','refused','unresolved'].forEach(v=>{
    const o=el('option',{value:v},statusLabel(v));if((edge?.status||'perceived')===v)o.selected=true;status.append(o);
  });
  const confidence=el('select',{'aria-label':'Confidence'});
  ['low','medium','high'].forEach(v=>{const o=el('option',{value:v},v[0].toUpperCase()+v.slice(1));if((edge?.confidence||'low')===v)o.selected=true;confidence.append(o);});
  const discovery=el('textarea',{rows:'3',placeholder:'Discovery trace — what made you notice this relation?','aria-label':'Discovery trace'},edge?.discoveryTrace||'');
  const evidence=el('textarea',{rows:'3',placeholder:"Evidence path — what source or receipt supports it? Write 'none yet' if none.",'aria-label':'Evidence path'},edge?.evidencePath||'');
  const revisionNote=el('textarea',{rows:'2',placeholder:'Revision note — optional reason for this status/confidence change','aria-label':'Revision note'},'');

  form.append(
    labelWrap('TYPE',type),
    labelWrap('FIRST PERCEIVED',perceived),
    labelWrap('STATUS',status),
    labelWrap('CONFIDENCE',confidence),
    labelWrap('DISCOVERY TRACE',discovery),
    labelWrap('EVIDENCE PATH',evidence)
  );
  if(edge)form.append(labelWrap('REVISION NOTE',revisionNote));

  const submit=el('button',{type:'submit',class:'primary'},edge?'SAVE REVISION':'CREATE EDGE');
  form.append(submit);
  form.addEventListener('submit',e=>{
    e.preventDefault();
    if(!heldFrom||!heldTo){alert('Hold both FROM and TO source addresses first.');return;}
    if(heldFrom.noteId===heldTo.noteId&&heldFrom.versionId===heldTo.versionId&&JSON.stringify(heldFrom.anchor||null)===JSON.stringify(heldTo.anchor||null)){
      alert('FROM and TO are the same exact address. Choose two distinct addresses.');return;
    }
    if(!type.value.trim()||!discovery.value.trim()||!evidence.value.trim()){alert('Type, discovery trace, and evidence path are required.');return;}
    const perceivedDate=new Date(perceived.value);
    if(Number.isNaN(perceivedDate.getTime())){alert('First perceived time is invalid.');return;}
    if(edge){
      const changed=edge.status!==status.value||edge.confidence!==confidence.value||edge.type!==type.value.trim()||edge.discoveryTrace!==discovery.value.trim()||edge.evidencePath!==evidence.value.trim();
      edge.from=copyEndpoint(heldFrom);edge.to=copyEndpoint(heldTo);edge.type=type.value.trim();edge.firstPerceivedAt=perceivedDate.toISOString();
      edge.discoveryTrace=discovery.value.trim();edge.evidencePath=evidence.value.trim();edge.confidence=confidence.value;edge.status=status.value;edge.updatedAt=stamp();
      if(changed)appendRevision(edge,'revision',revisionNote.value.trim());
      save();renderEditor(edge);
    }else{
      const now=stamp();
      const created={
        id:uid(),from:copyEndpoint(heldFrom),to:copyEndpoint(heldTo),type:type.value.trim(),
        firstPerceivedAt:perceivedDate.toISOString(),discoveryTrace:discovery.value.trim(),evidencePath:evidence.value.trim(),
        confidence:confidence.value,status:status.value,createdAt:now,updatedAt:now,history:[]
      };
      appendRevision(created,'created','');
      edges().push(created);save();editingEdgeId=created.id;renderEditor(created);
    }
  });
  root.append(form);

  if(edge){
    const actions=el('div',{class:'ge-actions'});
    const openFrom=el('button',{type:'button'},'OPEN FROM');openFrom.disabled=resolveEndpoint(edge.from).status!=='exact';openFrom.addEventListener('click',()=>{if(core.openStop({...edge.from,id:'edge-from'}))dialog.close();});
    const openTo=el('button',{type:'button'},'OPEN TO');openTo.disabled=resolveEndpoint(edge.to).status!=='exact';openTo.addEventListener('click',()=>{if(core.openStop({...edge.to,id:'edge-to'}))dialog.close();});
    const cross=el('button',{type:'button',class:'primary'},isTraversable(edge)?'CROSS TO TARGET':'NOT TRAVERSABLE');cross.disabled=!isTraversable(edge);cross.addEventListener('click',()=>{if(core.openStop({...edge.to,id:'edge-to'}))dialog.close();});
    const del=el('button',{type:'button',class:'danger'},'DELETE EDGE');
    del.addEventListener('click',()=>{
      if(!confirm('Delete this edge? Notes remain unchanged. Room/Walk references to it will become unresolved.'))return;
      const i=edges().findIndex(x=>x.id===edge.id);if(i>=0)edges().splice(i,1);save();renderList();
    });
    actions.append(openFrom,openTo,cross,del);root.append(actions);

    const h=el('section',{class:'ge-history'});
    h.append(el('div',{class:'ge-eyebrow'},'EDGE HISTORY'));
    [...history(edge)].reverse().forEach(r=>{
      const row=el('div',{class:'ge-history-row'});
      row.append(el('strong',{},statusLabel(r.status)+' · '+r.confidence),el('span',{},new Date(r.at).toLocaleString()));
      if(r.note)row.append(el('p',{},r.note));
      h.append(row);
    });
    root.append(h);
  }
}

function labelWrap(label,control){
  const wrap=el('label',{class:'ge-field'});
  wrap.append(el('span',{},label),control);return wrap;
}

function describe(edge){
  if(!edge)return null;
  return {
    id:edge.id,
    type:edge.type,
    status:edge.status,
    confidence:edge.confidence,
    firstPerceivedAt:edge.firstPerceivedAt,
    fromLabel:endpointLabel(edge.from),
    toLabel:endpointLabel(edge.to),
    fromResolved:resolveEndpoint(edge.from).status,
    toResolved:resolveEndpoint(edge.to).status,
    traversable:isTraversable(edge)
  };
}

injectHeader();

window.GOATedgesAPI={
  getEdges:edges,
  getEdge:edgeById,
  describe,
  isTraversable,
  openEdge:id=>{const edge=edgeById(id);if(!edge)return false;openDialog(id);return true;},
  openFrom:id=>{const edge=edgeById(id);return !!edge&&core.openStop({...edge.from,id:'edge-from'});},
  openTo:id=>{const edge=edgeById(id);return !!edge&&core.openStop({...edge.to,id:'edge-to'});}
};
})();