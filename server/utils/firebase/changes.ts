import { Step } from 'prosemirror-transform';
import firebase from 'firebase-admin';
import { uncompressStepJSON } from 'prosemirror-compress-pubpub';

import { editorSchema } from '../firebaseAdmin';

export const getStepsInChangeRange = async (
	branchRef: firebase.database.Reference,
	startIndex: number,
	endIndex: number,
): Promise<Step[]> => {
	const changesSnapshot = await branchRef
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
					Step.fromJSON(editorSchema, uncompressStepJSON(compressedStep)),
				),
			)
			.reduce((a, b) => [...a, ...b], []);
	}
	return [];
};
