import { Node } from 'prosemirror-model';
import { Selection } from 'prosemirror-state';
import { Mapping, Step } from 'prosemirror-transform';

import { DiscussionAnchor } from 'server/models';
import { DiscussionAnchor as DiscussionAnchorType } from 'utils/types';

/**
 * Persists a new anchor for an existing one based on changes to a Prosemirror document.
 * @param anchor an anchor model that will be updated and stored with a later history key
 * @param previousDoc the document that the anchor belongs to (implicitly, with the same history key in some context)
 * @param steps some steps to apply to the document to compute the new anchor position
 * @param the history key that (doc + steps) corresponds to
 */
export const createUpdatedDiscussionAnchorForNewSteps = async (
	anchor: DiscussionAnchorType,
	previousDoc: Node,
	currentDoc: Node,
	steps: Step[],
	historyKey: number,
	postgresTxn: any = null,
) => {
	const {
		originalText,
		originalTextPrefix,
		originalTextSuffix,
		discussionId,
		selection: previousSelectionSerialized,
	} = anchor;
	if (!previousSelectionSerialized) {
		return DiscussionAnchor.create({
			historyKey: historyKey,
			discussionId: discussionId,
			originalText: originalText,
			originalTextPrefix: originalTextPrefix,
			originalTextSuffix: originalTextSuffix,
			selection: null,
			isOriginal: false,
		});
	}
	const mapping = new Mapping(steps.map((step) => step.getMap()));
	const previousSelection = Selection.fromJSON(previousDoc, previousSelectionSerialized);
	const nextSelection = previousSelection.map(currentDoc, mapping);
	// Even if the resulting selection is empty -- and thus represents a discussion that has become
	// un-anchored -- we still create an anchor to express this information so we don't spend time
	// recalculating it.
	const nextSelectionSerialized = nextSelection.empty ? null : nextSelection.toJSON();
	return DiscussionAnchor.create(
		{
			historyKey: historyKey,
			discussionId: discussionId,
			originalText: originalText,
			originalTextPrefix: originalTextPrefix,
			originalTextSuffix: originalTextSuffix,
			selection: nextSelectionSerialized,
			isOriginal: false,
		},
		{ transaction: postgresTxn },
	);
};

export const createOriginalDiscussionAnchor = async ({
	discussionId,
	historyKey,
	selectionJson,
	originalText = '',
	originalTextPrefix = '',
	originalTextSuffix = '',
}: {
	discussionId: string;
	historyKey: number;
	// The type of selectionJson may be widened in the future to support non-text Selections
	selectionJson: { type: 'text'; head: number; anchor: number };
	originalText: string;
	originalTextPrefix?: string;
	originalTextSuffix?: string;
}) => {
	const { head, anchor } = selectionJson;
	return DiscussionAnchor.create({
		discussionId: discussionId,
		historyKey: historyKey,
		selection: head === anchor ? null : selectionJson,
		originalText: originalText,
		originalTextPrefix: originalTextPrefix,
		originalTextSuffix: originalTextSuffix,
		isOriginal: true,
	});
};
