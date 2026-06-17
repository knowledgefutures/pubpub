import type { Transaction } from 'sequelize';

import { CollabAuthority, RedisBroadcastManager } from '@pitter-patter/collab-server';
import { Op } from 'sequelize';

import { editorSchema } from 'client/components/Editor/utils/schema';
import { env } from 'server/env';
import { CollabCommit, Draft, DraftCheckpoint } from 'server/models';
import { sequelize } from 'server/sequelize';

const broadcastManager = new RedisBroadcastManager({
	redisUrl: env.VALKEY_URL ?? 'redis://localhost:6379',
});

export const connectCollabRedis = async () => {
	await broadcastManager.connect();
	console.log('[collab] collab broadcast redis connected');
};

export const collabAuthority = new CollabAuthority<Transaction>({
	schema: editorSchema,
	broadcastManager,

	runWithTransaction: async (callback) => {
		return sequelize.transaction((tr) => callback(tr));
	},

	//
	getDoc: async (tr, docId) => {
		const draft = await Draft.findOne({
			where: { id: docId },
			...(tr && { lock: tr.LOCK.UPDATE }),
			transaction: tr ?? undefined,
		});

		if (!draft) {
			throw new Error(`Draft not found: ${docId}`);
		}

		const checkpoint = await DraftCheckpoint.findOne({
			where: { draftId: docId },
			transaction: tr ?? undefined,
		});

		if (!checkpoint) {
			const emptyDoc = editorSchema.topNodeType.createAndFill()!;

			return {
				docJSON: emptyDoc.toJSON(),
				version: 0,
				lastUpdatedTimestamp: Date.now(),
			};
		}

		return {
			docJSON: checkpoint.doc,
			version: draft.version,
			lastUpdatedTimestamp: draft.latestKeyAt?.valueOf() ?? Date.now(),
		};
	},

	saveDoc: async (tr, docId, docJSON, version) => {
		await Draft.update(
			{ version, latestKeyAt: new Date() },
			{ where: { id: docId }, transaction: tr },
		);

		const existing = await DraftCheckpoint.findOne({
			where: { draftId: docId },
			transaction: tr,
		});

		if (existing) {
			await existing.update(
				{ doc: docJSON, historyKey: version, timestamp: Date.now() },
				{ transaction: tr },
			);
		} else {
			await DraftCheckpoint.create(
				{ draftId: docId, doc: docJSON, historyKey: version, timestamp: Date.now() },
				{ transaction: tr },
			);
		}
	},

	saveCommit: async (tr, docId, commitRef, commitVersion, commitSteps) => {
		console.log('saveCommit', docId, commitRef, commitVersion, commitSteps);
		await CollabCommit.create(
			{
				draftId: docId,
				ref: commitRef,
				version: commitVersion,
				steps: commitSteps,
			},
			{ transaction: tr },
		);
	},

	getCommit: async (tr, docId, commitRef) => {
		const commit = await CollabCommit.findOne({
			where: { draftId: docId, ref: commitRef },
			transaction: tr ?? undefined,
		});

		if (!commit) {
			return null;
		}

		return {
			ref: commit.ref,
			version: commit.version,
			steps: commit.steps,
		};
	},

	getCommits: async (tr, docId, version) => {
		const commits = await CollabCommit.findAll({
			where: {
				draftId: docId,
				version: { [Op.gt]: version },
			},
			order: [['version', 'ASC']],
			transaction: tr ?? undefined,
		});

		return commits.map((c) => ({
			ref: c.ref,
			version: c.version,
			steps: c.steps,
		}));
	},
});
