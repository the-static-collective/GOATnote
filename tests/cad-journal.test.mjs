import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import {
  verifyCadJournalHandoff, projectCadJournal, mergeCadJournal
} from "../cad-journal.mjs";

// Synthetic fixture only; the real signed evidence is validated by
// Static-OS's pinned native reLATTE source before handoff creation.
const ident = (head,letter) => head+":"+letter.repeat(64);
const source=ident("static-os-solved-sketch-v0","1");
const traceId=ident("static-os-cad-trace-v0","2");
const manifest=ident("static-os-solid-manifest-v0","3");
const crossing=ident("relatte-crossing-v0","4");
const stamps="2026-10-08T19:29:35.000Z";
const names=["SOURCE","SKETCH_TO_SOLID","PAD","POCKET","NEUTRAL_EXPORT","REIMPORT"];
const events=names.map((name,i)=>({
  schema:"static-os.cad-decision-event/v0",ordinal:i+1,
  event_id:ident("static-os-cad-event-v0",String(i+1)),
  previous_event_id:i===0?null:ident("static-os-cad-event-v0",String(i)),
  decision_code:name,source_refs:[source],
  alternatives_considered:["DECLINE",name],selected:name,
  declared_rationale_code:"EVIDENCE_REVIEW",observable_result:{ok:true,index:i},
  authority_effect:"none",model_private_reasoning_captured:false
}));
const handoff={
  schema:"goatnote.cad-journal-handoff/v0",
  evidence:{
    crossing_id:crossing,manifest_id:manifest,trace_id:traceId,
    source_sketch_id:source,receive_receipt_id:ident("relatte-receipt-v0","5"),
    disposition_receipt_id:ident("relatte-receipt-v0","6"),
    native_verification:"SIGNED_CROSSING_AND_RECEIVE_HOLD_VERIFIED",
    disposition:"HOLD",fabrication_grant:false,created_at:stamps,
  },
  trace:{
    schema:"static-os.cad-decision-trace/v0",trace_id:traceId,
    source_sketch_id:source,head:events.at(-1).event_id,
    events,status:"DECLARED_DECISION_AND_KERNEL_EVIDENCE",
    physical_action:false,hidden_chain_of_thought:"NOT_COLLECTED",
  },
};
const expectFailure=(value,why)=>{
  assert.throws(()=>verifyCadJournalHandoff(value),/REQUIRED|INVALID|MISMATCH|CAD|SOURCE|GOAT|HOLD|FABRICATION/,"refuse "+why);
};
assert.deepEqual(verifyCadJournalHandoff(handoff),handoff);
const first=projectCadJournal(handoff);
assert.equal(first.versions.length,1);
assert.equal(first.margins.length,12);
assert.equal(first.returnThreads.length,1);
assert.equal(first.returnThreads[0].entries.length,2);
for(const margin of first.margins){
  assert.equal(margin.versionId,first.versions[0].id);
  const {start,end,quote}=margin.anchor;
  assert.equal(first.versions[0].text.slice(start,end),quote);
}
assert.match(first.draft,/GOATnote has NOT independently verified/);
assert.equal(first.cadJournal.goatnote_signature_verified,false);
assert.match(first.draft,/Receiver disposition: HOLD/);
const old={id:"owned-journal",title:"My private note",
           draft:"DO NOT CHANGE ME",versions:[{id:"v0",text:"original"}],
           margins:[{id:"my-note",text:"keep this"}]};
const notebook={schema:1,notes:[old],walks:[{id:"walk"}],rooms:[],edges:[]};
assert.throws(()=>mergeCadJournal(notebook,handoff),/EXPLICIT/);
const added=mergeCadJournal(notebook,handoff,true);
assert.equal(added.added,true);
assert.equal(notebook.notes.length,1,"caller-owned notebook unchanged");
assert.equal(added.notebook.notes.length,2);
assert.deepEqual(added.notebook.notes[1],old);
assert.equal(added.notebook.walks,notebook.walks);
const decorated=structuredClone(added.notebook);
decorated.notes[0].margins.push({
  id:"human-margin",versionId:first.versions[0].id,
  kind:"interpretation",text:"A later human reading."
});
const replay=mergeCadJournal(decorated,handoff,true);
assert.equal(replay.added,false);
assert.deepEqual(replay.notebook,decorated,"later GOATnote margins never lost");
const evil=structuredClone(decorated);
evil.notes[0].versions[0].text="silently rewritten past";
assert.throws(()=>mergeCadJournal(evil,handoff,true),/SOURCE/);
expectFailure({...handoff,evidence:{...handoff.evidence,disposition:"ADMIT"}},"admission");
expectFailure({...handoff,evidence:{...handoff.evidence,fabrication_grant:true}},"grant");
expectFailure({...handoff,evidence:{...handoff.evidence,native_verification:"TRUST_ME"}},"unsigned");
expectFailure({...handoff,trace:{...handoff.trace,hidden_chain_of_thought:"secret"}},"hidden claim");
const bad=structuredClone(handoff);bad.trace.events[2].previous_event_id="other";
expectFailure(bad,"broken chain");
const bad2=structuredClone(handoff);bad2.trace.events[0].model_private_reasoning_captured=true;
expectFailure(bad2,"unearned private reasoning");
const bad3=structuredClone(handoff);bad3.trace.events[0].alternatives_considered=["DECLINE"];
expectFailure(bad3,"selected alternative unlisted");
const bad4=structuredClone(handoff);bad4.extra="RUN_MACHINES";
expectFailure(bad4,"extra action");
const ui=readFileSync(new URL("../index.html",import.meta.url),"utf8");
assert.match(ui,/id="importCadJournal"/);
assert.match(ui,/cad-journal-ui.mjs/);
const script=readFileSync(new URL("../cad-journal-ui.mjs",import.meta.url),"utf8");
assert.match(script,/confirm\(/);
assert.match(script,/mergeCadJournal\(db, handoff, true\)/);
assert.doesNotMatch(script,/fetch\(|sendBeacon\(|WebSocket/);
console.log("GOATnote CAD Journal 001: 24 assertions groups PASS; opt-in, source immutability, historical margins, HOLD, no background sync");
