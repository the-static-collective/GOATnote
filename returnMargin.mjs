// GOATNOTE-RETURN-001 — pure optional return projection; no browser data access.
// Immutable saved versions and their anchored margins remain source authority.
const required = (x, name) => {
  if (typeof x !== 'string' || !x.trim() || x.length > 256) throw Error(name + ' required');
  return x;
};
export function prepareReturnMargin(note, { sourceVersionId, returnVersionId, marginId, relation, actorRef }) {
  if (!note || !Array.isArray(note.versions) || !Array.isArray(note.margins)) throw Error('note with versions/margins required');
  required(note.id, 'note identity');
  required(sourceVersionId, 'source version');
  required(returnVersionId, 'return version');
  required(marginId, 'margin identity');
  required(actorRef, 'actor reference');
  if (!['reconsider', 'connect', 'correct', 'carry'].includes(relation)) throw Error('declared return relation required');
  const source = note.versions.find(v => v.id === sourceVersionId);
  const later = note.versions.find(v => v.id === returnVersionId);
  if (!source || !later || source.id === later.id) throw Error('two distinct saved versions required');
  if (typeof source.text !== 'string' || typeof later.text !== 'string') throw Error('source texts required');
  if (note.margins.some(m => m.id === marginId)) throw Error('margin identity already exists');
  // Caller supplies chronological intent; version array order is not proof of event time.
  return Object.freeze({
    schema: 'goatnote.return-margin/0.1',
    marginId,
    actorRef,
    noteRef: note.id,
    sourceVersionRef: source.id,
    returnVersionRef: later.id,
    relation,
    sourceSnapshotText: source.text,
    returnSnapshotText: later.text,
    status: 'proposed',
    nonClaims: ['return is not an edit of historical source', 'writing does not authenticate external events',
      'snapshot order does not prove occurrence chronology', 'no interpretation promoted into identity'],
  });
}
