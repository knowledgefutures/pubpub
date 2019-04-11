import React from 'react';
import { storiesOf } from '@storybook/react';
import PubHeader from 'containers/PubNew/PubHeader';
import { pubData } from '../data';

const altPubData = {
	...pubData,
	title: 'Eloquent Elephants show signs of specialized skills amongst young and old',
	description:
		'Are institutions, through compartmentalization, a root cause of the exploitation and reduction that spans relations from gender to ecology? A new language—and a new sense-making—to address the horrors of this exploitation.',
};

storiesOf('Components/PubHeaderNew', module).add('default', () => (
	<div>
		<PubHeader pubData={altPubData} />
		<PubHeader
			pubData={{
				...altPubData,
				useHeaderImage: false,
			}}
		/>
		<PubHeader
			pubData={{
				...altPubData,
				headerStyle: 'white-blocks',
				avatar: 'https://i.imgur.com/s9Gj6o6.png',
			}}
		/>
	</div>
));
