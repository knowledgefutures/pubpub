import React from 'react';
import PropTypes from 'prop-types';

import { Byline } from 'components';
import { naivePluralize } from 'utils/strings';
import { getAllPubContributors } from 'utils/pub/contributors';

require('./manyAuthorsByline.scss');

const propTypes = {
	pubData: PropTypes.shape({
		attributions: PropTypes.array,
	}).isRequired,
	isExpanded: PropTypes.bool.isRequired,
	truncateAt: PropTypes.number.isRequired,
};

const ManyAuthorsByline = (props) => {
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

ManyAuthorsByline.propTypes = propTypes;
export default ManyAuthorsByline;
