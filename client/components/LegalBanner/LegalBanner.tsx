import React, { useState } from 'react';
import classNames from 'classnames';
import { useEffectOnce } from 'react-use';
import { AnchorButton, Button } from '@blueprintjs/core';

import { shouldShowTosUpdate, markTosUpdateSeen } from 'client/utils/legal/tosUpdate';
import { shouldShowGdprBanner, updateGdprConsent } from 'client/utils/legal/gdprConsent';
import { Callback, PageContext } from 'types';
import { usePageContext } from 'utils/hooks';
import { dismissUserDismissable } from '../../utils/userDismissable';

require('./legalBanner.scss');

type Banner = {
	title: React.ReactNode;
	shouldShow: (context: PageContext) => boolean;
	notice: () => React.ReactNode;
	buttons: (context: PageContext, next: Callback) => React.ReactNode;
};

const banners: Banner[] = [
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
	{
		title: 'Take our User Satisfaction Survey',
		shouldShow: ({ dismissedUserDismissables, featureFlags, loginData }) => {
			return (
				!!loginData.id &&
				!dismissedUserDismissables.surveySummer22 &&
				featureFlags.surveySummer22
			);
		},
		notice: () => {
			return (
				<p>
					We'd like to understand who our users are, how they value PubPub, and how we can
					better service publishing communities. This will directly inform our roadmap and
					priorities. It should take less than 5 minutes to complete and can be filled out
					anonymously.
				</p>
			);
		},
		buttons: (_, next) => {
			const handleClick = () => {
				dismissUserDismissable('surveySummer22');
				next();
			};

			return (
				<>
					<AnchorButton
						large
						href="https://forms.gle/cecnRw7BDbeYyML4A"
						target="_blank"
						style={{ padding: '0 10px' }}
						intent="primary"
					>
						Take the survey
					</AnchorButton>
					<Button large onClick={handleClick}>
						Dismiss
					</Button>
				</>
			);
		},
	},
];

const LegalBanner = () => {
	const pageContext = usePageContext();
	const [bannerIndex, setBannerIndex] = useState(-1);
	const bannerToShow = banners[bannerIndex];
	const [allBannersToShow] = useState(banners.filter((banner) => banner.shouldShow(pageContext)));

	const findNextBannerToShow = () => {
		let index = bannerIndex;
		do {
			++index;
		} while (banners[index] && !banners[index].shouldShow(pageContext));
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
			<div className="legal-buttons">
				{bannerToShow.buttons(pageContext, findNextBannerToShow)}
			</div>
		</div>
	);
};
export default LegalBanner;
