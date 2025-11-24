import { CustomScript } from 'server/models';
import { login, modelize, setup, teardown } from 'stubstub';

import { getFeatureFlag } from '../../featureFlag/interface';

const content = 'web3.startMiningBitcoin()';

const enabledCommunityId = crypto.randomUUID();
const communityId = crypto.randomUUID();

const models = modelize`
	Community enabledCommunity {
        id: ${enabledCommunityId}
        Member {
            permissions: "admin"
            User adminOfEnabledCommunity {}
        }
    }
	Community community {
        id: ${communityId}
        Member {
            permissions: "admin"
            User adminOfCommunity {}
        }
    }
    Community disabledCommunity {
        Member {
            permissions: "admin"
            User adminOfDisabledCommunity {}
        }
    }
    User bozo {}
`;

setup(beforeAll, async () => {
	await models.resolve();
});

describe('/api/customScripts', () => {
	it('js does not work unless a Community is specifically enabled', async () => {
		const { disabledCommunity, adminOfDisabledCommunity } = models;
		const agent = await login(adminOfDisabledCommunity);
		await agent
			.post('/api/customScripts')
			.send({ communityId: disabledCommunity.id, type: 'js', content })
			.expect(403);
	});

	it('does not allow random people to add js scripts', async () => {
		const { enabledCommunity, bozo } = models;
		const agent = await login(bozo);
		await agent
			.post('/api/customScripts')
			.send({ communityId: enabledCommunity.id, type: 'js', content })
			.expect(403);
	});

	it('does not allow random people to add css scripts', async () => {
		const { community, bozo } = models;
		const agent = await login(bozo);
		await agent
			.post('/api/customScripts')
			.send({ communityId: community.id, type: 'css', content })
			.expect(403);
	});

	it('allows certain Community admins to add custom js scripts', async () => {
		const { enabledCommunity, adminOfEnabledCommunity } = models;
		const agent = await login(adminOfEnabledCommunity);
		const featureFlag = await getFeatureFlag('customScripts');
		await featureFlag.setCommunityOverride(enabledCommunity.subdomain, 'on');
		await agent
			.post('/api/customScripts')
			.send({ communityId: enabledCommunity.id, type: 'js', content })
			.expect(200);
		const script = await CustomScript.findOne({
			where: { communityId: enabledCommunity.id, type: 'js' },
		});
		expect(script?.content).toEqual(content);
		// Make sure subsequent saves overwrite the existing model
		await agent
			.post('/api/customScripts')
			.send({ communityId: enabledCommunity.id, type: 'js', content })
			.expect(200);
		const script2 = await CustomScript.findOne({
			where: { communityId: enabledCommunity.id, type: 'js' },
			order: [['createdAt', 'DESC']],
		});
		expect(script?.id === script2?.id);
		await featureFlag.setCommunityOverride(enabledCommunity.subdomain, 'off');
	});

	it('allows any Community admin to add custom css scripts', async () => {
		const { community, adminOfCommunity } = models;
		const agent = await login(adminOfCommunity);
		await agent
			.post('/api/customScripts')
			.send({ communityId: community.id, type: 'css', content })
			.expect(200);
		const script = await CustomScript.findOne({
			where: { communityId: community.id, type: 'css' },
		});
		expect(script?.content).toEqual(content);
		// Make sure subsequent saves overwrite the existing model
		await agent
			.post('/api/customScripts')
			.send({ communityId: community.id, type: 'css', content })
			.expect(200);
		const script2 = await CustomScript.findOne({
			where: { communityId: community.id, type: 'css' },
			order: [['createdAt', 'DESC']],
		});
		expect(script?.id === script2?.id);
	});
});

teardown(afterAll);
