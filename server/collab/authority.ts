import type { Transaction } from 'sequelize';
import type { DocJson } from 'types';

import { CollabAuthority, RedisBroadcastManager } from '@pitter-patter/collab-server';
import { Op } from 'sequelize';

import { editorSchema } from 'client/components/Editor/utils/schema';
import { upsertDraftCheckpoint } from 'server/draftCheckpoint/queries';
import { env } from 'server/env';
import { CollabCommit, Draft, DraftCheckpoint } from 'server/models';
import { sequelize } from 'server/sequelize';
import { createLogger } from 'server/utils/queryHelpers/communityGet';

import { replayCommitsOntoDoc } from './replay';

export { replayCommitsOntoDoc };

let authority: CollabAuthority<Transaction> | null = null;

const CHECKPOINT_INTERVAL = 50;

const createAuthority = (bm: RedisBroadcastManager) =>
	new CollabAuthority<Transaction>({
		schema: editorSchema,
		broadcastManager: bm,

		runWithTransaction: async (callback) => {
			return sequelize.transaction((tr) => callback(tr));
		},

		getDoc: async (tr, docId) => {
			const logger = createLogger('getDoc');

			const [draft, checkpoint] = await logger.log(
				'getDocAndCheckpoint',
				Promise.all([
					Draft.findOne({
						where: { id: docId },
						...(tr && { lock: tr.LOCK.NO_KEY_UPDATE }),
						transaction: tr ?? undefined,
					}),
					DraftCheckpoint.findOne({
						where: { draftId: docId },
						order: [['historyKey', 'DESC']],
						transaction: tr ?? undefined,
					}),
				]),
			);

			if (!draft) {
				throw new Error(`Draft not found: ${docId}`);
			}

			if (!checkpoint) {
				const emptyDoc = editorSchema.topNodeType.createAndFill()!;

				return {
					docJSON: emptyDoc.toJSON(),
					version: 0,
					lastUpdatedTimestamp: Date.now(),
				};
			}

			const checkpointVersion = checkpoint.historyKey ?? 0;

			if (checkpointVersion < draft.version) {
				const missedCommits = await logger.log(
					'getMissedCommits',
					CollabCommit.findAll({
						where: {
							draftId: docId,
							version: { [Op.gt]: checkpointVersion, [Op.lte]: draft.version },
						},
						order: [['version', 'ASC']],
						transaction: tr ?? undefined,
					}),
				);

				const reconstructedDoc = replayCommitsOntoDoc(checkpoint.doc, missedCommits);
				logger.end();

				return {
					docJSON: reconstructedDoc.toJSON(),
					version: draft.version,
					lastUpdatedTimestamp: draft.latestKeyAt?.valueOf() ?? Date.now(),
				};
			}

			logger.end();

			return {
				docJSON: checkpoint.doc,
				version: draft.version,
				lastUpdatedTimestamp: draft.latestKeyAt?.valueOf() ?? Date.now(),
			};
		},

		saveDoc: async (tr, docId, docJSON, version) => {
			try {
				await Draft.update(
					{ version, latestKeyAt: new Date() },
					{ where: { id: docId }, transaction: tr },
				);

				const shouldCheckpoint = version % CHECKPOINT_INTERVAL === 0 || version <= 1;

				if (!shouldCheckpoint) {
					return;
				}

				const truncateBelow = version - CHECKPOINT_INTERVAL;

				await upsertDraftCheckpoint(docId, version, docJSON as DocJson, Date.now(), tr);

				if (truncateBelow > 0) {
					await CollabCommit.destroy({
						where: {
							draftId: docId,
							version: { [Op.lt]: truncateBelow },
						},
						transaction: tr,
					});
				}
			} catch (error) {
				console.error('Error saving doc', error);
				throw error;
			}
		},

		saveCommit: async (tr, docId, commitRef, commitVersion, commitSteps) => {
			try {
				await CollabCommit.create(
					{
						draftId: docId,
						ref: commitRef,
						version: commitVersion,
						steps: commitSteps,
					},
					{ transaction: tr },
				);
			} catch (error) {
				console.error('Error saving commit', error);
				throw error;
			}
		},

		getCommit: async (tr, docId, commitRef) => {
			const commit = await CollabCommit.findOne({
				where: { draftId: docId, ref: commitRef },
				transaction: tr ?? undefined,
				plain: true,
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
			const commits =
				(await CollabCommit.findAll({
					where: {
						draftId: docId,
						version: { [Op.gt]: version },
					},
					order: [['version', 'ASC']],
					transaction: tr ?? undefined,
				})) ?? [];

			return commits.map((c) => ({
				ref: c.ref,
				version: c.version,
				steps: c.steps,
			}));
		},
	});

export const getCollabAuthority = async () => {
	if (!authority) {
		return await connectCollabRedis();
	}
	return authority;
};

export const connectCollabRedis = async () => {
	const broadcastManager = new RedisBroadcastManager({
		redisUrl: env.VALKEY_URL ?? 'redis://localhost:6379',
	});
	await broadcastManager.connect();
	authority = createAuthority(broadcastManager);
	console.log('[collab] collab broadcast redis connected');
	return authority;
};
