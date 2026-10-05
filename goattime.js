(()=>{
'use strict';

const core=window.GOATnoteWalkAPI;
const roomsAPI=window.GOATroomsAPI;
const edgesAPI=window.GOATedgesAPI;
const walkAPI=window.GOATwalkAPI;
if(!core||!roomsAPI||!edgesAPI||!walkAPI)return;

let roomId=null;
let cutAt=new Date();

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

const rooms=()=>roomsAPI.getRooms();
const room=()=>rooms().find(r=>r.id===roomId)||null;
const edgeById=id=>edgesAPI.getEdge(id);
const walkById=id=>walkAPI.getWalk(id);
const clip=(s,n=100)=>String(s||'').replace(/\s+/g,' ').trim().slice(0,n)+(String(s||'').replace(/\s+/g,' ').trim().length>n?'…':'');
const fmt=d=>{
  const x=d instanceof Date?d:new Date(d);
  return Number.isNaN(x.getTime())?'Unknown time':x.toLocaleString();
};
const inputValue=d=>{
  const x=new Date(d);
  const local=new Date(x.getTime()-x.getTimezoneOffset()*60000);
  return local.toISOString().slice(0,16);
};
const statusLabel=s=>({
  'not-yet-perceived':'Not yet perceived',
  perceived:'Perceived',
  proposed:'Proposed',
  admitted:'Admitted',
  weakened:'Weakened',
  refused:'Refused',
  unresolved:'Unresolved'
}[s]||s);

function endpointLabel(endpoint){
  if(!endpoint)return 'Missing endpoint';
  return endpoint.anchor?('“'+clip(endpoint.anchor.quote,72)+'”'):(endpoint.noteTitleAtAdd||'Whole note');
}

function endpointState(endpoint){
  if(!endpoint)return 'missing-endpoint';
  return core.resolveStop({
    id:'timecut-endpoint',
    noteId:endpoint.noteId,
    versionId:endpoint.versionId,
    anchor:endpoint.anchor||null
  }).status;
}

function relevantEdges(r=room()){
  if(!r)return [];
  return r.items
    .filter(i=>i.kind==='edge')
    .map(i=>edgeById(i.edgeId))
    .filter(Boolean);
}

function eventTimes(r=room()){
  const values=[];
  relevantEdges(r).forEach(edge=>{
    const born=new Date(edge.firstPerceivedAt);
    if(!Number.isNaN(born.getTime()))values.push({at:born,kind:'birth',edgeId:edge.id,label:edge.type});
    (Array.isArray(edge.history)?edge.history:[]).forEach(h=>{
      const at=new Date(h.at);
      if(!Number.isNaN(at.getTime()))values.push({at,kind:'revision',edgeId:edge.id,label:(h.type||edge.type)+' · '+(h.status||'revision')});
    });
  });
  const dedup=new Map();
  values.sort((a,b)=>a.at-b.at).forEach(x=>{
    const key=x.at.toISOString()+'|'+x.edgeId+'|'+x.kind+'|'+x.label;
    dedup.set(key,x);
  });
  return [...dedup.values()].sort((a,b)=>a.at-b.at);
}

function snapshot(r=room(),at=cutAt){
  if(!r)return null;
  const items=r.items.map(item=>{
    if(item.kind==='edge'){
      const edge=edgeById(item.edgeId);
      if(!edge)return {kind:'edge',id:item.id,edgeId:item.edgeId,state:'missing-edge',label:item.edgeTypeAtAdd||'Missing edge'};
      const historical=edgesAPI.stateAt(edge,at);
      return {
        kind:'edge',
        id:item.id,
        edgeId:edge.id,
        currentStatus:edge.status,
        historical,
        fromResolved:historical?.from?endpointState(historical.from):'missing-endpoint',
        toResolved:historical?.to?endpointState(historical.to):'missing-endpoint'
      };
    }
    if(item.kind==='walk'){
      const walk=walkById(item.walkId);
      return {kind:'walk',id:item.id,walkId:item.walkId,label:walk?.title||item.walkTitleAtAdd||'Missing Walk',mode:walk?.mode||null,stops:walk?.stops?.length??null,present:!!walk};
    }
    const resolved=core.resolveStop(item);
    return {kind:'source',id:item.id,noteId:item.noteId,versionId:item.versionId,label:item.noteTitleAtAdd||resolved.note?.title||'Missing source',anchor:item.anchor||null,resolved:resolved.status};
  });

  const topology=items.filter(i=>i.kind==='edge');
  const counts={};
  topology.forEach(i=>{
    const key=i.state==='missing-edge'?'missing-edge':(i.historical?.status||'unknown');
    counts[key]=(counts[key]||0)+1;
  });

  return {
    schema:'goatnote.timecut.v1',
    generatedAt:new Date().toISOString(),
    cutAt:new Date(at).toISOString(),
    room:{id:r.id,title:r.title,updatedAt:r.updatedAt},
    posture:{
      roomContents:'current-room-membership-held-constant',
      topology:'edge-state-reconstructed-as-of-cut',
      authority:'read-only',
      law:'AS-OF ADMISSION ≠ CURRENT AUTHORITY'
    },
    counts,
    items
  };
}

function renderControls(){
  const select=document.getElementById('gt-room');
  select.replaceChildren();
  rooms().forEach(r=>{
    const o=el('option',{value:r.id},r.title);
    if(r.id===roomId)o.selected=true;
    select.append(o);
  });
  select.disabled=!rooms().length;

  const input=document.getElementById('gt-cut');
  input.value=inputValue(cutAt);
}

function step(direction){
  const events=eventTimes();
  if(!events.length)return;
  const t=cutAt.getTime();
  if(direction<0){
    const prior=events.filter(e=>e.at.getTime()<t).pop();
    if(prior)cutAt=new Date(prior.at);
  }else{
    const next=events.find(e=>e.at.getTime()>t);
    if(next)cutAt=new Date(next.at);
  }
  render();
}

function renderSummary(snap){
  const root=document.getElementById('gt-summary');
  root.replaceChildren();
  if(!snap){
    root.append(el('p',{class:'muted'},'Create a Room first.'));
    return;
  }

  const total=snap.items.filter(i=>i.kind==='edge').length;
  const admitted=snap.counts.admitted||0;
  const unborn=snap.counts['not-yet-perceived']||0;
  const unresolved=(snap.counts['missing-edge']||0)+(snap.counts.unresolved||0);

  root.append(
    el('div',{class:'gt-summary-cell'},String(total)+' staircase'+(total===1?'':'s')+' addressed'),
    el('div',{class:'gt-summary-cell'},String(admitted)+' admitted at cut'),
    el('div',{class:'gt-summary-cell'},String(unborn)+' not yet perceived'),
    el('div',{class:'gt-summary-cell'},String(unresolved)+' unresolved / missing')
  );
}

function sourceCard(item){
  const card=el('article',{class:'gt-card gt-source'});
  card.append(
    el('div',{class:'gt-eyebrow'},'SOURCE · PRESENT ROOM OCCUPANT'),
    el('h3',{},item.label),
    el('p',{class:'gt-meta'},item.anchor?'Exact passage address':'Whole saved source address')
  );
  if(item.anchor)card.append(el('blockquote',{},item.anchor.quote));
  if(item.resolved!=='exact')card.append(el('p',{class:'gt-warning'},'Current source address is '+item.resolved+'. Time Cut does not repair it.'));
  return card;
}

function walkCard(item){
  const card=el('article',{class:'gt-card gt-walk'+(item.present?'':' unresolved')});
  card.append(
    el('div',{class:'gt-eyebrow'},'WALK DOOR · PRESENT ROOM OCCUPANT'),
    el('h3',{},item.label),
    el('p',{class:'gt-meta'},item.present?((item.mode||'walk')+' · '+item.stops+' stop'+(item.stops===1?'':'s')):'Referenced Walk is currently missing.')
  );
  return card;
}

function edgeCard(item){
  const edge=edgeById(item.edgeId);
  const state=item.historical;
  if(!edge||item.state==='missing-edge'||!state){
    const card=el('article',{class:'gt-card gt-edge unresolved'});
    card.append(el('div',{class:'gt-eyebrow'},'UNRESOLVED STAIRCASE'),el('h3',{},item.label||'Missing edge'),el('p',{class:'gt-warning'},'This Room still addresses an edge that no longer exists.'));
    return card;
  }

  if(state.status==='not-yet-perceived'){
    const card=el('article',{class:'gt-card gt-edge future'});
    card.append(
      el('div',{class:'gt-eyebrow'},'NO STAIRCASE AT THIS CUT'),
      el('h3',{},edge.type),
      el('p',{class:'gt-meta'},'First perceived later · '+fmt(edge.firstPerceivedAt)),
      el('p',{},endpointLabel(edge.from)+' ⇢ '+endpointLabel(edge.to))
    );
    return card;
  }

  const card=el('article',{class:'gt-card gt-edge status-'+state.status});
  const historicalType=state.type||edge.type;
  card.append(
    el('div',{class:'gt-eyebrow'},'STAIRCASE · '+statusLabel(state.status).toUpperCase()),
    el('h3',{},historicalType),
    el('p',{class:'gt-edge-path'},endpointLabel(state.from||edge.from)+' → '+endpointLabel(state.to||edge.to))
  );

  const bits=[
    state.confidence?state.confidence+' confidence':'confidence not yet recorded',
    'first perceived '+fmt(state.firstPerceivedAt||edge.firstPerceivedAt)
  ];
  if(state.recordedAt)bits.push('state recorded '+fmt(state.recordedAt));
  card.append(el('p',{class:'gt-meta'},bits.join(' · ')));

  if(item.fromResolved!=='exact'||item.toResolved!=='exact'){
    card.append(el('p',{class:'gt-warning'},'One or both endpoint addresses do not resolve exactly in the current notebook. The historical relation remains displayed, but no repair is inferred.'));
  }

  if(state.status==='admitted'){
    card.append(el('div',{class:'gt-was-open'},'STAIRCASE ADMITTED AT THIS CUT · READ ONLY'));
  }

  if(edge.status!==state.status){
    card.append(el('p',{class:'gt-current'},'Current disposition: '+statusLabel(edge.status)+'. Historical admission does not override current state.'));
  }

  const inspect=el('button',{type:'button'},'INSPECT CURRENT EDGE');
  inspect.addEventListener('click',()=>{dialog.close();edgesAPI.openEdge(edge.id);});
  card.append(inspect);
  return card;
}

function renderRoomField(snap){
  const root=document.getElementById('gt-field');
  root.replaceChildren();
  if(!snap){
    root.append(el('p',{class:'muted'},'No Room selected.'));
    return;
  }

  const note=el('div',{class:'gt-posture'});
  note.append(
    el('strong',{},snap.room.title),
    el('span',{},'Room membership held at its present composition. Only relation-state is scrubbed through recorded history.')
  );
  root.append(note);

  const grid=el('div',{class:'gt-grid'});
  snap.items.forEach(item=>{
    if(item.kind==='edge')grid.append(edgeCard(item));
    else if(item.kind==='walk')grid.append(walkCard(item));
    else grid.append(sourceCard(item));
  });
  if(!snap.items.length)grid.append(el('p',{class:'muted'},'This Room currently has no occupants.'));
  root.append(grid);
}

function renderEvents(){
  const root=document.getElementById('gt-events');
  root.replaceChildren();
  const events=eventTimes();
  if(!events.length){
    root.append(el('p',{class:'muted'},'No edge birthdays or revisions exist in this Room yet.'));
    return;
  }
  const nearest=[...events].sort((a,b)=>Math.abs(a.at-cutAt)-Math.abs(b.at-cutAt)).slice(0,8).sort((a,b)=>a.at-b.at);
  nearest.forEach(e=>{
    const row=el('button',{type:'button',class:'gt-event'});
    row.append(el('span',{},fmt(e.at)),el('strong',{},e.kind==='birth'?'BIRTH · '+e.label:e.label));
    if(e.at<=cutAt)row.classList.add('past');
    row.addEventListener('click',()=>{cutAt=new Date(e.at);render();});
    root.append(row);
  });
}

function render(){
  if(!roomId&&rooms().length)roomId=rooms()[0].id;
  if(roomId&&!rooms().some(r=>r.id===roomId))roomId=rooms()[0]?.id||null;
  renderControls();
  const snap=snapshot();
  document.getElementById('gt-cut-label').textContent=fmt(cutAt);
  renderSummary(snap);
  renderRoomField(snap);
  renderEvents();

  const has=!!snap;
  document.getElementById('gt-export-json').disabled=!has;
  document.getElementById('gt-export-md').disabled=!has;
}

function markdown(snap){
  const lines=[
    '# TIME CUT · '+snap.room.title,
    '',
    'Cut: '+snap.cutAt,
    '',
    '**AS-OF ADMISSION ≠ CURRENT AUTHORITY.**',
    '',
    'Room membership is held at its present composition. Only relation-state is reconstructed from recorded edge history.',
    ''
  ];

  snap.items.forEach(item=>{
    if(item.kind==='source'){
      lines.push('## Source · '+item.label,'');
      lines.push(item.anchor?item.anchor.quote:'Address: note '+item.noteId+' · version '+item.versionId,'');
    }else if(item.kind==='walk'){
      lines.push('## Walk door · '+item.label,'');
      lines.push(item.present?('Mode: '+(item.mode||'walk')+' · '+item.stops+' stops'):'[CURRENTLY MISSING WALK]','');
    }else if(item.state==='missing-edge'){
      lines.push('## Staircase · '+item.label,'','[CURRENTLY MISSING EDGE]','');
    }else{
      const h=item.historical;
      lines.push('## Staircase · '+((h?.type)||edgeById(item.edgeId)?.type||'Relation'),'');
      lines.push('Status at cut: '+statusLabel(h?.status||'unknown'),'');
      if(h?.status==='not-yet-perceived')lines.push('First perceived later: '+edgeById(item.edgeId)?.firstPerceivedAt,'');
      else{
        lines.push('From: '+endpointLabel(h?.from),'','To: '+endpointLabel(h?.to),'');
        lines.push('Confidence at cut: '+(h?.confidence||'not recorded'),'');
        lines.push('Discovery trace: '+(h?.discoveryTrace||'not recorded'),'','Evidence path: '+(h?.evidencePath||'not recorded'),'');
      }
    }
  });

  return lines.join('\n');
}

function download(name,type,text){
  const blob=new Blob([text],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function filename(ext){
  const r=room();
  const base=(r?.title||'room').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,48)||'room';
  return base+'-timecut-'+cutAt.toISOString().replace(/[:.]/g,'-')+'.'+ext;
}

function injectHeader(){
  const actions=document.querySelector('header .actions');
  if(!actions)return;
  const button=el('button',{id:'goattime-open'},'Time Cut');
  const exportBtn=document.getElementById('exportBtn');
  actions.insertBefore(button,exportBtn||null);
  button.addEventListener('click',()=>{
    if(!rooms().length){alert('Create a Room first.');return;}
    roomId=roomId||rooms()[0].id;
    cutAt=new Date();
    if(!dialog.open)dialog.showModal();
    render();
  });
}

const dialog=el('dialog',{id:'goattime-dialog','aria-labelledby':'gt-title'});
dialog.innerHTML=`
  <div class="gt-shell">
    <header class="gt-head">
      <div><div class="gt-eyebrow">TIME-CUT 001</div><h2 id="gt-title">Same Room, Different Staircases</h2></div>
      <button type="button" id="gt-close" aria-label="Close Time Cut">×</button>
    </header>
    <section class="gt-controls">
      <label><span>ROOM</span><select id="gt-room"></select></label>
      <label><span>AS-OF CUT</span><input id="gt-cut" type="datetime-local"></label>
      <div class="gt-step">
        <button id="gt-prev" type="button">← PREV EVENT</button>
        <button id="gt-now" type="button">NOW</button>
        <button id="gt-next" type="button">NEXT EVENT →</button>
      </div>
      <div id="gt-cut-label" class="gt-cut-label"></div>
      <p class="gt-law">CUT ≠ OCCURRENCE TIME · AS-OF VIEW ≠ HISTORICAL OMNISCIENCE · AS-OF ADMISSION ≠ CURRENT AUTHORITY</p>
    </section>
    <section id="gt-summary" class="gt-summary"></section>
    <section id="gt-field"></section>
    <section class="gt-events-wrap">
      <div class="gt-eyebrow">NEARBY EDGE EVENTS</div>
      <div id="gt-events" class="gt-events"></div>
    </section>
    <section class="gt-export">
      <button id="gt-export-json" type="button">EXPORT CUT .JSON</button>
      <button id="gt-export-md" type="button">EXPORT CUT .MD</button>
    </section>
  </div>`;
document.body.append(dialog);

dialog.querySelector('#gt-close').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
dialog.querySelector('#gt-room').addEventListener('change',e=>{roomId=e.target.value;render();});
dialog.querySelector('#gt-cut').addEventListener('change',e=>{
  const d=new Date(e.target.value);
  if(!Number.isNaN(d.getTime())){cutAt=d;render();}
});
dialog.querySelector('#gt-prev').addEventListener('click',()=>step(-1));
dialog.querySelector('#gt-next').addEventListener('click',()=>step(1));
dialog.querySelector('#gt-now').addEventListener('click',()=>{cutAt=new Date();render();});
dialog.querySelector('#gt-export-json').addEventListener('click',()=>{
  const snap=snapshot();if(snap)download(filename('json'),'application/json;charset=utf-8',JSON.stringify(snap,null,2));
});
dialog.querySelector('#gt-export-md').addEventListener('click',()=>{
  const snap=snapshot();if(snap)download(filename('md'),'text/markdown;charset=utf-8',markdown(snap));
});

injectHeader();

window.GOATtimeAPI={
  snapshot:(roomIdArg,cutArg)=>{
    const priorRoom=roomId,priorCut=cutAt;
    roomId=roomIdArg||roomId;
    cutAt=cutArg?new Date(cutArg):cutAt;
    const out=snapshot();
    roomId=priorRoom;cutAt=priorCut;
    return out;
  },
  open:(roomIdArg=null,cutArg=null)=>{
    if(roomIdArg)roomId=roomIdArg;
    if(cutArg)cutAt=new Date(cutArg);
    if(!dialog.open)dialog.showModal();
    render();
  }
};
})();