import React from 'react';
import { Tooltip, Classes } from '@blueprintjs/core';

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
		<>
			<React.Fragment>
				<Tooltip content={copy}>
					<span className={Classes.TOOLTIP_INDICATOR}>{children}</span>
				</Tooltip>
			</React.Fragment>
		</>
	);
};

export default PrimaryCollectionExplanation;
