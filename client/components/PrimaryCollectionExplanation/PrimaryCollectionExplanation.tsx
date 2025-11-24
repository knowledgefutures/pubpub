import React from 'react';

import { Classes, Tooltip } from '@blueprintjs/core';

type Props = {
	children?: React.ReactNode;
};

const copy = (
	<>
		A Pub can belong to many Collections, but its Primary Collection is the most important one.
		It is associated with the Pub in metadata, PDF exports, and more.
	</>
);

const PrimaryCollectionExplanation = (props: Props) => {
	const { children = 'Primary Collection' } = props;
	return (
		<Tooltip content={copy}>
			<span className={Classes.TOOLTIP_INDICATOR}>{children}</span>
		</Tooltip>
	);
};

export default PrimaryCollectionExplanation;
