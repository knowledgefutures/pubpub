import React from 'react';
import PropTypes from 'prop-types';
import dateFormat from 'dateformat';
import { NonIdealState } from '@blueprintjs/core';

import { groupPubs } from 'utils/dashboard';
import { DashboardFrame } from 'components';
import { usePageContext } from 'utils/hooks';

import OverviewBlocks from '../OverviewBlocks';
import OverviewTable from '../OverviewTable';

require('./communityOverview.scss');

const propTypes = {
	overviewData: PropTypes.object.isRequired,
};

const CommunityOverview = (props) => {
	const { overviewData } = props;
	const { communityData } = usePageContext();
	const { pubs, collections } = groupPubs(overviewData);

	return (
		<DashboardFrame
			className="community-overview-component"
			title="Overview"
			details={
				<span>
					This community was created on{' '}
					<i>{dateFormat(communityData.createdAt, 'mmmm dd, yyyy')}</i> and contains:
				</span>
			}
		>
			<OverviewBlocks collections={collections} pubs={overviewData.pubs} />
			<OverviewTable
				title="Pubs & Collections"
				collectionList={collections}
				pubList={pubs}
				emptyState={
					<NonIdealState
						icon="circle"
						title={`This Community doesn't have any content yet!`}
						description="Choose 'Create Pub' or 'Create Collection' from above to add content to your Community."
					/>
				}
			/>
		</DashboardFrame>
	);
};

CommunityOverview.propTypes = propTypes;
export default CommunityOverview;
