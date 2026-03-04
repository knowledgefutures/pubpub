import { Pub, PubAttribution, SpamTag, User } from 'server/models';

import buildPubOptions from './pubOptions';
import sanitizePub from './pubSanitize';

export default async (slug, initialData) => {
	const sanitizedSlug = slug.toLowerCase();
	const isSuperAdmin = !!initialData.loginData?.isSuperAdmin;
	const userData = await User.findOne({
		where: {
			slug: sanitizedSlug,
		},
		attributes: {
			exclude: ['salt', 'hash', 'email', 'updatedAt'],
		},
		include: [
			{
				model: PubAttribution,
				as: 'attributions',
				required: false,
				include: [
					{
						model: Pub,
						as: 'pub',
						...buildPubOptions({
							isPreview: true,
							getMembers: true,
							getCommunity: true,
							getCollections: true,
						}),
					},
				],
			},
			...(isSuperAdmin ? [{ model: SpamTag, as: 'spamTag', required: false }] : []),
		],
	});

	if (!userData) {
		throw new Error('User Not Found');
	}

	const serializedUserData = userData.toJSON();
	const finalUserData = {
		...serializedUserData,
		attributions: (serializedUserData.attributions || [])
			.map((attribution) => {
				const sanitizedPub = sanitizePub(attribution.pub, initialData);
				return {
					...attribution,
					pub: sanitizedPub,
				};
			})
			.filter((attribution) => {
				return !!attribution.pub;
			}),
	};

	return finalUserData;
};
