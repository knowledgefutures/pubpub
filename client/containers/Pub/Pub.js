import React from 'react';
import PropTypes from 'prop-types';

import { usePageContext } from 'utils/hooks';

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
import PubHeaderCompact from './PubHeader/PubHeaderCompact';

require('./pub.scss');

const propTypes = {
	pubData: PropTypes.object.isRequired,
};

const Pub = (props) => {
	const { loginData, locationData, communityData } = usePageContext();

	const renderHeader = (useFullHeader, modeProps) => {
		const { collabData, historyData, pubData, updateLocalData } = modeProps;
		if (useFullHeader) {
			return (
				<PubSuspendWhileTyping delay={1000}>
					{() => (
						<PubHeader
							pubData={pubData}
							updateLocalData={updateLocalData}
							collabData={collabData}
							historyData={historyData}
							communityData={communityData}
						/>
					)}
				</PubSuspendWhileTyping>
			);
		}
		return (
			<PubHeaderCompact
				pubData={pubData}
				locationData={locationData}
				communityData={communityData}
			/>
		);
	};

	return (
		<PubSuspendWhileTypingProvider>
			<div id="pub-container">
				<PubSyncManager
					pubData={props.pubData}
					locationData={locationData}
					communityData={communityData}
					loginData={loginData}
				>
					{({ pubData, collabData, firebaseBranchRef, updateLocalData, historyData }) => {
						// const mode = pubData.mode;
						const modeProps = {
							pubData: pubData,
							collabData: collabData,
							historyData: historyData,
							firebaseBranchRef: firebaseBranchRef,
							updateLocalData: updateLocalData,
						};
						return (
							<React.Fragment>
								{renderHeader(true, modeProps)}
								<PubDocument {...modeProps} />
								{/* mode === 'manage' && <PubManage {...modeProps} />}
								{mode === 'merge' && <PubMerge {...modeProps} />}
								{mode === 'review' && <PubReview {...modeProps} />}
								{mode === 'reviews' && <PubReviews {...modeProps} />}
								{mode === 'reviewCreate' && <PubReviewCreate {...modeProps} />}
								{mode === 'branchCreate' && <PubBranchCreate {...modeProps} /> */}
							</React.Fragment>
						);
					}}
				</PubSyncManager>
			</div>
		</PubSuspendWhileTypingProvider>
	);
};

Pub.propTypes = propTypes;
export default Pub;
