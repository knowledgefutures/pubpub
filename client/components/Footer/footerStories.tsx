import React from 'react';
import { storiesOf } from '@storybook/react';

import { AccentStyle, Footer } from 'components';
import { populateSocialItems } from 'utils/community';
import { communityData } from 'utils/storybook/data';

const wrapperStyle = { margin: '1em 0em' };

const socialItems = populateSocialItems({
	website: communityData.website,
	twitter: communityData.twitter,
	facebook: communityData.facebook,
	email: communityData.email,
});

storiesOf('components/Footer', module)
	.add('Dark', () => {
		return (
			<div>
				<AccentStyle communityData={communityData} isNavHidden={false} />

				<div style={wrapperStyle}>
					<Footer
						// @ts-expect-error ts-migrate(2322) FIXME: Property 'isAdmin' does not exist on type 'Intrins... Remove this comment to see the full error message
						isAdmin={true}
						isBasePubPub={false}
						socialItems={socialItems}
						communityData={communityData}
					/>
				</div>

				<div style={wrapperStyle}>
					<Footer
						// @ts-expect-error ts-migrate(2322) FIXME: Property 'isAdmin' does not exist on type 'Intrins... Remove this comment to see the full error message
						isAdmin={false}
						isBasePubPub={false}
						socialItems={socialItems}
						communityData={communityData}
					/>
				</div>

				<div style={wrapperStyle}>
					<Footer
						// @ts-expect-error ts-migrate(2322) FIXME: Property 'isAdmin' does not exist on type 'Intrins... Remove this comment to see the full error message
						isAdmin={false}
						isBasePubPub={true}
						communityData={communityData}
						socialItems={socialItems}
					/>
				</div>
			</div>
		);
	})
	.add('Light', () => (
		<div>
			<AccentStyle communityData={communityData} isNavHidden={false} />
			<div style={wrapperStyle}>
				<Footer
					// @ts-expect-error ts-migrate(2322) FIXME: Property 'isAdmin' does not exist on type 'Intrins... Remove this comment to see the full error message
					isAdmin={true}
					isBasePubPub={false}
					socialItems={socialItems}
					communityData={communityData}
				/>
			</div>
		</div>
	));
