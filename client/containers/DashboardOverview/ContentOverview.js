import React from 'react';
import PropTypes from 'prop-types';

import { usePageContext } from 'utils/hooks';

import CollectionOverview from './CollectionOverview';
import CommunityOverview from './CommunityOverview';

require('./contentOverview.scss');

const propTypes = {
	overviewData: PropTypes.object.isRequired,
};

const ContentOverview = (props) => {
	const { overviewData } = props;
	const {
		scopeData: {
			elements: { activeTargetType },
		},
	} = usePageContext();

	if (activeTargetType === 'community') {
		return <CommunityOverview overviewData={overviewData} />;
	}
	if (activeTargetType === 'collection') {
		return <CollectionOverview overviewData={overviewData} />;
	}
	return null;
};

ContentOverview.propTypes = propTypes;
export default ContentOverview;
