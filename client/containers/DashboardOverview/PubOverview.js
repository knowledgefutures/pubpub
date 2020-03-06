import React from 'react';
import PropTypes from 'prop-types';
import { AnchorButton } from '@blueprintjs/core';

import { DashboardFrame, SettingsSection } from 'components';
import { usePageContext } from 'utils/hooks';

require('./contentOverview.scss');

const propTypes = {
	overviewData: PropTypes.object.isRequired,
};

const PubOverview = (props) => {
	const { overviewData } = props;
	const { scopeData } = usePageContext();
	const { activePub } = scopeData.elements;
	return (
		<DashboardFrame className="pub-overview-component" title="Overview">
			<SettingsSection title="Pub title" />
		</DashboardFrame>
	);
};

ContentOverview.propTypes = propTypes;
export default ContentOverview;
