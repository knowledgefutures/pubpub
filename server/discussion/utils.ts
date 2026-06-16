import type { DiscussionInfo } from 'components/Editor/plugins/discussions/types';
import type * as types from 'types';

import { Step } from 'prosemirror-transform';

import { editorSchema, jsonToNode } from 'client/components/Editor/utils';
import { mapDiscussionThroughSteps } from 'client/components/Editor/plugins/discussions/util';
import { createDiscussionAnchor } from 'server/discussionAnchor/queries';
import { Discussion, DiscussionAnchor, Doc, Release } from 'server/models';
import { getPubDraft, getStepsBetweenVersions } from 'server/utils/firebaseAdmin';
import { indexByProperty } from 'utils/arrays';

type ExtendedDiscussionInfo = DiscussionInfo & {
	discussionId: string;
} & Pick<types.DiscussionAnchor, 'originalText' | 'originalTextPrefix' | 'originalTextSuffix'>;

const getDiscussions = async (discussionIds: string[], pubId: string) => {
	const discussions = (await Discussion.findAll({
		where: { id: discussionIds, pubId },
		include: [{ model: DiscussionAnchor, as: 'anchors' }],
	})) as types.DefinitelyHas<Discussion, 'anchors'>[];

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
	const release = (await Release.findOne({
		where: { pubId },
		include: [{ model: Doc, as: 'doc' }],
		order: [['historyKey', 'DESC']],
	})) as types.DefinitelyHas<Release, 'doc'>;

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
	const { draft } = await getPubDraft(pubId);
	const discussions = await getDiscussions(discussionIds, pubId);

	// get all steps from the release historyKey to the current draft version
	const stepGroups = await getStepsBetweenVersions(
		draft.id,
		historyKey,
		draft.version,
		editorSchema,
	);

	const allSteps = stepGroups.reduce((acc, group) => [...acc, ...group], [] as Step[]);

	// fast-forward each discussion through the steps
	const fastForwardedDiscussions: Record<string, DiscussionInfo | null> = {};

	for (const [id, info] of Object.entries(discussions)) {
		if (!info.selection) {
			fastForwardedDiscussions[id] = null;
			continue;
		}

		const mapped = mapDiscussionThroughSteps(info, allSteps);
		fastForwardedDiscussions[id] = mapped;
	}

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
