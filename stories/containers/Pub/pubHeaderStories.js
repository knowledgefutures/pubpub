import React from 'react';
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

storiesOf('containers/Pub/PubHeader', module).add('default', () => (
	<div>
		<PubHeader
			collabData={{}}
			pubData={{
				...altPubData,
			}}
			historyData={historyData}
		/>
		<PubHeader
			collabData={{}}
			pubData={{
				...altPubData,
				useHeaderImage: false,
			}}
			historyData={historyData}
		/>
		<PubHeader
			collabData={{}}
			pubData={{
				...altPubData,
				headerStyle: 'white-blocks',
				avatar: 'https://i.imgur.com/s9Gj6o6.png',
			}}
			historyData={historyData}
		/>
		<PubHeader
			collabData={{}}
			pubData={{
				...altPubData,
				headerStyle: 'black-blocks',
				avatar: 'https://i.imgur.com/kts3zH1.jpg',
			}}
			historyData={historyData}
		/>

		<PubHeader
			collabData={{}}
			pubData={{
				...altPubData,
				mode: 'manage',
			}}
			historyData={historyData}
		/>
		<PubHeader
			collabData={{}}
			pubData={{
				...altPubData,
				useHeaderImage: false,
				mode: 'manage',
			}}
			historyData={historyData}
		/>
		<PubHeader
			collabData={{}}
			pubData={{
				...altPubData,
				headerStyle: 'white-blocks',
				avatar: 'https://i.imgur.com/s9Gj6o6.png',
				mode: 'manage',
			}}
			historyData={historyData}
		/>
		<PubHeader
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
