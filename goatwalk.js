(()=>{
'use strict';
const api=window.GOATnoteWalkAPI;
if(!api)return;
const uid=api.uid;
const stamp=api.stamp;
let activeWalkId=null;
let pendingTarget=null;
let playerIndex=0,playerStack=[];

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
const walks=()=>api.getWalks();
const active=()=>walks().find(w=>w.id===activeWalkId)||null;
const walkById=id=>walks().find(w=>w.id===id)||null;
const save=()=>api.saveWalks(walks());
const clip=(s,n=110)=>String(s||'').replace(/\s+/g,' ').trim().slice(0,n)+(String(s||'').replace(/\s+/g,' ').trim().length>n?'…':'');
const modeLabel=m=>({story:'Story',plan:'Plan',memory:'Memory Room',playlist:'Playlist',free:'Free Walk'}[m]||'Walk');
const edgeAPI=()=>window.GOATedgesAPI;

function createWalk(title='Untitled Walk',mode='free'){
  const w={id:uid(),title:title.trim()||'Untitled Walk',mode,createdAt:stamp(),updatedAt:stamp(),stops:[]};
  walks().push(w);save();activeWalkId=w.id;return w;
}
function touch(w){w.updatedAt=stamp();save();}
function targetLabel(t){return t.anchor?('“'+clip(t.anchor.quote,86)+'”'):(t.noteTitle||'Whole note');}
function walkReferencesWalk(startId,targetId,seen=new Set()){
  if(startId===targetId)return true;
  if(seen.has(startId))return false;
  seen.add(startId);
  const w=walkById(startId);if(!w)return false;
  return w.stops.some(stop=>stop.kind==='walk'&&walkReferencesWalk(stop.walkId,targetId,seen));
}
function canNest(parentId,childId){
  return !!walkById(parentId)&&!!walkById(childId)&&parentId!==childId&&!walkReferencesWalk(childId,parentId);
}
function stopResolution(stop){
  if(stop.kind==='walk'){
    const walk=walkById(stop.walkId);
    return walk?{status:'exact',walk}:{status:'missing-walk',walk:null};
  }
  if(stop.kind==='edge'){
    const edge=edgeAPI()?.getEdge?.(stop.edgeId);
    return edge?{status:'exact',edge}:{status:'missing-edge',edge:null};
  }
  return api.resolveStop(stop);
}

function addStop(w,target){
  const stop={
    id:uid(),kind:'source',noteId:target.noteId,versionId:target.versionId,
    noteTitleAtAdd:target.noteTitle||'Untitled',
    anchor:target.anchor?{start:target.anchor.start,end:target.anchor.end,quote:target.anchor.quote}:null,
    transition:'',addedAt:stamp()
  };
  w.stops.push(stop);touch(w);return stop;
}
function addWalkStop(w,child){
  if(!w||!child||!canNest(w.id,child.id))return null;
  const stop={id:uid(),kind:'walk',walkId:child.id,walkTitleAtAdd:child.title,transition:'',addedAt:stamp()};
  w.stops.push(stop);touch(w);return stop;
}
function addEdgeStop(w,edge){
  if(!w||!edge)return null;
  const stop={id:uid(),kind:'edge',edgeId:edge.id,edgeTypeAtAdd:edge.type,transition:'',addedAt:stamp()};
  w.stops.push(stop);touch(w);return stop;
}

function injectHeader(){
  const actions=document.querySelector('header .actions');
  if(!actions)return;
  const add=el('button',{id:'goatwalk-add'},'+ To Walk');
  const open=el('button',{id:'goatwalk-open'},'Walks');
  actions.insertBefore(add,actions.children[3]||null);
  actions.insertBefore(open,actions.children[4]||null);
  add.addEventListener('click',()=>{
    try{
      pendingTarget=api.captureTarget();
      if(!pendingTarget){alert('Open a note first.');return;}
      openDialog('add');
    }catch(err){alert(err.message||'Could not address that passage.');}
  });
  open.addEventListener('click',()=>openDialog('library'));
}

const dialog=el('dialog',{id:'goatwalk-dialog','aria-labelledby':'goatwalk-title'});
dialog.innerHTML=`
  <div class="gw-shell">
    <header class="gw-head">
      <div><div class="gw-eyebrow">GOATwalk 001</div><h2 id="goatwalk-title">Walks</h2></div>
      <button type="button" id="gw-close" aria-label="Close GOATwalk">×</button>
    </header>
    <section id="gw-library"></section>
    <section id="gw-editor" hidden></section>
    <section id="gw-player" hidden></section>
  </div>`;
document.body.append(dialog);
dialog.querySelector('#gw-close').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});

