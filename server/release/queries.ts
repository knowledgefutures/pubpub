import { Op } from 'sequelize';
import firebase from 'firebase';

import { Release, Doc, Discussion, DiscussionAnchor, sequelize } from 'server/models';
import { getPubDraftDoc, getPubDraftRef } from 'server/utils/firebaseAdmin';
import { createLatestPubExports } from 'server/export/queries';
import { createDoc } from 'server/doc/queries';
import { setPubSearchData } from 'server/utils/search';
import { createUpdatedDiscussionAnchorForNewSteps } from 'server/discussionAnchor/queries';
import { Maybe, Release as ReleaseType, DefinitelyHas } from 'types';
import { getStepsInChangeRange, editorSchema } from 'components/Editor';
import { defer } from 'server/utils/deferred';
import { createPubReleasedActivityItem } from 'server/activityItem/queries';

type ReleaseErrorReason = 'merge-failed' | 'duplicate-release';
export class ReleaseQueryError extends Error {
	// eslint-disable-next-line no-useless-constructor
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
	const draftRef = await getPubDraftRef(pubId);
	if (previousRelease) {
		const steps = await getStepsSinceLastRelease(draftRef, previousRelease, currentHistoryKey);
		const flatSteps = steps.reduce((a, b) => [...a, ...b], []);
		const discussions = await Discussion.findAll({
			where: { pubId },
			attributes: ['id'],
		});
		const existingAnchors = await DiscussionAnchor.findAll({
			where: {
				discussionId: { [Op.in]: discussions.map((d) => d.id) },
				historyKey: previousRelease.historyKey,
			},
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
	noteContent?: {};
	noteText?: string;
	historyKey?: null | number;
	createExports?: boolean;
}) => {
	const mostRecentRelease = await Release.findOne({
		where: { pubId },
		order: [['historyKey', 'DESC']],
		include: [{ model: Doc, as: 'doc' }],
	});

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
	defer(() => createPubReleasedActivityItem(userId, release.id));

	return release.toJSON();
};

export const getReleasesForPub = (pubId: string): Promise<ReleaseType[]> => {
	return Release.findAll({ where: { pubId } });
};
