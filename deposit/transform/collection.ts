import { fetchFacetsForScope } from 'server/facets';
import { Collection, CollectionAttribution, Community } from 'types';
import { collectionUrl } from 'utils/canonicalUrls';
import { licenseDetailsByKind } from 'utils/licenses';
import { ResourceKind, ResourceContribution, ResourceContributorRole, Resource } from '../resource';

const attributionRoleToResourceContributorRole: Record<string, ResourceContributorRole> = {
	'Writing – Review & Editing': 'Editor',
	Editor: 'Editor',
	'Series Editor': 'Editor',
	Translator: 'Translator',
	Chair: 'Editor',
};

function transformAttributionRoleToResourceContributorRole(role: string): ResourceContributorRole {
	return attributionRoleToResourceContributorRole[role] ?? 'Other';
}

function getResourceKindForCollection(collection: Collection): ResourceKind {
	switch (collection.kind) {
		case 'tag':
		case 'issue':
			return 'JournalIssue';
		case 'book':
			return 'Book';
		case 'conference':
			return 'Conference';
		default:
			return 'Other';
	}
}

function transformCollectionAttributionToResourceContribution(
	attribution: CollectionAttribution,
	role: string,
): ResourceContribution {
	return {
		contributor: {
			name: attribution.user?.fullName ?? attribution.name,
			orcid: attribution.orcid,
		},
		contributorAffiliation: attribution.affiliation,
		contributorRole: transformAttributionRoleToResourceContributorRole(role),
		isAttribution: Boolean(attribution.isAuthor),
	};
}

export async function transformCollectionToResource(
	collection: Collection,
	community: Community,
): Promise<Resource> {
	const facets = await fetchFacetsForScope({ collectionId: collection.id }, ['License']);
	const license = licenseDetailsByKind[facets.License.value.kind];
	const contributions: ResourceContribution[] =
		collection.attributions?.flatMap(
			(attribution) =>
				attribution.roles?.map((role) =>
					transformCollectionAttributionToResourceContribution(attribution, role),
				) ?? transformCollectionAttributionToResourceContribution(attribution, 'Other'),
		) ?? [];
	const collectionResource: Resource = {
		kind: getResourceKindForCollection(collection),
		title: collection.title,
		identifiers: [
			{
				identifierKind: 'URL',
				identifierValue: collectionUrl(community, collection),
			},
		],
		license: { spdxIdentifier: license.spdxIdentifier, uri: license.link },
		timestamp: collection.updatedAt,
		contributions,
		relationships: [],
		descriptions: [],
		summaries: [],
		meta: {},
	};
	if (collection.doi) {
		collectionResource.identifiers.push({
			identifierKind: 'DOI',
			identifierValue: collection.doi,
		});
	}
	if (collection.metadata) {
		const { issn, isbn, printIssn, electronicIssn } = collection.metadata;
		if (issn) {
			collectionResource.identifiers.push({
				identifierKind: 'ISSN',
				identifierValue: issn,
			});
		} else if (printIssn) {
			collectionResource.identifiers.push({
				identifierKind: 'ISSN',
				identifierValue: printIssn,
			});
		}
		if (electronicIssn) {
			collectionResource.identifiers.push({
				identifierKind: 'EISSN',
				identifierValue: electronicIssn,
			});
		}
		if (isbn) {
			collectionResource.identifiers.push({
				identifierKind: 'ISBN',
				identifierValue: isbn,
			});
		}
	}
	return collectionResource;
}
