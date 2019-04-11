import React from 'react';
import { storiesOf } from '@storybook/react';
import PubHeader from 'containers/PubNew/PubHeader';
import { pubData } from '../../data';

const altPubData = {
	...pubData,
	mode: 'document',
	title: 'Eloquent Elephants show signs of specialized skills amongst young and old',
	description:
		'Are institutions, through compartmentalization, a root cause of the exploitation and reduction that spans relations from gender to ecology? A new language—and a new sense-making—to address the horrors of this exploitation.',
};

storiesOf('Containers/PubNew/PubHeader', module).add('default', () => (
	<div>
		<PubHeader
			pubData={{
				...altPubData,
				metaMode: 'details',
			}}
		/>
		<PubHeader
			pubData={{
				...altPubData,
				useHeaderImage: false,
				metaMode: 'details',
			}}
		/>
		<PubHeader
			pubData={{
				...altPubData,
				headerStyle: 'white-blocks',
				avatar: 'https://i.imgur.com/s9Gj6o6.png',
				metaMode: 'details',
			}}
		/>
		<PubHeader
			pubData={{
				...altPubData,
				headerStyle: 'black-blocks',
				avatar: 'https://i.imgur.com/kts3zH1.jpg',
				metaMode: 'details',
			}}
		/>
	</div>
));
