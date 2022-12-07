import React from 'react';

import { Icon } from 'components';

require('./spamBanner.scss');

const SpamBanner = () => {
	return (
		<div className="spam-banner-component">
			<Icon icon="error" iconSize={16} />
			<div className="text">
				We have determined that your Community violates PubPub's{' '}
				<a href="/legal/terms">Terms of Service</a>, and it is now hidden from visitors. If
				you believe this judgement was made in error, please{' '}
				<a href="mailto:help@pubpub.org">contact us</a>.
			</div>
		</div>
	);
};

export default SpamBanner;
