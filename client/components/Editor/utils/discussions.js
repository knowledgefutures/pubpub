import { uncompressSelectionJSON, compressSelectionJSON } from 'prosemirror-compress-pubpub';

// For every discussion in sourceBranch.discussions, assumes that the anchoring information
// (head, anchor, type) is valid on the destination branch document, but needs to be mapped to the
// destination branch's latest key information.
export const copyDiscussionMapsToBranch = async (
	sourceBranchRef,
	destinationBranchRef,
	destinationBranchCurrentKey,
	idFilter = () => true,
) => {
	const sourceDiscussionsSnapshot = await sourceBranchRef.child('discussions').once('value');
	const sourceDiscussions = sourceDiscussionsSnapshot.val();
	if (sourceDiscussions) {
		await Object.entries(sourceDiscussions).map(async (entry) => {
			const [discussionId, discussionInfo] = entry;
			if (!idFilter(discussionId)) {
				return;
			}
			const { selection: compressedSelection } = discussionInfo;
			const { anchor, head, type } = uncompressSelectionJSON(compressedSelection);
			const destinationBranchDiscussion = {
				initAnchor: anchor,
				initHead: head,
				initKey: destinationBranchCurrentKey,
				currentKey: destinationBranchCurrentKey,
				selection: compressSelectionJSON({
					anchor: anchor,
					head: head,
					type: type,
				}),
			};
			await destinationBranchRef
				.child(`discussions/${discussionId}`)
				.set(destinationBranchDiscussion);
		});
	}
};
