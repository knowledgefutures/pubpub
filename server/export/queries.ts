import Sequelize from 'sequelize';

import { WorkerTask, Export } from 'server/models';
import { addWorkerTask } from 'server/utils/workers';
import { getBranchDoc } from 'server/utils/firebaseAdmin';
import { getExportFormats } from 'utils/export/formats';

export const getOrStartExportTask = async ({ pubId, branchId, format, historyKey }) => {
	const existingExport = await Export.findOne({
		where: {
			branchId: branchId,
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
			branchId: branchId,
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

export const createBranchExports = async (pubId, branchId) => {
	const {
		historyData: { latestKey },
		// @ts-expect-error ts-migrate(2554) FIXME: Expected 5 arguments, but got 2.
	} = await getBranchDoc(pubId, branchId);
	await Promise.all(
		getExportFormats().map((format) =>
			getOrStartExportTask({
				pubId: pubId,
				branchId: branchId,
				format: format,
				historyKey: latestKey,
			}),
		),
	);
};
