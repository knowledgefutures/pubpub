/* eslint-disable react/prop-types */
import React, { useState } from 'react';
import { storiesOf } from '@storybook/react';

import PubHeader from 'containers/Pub/PubHeader';
import { pubData, communityData, attributionsData } from 'utils/storybook/data';
import { ImmediatePubContext } from '../PubContextProvider';

const altPubData = {
	...pubData,
	mode: 'document',
	title: 'Eloquent Elephants show signs of specialized skills amongst young and old',
	description:
		'Are institutions, through compartmentalization, a root cause of the exploitation and reduction that spans relations from gender to ecology? A new language—and a new sense-making—to address the horrors of this exploitation.',
};

const aPrimaryCollection = {
	id: '6cfea932-1701-4d4e-86b9-f85758dad57b',
	pubId: '00f9aaaf-0468-4590-9b86-1a2bff4ffe57',
	collectionId: '1e1c0f1f-1873-4705-b6e0-934f588889c6',
	contextHint: null,
	rank: null,
	pubRank: 'a',
	createdAt: '2019-04-24T20:43:15.375Z',
	updatedAt: '2019-04-24T20:43:15.375Z',
	collection: {
		id: '1e1c0f1f-1873-4705-b6e0-934f588889c6',
		title: 'I am a primary collection',
		isRestricted: true,
		isPublic: true,
		pageId: '1e1c0f1f-1873-4705-b6e0-934f588889c6',
		communityId: '7808da6b-94d1-436d-ad79-2e036a8e4428',
		metadata: null,
		kind: 'issue',
		doi: null,
		createdAt: '2018-10-15T23:51:00.296Z',
		updatedAt: '2018-10-15T23:51:00.296Z',
		page: {
			id: '1e1c0f1f-1873-4705-b6e0-934f588889c6',
			title: 'Home',
			slug: '',
		},
	},
};

const historyData = {
	isViewingHistory: false,
	currentKey: -1,
	latestKey: -1,
	timestamps: [],
};

const PubHeaderWrapper = (props) => {
	const [localData, setLocalData] = useState({
		pubData: props.pubData,
		historyData: props.historyData,
		collabData: props.collabData,
		communityData,
	});

	const updateLocalData = (type, value) => {
		const currentLocalData = { ...localData };
		if (type === 'pub') {
			currentLocalData.pubData = { ...localData.pubData, ...value };
		} else if (type === 'history') {
			currentLocalData.pubData = { ...localData.historyData, ...value };
		} else if (type === 'collab') {
			currentLocalData.pubData = { ...localData.collabData, ...value };
		}
		setLocalData(currentLocalData);
	};

	return (
		<ImmediatePubContext.Provider value={{ ...localData, updateLocalData } as any}>
			<PubHeader sticky={false} />
		</ImmediatePubContext.Provider>
	);
};

storiesOf('containers/Pub/PubHeader', module).add('default', () => (
	<div>
		<PubHeaderWrapper
			collabData={{}}
			pubData={{
				...altPubData,
				collectionPubs: [...altPubData.collectionPubs, aPrimaryCollection],
				attributions: [...altPubData.attributions, ...attributionsData],
			}}
			historyData={historyData}
		/>
		<PubHeaderWrapper
			collabData={{}}
			pubData={{
				...altPubData,
				description: null,
				canManage: false,
			}}
			historyData={historyData}
		/>
		<PubHeaderWrapper
			collabData={{}}
			pubData={{
				...altPubData,
				description: null,
				avatar: 'https://i.imgur.com/s9Gj6o6.png',
			}}
			historyData={historyData}
		/>
		<PubHeaderWrapper
			collabData={{}}
			pubData={{
				...altPubData,
				collectionPubs: [],
				avatar: 'https://i.imgur.com/kts3zH1.jpg',
			}}
			historyData={historyData}
		/>
	</div>
));
