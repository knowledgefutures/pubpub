import type { PubPageData } from 'types';

import React from 'react';

import { PubContextProvider } from './PubContextProvider';
import PubDocument from './PubDocument';
import PubHeader from './PubHeader';
import { PubSuspendWhileTypingProvider } from './PubSuspendWhileTyping';
import { usePubContext } from './pubHooks';
import SpubHeader from './SpubHeader';

import './pub.scss';

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
