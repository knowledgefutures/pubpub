import React from 'react';
import { storiesOf } from '@storybook/react';
import PubReviewCreate from 'containers/Pub/PubReviewCreate';
import { pubData } from 'data';

storiesOf('containers/Pub/PubReviewCreate', module).add('default', () => (
	<div
		style={{
			padding: '50px',
		}}
	>
		<PubReviewCreate pubData={{ ...pubData, reviews: [] }} />
		<hr />
		<PubReviewCreate pubData={pubData} />
	</div>
));
