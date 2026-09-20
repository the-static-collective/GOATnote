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
    this.tag = tag; this.value = ''; this.textContent = '';
    this.hidden = false; this.disabled = false; this.readOnly = false;
    this.children = []; this.selectionStart = 0; this.selectionEnd = 0;
    this.files = []; this.style = {};
  }
  replaceChildren(...xs) { this.children = xs; }
  append(...xs) { this.children.push(...xs); }
  focus() {}
  setSelectionRange(a,b) { this.selectionStart = a; this.selectionEnd = b; }
  click() { this.onclick?.(); }
}
const document = {
  getElementById(id) { if (!nodes.has(id)) nodes.set(id,new Element()); return nodes.get(id); },
  createElement(tag) { return new Element(tag); },
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

$('newThread').click();
$('threadKind').value = 'question'; $('threadText').value = 'What is still unresolved?'; $('saveThread').click();
note = db().notes[0];
assert.equal(note.returnThreads.length,1,'thread created');
const thread = note.returnThreads[0];
assert.equal(thread.sourceVersionId,versionId,'thread bound to selected historic source');
assert.equal(thread.entries[0].kind,'question','open question preserved');
assert.equal(note.versions.find(v => v.id === versionId).text,source,'source unchanged by thread');
$('threadList').children[0].children.at(-1).children[1].click();
$('threadKind').value = 'carry'; $('threadText').value = 'Carry the particular forward'; $('saveThread').click();
note = db().notes[0];
assert.equal(note.returnThreads[0].entries.length,2,'return appends without replacing');
assert.equal(note.returnThreads[0].entries[0].text,'What is still unresolved?','earlier question retained');
$('search').value = 'Carry the particular'; $('search').oninput();
assert.equal($('noteList').children.length,1,'search includes thread contributions');
$('search').value = ''; $('search').oninput();
$('latest').click();
$('body').value = 'A changed draft with no old sentence'; $('body').oninput();
$('threadList').children[0].children.at(-1).children[0].click();
assert.equal($('body').value,source,'original source view is exact after draft changes');
assert.equal($('body').readOnly,true,'source view cannot edit a frozen version');
$('latest').click();
assert.equal($('body').value,'A changed draft with no old sentence','return to latest retains draft');

$('dailyNote').click();
const count = db().notes.length;
$('dailyNote').click();
assert.equal(db().notes.length,count,'Today reopens instead of duplicating');
console.log('GOATnote smoke: original checks + 10 Return Thread checks passed. Browser/storage testing still required.');
