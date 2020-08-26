import React from 'react';

type Props = {
	count: number;
	index: number;
};

const PubEdgeListingCounter = (props: Props) => {
	const { index, count } = props;

	return (
		<span className="pub-edge-listing-counter-component">
			{count === 0 ? 0 : index + 1} of {count}
		</span>
	);
};
export default PubEdgeListingCounter;
