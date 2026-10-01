import type { Collection, DepositTarget, InitialCommunityData, Pub } from 'types';

import React, { useEffect, useState } from 'react';

import { Callout } from '@blueprintjs/core';

import Doi from 'client/containers/DashboardSettings/PubSettings/Doi';
import { apiFetch } from 'client/utils/apiFetch';
import {
	getFirstIntraWorkRelationship,
	type Resource,
	resourceKindToProperNoun,
} from 'deposit/resource';
import { assert, exists } from 'utils/assert';
import { PUBPUB_DOI_PREFIX } from 'utils/crossref/communities';

import DataciteDeposit from './DataciteDeposit';
import DepositStatusCallout from './DepositStatusCallout';
import './deposit.scss';

import { UpdateDoi } from './UpdateDoi';

type PubProps = {
	pub: Pub;
	updatePub: (...args: any[]) => any;
};

type CollectionProps = {
	collection: Collection;
	updateCollection: (...args: any[]) => any;
};

type Props = {
	canIssueDoi: boolean;
	communityData: InitialCommunityData;
	depositTarget?: DepositTarget;
} & (PubProps | CollectionProps);

function isSupplementTo(resource: Resource) {
	return resource.relationships.some(
		(relationship) => relationship.relation === 'Supplement' && relationship.isParent,
	);
}

function extractDoiSuffix(doi: string, depositTarget?: DepositTarget) {
	const prefix = depositTarget?.doiPrefix ?? PUBPUB_DOI_PREFIX;
	return doi.replace(`${prefix}/`, '');
}

