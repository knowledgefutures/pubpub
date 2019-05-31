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
import PubBranchCreate from './PubBranchCreate';

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
				<PubSyncManager
					pubData={props.pubData}
					locationData={props.locationData}
					loginData={props.loginData}
				>
					{({ pubData, collabData, firebaseBranchRef, updateLocalData, historyData }) => {
						const mode = pubData.mode;
						const modeProps = {
							pubData: pubData,
							collabData: collabData,
							historyData: historyData,
							firebaseBranchRef: firebaseBranchRef,
							updateLocalData: updateLocalData,
						};

						return (
							<React.Fragment>
								<PubHeader
									pubData={pubData}
									updateLocalData={updateLocalData}
									collabData={collabData}
									historyData={historyData}
								/>
								<PubMeta
									pubData={pubData}
									updateLocalData={updateLocalData}
									collabData={collabData}
									historyData={historyData}
								/>
								{mode === 'document' && <PubDocument {...modeProps} />}
								{mode === 'submissions' && <PubSubmission {...modeProps} />}
								{mode === 'manage' && <PubManage {...modeProps} />}
								{mode === 'new branch' && <PubBranchCreate {...modeProps} />}
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