function openDialog(mode='library'){
  if(!dialog.open)dialog.showModal();
  if(mode==='add')renderLibrary(true);
  else if(mode==='editor'&&active())renderEditor();
  else renderLibrary(false);
}

function renderLibrary(forAdd=false){
  const root=dialog.querySelector('#gw-library'),ed=dialog.querySelector('#gw-editor'),pl=dialog.querySelector('#gw-player');
  root.hidden=false;ed.hidden=true;pl.hidden=true;
  dialog.querySelector('#goatwalk-title').textContent=forAdd?'Add to a Walk':'Walks';
  root.replaceChildren();

  if(forAdd&&pendingTarget){
    const capture=el('div',{class:'gw-capture'});
    capture.append(
      el('div',{class:'gw-eyebrow'},pendingTarget.anchor?'SELECTED PASSAGE':'WHOLE NOTE'),
      el('strong',{},pendingTarget.noteTitle||'Untitled'),
      el('p',{},targetLabel(pendingTarget))
    );
    root.append(capture);
  }

  const maker=el('form',{class:'gw-new'});
  const title=el('input',{type:'text',placeholder:'New Walk title',maxlength:'120','aria-label':'New Walk title'});
  const mode=el('select',{'aria-label':'Walk mode'});
  [['free','Free Walk'],['story','Story'],['plan','Plan'],['memory','Memory Room'],['playlist','Playlist']].forEach(([v,l])=>mode.append(el('option',{value:v},l)));
  const make=el('button',{type:'submit',class:'primary'},forAdd?'NEW WALK + ADD':'NEW WALK');
  maker.append(title,mode,make);
  maker.addEventListener('submit',e=>{
    e.preventDefault();
    const w=createWalk(title.value,mode.value);
    if(forAdd&&pendingTarget){addStop(w,pendingTarget);pendingTarget=null;}
    renderEditor();
  });
  root.append(maker);

  const list=el('div',{class:'gw-list'});
  if(!walks().length)list.append(el('p',{class:'muted'},'No Walks yet. A Walk is an order through source, not a copy of source.'));
  for(const w of [...walks()].sort((a,b)=>new Date(b.updatedAt)-new Date(a.updatedAt))){
    const card=el('article',{class:'gw-walk-card'});
    const meta=el('div',{class:'gw-walk-meta'},modeLabel(w.mode)+' · '+w.stops.length+' stop'+(w.stops.length===1?'':'s'));
    const h=el('h3',{},w.title);
    const actions=el('div',{class:'gw-row'});
    const open=el('button',{type:'button'},forAdd?'ADD HERE':'OPEN');
    open.addEventListener('click',()=>{
      activeWalkId=w.id;
      if(forAdd&&pendingTarget){addStop(w,pendingTarget);pendingTarget=null;}
      renderEditor();
    });
    actions.append(open);
    card.append(meta,h,actions);list.append(card);
  }
  root.append(list);
}

