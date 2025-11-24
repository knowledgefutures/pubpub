/** @jsx x */
/** @jsxFrag null */

import type { DepositTarget } from 'types';

import { x } from '@pubpub/deposit-utils/datacite';

import {
	getIdentifier,
	getIdentifierValue,
	isInterWorkRelationship,
	isIntraWorkRelationship,
	type Resource,
	type ResourceContribution,
	type ResourceContributorRole,
	type ResourceDescriptor,
	type ResourceKind,
	type ResourceRelation,
	type ResourceRelationship,
	type ResourceSummaryKind,
} from 'deposit/resource';
import { exists, expect } from 'utils/assert';
import { aes256Decrypt } from 'utils/crypto';
import { ORCID_PATTERN } from 'utils/orcid';

function transformResourceKindToDataciteResourceType(kind: ResourceKind) {
	switch (kind) {
		case 'Book':
			return 'Book';
		case 'BookChapter':
			return 'BookChapter';
		case 'Conference':
		case 'ConferenceProceeding':
			return 'ConferenceProceeding';
		case 'ConferencePaper':
			return 'ConferencePaper';
		case 'Journal':
		case 'JournalIssue':
			return 'Journal';
		case 'JournalArticle':
			return 'JournalArticle';
		case 'Preprint':
			return 'Preprint';
		default:
			return 'Other';
	}
}

function transformResourceDescriptionKindToDataciteDescriptionType(kind: ResourceDescriptor) {
	switch (kind) {
		case 'Process':
			return 'Methods';
		case 'Mechanism':
			return 'TechnicalInfo';
		default:
			return 'Other';
	}
}

function transformResourceSummaryKindToDataciteDescriptionType(kind: ResourceSummaryKind) {
	switch (kind) {
		case 'Synopsis':
			return 'Abstract';
		default:
			return 'Other';
	}
}

function transformResourceContributorRoleToDataciteContributorType(role: ResourceContributorRole) {
	switch (role) {
		case 'Editor':
			return 'Editor';
		default:
			return 'Other';
	}
}

function transformResourceRelationToDataciteRelationType(
	relation: ResourceRelation,
	isParent: boolean,
) {
	switch (relation) {
		case 'Review':
			return isParent ? 'Reviews' : 'IsReviewedBy';
		case 'Reply':
		case 'Comment':
			return isParent ? 'References' : 'IsReferencedBy';
		case 'Preprint':
			return isParent ? 'IsPreviousVersionOf' : 'IsNewVersionOf';
		case 'Supplement':
			return isParent ? 'IsSupplementTo' : 'IsSupplementedBy';
		case 'Translation':
			return isParent ? 'IsVariantFormOf' : 'IsOriginalFormOf';
		case 'Version':
			return isParent ? 'IsVersionOf' : 'HasVersion';
		case 'Part':
			return isParent ? 'IsPartOf' : 'HasPart';
		case 'Publication':
			return isParent ? 'IsPublishedIn' : 'HasPart';
		default:
			throw new Error('Invalid resource relation type');
	}
}

function renderCreator(contribution: ResourceContribution) {
	const orcidMatches = contribution.contributor.orcid?.match(ORCID_PATTERN);
	const orcid = orcidMatches?.[0];
	return (
		<creator>
			<creatorName>{contribution.contributor.name}</creatorName>
			{orcid ? (
				// @ts-expect-error
				<nameIdentifier schemeURI="https://orcid.org/" nameIdentifierScheme="ORCID">
					{orcid}
					{/* @ts-expect-error */}
				</nameIdentifier>
			) : undefined}
			{contribution.contributorAffiliation ? (
				// @ts-expect-error
				<affiliation>{contribution.contributorAffiliation}</affiliation>
			) : undefined}
		</creator>
	);
}

