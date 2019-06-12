import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Button } from '@blueprintjs/core';

import { shouldShowGdprBanner, updateGdprConsent } from 'utils/gdprConsent';
import { useEffectOnce } from 'react-use';

require('./gdprBanner.scss');

const propTypes = {
	loginData: PropTypes.shape({
		id: PropTypes.string,
		gdprConsent: PropTypes.bool,
	}).isRequired,
};

const GdprBanner = (props) => {
	const { loginData } = props;
	const [isShown, setIsShown] = useState(null);

	// After the component mounts on the client, check to see whether it should be shown.
	// (it uses cookies, so it causes SSR problems if we try to do this at first render)
	useEffectOnce(() => {
		if (shouldShowGdprBanner(loginData)) {
			setIsShown(true);
		}
	});

	const closeWithConsent = (doesConsent) => {
		updateGdprConsent(loginData, doesConsent);
		setIsShown(false);
	};

	if (!isShown) {
		return null;
	}

	return (
		<div className="gdpr-banner-component">
			<div className="logo">
				<img src="/static/logoWhite.png" alt="" />
			</div>
			<div className="notice">
				<p>
					<b>The Cookies Talk: </b>
					PubPub uses cookies that help our team and our communities understand what
					features and content on PubPub are receiving traffic. We don't sell this data or
					share it with anyone else. Visit your{' '}
					<a href="/privacy/settings">privacy settings</a> to learn more.
				</p>
			</div>
			<div className="buttons">
				<Button onClick={() => closeWithConsent(true)} intent="success">
					Accept
				</Button>
				<Button onClick={() => closeWithConsent(false)}>Disable</Button>
			</div>
		</div>
	);
};

GdprBanner.propTypes = propTypes;
export default GdprBanner;
