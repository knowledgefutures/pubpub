import React, { useContext, useEffect, useState } from 'react';
import { Card, Switch } from '@blueprintjs/core';

import { PageContext } from 'components/PageWrapper/PageWrapper';
import { getGdprConsentElection, updateGdprConsent } from 'utils/gdprConsent';

const ThirdPartyAnalyticsCard = () => {
	const { loginData } = useContext(PageContext);
	const [hasUsedToggle, setHasUsedToggle] = useState(false);
	const [isEnabled, setIsEnabled] = useState(null);

	// We start with a null isEnabled value and only set it in a useEffect in order to avoid having
	// to check a cookie on the server side, which our SSR framework isn't set up to do.
	useEffect(() => {
		if (isEnabled === null) {
			setIsEnabled(!!getGdprConsentElection(loginData));
		}
		if (hasUsedToggle) {
			updateGdprConsent(loginData, isEnabled);
		}
	}, [hasUsedToggle, isEnabled, loginData]);

	return (
		<Card>
			<h5>Third-party analytics</h5>
			<p>
				PubPub uses a third-party analytics service called Keen to store, aggregate and
				summarize information about page views on our platform. We do this primarily to help
				communities who use our service understand traffic to their Pubs. We pay Keen for
				this service rather than using a more popular platform like Google Analytics, which
				is free but allows Google to sell your data and track you across the web.
			</p>
			<p>
				If you allow us to enable Keen while you browse, we'll send requests to their
				servers containing things like the URL of the current page, your browser version,
				and your IP address. If you're logged in, we'll also send your PubPub user ID, which
				made of random letters and numbers. We'll never send Keen any identifying
				information such as your name, affiliation, or email address.
			</p>
			<Switch
				checked={!!isEnabled}
				onChange={() => {
					setHasUsedToggle(true);
					setIsEnabled(!isEnabled);
				}}
				label={'Third party analytics is ' + (isEnabled ? 'enabled' : 'disabled')}
			/>
		</Card>
	);
};

const PrivacySettings = () => {
	return (
		<React.Fragment>
			<ThirdPartyAnalyticsCard />
		</React.Fragment>
	);
};

export default PrivacySettings;
