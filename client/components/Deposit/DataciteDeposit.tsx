import { Callout } from '@blueprintjs/core';
import React, { useCallback, useEffect, useState } from 'react';

import { assert, expect } from 'utils/assert';
import { apiFetch } from 'client/utils/apiFetch';
import { Collection, Pub } from 'types';

import { DataciteDepositPreview, DepositNode } from './DataciteDepositPreview';
import SubmitDepositButton from './SubmitDepositButton';
import { SubmitDepositStatus } from './SubmitDepositStatus';
import ReviewDepositCallout from './ReviewDepositCallout';

import './dataciteDeposit.scss';

type Props = ({ pub: Pub } | { collection: Collection }) & {
	onDepositSuccess(): void;
	canSubmit?: boolean;
};

const getDepositTypeTitle = (deposit: DepositNode) => {
	assert('attributes' in deposit);
	const resourceType = expect(
		deposit.children.find((child) => 'attributes' in child && child.name === 'resourceType'),
	);
	assert('attributes' in resourceType);
	return (expect(resourceType.attributes.resourceTypeGeneral) as string)
		.replace(/([A-Z])/g, ' $1')
		.trim();
};

export default function DataciteDeposit(props: Props) {
	const { onDepositSuccess } = props;
	const [deposit, setDeposit] = useState<DepositNode>();
	const [error, setError] = useState<string>();
	const [status, setStatus] = useState(SubmitDepositStatus.Initial);
	const baseUrl =
		'pub' in props
			? `/api/pub/${props.pub.id}/doi`
			: `/api/collection/${props.collection.id}/doi`;
	const fetchDepositPreview = useCallback(
		() =>
			apiFetch(`${baseUrl}/preview`, { method: 'POST' })
				.then((json) => {
					setStatus(SubmitDepositStatus.Previewed);
					setDeposit(json);
				})
				.catch((response) => {
					setStatus(SubmitDepositStatus.Initial);
					setError(response.error);
				}),
		[baseUrl],
	);
	const submitDeposit = useCallback(
		() =>
			apiFetch(`${baseUrl}`, { method: 'POST' })
				.then((json) => {
					setDeposit(json);
					setStatus(SubmitDepositStatus.Deposited);
					onDepositSuccess();
				})
				.catch((response) => {
					setStatus(SubmitDepositStatus.Previewed);
					setError(response.error);
				}),
		[baseUrl, onDepositSuccess],
	);
	const handleDepositClick = useCallback(() => {
		switch (status) {
			case SubmitDepositStatus.Initial:
				setError(undefined);
				setStatus(SubmitDepositStatus.Previewing);
				fetchDepositPreview();
				break;
			case SubmitDepositStatus.Previewed:
				setError(undefined);
				setStatus(SubmitDepositStatus.Depositing);
				submitDeposit();
				break;
			default:
				break;
		}
	}, [status, fetchDepositPreview, submitDeposit]);
	const depositRecord =
		'pub' in props ? props.pub.crossrefDepositRecord : props.collection.crossrefDepositRecord;
	const pub = 'pub' in props ? props.pub : undefined;

	useEffect(() => {
		if (pub && pub.releases.length > 0) {
			fetchDepositPreview();
		}
	}, [pub, fetchDepositPreview]);

	return (
		<div className="datacite-deposit">
			{deposit && (
				<ReviewDepositCallout
					depositTypeTitle={getDepositTypeTitle(deposit)}
					depositTargetServiceName="Datacite"
				/>
			)}
			{deposit && <DataciteDepositPreview deposit={deposit} />}
			{error && (
				<Callout intent="danger" title="Deposit Error">
					<p>{error}</p>
				</Callout>
			)}
			<SubmitDepositButton
				onClick={handleDepositClick}
				status={status}
				depositRecord={depositRecord}
				disabled={
					status === SubmitDepositStatus.Previewing ||
					status === SubmitDepositStatus.Depositing ||
					status === SubmitDepositStatus.Deposited ||
					(props.canSubmit === false && status === SubmitDepositStatus.Previewed)
				}
			/>
		</div>
	);
}
