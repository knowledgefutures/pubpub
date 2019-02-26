import React from 'react';
import { storiesOf } from '@storybook/react';
import CommunityPreview from 'components/CommunityPreview/CommunityPreview';

const data = {
	subdomain: 'jods',
	domain: 'jods.mitpress.mit.edu',
	title: 'Journal of Design and Science',
	description: 'A description of the journal',
	heroBackgroundImage: 'https://assets.pubpub.org/9s4gbj5y/51507218425793.png',
	heroLogo: 'https://assets.pubpub.org/m4i28ev7/51514322606636.png',
	accentColor: '#222222',
	accentTextColor: '#FFFFFF',
	numPubs: '23',
	numDiscussions: '49',
};

storiesOf('Components/CommunityPreview', module).add('default', () => (
	<div>
		<div className="container">
			<div className="row">
				<div className="col-4">
					<CommunityPreview {...data} />
				</div>
				<div className="col-4">
					<CommunityPreview {...data} />
				</div>
				<div className="col-4">
					<CommunityPreview {...data} />
				</div>
			</div>
		</div>

		<div className="container">
			<div className="row">
				<div className="col-6">
					<CommunityPreview {...data} />
				</div>
				<div className="col-6">
					<CommunityPreview {...data} />
				</div>
			</div>
		</div>

		<div className="container">
			<div className="row">
				<div className="col-12">
					<CommunityPreview {...data} />
				</div>
			</div>
		</div>
	</div>
));
