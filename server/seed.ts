import crypto from 'crypto';

import { Community, FeatureFlag, FeatureFlagCommunity, Page, SpamTag } from './models';

const DEMO_SUBDOMAIN = 'demo';

export async function seedDevData() {
	if (process.env.NODE_ENV === 'production') return;

	const existing = await Community.findOne({
		where: { subdomain: DEMO_SUBDOMAIN },
		attributes: ['id'],
	});
	if (existing) return;

	console.log('[seed] Creating demo community...');

	const communityId = crypto.randomUUID();
	const homePageId = crypto.randomUUID();

	try {
		const customFeatureFlag = await FeatureFlag.create({
			id: crypto.randomUUID(),
			name: 'customScripts',
		});

		const spamTag = await SpamTag.create({
			id: crypto.randomUUID(),
			status: 'confirmed-not-spam',
			fields: {},
			spamScore: 0,

			spamScoreComputedAt: new Date(),
			spamScoreVersion: 1,
		});
		await Community.create(
			{
				id: communityId,
				subdomain: DEMO_SUBDOMAIN,
				title: 'Demo Community',
				description: 'Local development community',
				heroTitle: 'Demo Community',
				heroText: 'Welcome to your local PubPub development environment.',
				accentColorLight: '#ffffff',
				accentColorDark: '#112233',
				navigation: [{ type: 'page', id: homePageId }],
				hideCreatePubButton: false,
				spamTagId: spamTag.id,
			},
			{ hooks: false },
		);
		await FeatureFlagCommunity.create({
			id: crypto.randomUUID(),
			featureFlagId: customFeatureFlag.id,
			communityId,
			enabled: true,
		});

		await Page.create({
			id: homePageId,
			title: 'Home',
			slug: '',
			communityId,
			isPublic: true,
			layout: [
				{
					id: crypto.randomUUID().slice(0, 8),
					type: 'text',
					content: {
						text: {
							type: 'doc',
							attrs: { meta: {} },
							content: [
								{
									type: 'heading',
									attrs: { level: 1, fixedId: '', id: 'welcome' },
									content: [{ type: 'text', text: 'Welcome to PubPub Dev' }],
								},
								{
									type: 'paragraph',
									attrs: { class: null },
									content: [
										{
											type: 'text',
											text: 'This community was automatically created for local development. Sign in with your KF Auth account to get started.',
										},
									],
								},
							],
						},
						align: 'left',
						title: '',
						width: 'wide',
					},
				},
			],
			viewHash: crypto.randomUUID().slice(0, 8),
		} as any);

		console.log('[seed] Demo community created (subdomain: demo)');
	} catch (err: any) {
		if (err?.name === 'SequelizeUniqueConstraintError') {
			return;
		}
		throw err;
	}
}
