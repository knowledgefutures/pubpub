import type { DepositRecord } from 'types';

import React from 'react';

import { Button } from '@blueprintjs/core';

import InputField from '../InputField/InputField';
import { SubmitDepositStatus } from './SubmitDepositStatus';

type Props = {
	depositRecord?: DepositRecord;
	disabled?: boolean;
	error?: string;
	onClick?: () => void;
	status: SubmitDepositStatus;
};

const buttonTextByStatus = {
	[SubmitDepositStatus.Initial]: 'Preview Deposit',
	[SubmitDepositStatus.Previewing]: 'Generating Preview',
	[SubmitDepositStatus.Previewed]: 'Submit Deposit',
	[SubmitDepositStatus.Depositing]: 'Depositing',
	[SubmitDepositStatus.Deposited]: 'DOI Deposited',
};

const getButtonText = (status: SubmitDepositStatus, depositRecord?: DepositRecord) => {
	if (status === SubmitDepositStatus.Initial && depositRecord) {
		return 'Preview & Update Deposit';
	}
	if (status === SubmitDepositStatus.Previewed && depositRecord) {
		return 'Re-Submit Deposit';
	}

	return buttonTextByStatus[status];
};

export default function SubmitDepositButton(props: Props) {
	return (
		<InputField error={props.error}>
			<Button
				disabled={props.disabled || !props.onClick}
				text={getButtonText(props.status, props.depositRecord)}
				loading={
					props.status === SubmitDepositStatus.Previewing ||
					props.status === SubmitDepositStatus.Depositing
				}
				onClick={props.onClick}
				icon={props.status === SubmitDepositStatus.Deposited && 'tick'}
			/>
		</InputField>
	);
}