function renderEditor(){
  const w=active();if(!w){renderLibrary(false);return;}
  const root=dialog.querySelector('#gw-editor'),lib=dialog.querySelector('#gw-library'),pl=dialog.querySelector('#gw-player');
  lib.hidden=true;root.hidden=false;pl.hidden=true;
  dialog.querySelector('#goatwalk-title').textContent='Edit Walk';
  root.replaceChildren();

  const top=el('div',{class:'gw-editor-top'});
  const back=el('button',{type:'button'},'← ALL WALKS');
  back.addEventListener('click',()=>renderLibrary(false));
  const title=el('input',{class:'gw-title',type:'text',value:w.title,maxlength:'120','aria-label':'Walk title'});
  title.addEventListener('change',()=>{w.title=title.value.trim()||'Untitled Walk';touch(w);});
  const mode=el('select',{'aria-label':'Walk mode'});
  [['free','Free Walk'],['story','Story'],['plan','Plan'],['memory','Memory Room'],['playlist','Playlist']].forEach(([v,l])=>{const o=el('option',{value:v},l);if(v===w.mode)o.selected=true;mode.append(o);});
  mode.addEventListener('change',()=>{w.mode=mode.value;touch(w);renderEditor();});
  top.append(back,title,mode);root.append(top);

  const law=el('p',{class:'gw-law'},'ORDER ≠ SOURCE · A ROUTE THROUGH A NOTE IS NOT THE NOTE');
  root.append(law);

  const toolbar=el('div',{class:'gw-toolbar'});
  const addCurrent=el('button',{type:'button',class:'primary'},'+ CURRENT SOURCE');
  addCurrent.addEventListener('click',()=>{
    try{
      const t=api.captureTarget();
      if(!t){alert('Open a note first.');return;}
      addStop(w,t);renderEditor();
    }catch(err){alert(err.message||'Could not address that passage.');}
  });
  const walkSelect=el('select',{'aria-label':'Choose another Walk as a door'});
  walkSelect.append(el('option',{value:''},'Walk door…'));
  walks().filter(child=>canNest(w.id,child.id)).forEach(child=>walkSelect.append(el('option',{value:child.id},child.title)));
  const addWalk=el('button',{type:'button'},'+ WALK DOOR');
  addWalk.disabled=walkSelect.options.length<=1;
  addWalk.addEventListener('click',()=>{const child=walkById(walkSelect.value);if(child&&addWalkStop(w,child))renderEditor();});
  const edgeSelect=el('select',{'aria-label':'Choose edge as a Walk stop'});
  edgeSelect.append(el('option',{value:''},'Edge…'));
  (edgeAPI()?.getEdges?.()||[]).forEach(edge=>edgeSelect.append(el('option',{value:edge.id},edge.type+' · '+edge.status)));
  const addEdge=el('button',{type:'button'},'+ EDGE');
  addEdge.disabled=edgeSelect.options.length<=1;
  addEdge.addEventListener('click',()=>{const edge=edgeAPI()?.getEdge?.(edgeSelect.value);if(edge&&addEdgeStop(w,edge))renderEditor();});
  const play=el('button',{type:'button'},'WALK IT');
  play.disabled=!w.stops.length;
  play.addEventListener('click',()=>{playerStack=[];playerIndex=0;renderPlayer();});
  const exportMd=el('button',{type:'button'},'EXPORT .MD');
  exportMd.disabled=!w.stops.length;
  exportMd.addEventListener('click',()=>exportWalkMarkdown(w));
  toolbar.append(addCurrent,walkSelect,addWalk,edgeSelect,addEdge,play,exportMd);root.append(toolbar);

  const stopList=el('div',{class:'gw-stops'});
  if(!w.stops.length)stopList.append(el('p',{class:'muted'},'Select a passage or leave nothing selected for the whole note, then choose + CURRENT SOURCE.'));
  w.stops.forEach((stop,index)=>stopList.append(renderStopCard(w,stop,index)));
  root.append(stopList);

  const danger=el('div',{class:'gw-danger'});
  const del=el('button',{type:'button',class:'danger'},'Delete Walk');
  del.addEventListener('click',()=>{
    if(!confirm('Delete this Walk? Source notes and versions will not be changed.'))return;
    const i=walks().findIndex(x=>x.id===w.id);if(i>=0)walks().splice(i,1);save();activeWalkId=null;renderLibrary(false);
  });
  danger.append(del);root.append(danger);
}

