import * as types from 'types';
import { jsonToNode } from 'components/Editor';
import { createFastForwarder } from 'components/Editor/plugins/discussions/fastForward';
import { DiscussionInfo } from 'components/Editor/plugins/discussions/types';
import { Discussion, DiscussionAnchor, Doc, Release } from 'server/models';
import { getPubDraftRef } from 'server/utils/firebaseAdmin';
import { indexByProperty } from 'utils/arrays';
import { createDiscussionAnchor } from 'server/discussionAnchor/queries';

type DiscussionWithAnchors = types.SequelizeModel<types.DefinitelyHas<types.Discussion, 'anchors'>>;

type ExtendedDiscussionInfo = DiscussionInfo & {
	discussionId: string;
} & Pick<types.DiscussionAnchor, 'originalText' | 'originalTextPrefix' | 'originalTextSuffix'>;

const getDiscussions = async (discussionIds: string[], pubId: string) => {
	const discussions: DiscussionWithAnchors[] = await Discussion.findAll({
		where: { id: discussionIds, pubId },
		include: [{ model: DiscussionAnchor, as: 'anchors' }],
	});
	const discussionInfoValues: ExtendedDiscussionInfo[] = [];
	discussions.forEach(({ anchors, id: discussionId }) => {
		const firstAnchor = anchors.reduce(
			(curr, next) => (curr && curr.historyKey < next.historyKey ? curr : next),
			null as null | types.DiscussionAnchor,
		);
		const latestAnchor = anchors.reduce(
			(curr, next) => (curr && curr.historyKey > next.historyKey ? curr : next),
			null as null | types.DiscussionAnchor,
		);
		if (firstAnchor?.selection && latestAnchor?.selection) {
			const {
				historyKey: initKey,
				selection: { anchor: initAnchor, head: initHead },
				originalText,
				originalTextPrefix,
				originalTextSuffix,
			} = firstAnchor;
			const { historyKey: currentKey, selection } = latestAnchor;
			discussionInfoValues.push({
				discussionId,
				initKey,
				initAnchor,
				initHead,
				currentKey,
				selection,
				originalText,
				originalTextPrefix,
				originalTextSuffix,
			});
		}
	});
	return indexByProperty(discussionInfoValues, 'discussionId');
};

const getLatestReleaseInfo = async (pubId: string) => {
	const release: types.DefinitelyHas<types.Release, 'doc'> = await Release.findOne({
		where: { pubId },
		include: [{ model: Doc, as: 'doc' }],
		order: [['historyKey', 'DESC']],
	});
	if (!release) {
		throw new Error('Pub does not have a Release');
	}
	return { doc: jsonToNode(release.doc.content), historyKey: release.historyKey };
};

export const createDiscussionAnchorsForLatestRelease = async (
	pubId: string,
	discussionIds: string[],
) => {
	const { doc, historyKey } = await getLatestReleaseInfo(pubId);
	const draftRef = await getPubDraftRef(pubId);
	const fastForward = createFastForwarder(draftRef);
	const discussions = await getDiscussions(discussionIds, pubId);
	const fastForwardedDiscussions = await fastForward(discussions, doc, historyKey);
	return Promise.all(
		Object.values(discussions).map(async (extendedDiscussionInfo) => {
			const { originalText, originalTextPrefix, originalTextSuffix, discussionId } =
				extendedDiscussionInfo;
			const fastForwardedDiscussionInfo = fastForwardedDiscussions[discussionId];
			if (fastForwardedDiscussionInfo?.selection) {
				const { selection } = fastForwardedDiscussionInfo;
				await createDiscussionAnchor({
					discussionId,
					historyKey,
					originalText,
					originalTextPrefix,
					originalTextSuffix,
					selectionJson: selection,
					isOriginal: false,
				});
			}
		}),
	);
};
