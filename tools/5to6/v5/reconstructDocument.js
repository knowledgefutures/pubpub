/* eslint-disable no-restricted-syntax, no-loop-func */
const { uncompressStateJSON } = require('prosemirror-compress-pubpub');

const { warn } = require('../problems');
const editorSchema = require('../util/editorSchema');
const { jsonToDoc } = require('../util/docUtils');
const { createReplaceWholeDocumentChange } = require('./changes');

/**
 * A container representing an intermediate state in reconstructing a doc from its changes
 * @param {Document} doc -- a document created by applying changes 1...index
 * @param {Change} change -- the change that was most recently applied to produce this document
 * @param {string} index -- the index of this intermediate state in the timeline
 * @param {Map<Step, Document>} docsWithinChange -- docs that were created from intermediate steps
 */
function IntermediateDocState(doc, change, index, docsWithinChange) {
	this.doc = doc;
	this.change = change;
	this.index = index;
	this.docsWithinChange = docsWithinChange;
}

const newDocument = () =>
	editorSchema.nodeFromJSON({
		type: 'doc',
		attrs: { meta: {} },
		content: [{ type: 'paragraph' }],
	});

const reconstructDocument = function*(changes, startingState) {
	let state = startingState || { index: -1, doc: newDocument() };
	for (const change of changes) {
		let docWithinChange = state.doc;
		const docsWithinChange = new Map();
		for (const step of change.steps || []) {
			const { doc: nextDoc, failed } = step.apply(docWithinChange);
			if (failed) {
				throw new Error(`${failed} at ${state.index}`);
			} else {
				docsWithinChange.set(step, nextDoc);
				docWithinChange = nextDoc;
			}
		}
		state = new IntermediateDocState(
			docWithinChange,
			change,
			state.index + 1,
			docsWithinChange,
		);
		yield state;
	}
};

const reconstructDocumentWithCheckpointFallback = (changes, checkpoint, draftBranchId) => {
	try {
		return [...reconstructDocument(changes)];
	} catch (err) {
		if (!checkpoint) {
			return [];
		}
		warn(`Full document reconstruction failed: ${err}. Falling back to checkpoint`);
		const { k: checkpointKey } = checkpoint;
		const checkpointDoc = jsonToDoc(uncompressStateJSON(checkpoint).doc);
		const changesAfterCheckpoint = changes.slice(parseInt(checkpointKey, 10));
		try {
			return [
				...reconstructDocument([
					createReplaceWholeDocumentChange(newDocument(), checkpointDoc, draftBranchId),
					...changesAfterCheckpoint,
				]),
			];
		} catch (e) {
			warn(`Reconstruction from checkpoint failed: ${err}. The pub will have no history.`);
			return [];
		}
	}
};

module.exports = {
	IntermediateDocState: IntermediateDocState,
	newDocument: newDocument,
	reconstructDocument: reconstructDocument,
	reconstructDocumentWithCheckpointFallback: reconstructDocumentWithCheckpointFallback,
};