function renderContributor(contribution: ResourceContribution) {
	const orcidMatches = contribution.contributor.orcid?.match(ORCID_PATTERN);
	const orcid = orcidMatches?.[0];
	return (
		<contributor
			contributorType={transformResourceContributorRoleToDataciteContributorType(
				contribution.contributorRole,
			)}
		>
			<contributorName>{contribution.contributor.name}</contributorName>
			{orcid ? (
				// @ts-expect-error
				<nameIdentifier schemeURI="https://orcid.org/" nameIdentifierScheme="ORCID">
					{orcid}
					{/* @ts-expect-error */}
				</nameIdentifier>
			) : undefined}
			{contribution.contributorAffiliation ? (
				// @ts-expect-error
				<affiliation>{contribution.contributorAffiliation}</affiliation>
			) : undefined}
		</contributor>
	);
}

function renderRelatedItem(relationship: ResourceRelationship) {
	const identifier = expect(
		getIdentifier(relationship.resource, 'DOI') ?? getIdentifier(relationship.resource, 'URL'),
	);
	return (
		<relatedItem
			relatedItemType={transformResourceKindToDataciteResourceType(
				relationship.resource.kind,
			)}
			relationType={transformResourceRelationToDataciteRelationType(
				relationship.relation,
				relationship.isParent,
			)}
		>
			<relatedItemIdentifier relatedItemIdentifierType={identifier.identifierKind}>
				{identifier.identifierValue}
			</relatedItemIdentifier>
			<titles>
				<title>{relationship.resource.title}</title>
			</titles>
		</relatedItem>
	);
}

function renderRelatedIdentifier(relationship: ResourceRelationship) {
	const identifier = relationship.resource.identifiers[0];
	return (
		<relatedIdentifier
			relatedIdentifierType={identifier.identifierKind}
			resourceTypeGeneral={transformResourceKindToDataciteResourceType(
				relationship.resource.kind,
			)}
			relationType={transformResourceRelationToDataciteRelationType(
				relationship.relation,
				relationship.isParent,
			)}
		>
			{identifier.identifierValue}
		</relatedIdentifier>
	);
}

export function createDeposit(resource: Resource) {
	const wordCount = resource.summaries.find((summary) => summary.kind === 'WordCount');
	const publisher = expect(resource.meta.publisher);
	const createdDate = expect(resource.meta['created-date']);
	const updatedDate = resource.meta['updated-date'];
	const url = expect(getIdentifierValue(resource, 'URL'));
	const doi = expect(getIdentifierValue(resource, 'DOI'));
	const issn = getIdentifierValue(resource, 'ISSN');
	const eissn = getIdentifierValue(resource, 'EISSN');
	const isbn = getIdentifierValue(resource, 'ISBN');
	return (
		<resource xmlns="http://datacite.org/schema/kernel-4">
			<resourceType
				resourceTypeGeneral={transformResourceKindToDataciteResourceType(resource.kind)}
			/>
			<publisher>{publisher}</publisher>
			<publicationYear>{new Date(resource.timestamp).getUTCFullYear()}</publicationYear>
			<identifier identifierType="DOI">{doi}</identifier>
			<titles>
				<title xml:lang="en-US">{resource.title}</title>
			</titles>
			<subjects />
			<dates>
				<date dateType="Created">{createdDate}</date>
				{exists(updatedDate) ? <date dateType="Updated">{updatedDate}</date> : undefined}
			</dates>
			<descriptions>
				{resource.descriptions.map((description) => (
					<description
						xml:lang="en-US"
						descriptionType={transformResourceDescriptionKindToDataciteDescriptionType(
							description.kind,
						)}
					/>
				))}
				{resource.summaries
					.filter((summary) => summary.kind !== 'WordCount')
					.map((summary) => (
						<description
							xml:lang="en-US"
							descriptionType={transformResourceSummaryKindToDataciteDescriptionType(
								summary.kind,
							)}
						/>
					))}
			</descriptions>
			<creators>
				{resource.contributions
					.filter((contribution) => contribution.isAttribution)
					.map(renderCreator)}
			</creators>
			<contributors>
				{resource.contributions
					.filter((contribution) => !contribution.isAttribution)
					.map(renderContributor)}
			</contributors>
			<sizes>{wordCount ? <size>{`${wordCount.value} words`}</size> : undefined}</sizes>
			<alternateIdentifiers>
				<alternateIdentifier
					// @ts-expect-error
					alternateIdentifierType="URL"
				>
					{url}
				</alternateIdentifier>
			</alternateIdentifiers>
			<relatedItems>
				{resource.relationships.filter(isIntraWorkRelationship).map(renderRelatedItem)}
			</relatedItems>
			<relatedIdentifiers>
				{resource.relationships
					.filter(isInterWorkRelationship)
					.map(renderRelatedIdentifier)}
				{issn ? (
					<relatedIdentifier
						resourceTypeGeneral="Journal"
						relationType="IsPartOf"
						relatedIdentifierType="ISSN"
					>
						{issn}
					</relatedIdentifier>
				) : undefined}
				{eissn ? (
					<relatedIdentifier
						resourceTypeGeneral="Journal"
						relationType="IsPartOf"
						relatedIdentifierType="EISSN"
					>
						{eissn}
					</relatedIdentifier>
				) : undefined}
				{isbn ? (
					<relatedIdentifier
						resourceTypeGeneral="Book"
						relationType="IsPartOf"
						relatedIdentifierType="ISBN"
					>
						{isbn}
					</relatedIdentifier>
				) : undefined}
			</relatedIdentifiers>
			<version>1.0</version>
			<formats>
				<format>text/html</format>
			</formats>
			<language>en-US</language>
			<rightsList>
				<rights xml:lang="en-US" rightsURI={resource.license.uri}>
					{resource.license.spdxIdentifier}
				</rights>
			</rightsList>
		</resource>
	);
}

