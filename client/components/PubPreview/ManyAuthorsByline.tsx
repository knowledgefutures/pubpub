import React from 'react';

import { BylineProps } from 'components/Byline/Byline';
import { getAllPubContributors } from 'utils/contributors';
import { Pub } from 'types';
import WithinCommunityByline from '../WithinCommunityByline/WithinCommunityByline';

require('./manyAuthorsByline.scss');

type Props = Omit<BylineProps, 'contributors'> & {
	pubData: Pub;
	isExpanded: boolean;
	truncateAt: number;
};

const ManyAuthorsByline = (props: Props) => {
	const { pubData, truncateAt, isExpanded, ...restProps } = props;
	const authors = getAllPubContributors(pubData, 'contributors', false, true);
	const isTruncating = authors.length > truncateAt;

	if (authors.length === 0) {
		return null;
	}

	if (isExpanded && isTruncating) {
		return <WithinCommunityByline contributors={authors} linkToUsers={false} />;
	}
	return (
		<WithinCommunityByline
			contributors={authors}
			renderTruncation={(n) => `${n} more`}
			truncateAt={truncateAt}
			{...restProps}
		/>
	);
};
export default ManyAuthorsByline;
