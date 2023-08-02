import { Callout } from '@blueprintjs/core';
import Doi from 'client/containers/DashboardSettings/PubSettings/Doi';
import { apiFetch } from 'client/utils/apiFetch';
import {
	getFirstIntraWorkRelationship,
	Resource,
	resourceKindToProperNoun,
} from 'deposit/resource';
import React, { useEffect, useState } from 'react';
import { Collection, DepositTarget, InitialCommunityData, Pub } from 'types';
import { assert, exists } from 'utils/assert';
import { PUBPUB_DOI_PREFIX } from 'utils/crossref/communities';
import DataciteDeposit from './DataciteDeposit';
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
	const { depositTarget } = props;
	const [resource, setResource] = useState<Resource>();
	const [doiSuffix, setDoiSuffix] = useState('');
	const [persistingDoiSuffix, setPersistingDoiSuffix] = useState(false);
	const [justSetDoi, setJustSetDoi] = useState(false);
	const doiPrefix = depositTarget?.doiPrefix;
	const fetchResource = async () => {
		if ('pub' in props) {
			await apiFetch(`/api/pub/${props.pub.id}/resource`, { method: 'GET' }).then(
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
			await apiFetch(`/api/collection/${props.collection.id}/resource`, {
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

	useEffect(
		() => {
			fetchResource();
		},
		/* eslint-disable-next-line react-hooks/exhaustive-deps */
		[],
	);

	const firstIntraWorkRelationship = resource && getFirstIntraWorkRelationship(resource);
	const disabledDueToNoReleases = 'pub' in props && props.pub.releases?.length === 0;
	const crossrefDepositRecordId =
		'pub' in props
			? props.pub.crossrefDepositRecordId
			: props.collection.crossrefDepositRecordId;

	let children: React.ReactNode;

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
						<DataciteDeposit {...props} onDepositSuccess={onDepositSuccess} />
					)}
				</>
			);
		}
	} else {
		assert('pub' in props);
		children = (
			<Doi
				canIssueDoi={props.canIssueDoi}
				communityData={props.communityData}
				updatePubData={props.updatePub}
				pubData={props.pub}
				depositTarget={props.depositTarget}
			/>
		);
	}

	return <div className="deposit">{children}</div>;
}
