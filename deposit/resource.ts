export type ResourceLicense = {
	uri: string;
	/**
	 * SPDX license identifier.
	 * @see {@link https://spdx.org/licenses}
	 */
	spdxIdentifier: string;
};

export const resourceKinds = [
	'Book',
	'BookChapter',
	'Journal',
	'JournalIssue',
	'JournalArticle',
	'Conference',
	'ConferenceProceeding',
	'ConferencePaper',
	'Other',
] as const;

export type ResourceKind = (typeof resourceKinds)[number];

export const resourceKindToProperNoun: Record<ResourceKind, string> = {
	Book: 'Book',
	BookChapter: 'Book Chapter',
	Journal: 'Journal',
	JournalIssue: 'Journal Issue',
	JournalArticle: 'Journal Article',
	Conference: 'Conference',
	ConferenceProceeding: 'Conference Proceeding',
	ConferencePaper: 'Conference Paper',
	Other: 'Other',
};

export const interWorkResourceRelations = [
	'Comment',
	'Preprint',
	'Reply',
	'Review',
	'Supplement',
	'Translation',
	'Version',
] as const;

export type InterWorkResourceRelation = (typeof interWorkResourceRelations)[number];

export const intraWorkResourceRelations = ['Part', 'Publication'] as const;
export type IntraWorkResourceRelation = (typeof intraWorkResourceRelations)[number];

export const resourceRelations = [
	...interWorkResourceRelations,
	...intraWorkResourceRelations,
] as const;
export type ResourceRelation = (typeof resourceRelations)[number];

export type ResourceRelationship = {
	isParent: boolean;
	relation: ResourceRelation;
	resource: AnyResource;
};

export const resourceContributorKinds = ['Person', 'Organization'] as const;
export type ResourceContributorKind = (typeof resourceContributorKinds)[number];
export const resourceContributorRoles = ['Creator', 'Editor', 'Translator', 'Other'] as const;
export type ResourceContributorRole = (typeof resourceContributorRoles)[number];
export type ResourceContributor = { name: string; orcid?: string | null };

export type ResourceContribution = {
	isAttribution: boolean;
	contributor: ResourceContributor;
	contributorAffiliation?: string | undefined | null;
	contributorRole: ResourceContributorRole;
};

export const resourceDescriptors = [
	'Explanation',
	'Mechanism',
	'Process',
	'Definition',
	'Other',
] as const;

export type ResourceDescriptor = (typeof resourceDescriptors)[number];

export type ResourceDescription = {
	kind: ResourceDescriptor;
	/**
	 * ISO 639.2 language code.
	 */
	lang: string;

	text: string;
};

export const resourceSummaryKinds = ['Synopsis', 'WordCount', 'Other'] as const;
export type ResourceSummaryKind = (typeof resourceSummaryKinds)[number];

export type ResourceSummary = {
	kind: ResourceSummaryKind;

	/**
	 * ISO 639.2 language code.
	 */
	lang: string;

	value: string;
};

export type PartialResource = {
	/**
	 * The title of the resource.
	 */
	title: string;

	/**
	 * The type of resource.
	 */
	kind: ResourceKind;

	identifiers: ResourceIdentifier[];
};

export const resourceIdentifierKinds = ['URL', 'DOI', 'ISSN', 'EISSN', 'ISBN'] as const;
export type ResourceIdentifierKind = (typeof resourceIdentifierKinds)[number];

export type ResourceIdentifier = {
	identifierKind: ResourceIdentifierKind;
	identifierValue: string;
};

type ResourceMeta = {
	[key: string]: string;
};

export type Resource = PartialResource & {
	/**
	 * The version of the resource expressed as a UTC datetime string.
	 */
	timestamp: string;

	descriptions: ResourceDescription[];

	summaries: ResourceSummary[];

	contributions: ResourceContribution[];

	/**
	 * Homogeneous list of inter- and intra-work relationships.
	 */
	relationships: ResourceRelationship[];

	license: ResourceLicense;

	meta: ResourceMeta;
};

export type AnyResource = PartialResource | Resource;

export const isIntraWorkRelation = (relation: ResourceRelation) =>
	relation === 'Part' || relation === 'Publication';
export const isInterWorkRelation = (relation: ResourceRelation) => !isIntraWorkRelation(relation);

export const isIntraWorkRelationship = (relationship: ResourceRelationship) =>
	isIntraWorkRelation(relationship.relation);
export const isInterWorkRelationship = (relationship: ResourceRelationship) =>
	!isIntraWorkRelationship(relationship);

export const getFirstIntraWorkRelationship = (resource: Resource) =>
	resource.relationships.find(isIntraWorkRelationship);

export const getIdentifier = (resource: AnyResource, identifierKind: ResourceIdentifierKind) =>
	resource.identifiers.find((identifier) => identifier.identifierKind === identifierKind);

export const getIdentifierValue = (resource: AnyResource, identifierKind: ResourceIdentifierKind) =>
	resource.identifiers.find((identifier) => identifier.identifierKind === identifierKind)
		?.identifierValue;
