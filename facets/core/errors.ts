import { FacetDefinition } from './facet';

export class FacetsError extends Error {
	constructor(message: string) {
		super(`[facets] ${message}`);
	}
}

export class FacetDoesNotExistError extends FacetsError {
	constructor(supposedFacetName: string) {
		super(`The facet ${supposedFacetName} does not exist.`);
	}
}

export class FacetParseError extends FacetsError {
	constructor(facet: FacetDefinition, propNames: string | string[], propValue?: string) {
		super(
			`Error when parsing ${facet.name} instance: invalid ${propNames}${
				propValue ? ' = ' + propValue : ''
			}`,
		);
	}
}

export class FacetCascadeNotImplError extends FacetsError {
	constructor(cascadeStrategy: string) {
		super(`The facet cascade strategy "${cascadeStrategy}" has no implementation yet.`);
	}
}
