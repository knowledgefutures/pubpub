import type firebase from 'firebase';

import type { DefinitelyHas, DocJson, Maybe, Release as ReleaseType } from 'types';

import { Op } from 'sequelize';

import { editorSchema, getStepsInChangeRange } from 'components/Editor';
import { createPubReleasedActivityItem } from 'server/activityItem/queries';
import { createUpdatedDiscussionAnchorForNewSteps } from 'server/discussionAnchor/queries';
import { createDoc } from 'server/doc/queries';
import { createLatestPubExports } from 'server/export/queries';
import { Discussion, DiscussionAnchor, Doc, Release } from 'server/models';
import { sequelize } from 'server/sequelize';
import { defer } from 'server/utils/deferred';
import { getPubDraftDoc, getPubDraftRef } from 'server/utils/firebaseAdmin';
import { setPubSearchData } from 'server/utils/search';

type ReleaseErrorReason = 'merge-failed' | 'duplicate-release';
export class ReleaseQueryError extends Error {
	// biome-ignore lint/complexity/noUselessConstructor: shhhhhh
	constructor(reason: ReleaseErrorReason) {
		super(reason);
	}
}

const getStepsSinceLastRelease = async (
	draftRef: firebase.database.Reference,
	previousRelease: Maybe<ReleaseType>,
	currentHistoryKey: number,
) => {
	if (previousRelease) {
		const { historyKey: previousHistoryKey } = previousRelease;
		return getStepsInChangeRange(
			draftRef,
			editorSchema,
			previousHistoryKey + 1,
			currentHistoryKey,
		);
	}
	return [];
};

const createDiscussionAnchorsForRelease = async (
	pubId: string,
	previousRelease: Maybe<DefinitelyHas<ReleaseType, 'doc'>>,
	currentHistoryKey: number,
	sequelizeTransaction: any,
) => {
	const draftRef = await getPubDraftRef(pubId, sequelizeTransaction);
	if (previousRelease) {
		const steps = await getStepsSinceLastRelease(draftRef, previousRelease, currentHistoryKey);
		const flatSteps = steps.reduce((a, b) => [...a, ...b], []);
		const discussions = await Discussion.findAll({
			where: { pubId },
			attributes: ['id'],
			transaction: sequelizeTransaction,
		});
		const existingAnchors = await DiscussionAnchor.findAll({
			where: {
				discussionId: { [Op.in]: discussions.map((d) => d.id) },
				historyKey: previousRelease.historyKey,
			},
			transaction: sequelizeTransaction,
		});
		await Promise.all(
			existingAnchors.map((anchor) =>
				createUpdatedDiscussionAnchorForNewSteps(
					anchor,
					flatSteps,
					currentHistoryKey,
					sequelizeTransaction,
				).catch((err) => console.error('Failed to create updated discussion anchor', err)),
			),
		);
	}
};

export const createRelease = async ({
	userId,
	pubId,
	noteContent,
	noteText,
	historyKey: providedHistoryKey = null,
	createExports = true,
}: {
	userId: string;
	pubId: string;
	noteContent?: DocJson | null;
	noteText?: string | null;
	historyKey?: null | number;
	createExports?: boolean;
}) => {
	const mostRecentRelease = (await Release.findOne({
		where: { pubId },
		order: [['historyKey', 'DESC']],
		include: [{ model: Doc, as: 'doc' }],
	})) as DefinitelyHas<Release, 'doc'> | null;

	const {
		doc: nextDoc,
		historyData: { currentKey },
	} = await getPubDraftDoc(pubId, providedHistoryKey ?? null);
	const historyKey = providedHistoryKey ?? currentKey;

	if (mostRecentRelease && mostRecentRelease.historyKey === historyKey) {
		throw new ReleaseQueryError('duplicate-release');
	}

	const release = await sequelize.transaction(async (txn) => {
		const docModel = await createDoc(nextDoc, txn);
		const [nextRelease] = await Promise.all([
			Release.create(
				{
					noteContent,
					noteText,
					historyKey,
					userId,
					pubId,
					docId: docModel.id,
				},
				{ transaction: txn },
			),
			createDiscussionAnchorsForRelease(pubId, mostRecentRelease, historyKey, txn),
		]);
		return nextRelease;
	});

	setPubSearchData(pubId);
	if (createExports) {
		await createLatestPubExports(pubId);
	}
	defer(async () => {
		await createPubReleasedActivityItem(userId, release.id);
	});

	return release.toJSON();
};

export const getReleasesForPub = (pubId: string) => {
	return Release.findAll({ where: { pubId } });
};
