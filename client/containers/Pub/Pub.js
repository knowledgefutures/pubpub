import React from 'react';
import PropTypes from 'prop-types';

import { usePageContext } from 'utils/hooks';

import PubSyncManager from './PubSyncManager';
import PubHeader from './PubHeader';
import PubDocument from './PubDocument';

require('./pub.scss');

const propTypes = {
	pubData: PropTypes.object.isRequired,
};

const Pub = (props) => {
	const { loginData, locationData, communityData } = usePageContext();
	return (
		<div id="pub-container">
			<PubSyncManager
				pubData={props.pubData}
				locationData={locationData}
				communityData={communityData}
				loginData={loginData}
			>
				{({ pubData, collabData, firebaseBranchRef, updateLocalData, historyData }) => {
					const modeProps = {
						pubData: pubData,
						collabData: collabData,
						historyData: historyData,
						firebaseBranchRef: firebaseBranchRef,
						updateLocalData: updateLocalData,
					};
					return (
						<React.Fragment>
							<PubHeader {...modeProps} />
							<PubDocument {...modeProps} />
						</React.Fragment>
					);
				}}
			</PubSyncManager>
		</div>
	);
};

Pub.propTypes = propTypes;
export default Pub;
