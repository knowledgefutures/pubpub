import { Step } from 'prosemirror-transform';

import { DiscussionAnchor } from 'server/models';
import { DiscussionAnchor as DiscussionAnchorType } from 'utils/types';
import {
	DiscussionSelection,
	mapDiscussionSelectionThroughSteps,
} from 'client/components/Editor/plugins/discussions';

/**
 * Persists a new anchor for an existing one based on changes to a Prosemirror document.
 * @param anchor an anchor model that will be updated and stored with a later history key
 * @param steps some steps to apply to the document to compute the new anchor position
 * @param historyKey the history key that (doc + steps) corresponds to
 * @param sequelizeTxn a Sequelize transaction with which to commit (or rollback) this item
 */
export const createUpdatedDiscussionAnchorForNewSteps = async (
	anchor: DiscussionAnchorType,
	steps: Step[],
	historyKey: number,
	sequelizeTxn: any = null,
) => {
	const {
		originalText,
		originalTextPrefix,
		originalTextSuffix,
		discussionId,
		selection,
	} = anchor;
	const nextSelection = mapDiscussionSelectionThroughSteps(selection, steps);
	return DiscussionAnchor.create(
		{
			historyKey,
			discussionId,
			originalText,
			originalTextPrefix,
			originalTextSuffix,
			selection: nextSelection,
			isOriginal: false,
		},
		{ transaction: sequelizeTxn },
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
	selectionJson: DiscussionSelection;
	originalText: string;
	originalTextPrefix?: string;
	originalTextSuffix?: string;
}) => {
	const { head, anchor } = selectionJson;
	return DiscussionAnchor.create({
		discussionId,
		historyKey,
		selection: head === anchor ? null : selectionJson,
		originalText,
		originalTextPrefix,
		originalTextSuffix,
		isOriginal: true,
	});
};
