import React from 'react';
import PageWrapper from 'components/PageWrapper/PageWrapper';
import { hydrateWrapper } from 'utils';
import { communityDataProps, locationDataProps, loginDataProps } from 'types/base';
import { pubDataProps } from 'types/pub';
import PubSyncManager from './PubSyncManager';
import PubHeader from './PubHeader';
import PubDocument from './PubDocument';
import PubMerge from './PubMerge';
import PubManage from './PubManage';
import PubReviewCreate from './PubReviewCreate';
import PubReviews from './PubReviews';
import PubReview from './PubReview';
import PubBranchCreate from './PubBranchCreate';
import { PubSuspendWhileTypingProvider, PubSuspendWhileTyping } from './PubSuspendWhileTyping';

require('./pub.scss');

const propTypes = {
	communityData: communityDataProps.isRequired,
	loginData: loginDataProps.isRequired,
	locationData: locationDataProps.isRequired,
	pubData: pubDataProps.isRequired,
};

const Pub = (props) => {
	return (
		<PubSuspendWhileTypingProvider>
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
						{({
							pubData,
							collabData,
							firebaseBranchRef,
							updateLocalData,
							historyData,
						}) => {
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
									<PubSuspendWhileTyping delay={1000}>
										{() => (
											<PubHeader
												pubData={pubData}
												updateLocalData={updateLocalData}
												collabData={collabData}
												historyData={historyData}
											/>
										)}
									</PubSuspendWhileTyping>
									{mode === 'document' && <PubDocument {...modeProps} />}
									{mode === 'manage' && <PubManage {...modeProps} />}
									{mode === 'merge' && <PubMerge {...modeProps} />}
									{mode === 'review' && <PubReview {...modeProps} />}
									{mode === 'reviews' && <PubReviews {...modeProps} />}
									{mode === 'reviewCreate' && <PubReviewCreate {...modeProps} />}
									{mode === 'branchCreate' && <PubBranchCreate {...modeProps} />}
								</React.Fragment>
							);
						}}
					</PubSyncManager>
				</PageWrapper>
			</div>
		</PubSuspendWhileTypingProvider>
	);
};

Pub.propTypes = propTypes;
export default Pub;

hydrateWrapper(Pub);
