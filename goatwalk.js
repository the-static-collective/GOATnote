(()=>{
'use strict';
const api=window.GOATnoteWalkAPI;
if(!api)return;
const uid=api.uid;
const stamp=api.stamp;
let activeWalkId=null;
let pendingTarget=null;
let playerIndex=0;

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
const save=()=>api.saveWalks(walks());
const clip=(s,n=110)=>String(s||'').replace(/\s+/g,' ').trim().slice(0,n)+(String(s||'').replace(/\s+/g,' ').trim().length>n?'…':'');
const modeLabel=m=>({story:'Story',plan:'Plan',memory:'Memory Room',playlist:'Playlist',free:'Free Walk'}[m]||'Walk');

function createWalk(title='Untitled Walk',mode='free'){
  const w={id:uid(),title:title.trim()||'Untitled Walk',mode,createdAt:stamp(),updatedAt:stamp(),stops:[]};
  walks().push(w);save();activeWalkId=w.id;return w;
}
function touch(w){w.updatedAt=stamp();save();}
function targetLabel(t){return t.anchor?('“'+clip(t.anchor.quote,86)+'”'):(t.noteTitle||'Whole note');}
function stopResolution(stop){return api.resolveStop(stop);}

function addStop(w,target){
  const stop={
    id:uid(),noteId:target.noteId,versionId:target.versionId,
    noteTitleAtAdd:target.noteTitle||'Untitled',
    anchor:target.anchor?{start:target.anchor.start,end:target.anchor.end,quote:target.anchor.quote}:null,
    transition:'',addedAt:stamp()
  };
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
  const play=el('button',{type:'button'},'WALK IT');
  play.disabled=!w.stops.length;
  play.addEventListener('click',()=>{playerIndex=0;renderPlayer();});
  const exportMd=el('button',{type:'button'},'EXPORT .MD');
  exportMd.disabled=!w.stops.length;
  exportMd.addEventListener('click',()=>exportWalkMarkdown(w));
  toolbar.append(addCurrent,play,exportMd);root.append(toolbar);

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
  const card=el('article',{class:'gw-stop'+(resolved.status==='exact'?'':' unresolved')});
  const head=el('div',{class:'gw-stop-head'});
  head.append(el('span',{class:'gw-number'},String(index+1).padStart(2,'0')),el('span',{class:'gw-source'},stop.noteTitleAtAdd||resolved.note?.title||'Missing source'));
  const badge=el('span',{class:'gw-badge'},resolved.status==='exact'?(stop.anchor?'PASSAGE':'WHOLE NOTE'):'UNRESOLVED');
  head.append(badge);card.append(head);

  const excerpt=el('blockquote',{},stop.anchor?stop.anchor.quote:(resolved.status==='exact'?clip(resolved.text,260):'Source address no longer resolves exactly.'));
  card.append(excerpt);

  if(resolved.status!=='exact'){
    const why=resolved.status==='missing-note'?'The source note was deleted.':resolved.status==='missing-version'?'The saved source version is unavailable.':'The stored offsets no longer contain the exact quoted passage.';
    card.append(el('p',{class:'gw-warning'},why+' GOATwalk will not silently rebind this stop.'));
  }

  const transition=el('textarea',{rows:'2',placeholder:'Transition after this stop…','aria-label':'Transition after stop'},stop.transition||'');
  transition.addEventListener('change',()=>{stop.transition=transition.value;touch(w);});
  card.append(transition);

  const actions=el('div',{class:'gw-row'});
  const source=el('button',{type:'button'},'OPEN SOURCE');source.disabled=resolved.status!=='exact';source.addEventListener('click',()=>{if(api.openStop(stop))dialog.close();});
  const up=el('button',{type:'button','aria-label':'Move stop up'},'↑');up.disabled=index===0;up.addEventListener('click',()=>moveStop(w,index,index-1));
  const down=el('button',{type:'button','aria-label':'Move stop down'},'↓');down.disabled=index===w.stops.length-1;down.addEventListener('click',()=>moveStop(w,index,index+1));
  const remove=el('button',{type:'button',class:'danger'},'REMOVE');remove.addEventListener('click',()=>{w.stops.splice(index,1);touch(w);renderEditor();});
  actions.append(source,up,down,remove);card.append(actions);
  return card;
}
function moveStop(w,from,to){const [x]=w.stops.splice(from,1);w.stops.splice(to,0,x);touch(w);renderEditor();}

function renderPlayer(){
  const w=active();if(!w||!w.stops.length){renderEditor();return;}
  playerIndex=Math.max(0,Math.min(playerIndex,w.stops.length-1));
  const root=dialog.querySelector('#gw-player'),lib=dialog.querySelector('#gw-library'),ed=dialog.querySelector('#gw-editor');
  lib.hidden=true;ed.hidden=true;root.hidden=false;
  dialog.querySelector('#goatwalk-title').textContent=w.title;
  root.replaceChildren();

  const stop=w.stops[playerIndex],resolved=stopResolution(stop);
  const prog=el('div',{class:'gw-player-progress'},'STOP '+(playerIndex+1)+' / '+w.stops.length+' · '+modeLabel(w.mode));
  root.append(prog);
  if(playerIndex>0&&w.stops[playerIndex-1].transition){
    const bridge=el('div',{class:'gw-bridge'});
    bridge.append(el('div',{class:'gw-eyebrow'},'BRIDGE'),el('p',{},w.stops[playerIndex-1].transition));
    root.append(bridge);
  }
  const page=el('article',{class:'gw-player-page'+(resolved.status==='exact'?'':' unresolved')});
  page.append(el('div',{class:'gw-eyebrow'},stop.anchor?'PASSAGE':'SOURCE'),el('h3',{},stop.noteTitleAtAdd||resolved.note?.title||'Missing source'));
  if(resolved.status==='exact'){
    const text=stop.anchor?stop.anchor.quote:resolved.version.text;
    page.append(el('div',{class:'gw-player-text'},text));
  }else{
    page.append(el('p',{class:'gw-warning'},'This source address is unresolved. The Walk keeps the stop but does not substitute another text.'));
  }
  const open=el('button',{type:'button'},'OPEN EXACT SOURCE');open.disabled=resolved.status!=='exact';open.addEventListener('click',()=>{if(api.openStop(stop))dialog.close();});
  page.append(open);root.append(page);

  const nav=el('div',{class:'gw-player-nav'});
  const prev=el('button',{type:'button'},'← PREVIOUS');prev.disabled=playerIndex===0;prev.addEventListener('click',()=>{playerIndex--;renderPlayer();});
  const edit=el('button',{type:'button'},'EDIT WALK');edit.addEventListener('click',renderEditor);
  const next=el('button',{type:'button'},playerIndex===w.stops.length-1?'END WALK':'NEXT →');next.addEventListener('click',()=>{if(playerIndex===w.stops.length-1)renderEditor();else{playerIndex++;renderPlayer();}});
  nav.append(prev,edit,next);root.append(nav);
}

function exportWalkMarkdown(w){
  const lines=['# '+w.title,'','GOATwalk export · '+stamp(),'','Mode: '+modeLabel(w.mode),'','**ORDER ≠ SOURCE. A route through a note is not the note.**',''];
  w.stops.forEach((stop,index)=>{
    const r=stopResolution(stop);
    lines.push('## Stop '+(index+1)+' · '+(stop.noteTitleAtAdd||r.note?.title||'Missing source'),'');
    lines.push('Address: note '+stop.noteId+' · version '+stop.versionId,'');
    if(r.status==='exact')lines.push(stop.anchor?stop.anchor.quote:r.version.text,'');
    else lines.push('[UNRESOLVED SOURCE: '+r.status+']','');
    if(stop.transition)lines.push('### Transition','',stop.transition,'');
  });
  const blob=new Blob([lines.join('\n')],{type:'text/markdown;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=(w.title.toLowerCase().replace(/[^a-z0-9-]+/g,'-').replace(/^-|-$/g,'').slice(0,48)||'goatwalk')+'.md';
  document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}

injectHeader();
})();