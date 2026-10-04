(()=>{
'use strict';
const core=window.GOATnoteWalkAPI;
const walkAPI=window.GOATwalkAPI;
if(!core||!walkAPI)return;

const uid=core.uid;
const stamp=core.stamp;
let activeRoomId=null;
let pendingTarget=null;

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
const rooms=()=>core.getRooms();
const active=()=>rooms().find(r=>r.id===activeRoomId)||null;
const save=()=>core.saveRooms(rooms());
const clip=(s,n=120)=>String(s||'').replace(/\s+/g,' ').trim().slice(0,n)+(String(s||'').replace(/\s+/g,' ').trim().length>n?'…':'');
const walkLabel=w=>({story:'Story',plan:'Plan',memory:'Memory Room',playlist:'Playlist',free:'Free Walk'}[w?.mode]||'Walk');

function createRoom(title='Untitled Room'){
  const room={id:uid(),title:title.trim()||'Untitled Room',createdAt:stamp(),updatedAt:stamp(),items:[]};
  rooms().push(room);save();activeRoomId=room.id;return room;
}
function touch(room){room.updatedAt=stamp();save();}
function sourceItem(target){
  return {
    id:uid(),kind:'source',noteId:target.noteId,versionId:target.versionId,
    noteTitleAtAdd:target.noteTitle||'Untitled',
    anchor:target.anchor?{start:target.anchor.start,end:target.anchor.end,quote:target.anchor.quote}:null,
    addedAt:stamp()
  };
}
function walkItem(walk){
  return {id:uid(),kind:'walk',walkId:walk.id,walkTitleAtAdd:walk.title,addedAt:stamp()};
}
function addSource(room,target){room.items.push(sourceItem(target));touch(room);}
function addWalk(room,walk){
  if(room.items.some(i=>i.kind==='walk'&&i.walkId===walk.id))return false;
  room.items.push(walkItem(walk));touch(room);return true;
}

function injectHeader(){
  const actions=document.querySelector('header .actions');
  if(!actions)return;
  const add=el('button',{id:'goatroom-add'},'+ To Room');
  const open=el('button',{id:'goatroom-open'},'Rooms');
  const exportBtn=document.getElementById('exportBtn');
  actions.insertBefore(add,exportBtn||null);
  actions.insertBefore(open,exportBtn||null);

  add.addEventListener('click',()=>{
    try{
      pendingTarget=core.captureTarget();
      if(!pendingTarget){alert('Open a note first.');return;}
      openDialog('add');
    }catch(err){alert(err.message||'Could not address that passage.');}
  });
  open.addEventListener('click',()=>openDialog('library'));
}

const dialog=el('dialog',{id:'goatroom-dialog','aria-labelledby':'goatroom-title'});
dialog.innerHTML=`
  <div class="gr-shell">
    <header class="gr-head">
      <div><div class="gr-eyebrow">GOATrooms 001</div><h2 id="goatroom-title">Rooms</h2></div>
      <button type="button" id="gr-close" aria-label="Close GOATrooms">×</button>
    </header>
    <section id="gr-library"></section>
    <section id="gr-room" hidden></section>
  </div>`;
document.body.append(dialog);
dialog.querySelector('#gr-close').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});

function openDialog(mode='library'){
  if(!dialog.open)dialog.showModal();
  if(mode==='add')renderLibrary(true); else renderLibrary(false);
}

