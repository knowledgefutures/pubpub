import { Op } from 'sequelize';

import { ActivityItem } from 'server/models';
import { setup, login, modelize } from 'stubstub';
import { fetchFacetsForScope } from '..';

const models = modelize`
    Community community {
        Pub pub {
            FacetBinding {
                CitationStyle {
                    citationStyle: "apa-7"
                }
            }
            Member {
                permissions: "edit"
                User userWhoCanEdit {}
            }
            Member {
                permissions: "manage"
                User userWhoCanManage {}
            }
        }
    }
`;

setup(beforeAll, models.resolve);

describe('/api/facets', () => {
	it('forbids users without "manage" member permission from updating facets', async () => {
		const { userWhoCanEdit, pub } = models;
		const agent = await login(userWhoCanEdit);
		await agent
			.post('/api/facets')
			.send({
				scope: { kind: 'pub', id: pub.id },
				facets: { PubHeaderTheme: { backgroundImage: 'image.png' } },
			})
			.expect(403);
	});

	it('does not update any facets if there are invalid prop values', async () => {
		const { userWhoCanManage, pub } = models;
		const agent = await login(userWhoCanManage);
		await agent
			.post('/api/facets')
			.send({
				scope: { kind: 'pub', id: pub.id },
				facets: {
					PubHeaderTheme: { backgroundImage: 7 },
					CitationStyle: { citationStyle: 'cell' },
				},
			})
			.expect(400);
		expect(
			await fetchFacetsForScope({ pubId: pub.id }, ['PubHeaderTheme', 'CitationStyle']),
		).toMatchObject({
			PubHeaderTheme: {
				value: {
					backgroundImage: null,
				},
			},
			CitationStyle: {
				value: {
					citationStyle: 'apa-7',
				},
			},
		});
	});

	it('updates facets, and creates ActivityItems for each one', async () => {
		const { userWhoCanManage, pub } = models;
		const t0 = Date.now();
		const agent = await login(userWhoCanManage);
		await agent
			.post('/api/facets')
			.send({
				scope: { kind: 'pub', id: pub.id },
				facets: {
					PubHeaderTheme: { backgroundImage: 'test.png' },
					CitationStyle: { citationStyle: 'cell' },
				},
			})
			.expect(200);
		expect(
			await fetchFacetsForScope({ pubId: pub.id }, ['PubHeaderTheme', 'CitationStyle']),
		).toMatchObject({
			PubHeaderTheme: {
				value: {
					backgroundImage: 'test.png',
				},
			},
			CitationStyle: {
				value: {
					citationStyle: 'cell',
				},
			},
		});
		const createdActivityItems = await ActivityItem.findAll({
			where: { kind: 'facet-instance-updated', pubId: pub.id, createdAt: { [Op.gte]: t0 } },
		});
		expect(createdActivityItems.length).toBe(2);
		const [pubHeaderThemeItem, citationStyleItem] = ['PubHeaderTheme', 'CitationStyle'].map(
			(facetName) =>
				createdActivityItems.find((item) => item.payload.facetName === facetName),
		);
		expect(pubHeaderThemeItem).toMatchObject({
			actorId: userWhoCanManage.id,
			payload: {
				facetName: 'PubHeaderTheme',
				facetProps: {
					backgroundImage: {
						from: null,
						to: 'test.png',
					},
				},
			},
		});
		expect(citationStyleItem).toMatchObject({
			actorId: userWhoCanManage.id,
			payload: {
				facetName: 'CitationStyle',
				facetProps: {
					citationStyle: {
						from: 'apa-7',
						to: 'cell',
					},
				},
			},
		});
	});
});
