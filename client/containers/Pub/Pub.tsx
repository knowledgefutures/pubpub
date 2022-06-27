import React from 'react';

import { PubPageData } from 'types';

import PubHeader from './PubHeader';
import SpubHeader from './SpubHeader';
import PubDocument from './PubDocument';
import { usePubContext } from './pubHooks';
import { PubContextProvider } from './PubContextProvider';
import { PubSuspendWhileTypingProvider } from './PubSuspendWhileTyping';

require('./pub.scss');

type Props = {
	pubData: PubPageData;
};

const SomePubHeader = () => {
	const pubContext = usePubContext();
	const { submissionState } = pubContext;
	const HeaderComponent = submissionState ? SpubHeader : PubHeader;
	return <HeaderComponent />;
};

const Pub = (props: Props) => {
	const { pubData } = props;
	return (
		<div id="pub-container">
			<PubSuspendWhileTypingProvider>
				<PubContextProvider pubData={pubData}>
					<SomePubHeader />
					<PubDocument />
				</PubContextProvider>
			</PubSuspendWhileTypingProvider>
		</div>
	);
};

export default Pub;
