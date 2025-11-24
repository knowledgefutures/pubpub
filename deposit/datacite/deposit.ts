import type { Resource } from 'deposit/resource';
import type { Collection, Pub } from 'server/models';
import type { DefinitelyHas } from 'types';

import { renderXml } from '@pubpub/deposit-utils/datacite';

import { getCommunityDepositTarget } from 'server/depositTarget/queries';
import { persistCrossrefDepositRecord, persistDoiData } from 'server/doi/queries';
import { expect } from 'utils/assert';

import {
	createDataciteDoiWithMetadata,
	createDeposit,
	hasDataciteDoiMetadata,
	updateDataciteDoiMetadata,
} from './index';

type Scope = DefinitelyHas<Collection, 'community'> | DefinitelyHas<Pub, 'community'>;

export function loadScopeResourceMeta(scope: Scope, scopeResource: Resource, scopeDoi: string) {
	scopeResource.identifiers.push({
		identifierKind: 'DOI',
		identifierValue: scopeDoi,
	});
	scopeResource.meta.publisher = scope.community.publishAs || 'PubPub';
}

const R_MISSING_ELEMENT =
	/Missing child element.*\{http:\/\/datacite.org\/schema\/kernel-4\}(\w+).*\)./;
const dataciteEntityToPubPubNoun = {
	creator: 'byline contributor',
};

export async function prepareResource(scope: Scope, scopeResource: Resource, scopeDoi: string) {
	loadScopeResourceMeta(scope, scopeResource, scopeDoi);
	const resourceAst = createDeposit(scopeResource);
	try {
		const resourceXml = await renderXml(resourceAst);
		return { resourceAst, resourceXml };
	} catch (error) {
		const matches = (error as Error).message?.match(R_MISSING_ELEMENT);
		if (matches) {
			const dataciteEntity = matches[1];
			throw new Error(
				`Datacite deposits require at least one ${
					dataciteEntityToPubPubNoun[dataciteEntity] ?? dataciteEntity
				}.`,
			);
		}
		throw error;
	}
}

export async function submitResource(
	scope: Scope,
	scopeResource: Resource,
	scopeDoi: string,
	requestIds: { pubId: string } | { collectionId: string },
) {
	const depositTarget = expect(await getCommunityDepositTarget(scope.communityId, true));
	const { resourceXml, resourceAst } = await prepareResource(scope, scopeResource, scopeDoi);
	const { identifierValue: resourceUrl } = expect(
		scopeResource.identifiers.find((identifier) => identifier.identifierKind === 'URL'),
	);
	const hasExistingMetadata = await hasDataciteDoiMetadata(scopeDoi, depositTarget);
	const depositResult = await (hasExistingMetadata
		? updateDataciteDoiMetadata
		: createDataciteDoiWithMetadata)(resourceXml, resourceUrl, scopeDoi, depositTarget);
	if (depositResult.errors?.length > 0) {
		throw new Error('An unexpected error occurred when submitting the deposit to DataCite');
	}
	await Promise.all([
		persistDoiData(
			requestIds,
			'pubId' in requestIds ? { pub: scopeDoi } : { collection: scopeDoi },
		),
		persistCrossrefDepositRecord(requestIds, depositResult),
	]);
	return { depositResult, resourceAst };
}
