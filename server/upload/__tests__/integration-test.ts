import fs from 'fs/promises';
import path from 'path';

import { login, modelize, setup, teardown } from 'stubstub';

const models = modelize`
	Community community {
		Member {
			permissions: "admin"
			User admin {}
		}
		Member {
			permissions: "view"
			User nonAdmin {}
		}
    }`;

// we require config.js here in order to get proper AWS_ACCESS_ID env vars

require('../../../config');

setup(beforeAll, async () => {
	await models.resolve();
});

teardown(afterAll);

const getHost = (community: any) => `${community.subdomain}.pubpub.org`;

let adminAgent: Awaited<ReturnType<typeof login>>;
describe('POST /api/upload', () => {
	beforeEach(async () => {
		adminAgent = await login(models.admin);
		adminAgent.set('Host', getHost(models.community));
	});

	it('should not be able to upload if not logged in', async () => {
		const agent = await login();
		await agent
			.post('/api/upload')
			.send({
				file: 'test file',
				fileName: 'test file name.html',
				mimeType: 'text/html',
			})
			.expect(403);
	});

	it('should not be able to upload a text html file with only filename set via field', async () => {
		const testContent = 'test file';
		await adminAgent
			.post('/api/upload')
			.field('name', 'test file name.html')
			.attach('file', Buffer.from(testContent))
			.expect(400);
	});

	it('should be able to upload a text html buffer with properly set filename and content', async () => {
		const testContent = 'test file';

		const result = await adminAgent
			.post('/api/upload')
			.attach('file', Buffer.from(testContent), {
				filename: 'test file name.html',
				contentType: 'text/html',
			})
			.expect(201);

		const res = await fetch(result.body.url);

		expect(res.status).toEqual(200);

		const body = await res.text();

		expect(body).toEqual('test file');
	});

	it('should be able to upload a BIG PDF file read from disk', async () => {
		const pdfFile = path.join(__dirname, 'test.pdf');
		const pdfFileContent = await fs.readFile(pdfFile);

		const result = await adminAgent
			.post('/api/upload')
			.attach('file', pdfFileContent, {
				filename: 'test.pdf',
				contentType: 'application/pdf',
			})
			.expect(201);

		expect(result.status).toEqual(201);

		const body = result.body;
		expect(body.size).toBeGreaterThan(20_000_000);
		const res = await fetch(body.url, { method: 'HEAD' });

		expect(res.status).toEqual(200);
	}, 60000);
});
