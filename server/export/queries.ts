import Sequelize from 'sequelize';

import { Export, WorkerTask } from 'server/models';
import { getReleasesForPub } from 'server/release/queries';
import { getPubDraftDoc } from 'server/utils/firebaseAdmin';
import { addWorkerTask } from 'server/utils/workers';
import { getExportFormats } from 'utils/export/formats';

export const getOrStartExportTask = async ({
	pubId,
	format,
	historyKey,
}: {
	pubId: string;
	format: string;
	historyKey: number;
}) => {
	const existingExport = await Export.findOne({
		where: {
			pubId,
			format,
			historyKey: {
				[Sequelize.Op.eq]: historyKey,
			},
		},
		include: [{ model: WorkerTask, as: 'workerTask' }],
	});

	if (existingExport) {
		const { url, workerTask } = existingExport;
		if (url) {
			return { url, format };
		}
		const shouldAllowTaskToComplete = workerTask && !workerTask.error;
		if (shouldAllowTaskToComplete) {
			return { taskId: workerTask.id, format };
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
	return { taskId: task.id, format: theExport.format, url: theExport.url };
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
