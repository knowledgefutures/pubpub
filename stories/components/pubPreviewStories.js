import React from 'react';
import { storiesOf } from '@storybook/react';
import { PubPreview } from 'components';
import { pubData } from 'data';

storiesOf('components/PubPreview', module).add('default', () => (
	<div className="container">
		<h1 style={{ margin: '0em 0em 0.5em' }}>Large</h1>
		<div className="row">
			<div className="col-12">
				<PubPreview pubData={pubData} size="large" />
			</div>
		</div>

		<h1 style={{ margin: '2em 0em 0.5em' }}>Medium</h1>
		<div className="row">
			<div className="col-6">
				<PubPreview pubData={pubData} size="medium" />
			</div>
			<div className="col-6">
				<PubPreview pubData={pubData} size="medium" />
			</div>
			<div className="col-6">
				<PubPreview
					pubData={pubData}
					size="medium"
					communityData={{
						accentColorDark: '#000000',
						domain: 'jods.mitpress.mit.edu',
						id: 'fake-id',
						headerLogo: 'https://assets.pubpub.org/b5ftxm4v/51508255582371.png',
						subdomain: 'jods',
						title: 'Journal of Design and Science',
					}}
				/>
			</div>
		</div>

		<h1 style={{ margin: '2em 0em 0.5em' }}>Small</h1>
		<div className="row">
			<div className="col-12">
				<PubPreview pubData={pubData} size="small" />
			</div>
			<div className="col-12">
				<PubPreview pubData={pubData} size="small" />
			</div>
		</div>

		<h1 style={{ margin: '2em 0em 0.5em' }}>Minimal</h1>
		<div className="row">
			<div className="col-6">
				<PubPreview pubData={pubData} size="minimal" />
			</div>
			<div className="col-6">
				<PubPreview pubData={pubData} size="minimal" />
			</div>
			<div className="col-6">
				<PubPreview pubData={pubData} size="minimal" />
			</div>
		</div>
	</div>
));