function renderLibrary(forAdd=false){
  const root=dialog.querySelector('#gr-library'),roomRoot=dialog.querySelector('#gr-room');
  root.hidden=false;roomRoot.hidden=true;
  dialog.querySelector('#goatroom-title').textContent=forAdd?'Add to a Room':'Rooms';
  root.replaceChildren();

  if(forAdd&&pendingTarget){
    const capture=el('div',{class:'gr-capture'});
    capture.append(
      el('div',{class:'gr-eyebrow'},pendingTarget.anchor?'SELECTED PASSAGE':'WHOLE NOTE'),
      el('strong',{},pendingTarget.noteTitle||'Untitled'),
      el('p',{},pendingTarget.anchor?'“'+clip(pendingTarget.anchor.quote,90)+'”':'Exact saved source')
    );
    root.append(capture);
  }

  const maker=el('form',{class:'gr-new'});
  const title=el('input',{type:'text',placeholder:'New Room name',maxlength:'120','aria-label':'New Room name'});
  const make=el('button',{type:'submit',class:'primary'},forAdd?'NEW ROOM + PLACE':'NEW ROOM');
  maker.append(title,make);
  maker.addEventListener('submit',e=>{
    e.preventDefault();
    const room=createRoom(title.value);
    if(forAdd&&pendingTarget){addSource(room,pendingTarget);pendingTarget=null;}
    renderRoom();
  });
  root.append(maker);

  const grid=el('div',{class:'gr-library-grid'});
  if(!rooms().length)grid.append(el('p',{class:'muted'},'No Rooms yet. A Room gathers addresses without turning them into a sequence.'));
  for(const room of [...rooms()].sort((a,b)=>new Date(b.updatedAt)-new Date(a.updatedAt))){
    const card=el('article',{class:'gr-room-card'});
    card.append(
      el('div',{class:'gr-eyebrow'},'ROOM'),
      el('h3',{},room.title),
      el('p',{class:'gr-meta'},room.items.length+' occupant'+(room.items.length===1?'':'s'))
    );
    const open=el('button',{type:'button'},forAdd?'PLACE HERE':'ENTER ROOM');
    open.addEventListener('click',()=>{
      activeRoomId=room.id;
      if(forAdd&&pendingTarget){addSource(room,pendingTarget);pendingTarget=null;}
      renderRoom();
    });
    card.append(open);grid.append(card);
  }
  root.append(grid);
}

function renderRoom(){
  const room=active();if(!room){renderLibrary(false);return;}
  const root=dialog.querySelector('#gr-room'),lib=dialog.querySelector('#gr-library');
  lib.hidden=true;root.hidden=false;
  dialog.querySelector('#goatroom-title').textContent='Room';
  root.replaceChildren();

  const top=el('div',{class:'gr-top'});
  const back=el('button',{type:'button'},'← ALL ROOMS');back.addEventListener('click',()=>renderLibrary(false));
  const title=el('input',{class:'gr-title',type:'text',value:room.title,maxlength:'120','aria-label':'Room name'});
  title.addEventListener('change',()=>{room.title=title.value.trim()||'Untitled Room';touch(room);});
  top.append(back,title);root.append(top);

  root.append(el('p',{class:'gr-law'},'ROOM ≠ ROUTE · PLACEMENT ≠ CHRONOLOGY · ADJACENCY ≠ CAUSATION'));

  const tools=el('div',{class:'gr-tools'});
  const addCurrent=el('button',{type:'button',class:'primary'},'+ CURRENT SOURCE');
  addCurrent.addEventListener('click',()=>{
    try{
      const target=core.captureTarget();if(!target){alert('Open a note first.');return;}
      addSource(room,target);renderRoom();
    }catch(err){alert(err.message||'Could not address that passage.');}
  });

  const walkSelect=el('select',{'aria-label':'Choose Walk door for Room'});
  walkSelect.append(el('option',{value:''},'Walk door…'));
  walkAPI.getWalks().forEach(w=>walkSelect.append(el('option',{value:w.id},w.title)));
  const addWalkBtn=el('button',{type:'button'},'+ WALK DOOR');
  addWalkBtn.disabled=walkSelect.options.length<=1;
  addWalkBtn.addEventListener('click',()=>{
    const walk=walkAPI.getWalk(walkSelect.value);
    if(walk&&addWalk(room,walk))renderRoom();
  });

  const exportMd=el('button',{type:'button'},'EXPORT ROOM .MD');
  exportMd.disabled=!room.items.length;
  exportMd.addEventListener('click',()=>exportRoom(room));

  tools.append(addCurrent,walkSelect,addWalkBtn,exportMd);root.append(tools);

  const field=el('div',{class:'gr-field'});
  if(!room.items.length)field.append(el('p',{class:'muted'},'This Room is empty. Place source addresses or Walk doors here.'));
  room.items.forEach((item,index)=>field.append(renderItem(room,item,index)));
  root.append(field);

  const danger=el('div',{class:'gr-danger'});
  const del=el('button',{type:'button',class:'danger'},'Delete Room');
  del.addEventListener('click',()=>{
    if(!confirm('Delete this Room? Source notes and Walks will not be changed.'))return;
    const i=rooms().findIndex(r=>r.id===room.id);if(i>=0)rooms().splice(i,1);save();activeRoomId=null;renderLibrary(false);
  });
  danger.append(del);root.append(danger);
}

