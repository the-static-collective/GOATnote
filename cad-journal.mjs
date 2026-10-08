/* GOATnote CAD Journal 001.
 * Source-owned immutable note versions, version-anchored margins and Return
 * Threads. No auto import, no signer, no authority or "AI inner thoughts".
 * Works as an ES module in GOATnote's browser and as Node >=24 tests.
 */
export const CAD_JOURNAL_SCHEMA = "goatnote.cad-journal-handoff/v0";
export const SOURCE_POSTURE = "DECLARED_CAD_DECISIONS_NOT_PRIVATE_REASONING";
const kinds = ["SOURCE","SKETCH_TO_SOLID","PAD","POCKET","NEUTRAL_EXPORT","REIMPORT"];
const safe = (condition, code) => { if (!condition) throw new Error(code); };
const object = v => v !== null && typeof v === "object" && !Array.isArray(v);
const cleanId = (id) => {
  safe(typeof id === "string" && id.length > 8 && id.length < 180
       && /^(?:[a-z][a-z0-9._:-]+)$/i.test(id), "INVALID_GOAT_CAD_ID");
  return id;
};
const noAuthority = event => event.authority_effect === "none"
  && event.model_private_reasoning_captured === false;

export function verifyCadJournalHandoff(value) {
  safe(object(value) && ["evidence|schema|trace","branch|evidence|schema|trace"]
       .includes(Object.keys(value).sort().join("|")), "EXACT_CAD_HANDOFF_REQUIRED");
  safe(value.schema === CAD_JOURNAL_SCHEMA, "INVALID_GOAT_CAD_SCHEMA");
  const evidence = value.evidence;
  const trace = value.trace;
  safe(object(evidence) && object(trace), "MISSING_CAD_EVIDENCE");
  safe(Object.keys(evidence).sort().join("|") === [
    "created_at", "crossing_id", "disposition", "fabrication_grant",
    "manifest_id", "native_verification", "receive_receipt_id",
    "source_sketch_id", "trace_id", "disposition_receipt_id"
  ].sort().join("|"), "EXACT_RECEIPT_WITNESS_FIELDS");
  for (const name of ["crossing_id","manifest_id","trace_id",
                       "receive_receipt_id","disposition_receipt_id","source_sketch_id"]) {
    cleanId(evidence[name]);
  }
  safe(typeof evidence.created_at === "string" &&
       /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(evidence.created_at),
       "INVALID_SIGNED_CROSSING_TIME");
  safe(evidence.native_verification === "SIGNED_CROSSING_AND_RECEIVE_HOLD_VERIFIED"
       && evidence.disposition === "HOLD" && evidence.fabrication_grant === false,
       "GOATNOTE_CANNOT_IMPORT_ADMITTED_FABRICATION");
  safe(trace.schema === "static-os.cad-decision-trace/v0"
       && trace.trace_id === evidence.trace_id
       && trace.source_sketch_id === evidence.source_sketch_id
       && trace.status === "DECLARED_DECISION_AND_KERNEL_EVIDENCE"
       && trace.physical_action === false
       && trace.hidden_chain_of_thought === "NOT_COLLECTED",
       "GOAT_CAD_SOURCE_TRACE_MISMATCH");
  safe(Array.isArray(trace.events) && trace.events.length === 6,
       "EXPECTED_SIX_DECLARED_DECISIONS");
  let previous = null;
  trace.events.forEach((event,i) => {
    safe(object(event) && event.schema === "static-os.cad-decision-event/v0"
         && event.ordinal === i+1 && event.decision_code === kinds[i]
         && event.previous_event_id === previous && noAuthority(event)
         && Array.isArray(event.source_refs)
         && event.source_refs.length === 1
         && event.source_refs[0] === evidence.source_sketch_id
         && typeof event.event_id === "string"
         && event.event_id.startsWith("static-os-cad-event-v0:")
         && typeof event.declared_rationale_code === "string"
         && event.declared_rationale_code.length > 0
         && typeof event.selected === "string" && event.selected.length > 0
         && Array.isArray(event.alternatives_considered)
         && event.alternatives_considered.includes(event.selected)
         && object(event.observable_result),
         "INCONSISTENT_CAD_DECISION_EVENT");
    previous=event.event_id;
  });
  safe(trace.head === previous && trace.trace_id === evidence.trace_id,
       "CAD_LEDGER_HEAD_MISMATCH");
  if (value.branch !== undefined) {
    const b = value.branch;
    safe(object(b) && Object.keys(b).sort().join("|") === [
      "schema","tree_id","selected_candidate_id","parent_sketch_id",
      "selected_revision_sketch_id","alternatives_not_executed",
      "owner_choice","construction_authorized"
    ].sort().join("|"), "EXACT_CAD_BRANCH_WITNESS_REQUIRED");
    safe(b.schema === "static-os.cad-feature-branch-provenance/v0"
       && b.construction_authorized === false
       && b.owner_choice === "EXPLICIT_LOCAL_SOFTWARE_SELECTION"
       && b.selected_revision_sketch_id === evidence.source_sketch_id
       && typeof b.parent_sketch_id === "string"
       && b.parent_sketch_id.startsWith("static-os-solved-sketch-v0:")
       && typeof b.tree_id === "string"
       && b.tree_id.startsWith("static-os-cad-feature-tree-v0:")
       && ["pad-deeper","bore-wider"].includes(b.selected_candidate_id)
       && Array.isArray(b.alternatives_not_executed)
       && b.alternatives_not_executed.length === 1
       && ["pad-deeper","bore-wider"].includes(b.alternatives_not_executed[0])
       && b.alternatives_not_executed[0] !== b.selected_candidate_id,
       "CAD_BRANCH_SOURCE_OR_AUTHORITY_MISMATCH");
  }
  // Native reLATTE signature/byte checks happen at the Static-OS donor.
  // GOATnote is source-preserving and does not claim independent verification.
  return value;
}
const digestId = id => id.split(":").at(-1);
const human = text => String(text).replace(/[\r\n\t]+/g," ").slice(0,500);

