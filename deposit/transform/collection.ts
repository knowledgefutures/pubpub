import type { Collection, Community } from 'server/models';
import type * as types from 'types';

import type {
	Resource,
	ResourceContribution,
	ResourceContributorRole,
	ResourceKind,
} from '../resource';

import { fetchFacetsForScope } from 'server/facets';
import { expect } from 'utils/assert';
import { collectionUrl } from 'utils/canonicalUrls';
import { licenseDetailsByKind } from 'utils/licenses';

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

function getResourceKindForCollection(collection: types.Collection | Collection): ResourceKind {
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
	attribution: types.CollectionAttribution,
	role: string,
): ResourceContribution {
	return {
		contributor: {
			name: attribution.user?.fullName ?? expect(attribution.name),
			orcid: attribution.orcid,
		},
		contributorAffiliation: attribution.affiliation,
		contributorRole: transformAttributionRoleToResourceContributorRole(role),
		isAttribution: Boolean(attribution.isAuthor),
	};
}

export async function transformCollectionToResource(
	collection: types.Collection | Collection,
	community: types.Community | Community,
): Promise<Resource> {
	const facets = await fetchFacetsForScope({ collectionId: collection.id }, ['License']);
	const license = licenseDetailsByKind[facets.License.value.kind];
	const contributions: ResourceContribution[] =
		collection.attributions
			?.sort((a, b) => a.order - b.order)
			.map((attribution) =>
				transformCollectionAttributionToResourceContribution(
					attribution,
					attribution.roles?.[0] ?? 'Other',
				),
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
	const depositJson = collection.crossrefDepositRecord?.depositJson;
	collectionResource.meta['created-date'] = collection.createdAt.toString();
	if (depositJson) {
		// @ts-expect-error FIXME: Property 'deposit' does not exist on type 'object'.
		const dateOfLastDeposit = new Date(depositJson.data.attributes.updated);
		const dateOfLatestUpdate = new Date(collection.updatedAt);
		if (dateOfLastDeposit.getTime() !== dateOfLatestUpdate.getTime()) {
			collectionResource.meta['updated-date'] = dateOfLatestUpdate.toString();
		}
	}
	return collectionResource;
}
