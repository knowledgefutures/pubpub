import React from 'react';

import { PubPageData } from 'types';

import PubHeader from './PubHeader';
import SpubHeader from './SpubHeader';
import PubDocument from './PubDocument';
import { usePubContext } from './pubHooks';
import { PubContextProvider } from './PubContextProvider';
import { PubSuspendWhileTypingProvider, PubSuspendWhileTyping } from './PubSuspendWhileTyping';

require('./pub.scss');

type Props = {
	pubData: PubPageData;
};

const SomePubHeader = () => {
	const pubContext = usePubContext();
	const { submissionState } = pubContext;
	const HeaderComponent = submissionState ? SpubHeader : PubHeader;
	return <PubSuspendWhileTyping delay={1000}>{() => <HeaderComponent />}</PubSuspendWhileTyping>;
};

const Pub = (props: Props) => {
	const { pubData } = props;

	return (
		<div id="pub-container">
			<PubContextProvider pubData={pubData}>
				<PubSuspendWhileTypingProvider>
					<SomePubHeader />
					<PubDocument />
				</PubSuspendWhileTypingProvider>
			</PubContextProvider>
		</div>
	);
};

export default Pub;
