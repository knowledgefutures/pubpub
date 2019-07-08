import React from 'react';
import { storiesOf } from '@storybook/react';
import { Pub } from 'containers';
import { pubData, loginData, communityData, locationData } from 'data';

storiesOf('containers/Pub', module).add('default', () => (
	<Pub
		communityData={communityData}
		loginData={loginData}
		locationData={locationData}
		pubData={{
			...pubData,
			mode: 'document',
			// headerStyle: 'white-blocks',
		}}
	/>
))
.add('default-white-blocks', () => (
	<Pub
		communityData={communityData}
		loginData={loginData}
		locationData={locationData}
		pubData={{
			...pubData,
			mode: 'document',
			headerStyle: 'white-blocks',

		}}
	/>
))
.add('default-dark-blocks', () => (
	<Pub
		communityData={communityData}
		loginData={loginData}
		locationData={locationData}
		pubData={{
			...pubData,
			mode: 'document',
			headerStyle: 'black-blocks',

		}}
	/>
))
.add('default-no-image', () => (
	<Pub
		communityData={communityData}
		loginData={loginData}
		locationData={locationData}
		pubData={{
			...pubData,
			mode: 'document',
			headerBackgroundType: 'color',

		}}
	/>
))
.add('default-manage', () => (
	<Pub
		communityData={communityData}
		loginData={loginData}
		locationData={locationData}
		pubData={{
			...pubData,
		}}
	/>
));
