import React from 'react';

import { Router } from 'express';
import { Op } from 'sequelize';

import Html from 'server/Html';
import { Community, ScopeSummary, SpamTag } from 'server/models';
import { handleErrors } from 'server/utils/errors';
import { getInitialData } from 'server/utils/initData';
import { hostIsValid } from 'server/utils/routes';
import { generateMetaComponents, renderToNodeStream } from 'server/utils/ssr';

export const router = Router();

// Simple seeded PRNG so the order changes daily but is stable within a page load
const seededShuffle = <T,>(arr: T[], seed: number): T[] => {
	const shuffled = [...arr];
	let s = Math.abs(seed);
	for (let i = shuffled.length - 1; i > 0; i--) {
		s = (s * 1664525 + 1013904223) % 2147483648;
		const j = s % (i + 1);
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}
	return shuffled;
};

router.get('/explore', (req, res, next) => {
	if (!hostIsValid(req, 'pubpub')) {
		return next();
	}

	const getActiveCommunities = Community.findAll({
		attributes: [
			'id',
			'subdomain',
			'domain',
			'title',
			'description',
			'avatar',
			'heroBackgroundImage',
			'heroBackgroundColor',
			'heroLogo',
			'accentColorLight',
			'accentColorDark',
			'headerLogo',
			'headerColorType',
			'isFeatured',
			'createdAt',
			'updatedAt',
		],
		include: [
			{
				model: SpamTag,
				as: 'spamTag',
				attributes: ['status'],
				required: false,
			},
			{
				model: ScopeSummary,
				as: 'scopeSummary',
				attributes: ['pubs', 'collections', 'discussions', 'reviews', 'submissions'],
				required: false,
			},
		],
		where: {
			[Op.or]: [{ spamTagId: null }, { '$spamTag.status$': 'confirmed-not-spam' }],
		},
	});

	return Promise.all([getInitialData(req), getActiveCommunities])
		.then(([initialData, activeCommunitiesData]) => {
			const communities = activeCommunitiesData
				.map((c) => {
					const json = c.toJSON() as any;
					const summary = json.scopeSummary || {};
					json.activityScore =
						(summary.pubs || 0) * 3 +
						(summary.discussions || 0) +
						(summary.collections || 0) * 2 +
						(summary.reviews || 0) +
						(summary.submissions || 0);
					return json;
				})
				.filter((c) => c.isFeatured && c.activityScore > 0)
				.sort((a, b) => b.activityScore - a.activityScore);

			// Shuffle daily so the page feels alive — seed from the date
			const today = new Date();
			const daySeed =
				today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
			const shuffled = seededShuffle(communities, daySeed);

			return renderToNodeStream(
				res,
				<Html
					chunkName="Explore"
					initialData={initialData}
					viewData={{
						exploreData: {
							communities: shuffled,
						},
					}}
					headerComponents={generateMetaComponents({
						initialData,
						title: 'Explore · PubPub',
						description:
							'Discover knowledge communities on PubPub — journals, books, conferences, and more.',
					})}
				/>,
			);
		})
		.catch(handleErrors(req, res, next));
});