function encodeDataciteCredentials(depositTarget: DepositTarget) {
	const { username, password, passwordInitVec } = depositTarget;
	const rawPassword = aes256Decrypt(
		expect(password),
		expect(process.env.AES_ENCRYPTION_KEY),
		expect(passwordInitVec),
	);
	return Buffer.from(`${username}:${rawPassword}`).toString('base64');
}

export async function getDataciteDoiMetadata(resourceDoi: string, depositTarget: DepositTarget) {
	const encodedCredentials = encodeDataciteCredentials(depositTarget);
	const response = await fetch(expect(process.env.DATACITE_DEPOSIT_URL) + `/${resourceDoi}`, {
		method: 'GET',
		headers: {
			'Content-Type': 'application/vnd.api+json',
			Authorization: 'Basic ' + encodedCredentials,
		},
	});
	return response.ok ? response.json() : null;
}

export async function hasDataciteDoiMetadata(resourceDoi: string, depositTarget: DepositTarget) {
	try {
		const metadata = await getDataciteDoiMetadata(resourceDoi, depositTarget);
		return Boolean(metadata?.data);
	} catch {
		return false;
	}
}

export async function createDataciteDoiWithMetadata(
	resourceXml: string,
	resourceUrl: string,
	resourceDoi: string,
	depositTarget: DepositTarget,
) {
	const encodedXml = Buffer.from(resourceXml).toString('base64');
	const encodedCredentials = encodeDataciteCredentials(depositTarget);
	const body = {
		data: {
			id: resourceDoi,
			type: 'dois',
			attributes: { event: 'publish', doi: resourceDoi, url: resourceUrl, xml: encodedXml },
		},
	};
	const response = await fetch(expect(process.env.DATACITE_DEPOSIT_URL), {
		method: 'POST',
		headers: {
			'Content-Type': 'application/vnd.api+json',
			Authorization: 'Basic ' + encodedCredentials,
		},
		body: JSON.stringify(body),
	});
	return response.json();
}

export async function updateDataciteDoiMetadata(
	resourceXml: string,
	resourceUrl: string,
	resourceDoi: string,
	depositTarget: DepositTarget,
) {
	const encodedXml = Buffer.from(resourceXml).toString('base64');
	const encodedCredentials = encodeDataciteCredentials(depositTarget);
	const body = {
		data: {
			id: resourceDoi,
			type: 'dois',
			attributes: { event: 'publish', doi: resourceDoi, url: resourceUrl, xml: encodedXml },
		},
	};
	const response = await fetch(expect(process.env.DATACITE_DEPOSIT_URL) + `/${resourceDoi}`, {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/vnd.api+json',
			Authorization: 'Basic ' + encodedCredentials,
		},
		body: JSON.stringify(body),
	});
	return response.json();
}
