import {
	arrayOf,
	cascade,
	createEmptyFacetInstance,
	createFacetInstance,
	facet,
	FacetsError,
	License,
	mapFacet,
	parseFacetInstance,
	parsePartialFacetInstance,
	prop,
	PubHeaderTheme,
	string,
} from 'facets';

const GroceryList = facet({
	name: 'GroceryList',
	props: {
		items: prop(arrayOf(string), {
			cascade: 'concat',
			rootValue: [] as string[],
		}),
	},
});

describe('createEmptyFacetInstance', () => {
	it('creates an instance of a facet with all-null props', () => {
		expect(createEmptyFacetInstance(PubHeaderTheme)).toEqual({
			backgroundColor: null,
			backgroundImage: null,
			textStyle: null,
		});
	});
});

describe('createFacetInstance', () => {
	it('creates an instance of a facet with the provided props', () => {
		expect(createFacetInstance(PubHeaderTheme, { backgroundColor: 'red' })).toEqual({
			backgroundColor: 'red',
			backgroundImage: null,
			textStyle: null,
		});
	});
});

describe('parseFacetInstance', () => {
	it('parses props into valid and invalid buckets', () => {
		expect(
			parseFacetInstance(License, {
				kind: 'cc-by-not-a-real-slug',
				copyrightSelection: {
					choice: 'infer-from-scope',
					year: null,
				},
			}),
		).toEqual({
			valid: {
				copyrightSelection: {
					choice: 'infer-from-scope',
					year: null,
				},
			},
			invalid: {
				kind: true,
			},
		});
	});

	it('silently ignores keys that are not facet props', () => {
		expect(
			parseFacetInstance(License, {
				zoop: 'zip',
				kind: 'cc-by-nc',
				copyrightSelection: {
					choice: 'infer-from-scope',
					year: null,
				},
			} as unknown as any),
		).toEqual({
			valid: {
				copyrightSelection: {
					choice: 'infer-from-scope',
					year: null,
				},
				kind: 'cc-by-nc',
			},
			invalid: {},
		});
	});

	it('throws an error when keys are missing', () => {
		expect(() =>
			parseFacetInstance(License, {
				copyrightSelection: {
					choice: 'infer-from-scope',
					year: null,
				},
			} as unknown as any),
		).toThrowError(FacetsError);
	});

	it('optionally throws an error when it encounters an invalid prop', () => {
		expect(() =>
			parseFacetInstance(
				License,
				{
					copyrightSelection: {
						choice: 'infer-from-scope',
						year: null,
					},
					kind: 'cc-by-not-a-real-slug',
				},
				true,
			),
		).toThrowError(FacetsError);
	});
});

describe('parsePartialFacetInstance', () => {
	it('parses props into valid and invalid buckets', () => {
		expect(
			parsePartialFacetInstance(PubHeaderTheme, {
				textStyle: 27,
				backgroundColor: 'red',
			}),
		).toEqual({
			valid: {
				backgroundColor: 'red',
			},
			invalid: {
				textStyle: true,
			},
		});
	});

	it('optionally throws an error when it encounters an invalid prop', () => {
		expect(() =>
			parsePartialFacetInstance(
				PubHeaderTheme,
				{
					textStyle: 27,
					backgroundColor: 'red',
				},
				true,
			),
		).toThrowError(FacetsError);
	});
});

describe('cascade', () => {
	it('returns the root values for an empty cascade', () => {
		expect(cascade(PubHeaderTheme, []).value).toEqual({
			backgroundColor: 'community',
			backgroundImage: null,
			textStyle: 'light',
		});
	});

	it('cascades values through nulls (and explains prop sources)', () => {
		const { value, props } = cascade(PubHeaderTheme, [
			{
				scope: { kind: 'community', id: '0000' },
				facetBindingId: 'fb-0000',
				value: {
					backgroundColor: null,
					backgroundImage: 'image.png',
					textStyle: null,
				},
			},
			{
				scope: { kind: 'pub', id: '0001' },
				facetBindingId: 'fb-0001',
				value: {
					backgroundColor: 'red',
					backgroundImage: null,
					textStyle: null,
				},
			},
		]);
		expect(value).toEqual({
			backgroundColor: 'red',
			backgroundImage: 'image.png',
			textStyle: 'light',
		});
		expect(props).toMatchObject({
			backgroundColor: {
				value: 'red',
				sources: [
					{
						scope: { kind: 'root' },
						facetBindingId: null,
						value: 'community',
					},
					{
						scope: { kind: 'community', id: '0000' },
						facetBindingId: 'fb-0000',
						value: null,
					},
					{
						scope: { kind: 'pub', id: '0001' },
						facetBindingId: 'fb-0001',
						value: 'red',
					},
				],
			},
		});
	});

	it('implements the `concat` CascadeStrategy', () => {
		const { value, props } = cascade(GroceryList, [
			{
				scope: { kind: 'community', id: '0000' },
				facetBindingId: 'fb-0000',
				value: {
					items: ['Apples', 'Oranges'],
				},
			},
			{
				scope: { kind: 'pub', id: '0001' },
				facetBindingId: 'fb-0001',
				value: {
					items: ['Bananas', 'Strawberries'],
				},
			},
		]);
		expect(value).toEqual({
			items: ['Apples', 'Oranges', 'Bananas', 'Strawberries'],
		});
		expect(props).toEqual({
			items: {
				value: ['Apples', 'Oranges', 'Bananas', 'Strawberries'],
				sources: [
					{
						scope: { kind: 'root' },
						facetBindingId: null,
						value: [],
					},
					{
						scope: { kind: 'community', id: '0000' },
						facetBindingId: 'fb-0000',
						value: ['Apples', 'Oranges'],
					},
					{
						scope: { kind: 'pub', id: '0001' },
						facetBindingId: 'fb-0001',
						value: ['Bananas', 'Strawberries'],
					},
				],
			},
		});
	});
});

describe('mapFacet', () => {
	it("creates a new object with keys from a facet's props", () => {
		expect(mapFacet(License, (key, propDef) => [key, propDef.rootValue])).toEqual({
			kind: ['kind', 'cc-by'],
			copyrightSelection: ['copyrightSelection', { choice: 'infer-from-scope', year: null }],
		});
	});
});
