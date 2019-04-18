import React from 'react';
import PageWrapper from 'components/PageWrapper/PageWrapper';
import { hydrateWrapper } from 'utils';
import { communityDataProps, locationDataProps, loginDataProps } from 'types/base';
import { pubDataProps } from 'types/pub';
import PubSyncManager from './PubSyncManager';
import PubHeader from './PubHeader';
import PubDocument from './PubDocument';
import PubSubmission from './PubSubmission';
import PubMeta from './PubMeta';
import PubManage from './PubManage';

require('./pub.scss');

const propTypes = {
	communityData: communityDataProps.isRequired,
	loginData: loginDataProps.isRequired,
	locationData: locationDataProps.isRequired,
	pubData: pubDataProps.isRequired,
};

const Pub = (props) => {
	return (
		<div id="pub-new-container">
			<PageWrapper
				locationData={props.locationData}
				communityData={props.communityData}
				loginData={props.loginData}
			>
				<PubSyncManager pubData={props.pubData}>
					{({ pubData, collabData, firebaseBranchRef, updateLocalData }) => {
						const mode = pubData.mode;
						const modeProps = {
							pubData: pubData,
							collabData: collabData,
							firebaseBranchRef: firebaseBranchRef,
							updateLocalData: updateLocalData,
						};

						return (
							<React.Fragment>
								<PubHeader pubData={pubData} updateLocalData={updateLocalData} />
								<PubMeta pubData={pubData} updateLocalData={updateLocalData} />
								{mode === 'document' && <PubDocument {...modeProps} />}
								{mode === 'submission' && <PubSubmission {...modeProps} />}
								{mode === 'manage' && <PubManage {...modeProps} />}
							</React.Fragment>
						);
					}}
				</PubSyncManager>
			</PageWrapper>
		</div>
	);
};

Pub.propTypes = propTypes;
export default Pub;

hydrateWrapper(Pub);
