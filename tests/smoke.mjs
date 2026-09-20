// Run with: node tests/smoke.mjs
// Dependency-free model/DOM smoke test. Real browser and storage tests are still needed.
import { readFileSync } from 'node:fs';
import { strict as assert } from 'node:assert';
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert(script, 'Missing app script');
const nodes = new Map();
let serial = 0;
class Element {
  constructor(tag = 'div') {
    this.tag = tag; this.dataset = {}; this.attributes = {}; this.value = ''; this.textContent = '';
    this.hidden = false; this.disabled = false; this.readOnly = false;
    this.children = []; this.selectionStart = 0; this.selectionEnd = 0;
    this.files = []; this.style = {};
  }
  replaceChildren(...xs) { this.children = xs; }
  append(...xs) { this.children.push(...xs); }
  focus() {}
  setSelectionRange(a,b) { this.selectionStart = a; this.selectionEnd = b; }
  click() { this.onclick?.(); }
  setAttribute(key,value) { this.attributes[key] = value; }
}
const document = {
  getElementById(id) { if (!nodes.has(id)) nodes.set(id,new Element()); return nodes.get(id); },
  createElement(tag) { return new Element(tag); },
  querySelectorAll(selector) { if(selector==='[data-attention]') return ['joyful','useful','curiouser','none'].map(name=>{const id='attention-'+name;const node=this.getElementById(id);node.dataset.attention=name;return node});return []; },
  addEventListener() {},
};
const stored = new Map();
const localStorage = { getItem: k => stored.get(k) || null, setItem: (k,v) => stored.set(k,v) };
const window = { addEventListener() {} };
const crypto = { randomUUID: () => 'id-' + (++serial) };
const confirm = () => true;
const alert = message => { throw Error('Unexpected alert: ' + message); };
new Function('document','window','localStorage','crypto','setTimeout','clearTimeout','confirm','alert',script)(
  document,window,localStorage,crypto,()=>123,()=>{},confirm,alert
);
const $ = id => document.getElementById(id);
const db = () => JSON.parse(stored.get('goatnote-v1'));
$('newNote').click();
assert.equal(db().notes.length,1,'create note');
$('title').value = 'Original title'; $('title').oninput();
$('body').value = 'a particular line'; $('body').oninput();
$('body').setSelectionRange(2,12); $('addMargin').click();
$('marginText').value = 'first witness'; $('saveMargin').click();
let note = db().notes[0];
assert.equal(note.margins[0].anchor.quote,'particular','exact quote anchored');
assert.equal(note.versions.length,2,'margin commits draft');
const versionId = note.margins[0].versionId;
const source = note.versions.find(v => v.id === versionId).text;
$('body').value = 'new preface, a particular line'; $('body').oninput();
$('saveVersion').click();
note = db().notes[0];
assert.equal(note.versions.find(v => v.id === versionId).text,source,'past source unchanged');
$('version').value = versionId; $('version').onchange();
assert($('body').readOnly && !$('addMargin').disabled,'historical version accepts margins but not edits');
$('body').setSelectionRange(2,12); $('addMargin').click();
$('marginText').value = 'later reading'; $('saveMargin').click();
note = db().notes[0];
assert.equal(note.margins.length,2,'second margin saved');
assert.equal(note.margins[1].versionId,versionId,'later reading bound to original version');
$('search').value = 'later reading'; $('search').oninput();
assert.equal($('noteList').children.length,1,'search includes margins');
$('dailyNote').click();
const count = db().notes.length;
$('dailyNote').click();
assert.equal(db().notes.length,count,'Today reopens instead of duplicating');
$('noteList').children[0].click(); // reopen the original search hit before attention assertions
// ATTENTION-CROSSING: native local marks are append-only, anchored to source and not auto-selected.
$('attentionWhole').click();
$('attention-joyful').click();
note = db().notes.find(n=>n.id===note.id);
assert.equal(note.attention.length,1,'explicit note mark saved');
assert.deepEqual(note.attention[0].dimensions,['joyful']);
$('attention-useful').click();
note = db().notes.find(n=>n.id===note.id);
assert.deepEqual(note.attention[1].dimensions,['joyful','useful']);
assert.equal(note.attention[1].previousId,note.attention[0].id,'revision preserved');
$('attention-none').click();
note = db().notes.find(n=>n.id===note.id);
assert.equal(note.attention[2].explicitNone,true,'explicit none kept separately from untouched');
$('attention-joyful').click();
note = db().notes.find(n=>n.id===note.id);
assert.deepEqual(note.attention.at(-1).dimensions,['joyful'],'none can be revised');
$('body').setSelectionRange(2,12);
$('attentionSelection').click();
$('attention-curiouser').click();
note = db().notes.find(n=>n.id===note.id);
const crossing = note.attention.at(-1);
assert.equal(crossing.kind,'passage');
assert.equal(crossing.anchor.quote,note.versions.find(v=>v.id===crossing.versionId).text.slice(2,12));
assert.equal(note.versions.find(v=>v.id===versionId).text,source,'mark did not rewrite historical source');
console.log('GOATnote smoke: note/passage attention, revisions, explicit none, and source preservation passed. Browser/storage testing still required.');
