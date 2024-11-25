/* eslint-disable no-use-before-define */
/* eslint-disable @typescript-eslint/no-use-before-define */

import { Node } from 'prosemirror-model';
import { buildSchema } from 'client/components/Editor/utils/schema';
import { getPrimaryParentPubEdge, sanitizePubEdges } from 'deposit/utils';
import { fetchFacetsForScope } from 'server/facets';
import { Doc } from 'server/models';
import * as types from 'types';
import { exists, expect } from 'utils/assert';
import { pubUrl } from 'utils/canonicalUrls';
import { getPrimaryCollection } from 'utils/collections/primary';
import { licenseDetailsByKind } from 'utils/licenses';
import { RelationType, relationTypeDefinitions } from 'utils/pubEdge';
import { getWordAndCharacterCountsFromDoc } from 'utils/pub/metadata';
import { sortByRank } from 'utils/rank';
import {
	AnyResource,
	PartialResource,
	Resource,
	ResourceContribution,
	ResourceContributorRole,
	ResourceKind,
	ResourceRelation,
	ResourceRelationship,
} from '../resource';
import { transformCollectionToResource } from './collection';

const schema = buildSchema();

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

const pubEdgeRelationTypeToResourceRelation: Record<
	keyof typeof relationTypeDefinitions,
	ResourceRelation
> = {
	comment: 'Comment',
	commentary: 'Comment',
	preprint: 'Preprint',
	rejoinder: 'Review',
	review: 'Review',
	reply: 'Reply',
	supplement: 'Supplement',
	translation: 'Translation',
	version: 'Version',
};

function transformPubAttributionToResourceContribution(
	attribution: types.PubAttribution,
	role: string,
): ResourceContribution {
	return {
		contributor: {
			name: attribution.user?.fullName ?? expect(attribution.name),
			orcid: attribution.user?.orcid ?? attribution.orcid,
		},
		contributorAffiliation: attribution.affiliation,
		contributorRole: transformAttributionRoleToResourceContributorRole(role),
		isAttribution: Boolean(attribution.isAuthor),
	};
}

function derivePubResourceKind(
	pubPrimaryParentEdge?: types.PubEdge | null,
	pubPrimaryCollection?: types.Collection | null,
	pubCommunity?: types.Community | null,
): ResourceKind {
	switch (pubPrimaryParentEdge?.relationType) {
		case RelationType.Preprint:
		case RelationType.Supplement:
			return 'Other';
		default:
			break;
	}
	if (exists(pubPrimaryCollection)) {
		switch (pubPrimaryCollection.kind) {
			case 'issue':
			case 'tag':
				return pubCommunity?.id === '1a71ef4d-f6fe-40d3-8379-42fa2141db58'
					? 'Preprint'
					: 'JournalArticle';
			case 'book':
				return 'BookChapter';
			case 'conference':
				return 'ConferenceProceeding';
			default:
				throw new Error('Invalid primary collection kind');
		}
	}
	return pubCommunity?.id === '1a71ef4d-f6fe-40d3-8379-42fa2141db58'
		? 'Preprint'
		: 'JournalArticle';
}

function derivePubEdgeRelation(pubEdge: types.PubEdge): ResourceRelation {
	return pubEdgeRelationTypeToResourceRelation[pubEdge.relationType];
}

function transformExternalPublicationToResource({
	title,
	url,
	doi,
}: types.ExternalPublication): AnyResource {
	const externalPublicationResource: AnyResource = {
		kind: 'Other',
		title,
		identifiers: [
			{
				identifierKind: 'URL',
				identifierValue: url,
			},
		],
	};
	if (doi) {
		externalPublicationResource.identifiers.push({
			identifierKind: 'DOI',
			identifierValue: doi,
		});
	}
	return externalPublicationResource;
}

async function transformEdgeToResourceRelationship(
	pubEdge: types.PubEdge,
	community: types.Community,
	inbound = false,
): Promise<ResourceRelationship> {
	return {
		isParent: inbound ? pubEdge.pubIsParent : !pubEdge.pubIsParent,
		resource: pubEdge.externalPublication
			? transformExternalPublicationToResource(pubEdge.externalPublication)
			: await transformPubToPartialResource(
					expect(inbound ? pubEdge.pub : pubEdge.targetPub),
					community,
			  ),
		relation: derivePubEdgeRelation(pubEdge),
	};
}

