import { TypeOfFacetProp, License as LicenseFacet } from 'facets';

export type LicenseKind = TypeOfFacetProp<typeof LicenseFacet['props']['kind']>;

export type LicenseDetails<Kind extends LicenseKind = LicenseKind> = {
	kind: Kind;
	full: string;
	short: string;
	version: string | null;
	link: string | null;
	requiresPremium?: true;
};

export type RenderedLicense = {
	kind: LicenseKind;
	full: string;
	short: string;
	summary: string | null;
	link: string | null;
};
