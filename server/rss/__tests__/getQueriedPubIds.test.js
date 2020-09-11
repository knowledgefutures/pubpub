/* global it, expect, beforeAll */
import { setup } from 'stubstub';

import { getQueriedPubIds } from '../queries';
import { models } from './data';

setup(beforeAll, async () => {
	await models.resolve();
});

const expectQuery = (query) => {
	const { community } = models;
	return {
		toReturn: async (pubs) => {
			const pubIds = await getQueriedPubIds({
				communityId: community.id,
				query: query,
				limit: 25,
			});
			expect(pubIds).toEqual(pubs.map((pub) => pub.id));
		},
	};
};

it('returns only released Pubs', async () => {
	const { p2, p3, p4, p5 } = models;
	await expectQuery({}).toReturn([p5, p4, p3, p2]);
});

it('filters out child Pubs when children=false', async () => {
	const { p4, p5 } = models;
	await expectQuery({ children: false }).toReturn([p5, p4]);
});

it('filters Pubs by collection membership', async () => {
	const { p2, p3, p4 } = models;
	await expectQuery({ collections: 'c1,c2' }).toReturn([p4, p3, p2]);
	await expectQuery({ collections: 'c2,-c3' }).toReturn([p2]);
});

it('filters Pubs by publication date', async () => {
	const { p2, p3, p4, p5 } = models;
	await expectQuery({ publishedOn: '2020-03-09' }).toReturn([p3]);
	await expectQuery({ publishedBefore: '2020-05-15' }).toReturn([p4, p3, p2]);
	await expectQuery({ publishedAfter: '2020-03-15' }).toReturn([p5, p4]);
	await expectQuery({
		publishedAfter: '2020-03-15',
		publishedBefore: '2020-05-01',
	}).toReturn([p4]);
});

it('filters Pubs by several things at once', async () => {
	const { p3, p4 } = models;
	await expectQuery({
		publishedAfter: '2020-03-01',
		collections: 'c2',
	}).toReturn([p4, p3]);
});