function renderItem(room,item,index){
  if(item.kind==='walk'){
    const walk=walkAPI.getWalk(item.walkId);
    const card=el('article',{class:'gr-item gr-door'+(walk?'':' unresolved')});
    card.append(
      el('div',{class:'gr-eyebrow'},walk?'WALK DOOR':'UNRESOLVED WALK DOOR'),
      el('h3',{},walk?.title||item.walkTitleAtAdd||'Missing Walk'),
      el('p',{class:'gr-meta'},walk?(walkLabel(walk)+' · '+walk.stops.length+' stop'+(walk.stops.length===1?'':'s')):'Referenced Walk no longer exists.')
    );
    const row=el('div',{class:'gr-row'});
    const enter=el('button',{type:'button',class:'primary'},walk&&walk.stops.length?'ENTER WALK':'EMPTY WALK');enter.disabled=!walk||!walk.stops.length;
    enter.addEventListener('click',()=>{dialog.close();walkAPI.playWalk(item.walkId);});
    const edit=el('button',{type:'button'},'OPEN WALK');edit.disabled=!walk;
    edit.addEventListener('click',()=>{dialog.close();walkAPI.openWalk(item.walkId);});
    const remove=el('button',{type:'button',class:'danger'},'REMOVE');remove.addEventListener('click',()=>{room.items.splice(index,1);touch(room);renderRoom();});
    row.append(enter,edit,remove);card.append(row);return card;
  }

  const resolved=core.resolveStop(item),exact=resolved.status==='exact';
  const card=el('article',{class:'gr-item gr-source'+(exact?'':' unresolved')});
  card.append(
    el('div',{class:'gr-eyebrow'},exact?(item.anchor?'PASSAGE':'SOURCE'):'UNRESOLVED SOURCE'),
    el('h3',{},item.noteTitleAtAdd||resolved.note?.title||'Missing source')
  );
  if(exact){
    card.append(el('blockquote',{},item.anchor?item.anchor.quote:clip(resolved.version.text,240)));
  }else{
    card.append(el('p',{class:'gr-warning'},'This source address no longer resolves exactly. GOATrooms will not replace it with similar text.'));
  }
  const row=el('div',{class:'gr-row'});
  const open=el('button',{type:'button'},'OPEN EXACT SOURCE');open.disabled=!exact;
  open.addEventListener('click',()=>{if(core.openStop(item))dialog.close();});
  const remove=el('button',{type:'button',class:'danger'},'REMOVE');remove.addEventListener('click',()=>{room.items.splice(index,1);touch(room);renderRoom();});
  row.append(open,remove);card.append(row);return card;
}

function exportRoom(room){
  const lines=['# '+room.title,'','GOATroom export · '+stamp(),'','**ROOM ≠ ROUTE. Placement ≠ chronology. Adjacency ≠ causation.**',''];
  room.items.forEach(item=>{
    if(item.kind==='walk'){
      const walk=walkAPI.getWalk(item.walkId);
      lines.push('## Walk door · '+(walk?.title||item.walkTitleAtAdd||'Missing Walk'),'');
      lines.push(walk?'Walk ID: '+walk.id+' · '+walkLabel(walk)+' · '+walk.stops.length+' stops':'[UNRESOLVED WALK: '+item.walkId+']','');
    }else{
      const r=core.resolveStop(item);
      lines.push('## Source · '+(item.noteTitleAtAdd||r.note?.title||'Missing source'),'');
      lines.push('Address: note '+item.noteId+' · version '+item.versionId,'');
      if(r.status==='exact')lines.push(item.anchor?item.anchor.quote:r.version.text,'');
      else lines.push('[UNRESOLVED SOURCE: '+r.status+']','');
    }
  });
  const blob=new Blob([lines.join('\n')],{type:'text/markdown;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=(room.title.toLowerCase().replace(/[^a-z0-9-]+/g,'-').replace(/^-|-$/g,'').slice(0,48)||'goatroom')+'.md';
  document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}

injectHeader();
window.GOATroomsAPI={
  getRooms:rooms,
  openRoom:id=>{const room=rooms().find(r=>r.id===id);if(!room)return false;activeRoomId=id;if(!dialog.open)dialog.showModal();renderRoom();return true;}
};
})();