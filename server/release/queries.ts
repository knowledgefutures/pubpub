import type firebase from 'firebase';

import type { DefinitelyHas, DocJson, Maybe, Release as ReleaseType } from 'types';

import { StepMap } from 'prosemirror-transform';
import { Op } from 'sequelize';

import { editorSchema, getStepsInChangeRange } from 'components/Editor';
import { createPubReleasedActivityItem } from 'server/activityItem/queries';
import { createUpdatedDiscussionAnchorForNewSteps } from 'server/discussionAnchor/queries';
import { createDoc } from 'server/doc/queries';
import { getDraftCheckpoint } from 'server/draftCheckpoint/queries';
import { createLatestPubExports } from 'server/export/queries';
import { Discussion, DiscussionAnchor, Doc, Draft, Pub, Release } from 'server/models';
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

/**
 * Map a discussion selection through an array of StepMap ranges (from DraftCheckpoint.stepMaps).
 * Returns the new selection, or null if it was deleted.
 */
const mapSelectionThroughStoredStepMaps = (
	selection: { anchor: number; head: number } | null,
	stepMapRanges: number[][],
) => {
	if (!selection || selection.anchor === selection.head) return null;
	let from = Math.min(selection.anchor, selection.head);
	let to = Math.max(selection.anchor, selection.head);

	for (const ranges of stepMapRanges) {
		const map = new StepMap(ranges);
		from = map.map(from, 1);
		to = map.map(to, -1);
		if (from >= to || from === 0) return null;
	}

	return { type: 'text' as const, anchor: from, head: to };
};

const createDiscussionAnchorsForRelease = async (
	pubId: string,
	previousRelease: Maybe<DefinitelyHas<ReleaseType, 'doc'>>,
	currentHistoryKey: number,
	sequelizeTransaction: any,
) => {
	if (!previousRelease) return;

	const draftRef = await getPubDraftRef(pubId, sequelizeTransaction);
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

	if (existingAnchors.length === 0) return;

	// If we got steps from Firebase, use them directly
	if (flatSteps.length > 0) {
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
		return;
	}

	// No steps from Firebase covering the full range — try stored stepMaps from
	// the DraftCheckpoint (cold-stored draft) and compose with any new Firebase
	// changes that happened after the stepMaps were captured.
	const pub = await Pub.findOne({
		where: { id: pubId },
		include: [{ model: Draft, as: 'draft' }],
		transaction: sequelizeTransaction,
	});
	if (!pub?.draft) return;

	const pgCheckpoint = await getDraftCheckpoint(pub.draft.id, sequelizeTransaction);
	if (!pgCheckpoint?.stepMaps?.length || pgCheckpoint.stepMapToKey == null) {
		console.warn(
			`[release] No steps or stepMaps available for pub ${pubId}, skipping anchor mapping`,
		);
		return;
	}

	// Compose stored stepMaps (release→stepMapToKey) with any new Firebase
	// steps (stepMapToKey+1→currentHistoryKey) that happened after thaw.
	let allStepMapRanges = pgCheckpoint.stepMaps!;
	if (pgCheckpoint.stepMapToKey < currentHistoryKey) {
		try {
			const newStepsByChange = await getStepsInChangeRange(
				draftRef,
				editorSchema,
				pgCheckpoint.stepMapToKey + 1,
				currentHistoryKey,
			);
			const newFlatSteps = newStepsByChange.reduce((a, b) => [...a, ...b], []);
			const newRanges = newFlatSteps.map((s) =>
				Array.from((s.getMap() as any).ranges as number[]),
			);
			allStepMapRanges = [...allStepMapRanges, ...newRanges];
		} catch (err) {
			console.warn(
				`[release] Could not get Firebase steps ${pgCheckpoint.stepMapToKey + 1}→${currentHistoryKey}, using stored stepMaps only`,
				err,
			);
		}
	}

	// Use composed stepMaps to map anchors
	await Promise.all(
		existingAnchors.map(async (anchor) => {
			try {
				const nextSelection = mapSelectionThroughStoredStepMaps(
					anchor.selection,
					allStepMapRanges,
				);
				await DiscussionAnchor.create(
					{
						historyKey: currentHistoryKey,
						discussionId: anchor.discussionId,
						originalText: anchor.originalText,
						originalTextPrefix: anchor.originalTextPrefix,
						originalTextSuffix: anchor.originalTextSuffix,
						selection: nextSelection,
						isOriginal: false,
					},
					{ transaction: sequelizeTransaction },
				);
			} catch (err) {
				console.error('Failed to create discussion anchor from stepMaps', err);
			}
		}),
	);
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
