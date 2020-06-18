import React from 'react';
import { storiesOf } from '@storybook/react';

import { PubPreview } from 'components';
import { pubData } from 'utils/storybook/data';

const communityData = {
	accentColorDark: '#000000',
	domain: 'jods.mitpress.mit.edu',
	id: 'fake-id',
	headerLogo: 'https://assets.pubpub.org/b5ftxm4v/51508255582371.png',
	subdomain: 'jods',
	title: 'Journal of Design and Science',
};

storiesOf('components/PubPreview', module).add('default', () => (
	<div className="container">
		<h1 style={{ margin: '0em 0em 0.5em' }}>Large</h1>
		<div className="row">
			<div className="col-12">
				<PubPreview pubData={pubData} communityData={communityData} size="large" />
			</div>
		</div>

		<h1 style={{ margin: '2em 0em 0.5em' }}>Medium</h1>
		<div className="row">
			<div className="col-6">
				<PubPreview pubData={pubData} communityData={communityData} size="medium" />
			</div>
			<div className="col-6">
				<PubPreview pubData={pubData} communityData={communityData} size="medium" />
			</div>
			<div className="col-6">
				<PubPreview pubData={pubData} communityData={communityData} size="medium" />
			</div>
		</div>

		<h1 style={{ margin: '2em 0em 0.5em' }}>Small</h1>
		<div className="row">
			<div className="col-12">
				<PubPreview pubData={pubData} communityData={communityData} size="small" />
			</div>
			<div className="col-12">
				<PubPreview pubData={pubData} communityData={communityData} size="small" />
			</div>
		</div>

		<h1 style={{ margin: '2em 0em 0.5em' }}>Minimal</h1>
		<div className="row">
			<div className="col-6">
				<PubPreview pubData={pubData} communityData={communityData} size="minimal" />
			</div>
			<div className="col-6">
				<PubPreview pubData={pubData} communityData={communityData} size="minimal" />
			</div>
			<div className="col-6">
				<PubPreview pubData={pubData} communityData={communityData} size="minimal" />
			</div>
		</div>
	</div>
));
