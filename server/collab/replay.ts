import { Node } from 'prosemirror-model';
import { Step } from 'prosemirror-transform';

import { editorSchema } from 'client/components/Editor/utils/schema';

export const replayCommitsOntoDoc = (
	docJSON: Record<string, any>,
	commits: { steps: Record<string, any>[] }[],
): Node => {
	let doc = Node.fromJSON(editorSchema, docJSON);

	for (const commit of commits) {
		for (const stepJSON of commit.steps) {
			const step = Step.fromJSON(editorSchema, stepJSON);
			const result = step.apply(doc);

			if (result.doc) {
				doc = result.doc;
			}
		}
	}

	return doc;
};
