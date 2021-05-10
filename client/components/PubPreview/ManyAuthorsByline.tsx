import React from 'react';

import Byline, { BylineProps } from 'components/Byline/Byline';
import { naivePluralize } from 'utils/strings';
import { getAllPubContributors } from 'utils/contributors';
import { Pub } from 'types';

require('./manyAuthorsByline.scss');

type Props = Omit<BylineProps, 'contributors'> & {
	pubData: Pub;
	isExpanded: boolean;
	truncateAt: number;
};

const ManyAuthorsByline = (props: Props) => {
	const { pubData, truncateAt, isExpanded, ...restProps } = props;
	const authors = getAllPubContributors(pubData, false, true);
	const isTruncating = authors.length > truncateAt;

	if (authors.length === 0) {
		return null;
	}

	if (isExpanded && isTruncating) {
		return (
			<>
				<Byline
					contributors={authors}
					bylinePrefix={`by ${authors.length} ${naivePluralize(
						'author',
						authors.length,
					)}: `}
					renderUserLabel={(user, index) => `(${index + 1}) ${user.fullName}`}
					linkToUsers={false}
				/>
			</>
		);
	}
	return (
		<Byline
			contributors={authors}
			renderTruncation={(n) => `${n} more`}
			truncateAt={truncateAt}
			{...restProps}
		/>
	);
};
export default ManyAuthorsByline;
