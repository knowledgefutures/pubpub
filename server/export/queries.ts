import Sequelize from 'sequelize';

import { WorkerTask, Export } from 'server/models';
import { addWorkerTask } from 'server/utils/workers';
import { getPubDraftDoc } from 'server/utils/firebaseAdmin';
import { getReleasesForPub } from 'server/release/queries';
import { getExportFormats } from 'utils/export/formats';

export const getOrStartExportTask = async ({ pubId, format, historyKey }) => {
	const existingExport = await Export.findOne({
		where: {
			pubId,
			format,
			historyKey: {
				[Sequelize.Op.gte]: historyKey,
			},
		},
		include: [{ model: WorkerTask, as: 'workerTask' }],
	});

	if (existingExport) {
		const { url, workerTask } = existingExport;
		if (url) {
			return { url };
		}
		const shouldAllowTaskToComplete = workerTask && !workerTask.error;
		if (shouldAllowTaskToComplete) {
			return { taskId: workerTask.id };
		}
	}

	const theExport =
		existingExport ||
		(await Export.create({
			pubId,
			format,
			historyKey,
		}));

	const task = await addWorkerTask({
		type: 'export',
		input: { exportId: theExport.id },
	});

	await theExport.update({ workerTaskId: task.id });
	return { taskId: task.id };
};

export const createPubExportsForHistoryKey = async (pubId: string, historyKey: number) => {
	await Promise.all(
		getExportFormats().map((format) =>
			getOrStartExportTask({
				pubId,
				format,
				historyKey,
			}),
		),
	);
};

export const createPubExportsForLatestRelease = async (pubId: string) => {
	const releases = await getReleasesForPub(pubId);
	const latestRelease = releases[releases.length - 1];
	if (latestRelease) {
		await createPubExportsForHistoryKey(pubId, latestRelease.historyKey);
	}
};

export const createLatestPubExports = async (pubId: string) => {
	const {
		historyData: { latestKey },
	} = await getPubDraftDoc(pubId);
	await createPubExportsForHistoryKey(pubId, latestKey);
};
