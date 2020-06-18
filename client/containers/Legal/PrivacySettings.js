import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { AnchorButton, Card, Switch } from '@blueprintjs/core';

import { usePageContext } from 'utils/hooks';
import { getGdprConsentElection, updateGdprConsent } from 'client/utils/legal/gdprConsent';

const propTypes = {
	isLoggedIn: PropTypes.bool.isRequired,
};

const exportEmailBody = `
Hello.
%0D%0A%0D%0A
I am writing to request an export of any PubPub account data associated with this email address.
`;

const deleteEmailBody = `
Hello.
%0D%0A%0D%0A
I am writing to request that the PubPub account associated with this email address, and all%20
data associated with that account, be deleted.
%0D%0A%0D%0A
I understand that this action may be irreversible.
`;

const ThirdPartyAnalyticsCard = () => {
	const { loginData } = usePageContext();
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
				summarize information about user behavior on our platform. We do this to help our
				engineering team make product decisions and communities who use our service to
				measure the performance of their content. We do not share any personally
				identifiable information with communities on PubPub or any other third parties. We
				pay Keen rather than using a more popular platform like Google Analytics, which is
				free but allows Google to process your data and re-sell it across the web.
			</p>
			<p>
				If you allow us to enable Keen while you browse, we'll send requests to their
				servers containing things like the URL of the current page, your browser version,
				and your IP address. If you're logged in, we'll also send your PubPub user ID, which
				is made of random letters and numbers. We'll never send Keen any identifying
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

const PrivacySettings = (props) => {
	const { isLoggedIn } = props;
	return (
		<div className="privacy-settings">
			<ThirdPartyAnalyticsCard />
			{isLoggedIn && (
				<React.Fragment>
					<Card>
						<h5>Data export</h5>
						<p>
							You can request an export of the data associated with your account on
							PubPub using the button below.
						</p>
						<AnchorButton
							target="_blank"
							href={`mailto:privacy@pubpub.org?subject=Account+data+export+request&body=${exportEmailBody.trim()}`}
						>
							Request data export
						</AnchorButton>
					</Card>
					<Card>
						<h5>Account deletion</h5>
						<p>
							You can request that we completely delete your PubPub account using the
							button below. If you have left comments on notable Pubs, we may reserve
							the right to continue to display them based on the academic research
							exception to GDPR.
						</p>
						<AnchorButton
							intent="danger"
							target="_blank"
							href={`mailto:privacy@pubpub.org?subject=Account+deletion+request&body=${deleteEmailBody.trim()}`}
						>
							Request account deletion
						</AnchorButton>
					</Card>
				</React.Fragment>
			)}
		</div>
	);
};

PrivacySettings.propTypes = propTypes;
export default PrivacySettings;
