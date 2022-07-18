import { Node, Schema } from 'prosemirror-model';
import { Step } from 'prosemirror-transform';
import { uncompressStepJSON } from 'prosemirror-compress-pubpub';
import firebase from 'firebase';

export const getStepsInChangeRange = async (
	draftRef: firebase.database.Reference,
	schema: Schema,
	startIndex: number,
	endIndex: number,
): Promise<Step[][]> => {
	const changesSnapshot = await draftRef
		.child('changes')
		.orderByKey()
		.startAt(startIndex.toString())
		.endAt(endIndex.toString())
		.once('value');
	const changes = changesSnapshot.val();
	if (changes) {
		return Object.keys(changes)
			.sort((a, b) => parseInt(a, 10) - parseInt(b, 10))
			.map((key) => changes[key])
			.map((change) =>
				change.s.map((compressedStep) =>
					Step.fromJSON(schema, uncompressStepJSON(compressedStep)),
				),
			);
	}
	return [];
};

export const applyStepsToDoc = (steps: Step[], doc: Node) => {
	return steps.reduce((currentDoc: Node, step: Step) => {
		const { doc: nextDoc, failed } = step.apply(currentDoc);
		if (failed) {
			throw new Error(failed);
		}
		return nextDoc!;
	}, doc);
};
