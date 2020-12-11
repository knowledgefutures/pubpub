import React, { useEffect } from 'react';

import { usePageContext } from 'utils/hooks';

import PubSyncManager from './PubSyncManager';
import PubHeader from './PubHeader';
import PubDocument from './PubDocument';
import { PubSuspendWhileTypingProvider, PubSuspendWhileTyping } from './PubSuspendWhileTyping';

require('./pub.scss');

type Props = {
	pubData: any;
};

const isInViewport = (rect: DOMRect, offsets: { top?: number; left?: number } = {}) => {
	const { top, left, bottom, right } = rect;
	const { innerWidth, innerHeight } = window;
	const { clientWidth, clientHeight } = document.documentElement;
	const { top: offsetTop, left: offsetLeft } = Object.assign({ top: 0, left: 0 }, offsets);

	return (
		top >= offsetTop &&
		left >= offsetLeft &&
		bottom <= (innerHeight || clientHeight) &&
		right <= (innerWidth || clientWidth)
	);
};

const Pub = (props: Props) => {
	const { loginData, locationData, communityData } = usePageContext();

	useEffect(() => {
		const hash = window.location.hash;

		if (hash) {
			const element = document.getElementById(hash.replace('#', ''));

			if (!element) {
				return;
			}

			setTimeout(() => {
				const rect = element.getBoundingClientRect();

				if (!isInViewport(rect, { top: 50 })) {
					document.body.scrollTop += rect.top - 50;
				}
			}, 500);
		}
	}, []);

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
									{() => <PubHeader {...modeProps} />}
								</PubSuspendWhileTyping>
								<PubDocument {...modeProps} />
							</React.Fragment>
						);
					}}
				</PubSyncManager>
			</div>
		</PubSuspendWhileTypingProvider>
	);
};
export default Pub;