export async function transformPubToPartialResource(
	pub: types.Pub,
	community: types.Community,
): Promise<PartialResource> {
	pub = sanitizePubEdges(pub, true);
	const pubPrimaryParentEdge = getPrimaryParentPubEdge(pub);
	const pubPrimaryCollection = pub.collectionPubs
		? getPrimaryCollection(pub.collectionPubs)
		: null;
	const pubResource: PartialResource = {
		title: pub.title,
		kind: derivePubResourceKind(pubPrimaryParentEdge, pubPrimaryCollection, pub.community),
		identifiers: [
			{
				identifierKind: 'URL',
				identifierValue: pubUrl(community, pub, { absolute: true }),
			},
		],
	};
	if (pub.doi) {
		pubResource.identifiers.push({
			identifierKind: 'DOI',
			identifierValue: pub.doi,
		});
	}
	return pubResource;
}

export async function transformPubToResource(
	pub: types.Pub,
	community: types.Community,
): Promise<Resource> {
	pub = sanitizePubEdges(pub, true);
	const pubPrimaryParentEdge = getPrimaryParentPubEdge(pub);
	const pubPrimaryCollection = pub.collectionPubs
		? getPrimaryCollection(pub.collectionPubs)
		: null;
	const facets = await fetchFacetsForScope({ pubId: pub.id }, ['License']);
	const license = licenseDetailsByKind[facets.License.value.kind];
	const relationships: ResourceRelationship[] = await Promise.all([
		...sortByRank(pub.outboundEdges ?? []).map((pubEdge) =>
			transformEdgeToResourceRelationship(pubEdge, community),
		),
		...sortByRank(pub.inboundEdges ?? []).map((pubEdge) =>
			transformEdgeToResourceRelationship(pubEdge, community, true),
		),
	]);
	const contributions: ResourceContribution[] = (pub.attributions ?? [])
		.sort((a, b) => a.order - b.order)
		.map((attribution) =>
			transformPubAttributionToResourceContribution(
				attribution,
				attribution.roles?.[0] ?? 'Other',
			),
		);
	const pubResource: Resource = {
		kind: derivePubResourceKind(pubPrimaryParentEdge, pubPrimaryCollection, pub.community),
		title: pub.title,
		timestamp: new Date().toUTCString(),
		license: { spdxIdentifier: license.spdxIdentifier, uri: license.link },
		summaries: [],
		descriptions: [],
		contributions,
		relationships,
		identifiers: [
			{
				identifierKind: 'URL',
				identifierValue: pubUrl(community, pub, { absolute: true }),
			},
		],
		meta: {},
	};
	if (pub.doi) {
		pubResource.identifiers.push({
			identifierKind: 'DOI',
			identifierValue: pub.doi,
		});
	}
	if (pubPrimaryCollection) {
		pubResource.relationships.push({
			isParent: true,
			relation: pubPrimaryCollection.kind === 'book' ? 'Part' : 'Publication',
			resource: await transformCollectionToResource(pubPrimaryCollection, community),
		});
	}

	const release = pub.releases?.[pub.releases.length - 1];

	if (release) {
		const releaseDoc = expect(await Doc.findByPk(release.docId));
		const releaseDocNode = Node.fromJSON(schema, releaseDoc.content);
		pubResource.summaries.push({
			kind: 'WordCount',
			value: getWordAndCharacterCountsFromDoc(releaseDocNode)[0],
			lang: 'eng',
		});
		const depositJson = pub.crossrefDepositRecord?.depositJson;
		pubResource.meta['created-date'] = expect(pub.releases?.[0]).createdAt.toString();
		if (depositJson) {
			// @ts-expect-error FIXME: Property 'deposit' does not exist on type 'object'.
			const updatedDate = depositJson.data?.attributes?.updated || depositJson.timestamp;
			const dateOfLastDeposit = new Date(updatedDate);
			const dateOfLatestRelease = new Date(release.createdAt);
			if (dateOfLastDeposit.getTime() !== dateOfLatestRelease.getTime()) {
				pubResource.meta['updated-date'] = dateOfLatestRelease.toString();
			}
		}
	}

	return pubResource;
}
