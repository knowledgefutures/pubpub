import React from 'react';
import PropTypes from 'prop-types';
import { AnchorButton } from '@blueprintjs/core';
import { usePageContext } from 'utils/hooks';

require('./contentOverview.scss');

const propTypes = {
	overviewData: PropTypes.object.isRequired,
};

const ContentOverview = (props) => {
	const { overviewData } = props;
	const { scopeData } = usePageContext();
	const { activePub } = scopeData;
	return (
		<div className="pub-overview-component">
			<div className="dashboard-content-header">
				<div className="name">Overview</div>
				<div className="buttons">
					<AnchorButton text="Go to Pub" href={`/pub/${activePub.slug}`} />
				</div>
			</div>
		</div>
	);
};

ContentOverview.propTypes = propTypes;
export default ContentOverview;
