export const Filter = {
	Parent: 'parent',
	Sibling: 'sibling',
	Child: 'child',
};

export const allFilters = Object.values(Filter);

export const Mode = {
	Carousel: 'carousel',
	List: 'list',
};

const pluralFilterLookup = {
	[Filter.Parent]: 'parents',
	[Filter.Sibling]: 'siblings',
	[Filter.Child]: 'children',
};

export const filterToPlural = (filter) => pluralFilterLookup[filter];