function renderStopCard(w,stop,index){
  const resolved=stopResolution(stop);
  const exact=resolved.status==='exact';
  const card=el('article',{class:'gw-stop'+(exact?'':' unresolved')});
  const head=el('div',{class:'gw-stop-head'});
  const title=stop.kind==='walk'
    ? (resolved.walk?.title||stop.walkTitleAtAdd||'Missing Walk')
    : stop.kind==='edge'
      ? (resolved.edge?.type||stop.edgeTypeAtAdd||'Missing edge')
      : (stop.noteTitleAtAdd||resolved.note?.title||'Missing source');
  head.append(el('span',{class:'gw-number'},String(index+1).padStart(2,'0')),el('span',{class:'gw-source'},title));
  const badge=el('span',{class:'gw-badge'},!exact?'UNRESOLVED':stop.kind==='walk'?'WALK DOOR':stop.kind==='edge'?('EDGE · '+resolved.edge.status.toUpperCase()):stop.anchor?'PASSAGE':'WHOLE NOTE');
  head.append(badge);card.append(head);

  if(stop.kind==='walk'){
    card.append(el('blockquote',{},exact?(modeLabel(resolved.walk.mode)+' · '+resolved.walk.stops.length+' stop'+(resolved.walk.stops.length===1?'':'s')):'Referenced Walk no longer exists.'));
    if(!exact)card.append(el('p',{class:'gw-warning'},'The Walk door is unresolved. GOATwalk will not redirect it to another Walk.'));
  }else if(stop.kind==='edge'){
    if(exact){
      const desc=edgeAPI()?.describe?.(resolved.edge);
      card.append(el('blockquote',{},desc?(desc.fromLabel+' → '+desc.toLabel):resolved.edge.type));
      card.append(el('p',{class:'gw-edge-meta'},'First perceived '+new Date(resolved.edge.firstPerceivedAt).toLocaleString()+' · '+resolved.edge.confidence+' confidence'));
    }else{
      card.append(el('p',{class:'gw-warning'},'Referenced edge no longer exists. GOATwalk keeps the stop unresolved.'));
    }
  }else{
    const excerpt=el('blockquote',{},stop.anchor?stop.anchor.quote:(exact?clip(resolved.text,260):'Source address no longer resolves exactly.'));
    card.append(excerpt);
    if(!exact){
      const why=resolved.status==='missing-note'?'The source note was deleted.':resolved.status==='missing-version'?'The saved source version is unavailable.':'The stored offsets no longer contain the exact quoted passage.';
      card.append(el('p',{class:'gw-warning'},why+' GOATwalk will not silently rebind this stop.'));
    }
  }

  const transition=el('textarea',{rows:'2',placeholder:'Transition after this stop…','aria-label':'Transition after stop'},stop.transition||'');
  transition.addEventListener('change',()=>{stop.transition=transition.value;touch(w);});
  card.append(transition);

  const actions=el('div',{class:'gw-row'});
  let open;
  if(stop.kind==='walk'){
    open=el('button',{type:'button'},'OPEN WALK');open.disabled=!exact;open.addEventListener('click',()=>{activeWalkId=resolved.walk.id;renderEditor();});
  }else if(stop.kind==='edge'){
    open=el('button',{type:'button'},'INSPECT EDGE');open.disabled=!exact;open.addEventListener('click',()=>{dialog.close();edgeAPI()?.openEdge?.(stop.edgeId);});
    const cross=el('button',{type:'button',class:'primary'},exact&&edgeAPI()?.isTraversable?.(resolved.edge)?'CROSS TO TARGET':'NOT TRAVERSABLE');
    cross.disabled=!exact||!edgeAPI()?.isTraversable?.(resolved.edge);
    cross.addEventListener('click',()=>{if(edgeAPI()?.openTo?.(stop.edgeId))dialog.close();});
    actions.append(open,cross);
  }else{
    open=el('button',{type:'button'},'OPEN SOURCE');open.disabled=!exact;open.addEventListener('click',()=>{if(api.openStop(stop))dialog.close();});
    actions.append(open);
  }
  if(stop.kind!=='edge')actions.append(open);
  const up=el('button',{type:'button','aria-label':'Move stop up'},'↑');up.disabled=index===0;up.addEventListener('click',()=>moveStop(w,index,index-1));
  const down=el('button',{type:'button','aria-label':'Move stop down'},'↓');down.disabled=index===w.stops.length-1;down.addEventListener('click',()=>moveStop(w,index,index+1));
  const remove=el('button',{type:'button',class:'danger'},'REMOVE');remove.addEventListener('click',()=>{w.stops.splice(index,1);touch(w);renderEditor();});
  actions.append(up,down,remove);card.append(actions);
  return card;
}
function moveStop(w,from,to){const [x]=w.stops.splice(from,1);w.stops.splice(to,0,x);touch(w);renderEditor();}

