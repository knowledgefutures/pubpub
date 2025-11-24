import type { AttributionWithUser } from 'types';

import React from 'react';

import { Icon, Tooltip } from '@blueprintjs/core';

import Byline, { type BylineProps } from 'components/Byline/Byline';
import { usePageContext } from 'utils/hooks';

// Review Note; I bet there's a better way to do this?
type Props = Omit<BylineProps, 'contributors'> & {
	contributors: AttributionWithUser[];
};

const sortContributorsByLastName = (contributors) => {
	return contributors.sort((last, next) => {
		if (last.user.lastName === next.user.lastName) {
			return last.user.firstName - next.user.firstName;
		}
		if (last.user.lastName > next.user.lastName) {
			return 1;
		}
		return -1;
	});
};

const WithinCommunityByline = (props: Props) => {
	const { communityData } = usePageContext();
	const { contributors } = props;
	let { bylinePrefix } = props;
	// TODO: Add function to get the sort option from community settings, and add other sort options
	const sortedContributors =
		communityData.id === '1a71ef4d-f6fe-40d3-8379-42fa2141db58'
			? sortContributorsByLastName(contributors)
			: contributors;
	bylinePrefix =
		communityData.id === '1a71ef4d-f6fe-40d3-8379-42fa2141db58'
			? (bylinePrefix = (
					<Tooltip
						content="Contributors (A-Z)"
						children={
							<Icon iconSize={12} icon="sort-alphabetical" className="byline-icon" />
						}
					/>
				))
			: bylinePrefix;
	return <Byline {...props} bylinePrefix={bylinePrefix} contributors={sortedContributors} />;
};
export default WithinCommunityByline;