export function projectCadJournal(handoff) {
  const h = verifyCadJournalHandoff(handoff);
  const e=h.evidence, t=h.trace;
  const id = "cadjournal-"+digestId(e.crossing_id);
  const versionId = "cadsource-"+digestId(e.trace_id);
  const title = "CAD design return · "+e.trace_id.slice(-12);
  const stamp = e.created_at; // Signed crossing creation, NOT CAD event occurrence.
  const lines = [
    "STATIC-CAD / GOATnote — frozen evidence source",
    "Posture: "+SOURCE_POSTURE,
    "Source sketch: "+e.source_sketch_id,
    ...(h.branch ? [
      "Feature tree: "+h.branch.tree_id,
      "Branch parent: "+h.branch.parent_sketch_id,
      "Selected branch: "+h.branch.selected_candidate_id,
      "Unselected candidate (NOT executed here): "+h.branch.alternatives_not_executed.join(", "),
    ] : []),
    "Decision trace: "+e.trace_id,
    "Solid manifest: "+e.manifest_id,
    "Native reLATTE crossing: "+e.crossing_id,
    "RECEIVED receipt: "+e.receive_receipt_id,
    "HOLD receipt: "+e.disposition_receipt_id,
    "Receiver disposition: HOLD (not admitted)",
    "Fabrication permission: NONE",
    "Record timestamp is the signed crossing creation time, not CAD event time.",
    "Notice: The upstream native verifier reported valid signatures and byte refs. GOATnote has NOT independently verified those signatures.",
    "",
    "Declared decision timeline:"
  ];
  const anchors=[];
  for(const event of t.events){
    const line=String(event.ordinal)+". "+event.decision_code+": "+human(event.selected)+
      " ["+human(event.declared_rationale_code)+"]";
    const start=lines.join("\n").length + 1;
    lines.push(line);
    anchors.push({start,end:start+line.length,quote:line});
  }
  const body=lines.join("\n");
  const margins=t.events.flatMap((event,i)=>{
    const observation=JSON.stringify(event.observable_result);
    const alternatives=event.alternatives_considered
      .filter(item=>item!==event.selected).map(human).join(", ") || "(none)";
    return [
      {id:"cadwitness-"+digestId(event.event_id),kind:"witness",
       text:"Observed (upstream): "+observation.slice(0,2000),
       versionId,anchor:anchors[i],createdAt:stamp},
      {id:"cadquestion-"+digestId(event.event_id),kind:"question",
       text:"Unselected alternative(s): "+alternatives+
            "\nDeclared reason: "+human(event.declared_rationale_code)+
            "\nThis is not independently verified physical truth.",
       versionId,anchor:anchors[i],createdAt:stamp},
    ];
  });
  const threadId="cadreturn-"+digestId(e.trace_id);
  const ret={
    id:threadId,sourceVersionId:versionId,createdAt:stamp,
    entries:[
      {id:"cadreturn-question-"+digestId(e.trace_id),
       kind:"question",
       text: h.branch ? ("Which experiment can compare "+h.branch.selected_candidate_id+
          " against unexecuted "+h.branch.alternatives_not_executed.join(", ")+"?") :
          "Which source-grounded CAD feature or engineering uncertainty should we test next?",
       createdAt:stamp},
      {id:"cadreturn-carry-"+digestId(e.trace_id),
       kind:"carry",
       text:"Keep original evidence, declined alternatives and reLATTE HOLD distinct. The signed crossing does not grant fabrication.",
       createdAt:stamp},
    ],
  };
  return {
    id,title,createdAt:stamp,updatedAt:stamp,draft:body,
    versions:[{id:versionId,title,text:body,createdAt:stamp}],
    margins,returnThreads:[ret],
    cadJournal:{
      schema:CAD_JOURNAL_SCHEMA,source_trace_id:e.trace_id,
      crossing_id:e.crossing_id,manifest_id:e.manifest_id,
      upstream_native_verified:true,
      goatnote_signature_verified:false,
      imported_from:"STATIC_OS_SELECTED_HANDOFF",
    },
  };
}
export function mergeCadJournal(db, value, selectedByHuman=false) {
  safe(selectedByHuman === true,"EXPLICIT_GOATNOTE_IMPORT_CONSENT_REQUIRED");
  safe(object(db) && db.schema===1 && Array.isArray(db.notes),
       "INVALID_GOATNOTE_NOTEBOOK");
  const note=projectCadJournal(value);
  const present=db.notes.find(n=>n.id===note.id);
  if(present){
    // A user may attach later margins to the GOATnote source. Those are
    // protected and must not be wiped just because the handoff is retried.
    safe(Array.isArray(present.versions)
         && present.versions.some(v=>v.id===note.versions[0].id
                                  && v.text===note.versions[0].text)
         && present.cadJournal?.source_trace_id===note.cadJournal.source_trace_id
         && present.cadJournal?.manifest_id===note.cadJournal.manifest_id,
         "SAME_CROSSING_CHANGED_GOATNOTE_SOURCE");
    return {notebook:db,added:false,noteId:note.id};
  }
  safe(!db.notes.some(n=>n.versions?.some(v=>v.id===note.versions[0].id)),
       "SOURCE_VERSION_ID_COLLISION");
  return {notebook:{...db,notes:[note,...db.notes]},
          added:true,noteId:note.id};
}
