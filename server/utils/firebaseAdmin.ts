import type { Schema } from 'prosemirror-model';

import type { DocJson, PubDraftInfo } from 'types';

import { Node } from 'prosemirror-model';
import { Step, Transform } from 'prosemirror-transform';
import { Op } from 'sequelize';

import { editorSchema } from 'components/Editor/utils';
import { getDraftCheckpoint } from 'server/draftCheckpoint/queries';
import { CollabCommit, Draft, Pub } from 'server/models';
import { expect } from 'utils/assert';

export const getPubDraft = async (pubId: string, sequelizeTransaction: any = null) => {
	const pub = expect(
		await Pub.findOne({
			where: { id: pubId },
			include: [{ model: Draft, as: 'draft' }],
			transaction: sequelizeTransaction,
		}),
	);

	return { draft: expect(pub.draft) };
};

const maybeAddKeyTimestampPair = (key: number, timestamp: number | null) => {
	if (typeof key === 'number' && key >= 0 && timestamp) {
		return { [key]: timestamp };
	}
	return null;
};

/**
 * Apply commits from Postgres on top of a checkpoint doc to produce the current document.
 */
const applyCommitsOnDoc = async (
	draftId: string,
	checkpointDoc: DocJson,
	checkpointKey: number,
	checkpointTimestamp: number | null,
	historyKey: null | number,
) => {
	const versionBound = historyKey ?? Infinity;

	const whereClause: any = {
		draftId,
		version: { [Op.gt]: checkpointKey },
	};

	if (versionBound !== Infinity) {
		whereClause.version = { [Op.gt]: checkpointKey, [Op.lte]: versionBound };
	}

	const commits = await CollabCommit.findAll({
		where: whereClause,
		order: [['version', 'ASC']],
	});

	const allStepsJson = commits.flatMap((commit) => commit.steps);

	const currentKey = commits.length > 0 ? commits[commits.length - 1].version : checkpointKey;

	const currentTimestamp =
		commits.length > 0
			? (commits[commits.length - 1].createdAt?.valueOf() ?? checkpointTimestamp)
			: checkpointTimestamp;

	let doc = Node.fromJSON(editorSchema, checkpointDoc);

	for (const stepJson of allStepsJson) {
		const step = Step.fromJSON(editorSchema, stepJson);
		const { failed, doc: nextDoc } = step.apply(doc);

		if (failed) {
			console.error(`Failed with: ${failed}`);
		} else if (nextDoc) {
			doc = nextDoc;
		}
	}

	return {
		doc,
		key: currentKey,
		timestamp: currentTimestamp as number,
	};
};

export const getPubDraftDoc = async (
	pubId: string,
	historyKey: null | number = null,
): Promise<PubDraftInfo> => {
	const { draft } = await getPubDraft(pubId);
	const pgCheckpoint = await getDraftCheckpoint(draft.id);

	if (!pgCheckpoint) {
		// no checkpoint exists, return empty doc at version 0
		const emptyDoc = editorSchema.topNodeType.createAndFill()!;

		return {
			doc: emptyDoc.toJSON() as DocJson,
			size: emptyDoc.content.size,
			mostRecentRemoteKey: 0,
			firstTimestamp: Date.now(),
			latestTimestamp: Date.now(),
			historyData: {
				timestamps: {},
				currentKey: 0,
				latestKey: 0,
			},
		};
	}

	const pgTimestamp = pgCheckpoint.timestamp ? Number(pgCheckpoint.timestamp) : null;

	const {
		doc,
		key: currentKey,
		timestamp: currentTimestamp,
	} = await applyCommitsOnDoc(
		draft.id,
		pgCheckpoint.doc as DocJson,
		pgCheckpoint.historyKey,
		pgTimestamp,
		historyKey,
	);

	// get the first and latest commit timestamps for history UI
	const [firstCommit, latestCommit] = await Promise.all([
		CollabCommit.findOne({
			where: { draftId: draft.id },
			order: [['version', 'ASC']],
			attributes: ['version', 'createdAt'],
		}),
		CollabCommit.findOne({
			where: { draftId: draft.id },
			order: [['version', 'DESC']],
			attributes: ['version', 'createdAt'],
		}),
	]);

	const firstKey = firstCommit?.version ?? pgCheckpoint.historyKey;
	const firstTimestamp = firstCommit?.createdAt?.valueOf() ?? pgTimestamp ?? Date.now();
	const latestKey = latestCommit?.version ?? currentKey;
	const latestTimestamp = latestCommit?.createdAt?.valueOf() ?? currentTimestamp;

	return {
		doc: doc.toJSON() as DocJson,
		size: doc.content.size,
		mostRecentRemoteKey: currentKey,
		firstTimestamp: firstTimestamp as number,
		latestTimestamp: latestTimestamp as number,
		historyData: {
			timestamps: {
				...maybeAddKeyTimestampPair(firstKey, firstTimestamp as number),
				...maybeAddKeyTimestampPair(currentKey, currentTimestamp),
				...maybeAddKeyTimestampPair(latestKey, latestTimestamp as number),
			},
			currentKey,
			latestKey,
		},
	};
};

