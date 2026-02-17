import type { SpamStatus } from 'types/spam';

import React from 'react';

import { Icon } from 'components';

import './spamBanner.scss';

type Props = {
	status: SpamStatus;
};

const SpamBanner = (props: Props) => {
	const { status } = props;

	if (status === 'unreviewed') {
		return (
			<div className="spam-banner-component">
				<Icon icon="info-sign" iconSize={16} />
				<div className="text">
					Your community is currently awaiting approval for compliance with our{' '}
					<a href="/legal/terms">Terms of Service</a> and{' '}
					<a href="/legal/aup">Acceptable Use Policy</a>. We strive to moderate all new
					communities within five business days. During this time, all features and
					functionality are available, but only logged in Members will be able to view the
					community.
				</div>
			</div>
		);
	}

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