function advancePlayer(){
  const w=active();if(!w){renderLibrary(false);return;}
  if(playerIndex<w.stops.length-1){playerIndex++;renderPlayer();return;}
  if(playerStack.length){
    const parent=playerStack.pop();
    activeWalkId=parent.walkId;
    playerIndex=parent.index;
    advancePlayer();
    return;
  }
  renderEditor();
}

function renderPlayer(){
  const w=active();if(!w||!w.stops.length){renderEditor();return;}
  playerIndex=Math.max(0,Math.min(playerIndex,w.stops.length-1));
  const root=dialog.querySelector('#gw-player'),lib=dialog.querySelector('#gw-library'),ed=dialog.querySelector('#gw-editor');
  lib.hidden=true;ed.hidden=true;root.hidden=false;
  dialog.querySelector('#goatwalk-title').textContent=w.title;
  root.replaceChildren();

  const stop=w.stops[playerIndex],resolved=stopResolution(stop),exact=resolved.status==='exact';
  const prog=el('div',{class:'gw-player-progress'},'STOP '+(playerIndex+1)+' / '+w.stops.length+' · '+modeLabel(w.mode)+(playerStack.length?' · DEPTH '+playerStack.length:''));
  root.append(prog);
  if(playerIndex>0&&w.stops[playerIndex-1].transition){
    const bridge=el('div',{class:'gw-bridge'});
    bridge.append(el('div',{class:'gw-eyebrow'},'BRIDGE'),el('p',{},w.stops[playerIndex-1].transition));
    root.append(bridge);
  }

  const page=el('article',{class:'gw-player-page'+(exact?'':' unresolved')});
  if(stop.kind==='walk'){
    page.append(el('div',{class:'gw-eyebrow'},'WALK DOOR'),el('h3',{},resolved.walk?.title||stop.walkTitleAtAdd||'Missing Walk'));
    if(exact){
      page.append(el('div',{class:'gw-player-text'},modeLabel(resolved.walk.mode)+'\n\n'+resolved.walk.stops.length+' stop'+(resolved.walk.stops.length===1?'':'s')+' beyond this door.'));
      const enter=el('button',{type:'button',class:'primary'},resolved.walk.stops.length?'ENTER WALK':'EMPTY WALK');
      enter.disabled=!resolved.walk.stops.length;
      enter.addEventListener('click',()=>{playerStack.push({walkId:w.id,index:playerIndex});activeWalkId=resolved.walk.id;playerIndex=0;renderPlayer();});
      page.append(enter);
    }else{
      page.append(el('p',{class:'gw-warning'},'This Walk door is unresolved. No substitute route is chosen.'));
    }
  }else if(stop.kind==='edge'){
    page.append(el('div',{class:'gw-eyebrow'},exact?('STAIRCASE · '+resolved.edge.status.toUpperCase()):'UNRESOLVED EDGE'),el('h3',{},resolved.edge?.type||stop.edgeTypeAtAdd||'Missing edge'));
    if(exact){
      const desc=edgeAPI()?.describe?.(resolved.edge);
      page.append(el('div',{class:'gw-player-text'},(desc?desc.fromLabel+'\n\n→ '+resolved.edge.type+' →\n\n'+desc.toLabel:resolved.edge.type)+'\n\nFirst perceived: '+new Date(resolved.edge.firstPerceivedAt).toLocaleString()+'\nConfidence: '+resolved.edge.confidence));
      const inspect=el('button',{type:'button'},'INSPECT EDGE');inspect.addEventListener('click',()=>{dialog.close();edgeAPI()?.openEdge?.(stop.edgeId);});
      const cross=el('button',{type:'button',class:'primary'},edgeAPI()?.isTraversable?.(resolved.edge)?'CROSS TO TARGET':'NOT TRAVERSABLE');
      cross.disabled=!edgeAPI()?.isTraversable?.(resolved.edge);
      cross.addEventListener('click',()=>{if(edgeAPI()?.openTo?.(stop.edgeId))dialog.close();});
      page.append(inspect,cross);
    }else{
      page.append(el('p',{class:'gw-warning'},'This edge address is unresolved. The Walk does not substitute another relation.'));
    }
  }else{
    page.append(el('div',{class:'gw-eyebrow'},stop.anchor?'PASSAGE':'SOURCE'),el('h3',{},stop.noteTitleAtAdd||resolved.note?.title||'Missing source'));
    if(exact){
      const text=stop.anchor?stop.anchor.quote:resolved.version.text;
      page.append(el('div',{class:'gw-player-text'},text));
    }else{
      page.append(el('p',{class:'gw-warning'},'This source address is unresolved. The Walk keeps the stop but does not substitute another text.'));
    }
    const open=el('button',{type:'button'},'OPEN EXACT SOURCE');open.disabled=!exact;open.addEventListener('click',()=>{if(api.openStop(stop))dialog.close();});
    page.append(open);
  }
  root.append(page);

  const nav=el('div',{class:'gw-player-nav'});
  const prev=el('button',{type:'button'},'← PREVIOUS');prev.disabled=playerIndex===0;prev.addEventListener('click',()=>{playerIndex--;renderPlayer();});
  const edit=el('button',{type:'button'},'EDIT WALK');edit.addEventListener('click',renderEditor);
  const next=el('button',{type:'button'},playerIndex===w.stops.length-1?(playerStack.length?'RETURN ↩':'END WALK'):'NEXT →');
  next.addEventListener('click',advancePlayer);
  nav.append(prev,edit,next);root.append(nav);
}

