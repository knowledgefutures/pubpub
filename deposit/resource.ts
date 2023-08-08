export type ResourceLicense = {
	uri: string;
	/**
	 * SPDX license identifier.
	 * @see {@link https://spdx.org/licenses}
	 */
	spdxIdentifier: string;
};

export type ResourceKind =
	| 'Book'
	| 'BookChapter'
	| 'Journal'
	| 'JournalIssue'
	| 'JournalArticle'
	| 'Conference'
	| 'ConferenceProceeding'
	| 'ConferencePaper'
	| 'Other';

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

export type InterWorkResourceRelation =
	| 'Comment'
	| 'Preprint'
	| 'Reply'
	| 'Review'
	| 'Supplement'
	| 'Translation'
	| 'Version';

export type IntraWorkResourceRelation = 'Part' | 'Publication';

export type ResourceRelation = InterWorkResourceRelation | IntraWorkResourceRelation;

export type ResourceRelationship = {
	isParent: boolean;
	relation: ResourceRelation;
	resource: AnyResource;
};

export type ResourceContributorKind = 'Person' | 'Organization';
export type ResourceContributorRole = 'Creator' | 'Editor' | 'Translator' | 'Other';
export type ResourceContributor = { name: string; orcid?: string | null };

export type ResourceContribution = {
	isAttribution: boolean;
	contributor: ResourceContributor;
	contributorAffiliation: string | undefined | null;
	contributorRole: ResourceContributorRole;
};

export type ResourceDescriptor = 'Explanation' | 'Mechanism' | 'Process' | 'Definition' | 'Other';

export type ResourceDescription = {
	kind: ResourceDescriptor;
	/**
	 * ISO 639.2 language code.
	 */
	lang: string;

	text: string;
};

export type ResourceSummaryKind = 'Synopsis' | 'WordCount' | 'Other';

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

export type ResourceIdentifierKind = 'URL' | 'DOI' | 'ISSN' | 'EISSN' | 'ISBN';

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
