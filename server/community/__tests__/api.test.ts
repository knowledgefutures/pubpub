/* global describe, it, expect, beforeAll, afterAll */
import sinon from 'sinon';
import uuid from 'uuid';

import { setup, teardown, login, modelize } from 'stubstub';

import { Community } from 'server/models';
import * as mailchimp from 'server/utils/mailchimp';
import * as webhooks from 'server/utils/webhooks';

let mailchimpStub;
let slackStub;

const models = modelize`
	Community existingCommunity {
		Member {
			permissions: "admin"
			User admin {}
		}
	}
	Community someOtherCommunity {
		Member {
			permissions: "admin"
			User someOtherAdmin {}
		}
	}
	User willCreateCommunity {}
`;

setup(beforeAll, async () => {
	mailchimpStub = sinon.stub(mailchimp, 'subscribeUser');
	slackStub = sinon.stub(webhooks, 'alertNewCommunity');
	await models.resolve();
});

describe('/api/communities', () => {
	it('creates a community', async () => {
		const { willCreateCommunity } = models;
		const agent = await login(willCreateCommunity);
		const subdomain = 'burn-book-' + uuid.v4();
		const { body: url } = await agent
			.post('/api/communities')
			.send({
				subdomain: subdomain,
				title: 'Burn Book',
				description: "Get in loser we're testing our code",
			})
			.expect(201);
		expect(url).toEqual(`https://${subdomain}.pubpub.org`);
		const newCommunity = await Community.findOne({ where: { subdomain: subdomain } });
		expect(newCommunity.title).toEqual('Burn Book');
	});

	it('does not create a community if you are logged out', async () => {
		await (await login())
			.post('/api/communities')
			.send({
				subdomain: 'notloggedin',
				title: 'Journal of Forgetting To Log In First',
				description: 'oops, I forgot',
			})
			.expect(403);
	});

	it('does not allow admins of other communities to update fields on a community', async () => {
		const { existingCommunity, someOtherAdmin } = models;
		const { title: oldTitle, id: communityId } = existingCommunity;
		const agent = await login(someOtherAdmin);
		await agent
			.put('/api/communities')
			.send({
				communityId: communityId,
				title: 'I Hear She Does Car Commericals, In Japan',
			})
			.expect(403);
		const communityNow = await Community.findOne({ where: { id: communityId } });
		expect(communityNow.title).toEqual(oldTitle);
	});

	it('allows community admins to update reasonable fields on the community', async () => {
		const { admin, existingCommunity } = models;
		const agent = await login(admin);
		await agent
			.put('/api/communities')
			.send({
				communityId: existingCommunity.id,
				// We expect this field to be updated...
				title: 'Journal of Trying To Lose Three Pounds',
				// ...but not this one!
				isFeatured: true,
			})
			.expect(200);
		const communityNow = await Community.findOne({ where: { id: existingCommunity.id } });
		expect(communityNow.title).toEqual('Journal of Trying To Lose Three Pounds');
		expect(communityNow.isFeatured).not.toBeTruthy();
	});
});

teardown(afterAll, () => {
	mailchimpStub.restore();
	slackStub.restore();
});
