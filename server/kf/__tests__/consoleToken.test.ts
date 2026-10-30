import type supertest from 'supertest';

import { login, setup, teardown } from 'stubstub';

import { registeredUrl } from '../consoleToken';
import { stubKfConsole } from './consoleTokenStub';

let kfConsole: Awaited<ReturnType<typeof stubKfConsole>>;
let agent: supertest.SuperAgentTest;

setup(beforeAll, async () => {
	kfConsole = await stubKfConsole();
	agent = await login();
});
teardown(afterAll);

beforeEach(() => {
	kfConsole.stubJwks();
});

const host = 'www.pubpub.org';
const webhookBody = JSON.stringify({
	event: 'test.ignored',
	timestamp: new Date().toISOString(),
	data: { userId: 'nobody' },
});

const getAs = (path: string, token?: string) => {
	const req = agent.get(`${path}?kf_org_id=kf-nobody&context=nowhere`).set('Host', host);
	return token ? req.set('KF-Console-Token', token) : req;
};

const postWebhook = (token?: string, body = webhookBody) => {
	const req = agent
		.post('/api/kf/webhooks')
		.set('Host', host)
		.set('Content-Type', 'application/json')
		.set('X-KF-Webhook-Event', 'test.ignored');
	return (token ? req.set('KF-Console-Token', token) : req).send(body);
};

describe('KF-Console-Token on calls from the console', () => {
	it('lets the console call each route', async () => {
		const sign = (path: string) => kfConsole.sign({ path });
		await getAs('/api/kf/summary', await sign('/api/kf/summary')).expect(200);
		await getAs('/api/kf/usage', await sign('/api/kf/usage')).expect(200);
		await getAs('/api/kf/contexts', await sign('/api/kf/contexts')).expect(200);
		// No community is called "nowhere": past the check, into the route
		await getAs('/api/kf/branding', await sign('/api/kf/branding')).expect(404);
	});

	it('accepts a webhook whose body matches the token', async () => {
		const token = await kfConsole.sign({
			method: 'POST',
			path: '/api/kf/webhooks',
			body: webhookBody,
		});
		const { body } = await postWebhook(token).expect(200);
		expect(body).toEqual({ ok: true, ignored: true });
	});

	it('refuses a call without the header', async () => {
		await getAs('/api/kf/summary').expect(401);
		await postWebhook().expect(401);
	});

	it('refuses the old shared key on its own', async () => {
		await getAs('/api/kf/summary').set('Authorization', 'Bearer test-internal-key').expect(401);
	});

	it.each([
		['another app', { aud: 'kf_underlay' }],
		['an ID token (sub is a user)', { sub: 'some-user-id' }],
		['another issuer', { iss: 'https://auth.example.org/api/auth' }],
		[
			'an expired token',
			{ iat: Math.floor(Date.now() / 1000) - 600, exp: Math.floor(Date.now() / 1000) - 300 },
		],
		['another method', { htm: 'POST' }],
		['another route', { htu: registeredUrl('/api/kf/contexts') }],
		['the URL as the request saw it', { htu: `http://${host}/api/kf/summary` }],
	])('refuses %s', async (_, claims) => {
		const token = await kfConsole.sign({ path: '/api/kf/summary', claims });
		await getAs('/api/kf/summary', token).expect(401);
	});

	it('refuses a token signed with another key', async () => {
		const other = await stubKfConsole();
		const token = await other.sign({ path: '/api/kf/summary' });
		await getAs('/api/kf/summary', token).expect(401);
	});

	it('refuses a webhook whose body was changed', async () => {
		const token = await kfConsole.sign({
			method: 'POST',
			path: '/api/kf/webhooks',
			body: webhookBody,
		});
		const tampered = webhookBody.replace('nobody', 'somebody');
		await postWebhook(token, tampered).expect(401);
	});

	it('refuses a webhook token without a body hash', async () => {
		const token = await kfConsole.sign({ method: 'POST', path: '/api/kf/webhooks' });
		await postWebhook(token).expect(401);
	});
});
