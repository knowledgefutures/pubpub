import React from 'react';

import { Byline } from 'components';
import { naivePluralize } from 'utils/strings';
import { getAllPubContributors } from 'utils/pub/contributors';

require('./manyAuthorsByline.scss');

type Props = {
	pubData: {
		attributions?: any[];
	};
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
					// @ts-expect-error ts-migrate(2322) FIXME: Type 'any[]' is not assignable to type 'never'.
					contributors={authors}
					// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'never'.
					bylinePrefix={`by ${authors.length} ${naivePluralize(
						'author',
						authors.length,
					)}: `}
					// @ts-expect-error ts-migrate(2322) FIXME: Type '(user: any, index: any) => string' is not as... Remove this comment to see the full error message
					renderUserLabel={(user, index) => `(${index + 1}) ${user.fullName}`}
					// @ts-expect-error ts-migrate(2322) FIXME: Type 'false' is not assignable to type 'never'.
					linkToUsers={false}
				/>
			</>
		);
	}
	return (
		<Byline
			// @ts-expect-error ts-migrate(2322) FIXME: Type 'any[]' is not assignable to type 'never'.
			contributors={authors}
			// @ts-expect-error ts-migrate(2322) FIXME: Type '(n: any) => string' is not assignable to typ... Remove this comment to see the full error message
			renderTruncation={(n) => `${n} more`}
			// @ts-expect-error ts-migrate(2322) FIXME: Type 'number' is not assignable to type 'never'.
			truncateAt={truncateAt}
			{...restProps}
		/>
	);
};
export default ManyAuthorsByline;
