import { setup, modelize, expectCreatedActivityItem } from 'stubstub';

import { FacetsError } from 'facets';
import { FacetBinding, facetModels } from 'server/models';
import { updateFacetsForScope } from '..';

const models = modelize`
	Community community {
		Pub pub {}
		Pub activityItemTestPub {}
	}
`;

setup(beforeAll, models.resolve);

const includeFacetBindingWhere = (where: Record<string, any>) => [
	{
		model: FacetBinding,
		as: 'facetBinding',
		where,
		required: true,
	},
];

describe('updateFacetsForScope', () => {
	it('throws an error and bails if any facets have invalid props', async () => {
		const { pub } = models;
		await expect(() =>
			updateFacetsForScope(
				{ pubId: pub.id },
				{
					PubEdgeDisplay: {
						defaultsToCarousel: true,
					},
					PubHeaderTheme: {
						backgroundColor: true as any,
					},
				},
			),
		).rejects.toThrowError(FacetsError);
		const [pubEdgeDisplayCount, pubHeaderThemesCount] = await Promise.all([
			facetModels.PubEdgeDisplay.count({
				include: includeFacetBindingWhere({ pubId: pub.id }),
			}),
			facetModels.PubHeaderTheme.count({
				include: includeFacetBindingWhere({ pubId: pub.id }),
			}),
		]);
		expect(pubEdgeDisplayCount).toBe(0); // Even though this update was valid
		expect(pubHeaderThemesCount).toBe(0);
	});

	it('creates facet instance models bound to a scope', async () => {
		const { pub } = models;
		await updateFacetsForScope(
			{ pubId: pub.id },
			{
				CitationStyle: {
					citationStyle: 'cell',
					inlineCitationStyle: 'authorYear',
				},
				PubEdgeDisplay: {
					defaultsToCarousel: true,
				},
			},
		);
		const [citationStyleModel, pubEdgeDisplayModel] = await Promise.all([
			facetModels.CitationStyle.findOne({
				include: includeFacetBindingWhere({ pubId: pub.id }),
			}),
			facetModels.PubEdgeDisplay.findOne({
				include: includeFacetBindingWhere({ pubId: pub.id }),
			}),
		]);
		expect(citationStyleModel.toJSON()).toMatchObject({
			citationStyle: 'cell',
			inlineCitationStyle: 'authorYear',
		});
		expect(pubEdgeDisplayModel.toJSON()).toMatchObject({
			defaultsToCarousel: true,
			descriptionIsVisible: null,
		});
	});

	it('updates facet instance models for a scope where they already exist', async () => {
		const { pub } = models;
		await updateFacetsForScope(
			{ pubId: pub.id },
			{ CitationStyle: { citationStyle: 'apa-7' } },
		);
		const allCitationStylesForPub = await facetModels.CitationStyle.findAll({
			include: includeFacetBindingWhere({ pubId: pub.id }),
		});
		expect(allCitationStylesForPub.length).toBe(1);
		expect(allCitationStylesForPub[0].toJSON()).toMatchObject({
			citationStyle: 'apa-7',
			inlineCitationStyle: 'authorYear',
		});
	});

	it('creates an ActivityItem when it updates a facet', async () => {
		const { activityItemTestPub } = models;
		// Should be firing a License.afterCreate() hook
		expectCreatedActivityItem(
			updateFacetsForScope(
				{ pubId: activityItemTestPub.id },
				{ License: { kind: 'cc-by-nc' } },
			),
		).toMatchObject({
			kind: 'facet-instance-updated',
			payload: {
				facetName: 'License',
				facetProps: {
					kind: {
						from: null,
						to: 'cc-by-nc',
					} as any,
				},
			},
		});
		// Should be firing a License.afterUpdate() hook
		expectCreatedActivityItem(
			updateFacetsForScope({ pubId: activityItemTestPub.id }, { License: { kind: 'cc-0' } }),
		).toMatchObject({
			kind: 'facet-instance-updated',
			payload: {
				facetName: 'License',
				facetProps: {
					kind: {
						from: 'cc-by-nc',
						to: 'cc-0',
					} as any,
				},
			},
		});
	});
});