export const getLatestKeyInPubDraft = async (pubId: string) => {
	const { mostRecentRemoteKey, historyData } = await getPubDraftDoc(pubId, null);
	return Math.max(mostRecentRemoteKey, historyData.latestKey);
};

/**
 * Programmatically apply edits to a draft's document. Used by server-side operations
 * like imports and migrations that need to modify the doc without a client.
 */
export const editDraft = async (pubId: string, clientId: string, schema: Schema = editorSchema) => {
	const { draft } = await getPubDraft(pubId);
	const checkpoint = await getDraftCheckpoint(draft.id);

	let doc = checkpoint
		? Node.fromJSON(schema, checkpoint.doc)
		: schema.topNodeType.createAndFill()!;

	let currentVersion = draft.version;
	let pendingSteps: Step[] = [];

	const api = {
		transform: (fn: (tr: Transform, sc: Schema) => void) => {
			const tr = new Transform(doc);
			fn(tr, schema);
			doc = tr.doc;
			pendingSteps.push(...tr.steps);
			return api;
		},

		writeChange: async (): Promise<boolean> => {
			if (pendingSteps.length === 0) {
				return true;
			}

			const { collabAuthority } = await import('server/collab/authority.js');

			try {
			const commitData = {
				steps: pendingSteps.map((s) => s.toJSON()),
				version: currentVersion,
				clientId,
				ref: `server-${Date.now()}-${Math.random().toString(36).slice(2)}`,
			};

				await collabAuthority.receiveCommit(draft.id, commitData);
				currentVersion++;
				pendingSteps = [];
				return true;
			} catch (_err) {
				return false;
			}
		},

		getDoc: () => doc,
		getKey: () => currentVersion,
	};

	return api;
};

/**
 * Get steps from the commit table between two versions (exclusive start, inclusive end).
 */
export const getStepsBetweenVersions = async (
	draftId: string,
	fromVersion: number,
	toVersion: number,
	schema: Schema = editorSchema,
): Promise<Step[][]> => {
	const commits = await CollabCommit.findAll({
		where: {
			draftId,
			version: { [Op.gt]: fromVersion, [Op.lte]: toVersion },
		},
		order: [['version', 'ASC']],
	});

	return commits.map((commit) =>
		commit.steps.map((stepJson: any) => Step.fromJSON(schema, stepJson)),
	);
};

// legacy utility for migration tools that still interact with firebase-admin directly
export const getDatabaseRef = (path: string) => {
	try {
		const firebaseAdmin = require('firebase-admin');
		const app = firebaseAdmin.apps[0];

		if (!app) {
			return null;
		}

		return app.database().ref(path);
	} catch {
		return null;
	}
};
