import uuid from 'uuid';

import { stubKfConsole } from 'server/kf/__tests__/consoleTokenStub';
import { Collection, Community, CrossrefDepositRecord, Org, Pub } from 'server/models';
import { login, modelize, setup, teardown } from 'stubstub';

const kfOrgId = `kf-account-${uuid.v4().slice(0, 8)}`;
let orgA: Org;
let orgB: Org;

const models = modelize`
	Community first {
		Member {
			permissions: "admin"
			User firstAdmin {}
		}
		Pub depositedPub {}
		Pub plainPub {}
		Collection depositedCollection {}
	}
	Community second {
		Pub secondPub {}
	}
	Community elsewhere {
		Pub elsewherePub {}
	}
`;

let kfConsole: Awaited<ReturnType<typeof stubKfConsole>>;

setup(beforeAll, async () => {
	kfConsole = await stubKfConsole();
	await models.resolve();
	const createOrg = (title: string, kf: string) =>
		Org.create({ slug: `kf-org-${uuid.v4().slice(0, 8)}`, title, kfOrgId: kf });
	orgA = await createOrg('Org A', kfOrgId);
	orgB = await createOrg('Org B', kfOrgId);
	const other = await createOrg('Other', 'kf-other-account');
	await Community.update({ orgId: orgA.id }, { where: { id: models.first.id } });
	await Community.update({ orgId: orgB.id }, { where: { id: models.second.id } });
	await Community.update({ orgId: other.id }, { where: { id: models.elsewhere.id } });

	const deposit = async () => (await CrossrefDepositRecord.create({ depositJson: {} })).id;
	await Pub.update(
		{ crossrefDepositRecordId: await deposit() },
		{ where: { id: models.depositedPub.id } },
	);
	await Collection.update(
		{ crossrefDepositRecordId: await deposit() },
		{ where: { id: models.depositedCollection.id } },
	);
	await Pub.update(
		{ crossrefDepositRecordId: await deposit() },
		{ where: { id: models.elsewherePub.id } },
	);
});
teardown(afterAll);
beforeEach(() => {
	kfConsole.stubJwks();
});

const host = 'www.pubpub.org';

describe('KF Account summary and usage', () => {
	it('requires a KF-Console-Token', async () => {
		await (await login())
			.get(`/api/kf/summary?kf_org_id=${kfOrgId}`)
			.set('Host', host)
			.expect(401);
	});

	it('lists the account’s orgs with their communities', async () => {
		const { body } = await (await login())
			.get(`/api/kf/summary?kf_org_id=${kfOrgId}`)
			.set('Host', host)
			.set('KF-Console-Token', await kfConsole.sign({ path: '/api/kf/summary' }))
			.expect(200);
		expect(body.accounts.map((a) => a.name)).toEqual(['Org A', 'Org B']);
		const [a] = body.accounts;
		expect(a).toMatchObject({ id: orgA.id, type: 'org', stats: { communities: 1, pubs: 2 } });
		expect(a.collections).toEqual([
			expect.objectContaining({
				id: models.first.id,
				type: 'community',
				stats: { pubs: 2, members: 1 },
			}),
		]);
	});

	it('counts communities and DOI deposits across the account’s orgs', async () => {
		const { body } = await (await login())
			.get(`/api/kf/usage?kf_org_id=${kfOrgId}`)
			.set('Host', host)
			.set('KF-Console-Token', await kfConsole.sign({ path: '/api/kf/usage' }))
			.expect(200);
		expect(body.line_items).toEqual([
			{ key: 'communities', quantity: 2 },
			{ key: 'doi_deposits', quantity: 2 },
		]);
		const byOrg = Object.fromEntries(body.orgs.map((o) => [o.orgId, o.doiDeposits]));
		expect(byOrg).toEqual({ [orgA.id]: 2, [orgB.id]: 0 });
	});

	it('limits DOI deposits to a window', async () => {
		const { body } = await (await login())
			.get(`/api/kf/usage?kf_org_id=${kfOrgId}&since=2000-01-01&until=2000-02-01`)
			.set('Host', host)
			.set('KF-Console-Token', await kfConsole.sign({ path: '/api/kf/usage' }))
			.expect(200);
		expect(body.line_items[1]).toEqual({ key: 'doi_deposits', quantity: 0 });
	});
});
