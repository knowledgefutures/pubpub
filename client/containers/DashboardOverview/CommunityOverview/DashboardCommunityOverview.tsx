import React from 'react';

import { DashboardFrame } from 'components';
import { Collection, Pub } from 'utils/types';

import CommunityItems from './CommunityItems';

type Props = {
	overviewData: {
		collections: Collection[];
		pubs: Pub[];
		includesAllPubs: boolean;
	};
};

const DashboardCommunityOverview = (props: Props) => {
	const { overviewData } = props;
	const { pubs, collections, includesAllPubs } = overviewData;
	return (
		<DashboardFrame title="Overview">
			<CommunityItems
				initialPubs={pubs}
				collections={collections}
				initiallyLoadedAllPubs={includesAllPubs}
			/>
		</DashboardFrame>
	);
};

export default DashboardCommunityOverview;
