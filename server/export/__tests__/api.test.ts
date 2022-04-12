import { setup, teardown, login, modelize } from 'stubstub';

import { Export, WorkerTask } from 'server/models';

const models = modelize`
	Community community {
		Pub pub {
			viewHash: "some-hash"
			Member {
				permissions: "view"
				User pubViewer {}
			}
			Release {
				historyKey: 10
			}
			Release {
				historyKey: 25
			}
		}
	}
`;

setup(beforeAll, async () => {
	await models.resolve();
});

afterEach(async () => {
	const { pub } = models;
	await Export.destroy({ where: { pubId: pub.id } });
});

teardown(afterAll);

const makeExportQuery = (historyKey, { format = 'pdf', accessHash = null } = {}) => {
	const { community, pub } = models;
	return {
		communityId: community.id,
		pubId: pub.id,
		historyKey,
		accessHash,
		format,
	};
};

it('Does not create an export of a non-Release key for a user without permission', async () => {
	const agent = await login();
	await agent.post('/api/export').send(makeExportQuery(3)).expect(403);
});

it('Creates an export of any key for a user with a valid access hash', async () => {
	const { pub } = models;
	const agent = await login();
	await agent
		.post('/api/export')
		.send(makeExportQuery(17, { accessHash: pub.viewHash }))
		.expect(201);
});

it('Creates an export of any key for a pub viewer', async () => {
	const { pubViewer } = models;
	const agent = await login(pubViewer);
	await agent.post('/api/export').send(makeExportQuery(15)).expect(201);
});

it('Creates an export of a Release history key for anyone', async () => {
	const agent = await login();
	await agent.post('/api/export').send(makeExportQuery(10)).expect(201);
});

it('Creates a new worker task or returns an existing one, appropriately', async () => {
	const { pubViewer } = models;
	const agent = await login(pubViewer);
	// Kick off a worker task
	const {
		body: { taskId },
	} = await agent.post('/api/export').send(makeExportQuery(0)).expect(201);
	const workerTask = await WorkerTask.findOne({ where: { id: taskId } });
	expect(workerTask.type).toEqual('export');
	// Now query again and check that we refer to the same worker task
	const { body: bodyAgain } = await agent
		.post('/api/export')
		.send(makeExportQuery(0))
		.expect(201);
	expect(bodyAgain.taskId).toEqual(taskId);
});

it('Returns the URL of a completed export', async () => {
	const { pubViewer } = models;
	const agent = await login(pubViewer);
	// Kick off a worker task
	const {
		body: { taskId },
	} = await agent.post('/api/export').send(makeExportQuery(0)).expect(201);
	// Now simulate the worker task completing
	await Export.update({ url: 'any_url' }, { where: { workerTaskId: taskId } });
	// Hit the API again and make sure we are served the right URL
	const {
		body: { url },
	} = await agent.post('/api/export').send(makeExportQuery(0)).expect(201);
	expect(url).toEqual('any_url');
});

it('Does not conflate the formats of existing exports', async () => {
	const { pubViewer } = models;
	const agent = await login(pubViewer);
	// Kick off a worker task
	const {
		body: { taskId: docxTaskId },
	} = await agent
		.post('/api/export')
		.send(makeExportQuery(0, { format: 'docx' }))
		.expect(201);
	// Ask for the same history key but in a different format
	const {
		body: { taskId: pdfTaskId },
	} = await agent
		.post('/api/export')
		.send(makeExportQuery(0, { format: 'pdf' }))
		.expect(201);

	expect(docxTaskId).not.toEqual(pdfTaskId);
	// Now simulate the first worker task completing
	await Export.update({ url: 'any_url' }, { where: { workerTaskId: docxTaskId } });
	// Ask for the PDF again and ensure we are given the pending task rather than the completed
	// URL in the wrong format.
	const {
		body: { taskId: pdfTaskIdAgain },
	} = await agent
		.post('/api/export')
		.send(makeExportQuery(0, { format: 'pdf' }))
		.expect(201);
	expect(pdfTaskIdAgain).toEqual(pdfTaskId);
});

it('Creates a new export if the key has advanced', async () => {
	const { pubViewer } = models;
	const agent = await login(pubViewer);
	// Kick off a worker task
	const {
		body: { taskId: taskId0 },
	} = await agent.post('/api/export').send(makeExportQuery(0)).expect(201);
	// Kick off another worker task for a different history key
	const {
		body: { taskId: taskId1 },
	} = await agent.post('/api/export').send(makeExportQuery(1)).expect(201);
	// Make sure these are two different tasks
	expect(taskId0).not.toEqual(taskId1);
	// Now let one of the tasks finish
	await Export.update({ url: 'any_url' }, { where: { workerTaskId: taskId0 } });
	// And query for yet another history key
	const {
		body: { taskId: taskId2 },
	} = await agent.post('/api/export').send(makeExportQuery(2)).expect(201);
	// And make sure that this creates yet another task.
	expect([taskId0, taskId1]).not.toContain(taskId2);
});

it('Restarts the export if another task failed', async () => {
	const { pubViewer } = models;
	const agent = await login(pubViewer);
	// Kick off a worker task
	const {
		body: { taskId: failingTaskId },
	} = await agent.post('/api/export').send(makeExportQuery(0)).expect(201);
	// Now make the worker task fail.
	await WorkerTask.update(
		{ error: 'something terrible happened' },
		{ where: { id: failingTaskId } },
	);
	// Now try again...
	const {
		body: { taskId: retryingTaskId },
	} = await agent.post('/api/export').send(makeExportQuery(0)).expect(201);
	// ...And expect to see a new task ID.
	expect(retryingTaskId).not.toEqual(failingTaskId);
});
