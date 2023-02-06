import { setup, modelize } from 'stubstub';

import { fetchFacetsForScope, fetchFacetsForScopeIds } from '..';

const models = modelize`
	Community community {
        FacetBinding {
            CitationStyle {
                citationStyle: "cell"
            }
        }
        FacetBinding {
            PubHeaderTheme {
                textStyle: "black-blocks"
            }
        }
		Pub pub {
            FacetBinding {
                PubHeaderTheme {
                    textStyle: "white-blocks"
                    backgroundColor: "puce"
                }
            }
        }
	}
`;

setup(beforeAll, models.resolve);

describe('fetchFacetsForScope', () => {
	it('fetches a casaded value for all facets', async () => {
		const { pub } = models;
		expect(await fetchFacetsForScope({ pubId: pub.id })).toMatchObject({
			CitationStyle: {
				value: {
					citationStyle: 'cell',
					inlineCitationStyle: 'count',
				},
			},
			PubHeaderTheme: {
				value: {
					textStyle: 'white-blocks',
					backgroundColor: 'puce',
					backgroundImage: null,
				},
			},
			// Even though we never explicitly set this anywhere...
			PubEdgeDisplay: {
				value: {
					descriptionIsVisible: true,
					defaultsToCarousel: true,
				},
			},
		});
	});

	it('fetches a casaded value for specified facets', async () => {
		const { pub } = models;
		const result = await fetchFacetsForScope({ pubId: pub.id }, ['CitationStyle']);
		expect(Object.keys(result).length).toBe(1);
		expect(result.CitationStyle).toMatchObject({
			value: {
				citationStyle: 'cell',
				inlineCitationStyle: 'count',
			},
		});
	});
});

describe('fetchFacetsForScopeIds', () => {
	it('fetches facets for multiple scopes at once', async () => {
		const { community, pub } = models;
		expect(
			await fetchFacetsForScopeIds({
				community: [community.id],
				pub: [pub.id],
			}),
		).toMatchObject({
			community: {
				[community.id]: {
					CitationStyle: {
						value: {
							citationStyle: 'cell',
							inlineCitationStyle: 'count',
						},
					},
					PubHeaderTheme: {
						value: {
							textStyle: 'black-blocks',
							backgroundColor: 'community',
							backgroundImage: null,
						},
					},
					PubEdgeDisplay: {
						value: {
							descriptionIsVisible: true,
							defaultsToCarousel: true,
						},
					},
				},
			},
			pub: {
				[pub.id]: {
					CitationStyle: {
						value: {
							citationStyle: 'cell',
							inlineCitationStyle: 'count',
						},
					},
					PubHeaderTheme: {
						value: {
							textStyle: 'white-blocks',
							backgroundColor: 'puce',
							backgroundImage: null,
						},
					},
					PubEdgeDisplay: {
						value: {
							descriptionIsVisible: true,
							defaultsToCarousel: true,
						},
					},
				},
			},
		});
	});
});
