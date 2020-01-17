/* eslint-disable react/prop-types */
import React, { useState } from 'react';
import { storiesOf } from '@storybook/react';
import PubHeader from 'containers/Pub/PubHeader';
import { pubData } from 'data';

const altPubData = {
	...pubData,
	mode: 'document',
	title: 'Eloquent Elephants show signs of specialized skills amongst young and old',
	description:
		'Are institutions, through compartmentalization, a root cause of the exploitation and reduction that spans relations from gender to ecology? A new language—and a new sense-making—to address the horrors of this exploitation.',
};

const historyData = {
	isViewingHistory: false,
};

const PubHeaderWrapper = (props) => {
	const [localData, setLocalData] = useState({
		pubData: props.pubData,
		historyData: props.historyData,
		collabData: props.collabData,
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

	return <PubHeader {...localData} updateLocalData={updateLocalData} />;
};

storiesOf('containers/Pub/PubHeader', module).add('default', () => (
	<div>
		<PubHeaderWrapper
			collabData={{}}
			pubData={{
				...altPubData,
			}}
			historyData={historyData}
		/>
		<PubHeaderWrapper
			collabData={{}}
			pubData={{
				...altPubData,
				description: null,
				canManage: false,
				useHeaderImage: false,
			}}
			historyData={historyData}
		/>
		<PubHeaderWrapper
			collabData={{}}
			pubData={{
				...altPubData,
				description: null,
				headerStyle: 'white-blocks',
				avatar: 'https://i.imgur.com/s9Gj6o6.png',
			}}
			historyData={historyData}
		/>
		<PubHeaderWrapper
			collabData={{}}
			pubData={{
				...altPubData,
				headerStyle: 'black-blocks',
				avatar: 'https://i.imgur.com/kts3zH1.jpg',
			}}
			historyData={historyData}
		/>

		<PubHeaderWrapper
			collabData={{}}
			pubData={{
				...altPubData,
				mode: 'manage',
			}}
			historyData={historyData}
		/>
		<PubHeaderWrapper
			collabData={{}}
			pubData={{
				...altPubData,
				useHeaderImage: false,
				mode: 'manage',
			}}
			historyData={historyData}
		/>
		<PubHeaderWrapper
			collabData={{}}
			pubData={{
				...altPubData,
				headerStyle: 'white-blocks',
				avatar: 'https://i.imgur.com/s9Gj6o6.png',
				mode: 'manage',
			}}
			historyData={historyData}
		/>
		<PubHeaderWrapper
			collabData={{}}
			pubData={{
				...altPubData,
				headerStyle: 'black-blocks',
				avatar: 'https://i.imgur.com/kts3zH1.jpg',
				mode: 'manage',
			}}
			historyData={historyData}
		/>
	</div>
));