export default function Deposit(props: Props) {
	const { depositTarget, communityData } = props;
	const isCommunityUnapproved =
		communityData.spamTag != null && communityData.spamTag.status !== 'confirmed-not-spam';
	const [resource, setResource] = useState<Resource>();
	const [doiSuffix, setDoiSuffix] = useState('');
	const [persistingDoiSuffix, setPersistingDoiSuffix] = useState(false);
	const [justSetDoi, setJustSetDoi] = useState(false);
	const doiPrefix = depositTarget?.doiPrefix;
	const fetchResource = async () => {
		if ('pub' in props) {
			await apiFetch(`/api/pubs/${props.pub.id}/resource`, { method: 'GET' }).then(
				(pubResource: Resource) => {
					const pubDoi = pubResource.identifiers.find(
						(identifier) => identifier.identifierKind === 'DOI',
					);
					const pubDoiSuffix = pubDoi?.identifierValue.split('/')[1] ?? '';
					setResource(pubResource);
					setDoiSuffix(pubDoiSuffix);
				},
			);
		} else {
			await apiFetch(`/api/collections/${props.collection.id}/resource`, {
				method: 'GET',
			}).then((collectionResource: Resource) => {
				const collectionDoi = collectionResource.identifiers.find(
					(identifier) => identifier.identifierKind === 'DOI',
				);
				const collectionDoiSuffix = collectionDoi?.identifierValue.split('/')[1] ?? '';
				setResource(collectionResource);
				setDoiSuffix(collectionDoiSuffix);
			});
		}
	};
	const persistDoi = async (doi: string) => {
		if ('pub' in props) {
			const pubData = await apiFetch(`/api/pubs`, {
				method: 'PUT',
				body: JSON.stringify({
					doi,
					pubId: props.pub.id,
					communityId: props.communityData.id,
				}),
			});
			props.updatePub(pubData);
		} else {
			const collectionData = await apiFetch(`/api/collections`, {
				method: 'PUT',
				body: JSON.stringify({
					doi,
					id: props.collection.id,
					communityId: props.communityData.id,
				}),
			});
			props.updateCollection(collectionData);
		}
		await fetchResource();
	};
	const onDelete = async () => {
		await persistDoi('');
		setDoiSuffix('');
	};
	const onGenerate = async () => {
		const params = new URLSearchParams({
			communityId: props.communityData.id,
		});

		if ('pub' in props) {
			params.append('pubId', props.pub.id);
			params.append('target', 'pub');
		} else {
			params.append('collectionId', props.collection.id);
			params.append('target', 'collection');
		}

		const { dois } = await apiFetch(`/api/generateDoi?${params.toString()}`);
		const doi = 'pub' in props ? dois.pub : dois.collection;

		setDoiSuffix(extractDoiSuffix(doi, depositTarget));
	};
	const onUpdate = (nextDoiSuffix: string) => {
		setDoiSuffix(nextDoiSuffix);
	};
	const onSave = async () => {
		const doi = `${doiPrefix}/${doiSuffix}`;
		setPersistingDoiSuffix(true);
		await persistDoi(doi);
		setPersistingDoiSuffix(false);
	};
	const onDepositSuccess = () => {
		setJustSetDoi(true);
	};

	useEffect(() => {
		fetchResource();
	}, []);

	const firstIntraWorkRelationship = resource && getFirstIntraWorkRelationship(resource);
	const disabledDueToNoReleases = 'pub' in props && props.pub.releases?.length === 0;
	// Deliberately still keyed on "a deposit exists" rather than "a deposit
	// succeeded": a failed deposit does NOT unlock the DOI suffix again. Deposit
	// state is per attempt, so a rejected *update* to a work whose DOI Crossref
	// already registered also reads as failed, and letting the suffix be edited
	// there would strand a live DOI pointing at nothing. The affordance for a
	// failure is fixing the metadata and re-submitting, not renaming the DOI.
	const crossrefDepositRecordId =
		'pub' in props
			? props.pub.crossrefDepositRecordId
			: props.collection.crossrefDepositRecordId;
	const depositRecord =
		'pub' in props ? props.pub.crossrefDepositRecord : props.collection.crossrefDepositRecord;

	let children: React.ReactNode;

	const unapprovedWarning = isCommunityUnapproved ? (
		<Callout intent="warning" style={{ marginBottom: 16 }}>
			DOI deposit is not available until your community has been approved. You may still
			preview deposits.
		</Callout>
	) : null;

	if (depositTarget?.service === 'datacite') {
		if (!exists(doiPrefix)) {
			children = (
				<Callout intent="danger">
					Unexpected error: communities that target Datacite must be configured with a
					custom DOI prefix. Please contact a PubPub administrator.
				</Callout>
			);
		} else {
			children = (
				<>
					{unapprovedWarning}
					{!justSetDoi && (
						<DepositStatusCallout
							status={depositRecord?.status}
							error={depositRecord?.error}
							lastCheckedAt={depositRecord?.lastCheckedAt}
							registrarName="DataCite"
						/>
					)}
					{'pub' in props && resource && firstIntraWorkRelationship && (
						<p>
							This Pub will be cited as a member of the{' '}
							{resourceKindToProperNoun[
								firstIntraWorkRelationship.resource.kind
							].toLowerCase()}
							, <b>{firstIntraWorkRelationship.resource.title}</b>. You can change
							this by updating the <em>Primary Collection</em> of the Pub from the
							Collections tab.
						</p>
					)}
					{disabledDueToNoReleases && (
						<Callout intent="warning">
							This Pub cannot be deposited because it has no published releases.
						</Callout>
					)}
					{resource && isSupplementTo(resource) && (
						<Callout intent="warning">
							The DOI for this Pub is not editable because it is a{' '}
							<strong>Supplement</strong> to another Pub.
						</Callout>
					)}
					{resource && (
						<UpdateDoi
							doiSuffix={doiSuffix}
							doiPrefix={doiPrefix}
							editable={
								!isSupplementTo(resource) && !crossrefDepositRecordId && !justSetDoi
							}
							loading={persistingDoiSuffix}
							onDelete={onDelete}
							onGenerate={onGenerate}
							onUpdate={onUpdate}
							onSave={onSave}
						/>
					)}
					{!disabledDueToNoReleases && !persistingDoiSuffix && (
						<DataciteDeposit
							{...props}
							onDepositSuccess={onDepositSuccess}
							canSubmit={!isCommunityUnapproved}
						/>
					)}
				</>
			);
		}
	} else {
		assert('pub' in props);
		children = (
			<>
				{unapprovedWarning}
				<Doi
					canIssueDoi={props.canIssueDoi}
					communityData={props.communityData}
					updatePubData={props.updatePub}
					pubData={props.pub}
					depositTarget={props.depositTarget}
					depositDisabled={isCommunityUnapproved}
				/>
			</>
		);
	}

	return <div className="deposit">{children}</div>;
}
