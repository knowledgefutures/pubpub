import React, { useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { useEffectOnce } from 'react-use';
import { Button } from '@blueprintjs/core';

import { shouldShowTosUpdate, markTosUpdateSeen } from 'client/utils/legal/tosUpdate';
import { shouldShowGdprBanner, updateGdprConsent } from 'client/utils/legal/gdprConsent';

require('./legalBanner.scss');

const propTypes = {
	loginData: PropTypes.shape({
		id: PropTypes.string,
		gdprConsent: PropTypes.bool,
	}).isRequired,
};

const banners = [
	{
		title: 'Terms of service',
		shouldShow: () => shouldShowTosUpdate(),
		notice: () => {
			return (
				<p>
					We've updated PubPub's Terms of Service to clarify the relationship between
					PubPub, third-party publishers, and users, and to further underscore our
					commitment to the highest standards of user privacy.
				</p>
			);
		},
		// eslint-disable-next-line react/prop-types
		buttons: ({ loginData }, next) => {
			return (
				<>
					<Button
						large
						onClick={() => {
							markTosUpdateSeen();
							next();
						}}
						intent="success"
					>
						{shouldShowGdprBanner(loginData) ? 'Next' : 'Close'}
					</Button>
					<Button
						large
						onClick={() => {
							window.open('https://www.pubpub.org/legal/terms', '_blank');
						}}
					>
						See terms
					</Button>
				</>
			);
		},
	},
	{
		title: 'Cookies and data privacy',
		shouldShow: ({ loginData }) => shouldShowGdprBanner(loginData),
		notice: () => {
			return (
				<p>
					PubPub uses third-party cookies to help our team and our communities understand
					which features and content on PubPub are receiving traffic.{' '}
					<b>We don't sell this data or share it with anyone else</b>, and we don't use
					third-party processors who aggregate and sell data. Visit your{' '}
					<a href="/legal/settings">privacy settings</a> to learn more.
				</p>
			);
		},
		// eslint-disable-next-line react/prop-types
		buttons: ({ loginData }, next) => {
			const closeWithConsent = (doesConsent) => {
				updateGdprConsent(loginData, doesConsent);
				next();
			};
			return (
				<>
					<Button large onClick={() => closeWithConsent(true)} intent="success">
						Accept
					</Button>
					<Button large onClick={() => closeWithConsent(false)}>
						Disable
					</Button>
				</>
			);
		},
	},
];

const LegalBanner = (props) => {
	const [bannerIndex, setBannerIndex] = useState(-1);
	const bannerToShow = banners[bannerIndex];
	const [allBannersToShow] = useState(banners.filter((banner) => banner.shouldShow(props)));

	const findNextBannerToShow = () => {
		let index = bannerIndex;
		do {
			++index;
		} while (banners[index] && !banners[index].shouldShow(props));
		setBannerIndex(index);
	};

	// After the component mounts on the client, check to see whether it should be shown.
	// (it uses cookies, so it causes SSR problems if we try to do this at first render)
	useEffectOnce(findNextBannerToShow);

	if (!bannerToShow) {
		return null;
	}

	const renderNoticeSteps = () => {
		return (
			<div className="notice-steps">
				{allBannersToShow.map((banner, index) => {
					return (
						<div
							// eslint-disable-next-line react/no-array-index-key
							key={index}
							className={classNames(
								'step',
								banners.indexOf(banner) === bannerIndex && 'current',
							)}
						>
							{banner.title}
						</div>
					);
				})}
			</div>
		);
	};

	return (
		<div className="legal-banner-component">
			<div className="logo">
				<img src="/static/logo.png" alt="" />
			</div>
			<div className="notice">
				{renderNoticeSteps()}
				{bannerToShow.notice()}
			</div>
			<div className="legal-buttons">{bannerToShow.buttons(props, findNextBannerToShow)}</div>
		</div>
	);
};

LegalBanner.propTypes = propTypes;
export default LegalBanner;
