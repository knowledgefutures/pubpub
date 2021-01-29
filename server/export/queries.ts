import Sequelize from 'sequelize';

import { WorkerTask, Export } from 'server/models';
import { addWorkerTask } from 'server/utils/workers';
import { getPubDraftDoc } from 'server/utils/firebaseAdmin';
import { getExportFormats } from 'utils/export/formats';

export const getOrStartExportTask = async ({ pubId, format, historyKey }) => {
	const existingExport = await Export.findOne({
		where: {
			pubId: pubId,
			format: format,
			historyKey: {
				[Sequelize.Op.gte]: historyKey,
			},
		},
		include: [{ model: WorkerTask, as: 'workerTask' }],
	});

	if (existingExport) {
		const { url, workerTask } = existingExport;
		if (url) {
			return { url: url };
		}
		const shouldAllowTaskToComplete = workerTask && !workerTask.error;
		if (shouldAllowTaskToComplete) {
			return { taskId: workerTask.id };
		}
	}

	const theExport =
		existingExport ||
		(await Export.create({
			pubId: pubId,
			format: format,
			historyKey: historyKey,
		}));

	const task = await addWorkerTask({
		type: 'export',
		input: { exportId: theExport.id },
	});

	await theExport.update({ workerTaskId: task.id });
	return { taskId: task.id };
};

export const createLatestPubExports = async (pubId) => {
	const {
		historyData: { latestKey },
	} = await getPubDraftDoc(pubId);
	await Promise.all(
		getExportFormats().map((format) =>
			getOrStartExportTask({
				pubId: pubId,
				format: format,
				historyKey: latestKey,
			}),
		),
	);
};
