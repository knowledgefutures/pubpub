import React from 'react';
import PropTypes from 'prop-types';
import { AnchorButton, Callout } from '@blueprintjs/core';

require('./pubMaintenanceNotice.scss');

const propTypes = {
	pubData: PropTypes.shape({
		isInMaintenanceMode: PropTypes.bool,
	}).isRequired,
};

const PubMaintenanceNotice = (props) => {
	const { pubData } = props;
	const { isInMaintenanceMode } = pubData;

	if (!isInMaintenanceMode) {
		return null;
	}

	const renderWarning = () => {
		return (
			<p>
				The PubPub team has identified a problem with this Pub and has placed it into
				read-only maintenance mode while we work to fix it. We apologize for the
				inconvenience and appreciate your patience!
			</p>
		);
	};

	const renderAction = () => {
		return <AnchorButton href="mailto:help@pubpub.org">Contact us</AnchorButton>;
	};

	return (
		<Callout
			icon="diagnosis"
			intent="warning"
			className="pub-maintenance-notice-component"
			title="This Pub is under maintenance."
		>
			{renderWarning()}
			{renderAction()}
		</Callout>
	);
};

PubMaintenanceNotice.propTypes = propTypes;
export default PubMaintenanceNotice;