function exportWalkMarkdown(w){
  const lines=['# '+w.title,'','GOATwalk export · '+stamp(),'','Mode: '+modeLabel(w.mode),'','**ORDER ≠ SOURCE. A route through a note is not the note.**',''];
  w.stops.forEach((stop,index)=>{
    if(stop.kind==='walk'){
      const child=walkById(stop.walkId);
      lines.push('## Stop '+(index+1)+' · Walk door · '+(child?.title||stop.walkTitleAtAdd||'Missing Walk'),'');
      lines.push(child?'Walk ID: '+child.id:'[UNRESOLVED WALK: '+stop.walkId+']','');
    }else if(stop.kind==='edge'){
      const edge=edgeAPI()?.getEdge?.(stop.edgeId),desc=edge?edgeAPI()?.describe?.(edge):null;
      lines.push('## Stop '+(index+1)+' · Staircase · '+(edge?.type||stop.edgeTypeAtAdd||'Missing edge'),'');
      if(edge&&desc){
        lines.push('Status: '+edge.status+' · confidence: '+edge.confidence,'');
        lines.push('First perceived: '+edge.firstPerceivedAt,'');
        lines.push('From: '+desc.fromLabel,'','To: '+desc.toLabel,'');
        lines.push('Discovery trace: '+edge.discoveryTrace,'','Evidence path: '+edge.evidencePath,'');
      }else lines.push('[UNRESOLVED EDGE: '+stop.edgeId+']','');
    }else{
      const r=stopResolution(stop);
      lines.push('## Stop '+(index+1)+' · '+(stop.noteTitleAtAdd||r.note?.title||'Missing source'),'');
      lines.push('Address: note '+stop.noteId+' · version '+stop.versionId,'');
      if(r.status==='exact')lines.push(stop.anchor?stop.anchor.quote:r.version.text,'');
      else lines.push('[UNRESOLVED SOURCE: '+r.status+']','');
    }
    if(stop.transition)lines.push('### Transition','',stop.transition,'');
  });
  const blob=new Blob([lines.join('\n')],{type:'text/markdown;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=(w.title.toLowerCase().replace(/[^a-z0-9-]+/g,'-').replace(/^-|-$/g,'').slice(0,48)||'goatwalk')+'.md';
  document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}

window.GOATwalkAPI={
  getWalks:walks,
  getWalk:walkById,
  canNest,
  addWalkDoor:(parentId,childId)=>{
    const parent=walkById(parentId),child=walkById(childId);
    return addWalkStop(parent,child);
  },
  addEdgeStop:(walkId,edgeId)=>{
    const w=walkById(walkId),edge=edgeAPI()?.getEdge?.(edgeId);
    return addEdgeStop(w,edge);
  },
  playWalk:id=>{
    const w=walkById(id);if(!w||!w.stops.length)return false;
    activeWalkId=id;playerStack=[];playerIndex=0;openDialog('editor');renderPlayer();return true;
  },
  openWalk:id=>{
    const w=walkById(id);if(!w)return false;
    activeWalkId=id;openDialog('editor');return true;
  }
};

injectHeader();
})();