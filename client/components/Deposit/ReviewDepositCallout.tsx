import { Callout } from '@blueprintjs/core';
import React from 'react';

type Props = {
	depositTargetServiceName: string;
	depositTypeTitle?: string;
};

export default function ReviewDepositCallout(props: Props) {
	const { depositTargetServiceName, depositTypeTitle } = props;
	return (
		<Callout intent="primary" title="Preview Deposit">
			This work is being deposited as a <strong>{depositTypeTitle ?? '...'}</strong> based on
			its Connections, Primary Collection, or selected Content Version. Review the information
			below, then click the "Submit Deposit" button to submit the deposit to{' '}
			{depositTargetServiceName.charAt(0).toUpperCase() + depositTargetServiceName.slice(1)}.
		</Callout>
	);
}
