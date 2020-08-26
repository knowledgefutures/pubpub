import React from 'react';
import dateFormat from 'dateformat';
import { NonIdealState } from '@blueprintjs/core';

import { groupPubs } from 'utils/dashboard';
import { DashboardFrame } from 'components';
import { usePageContext } from 'utils/hooks';

import OverviewBlocks from '../OverviewBlocks';
import OverviewTable from '../OverviewTable';

require('./communityOverview.scss');

type Props = {
	overviewData: any;
};

const CommunityOverview = (props: Props) => {
	const { overviewData } = props;
	const { communityData } = usePageContext();
	const { pubs, collections } = groupPubs(overviewData);

	return (
		// @ts-expect-error ts-migrate(2746) FIXME: This JSX tag's 'children' prop expects a single ch... Remove this comment to see the full error message
		<DashboardFrame
			// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'never'.
			className="community-overview-component"
			// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'never'.
			title="Overview"
			// @ts-expect-error ts-migrate(2322) FIXME: Type 'Element' is not assignable to type 'never'.
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
export default CommunityOverview;
