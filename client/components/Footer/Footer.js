import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
	Button,
	InputGroup,
	Checkbox,
	Position,
	Popover,
	PopoverInteractionKind,
} from '@blueprintjs/core';

import { GridWrapper } from 'components';
import Icon from 'components/Icon/Icon';
import { apiFetch } from 'client/utils/apiFetch';
import { usePageContext } from 'utils/hooks';
import { populateNavigationIds, defaultFooterLinks, populateSocialItems } from 'utils/community';

require('./footer.scss');

const propTypes = {
	previewContext: PropTypes.object,
};

const defaultProps = {
	previewContext: undefined,
};

const Footer = (props) => {
	const [email, setEmail] = useState('');
	const [isLoadingSubscribe, setIsLoadingSubscribe] = useState(false);
	const [isSubscribed, setIsSubscribed] = useState(false);
	const [isConfirmed, setIsConfirmed] = useState(false);
	const { locationData, communityData, scopeData } = usePageContext(props.previewContext);
	const { isBasePubPub } = locationData;
	const links = isBasePubPub
		? [
				{ id: 1, title: 'Create your community', href: '/community/create' },
				{ id: 2, title: 'Login', href: '/login' },
				{ id: 3, title: 'Signup', href: '/signup' },
				{ id: 4, title: 'Legal', href: '/legal' },
				// { id: 6, title: 'Help', url: 'https://meta.pubpub.org/help' },
		  ]
		: populateNavigationIds(
				communityData.pages,
				communityData.footerLinks || defaultFooterLinks,
		  );
	const handleEmailSubmit = (evt) => {
		evt.preventDefault();
		setIsLoadingSubscribe(true);

		if (!isConfirmed) {
			setIsLoadingSubscribe(false);
			return false;
		}
		return apiFetch('/api/subscribe', {
			method: 'POST',
			body: JSON.stringify({
				email: email,
			}),
		})
			.then(() => {
				setIsLoadingSubscribe(false);
				setEmail('');
				setIsSubscribed(true);
			})
			.catch((err) => {
				console.error(err);
				setIsLoadingSubscribe(false);
			});
	};
	const pubpubLogo =
		communityData.headerColorType === 'light'
			? '/static/logoBlack.svg'
			: '/static/logoWhite.svg';
	const wrapperClasses = isBasePubPub ? 'base-pubpub' : 'accent-background accent-color';
	const socialElements = isBasePubPub
		? [
				{
					id: 'si-1',
					icon: 'twitter',
					title: 'Twitter',
					value: 'pubpub',
					url: 'https://twitter.com/pubpub',
				},
				{
					id: 'si-2',
					icon: 'github',
					title: 'Github',
					value: 'pubpub',
					url: 'https://github.com/pubpub',
				},
				{
					id: 'si-3',
					icon: 'envelope',
					title: 'Contact by email',
					value: 'hello@pubpub.org',
					url: 'mailto:hello@pubpub.org?subject=Contact',
				},
		  ]
		: populateSocialItems(communityData);
	return (
		<div className={`footer-component ${wrapperClasses}`}>
			<GridWrapper>
				<div className="left">
					{isBasePubPub && (
						<React.Fragment>
							<div className="title">
								<a href="https://pubpub.org">
									<img className="logo" src={pubpubLogo} alt="PubPub logo" />
								</a>
								<ul className="social-list">
									<li>
										<a href="https://twitter.com/pubpub">
											<Icon icon="twitter" />
										</a>
									</li>
									<li>
										<a href="mailto:hello@pubpub.org?subject=Contact">
											<Icon icon="envelope" />
										</a>
									</li>
									<li>
										<a href="https://github.com/pubpub">
											<Icon icon="github" />
										</a>
									</li>
								</ul>
							</div>
							<ul className="separated">
								<li>
									<a href="https://pubpub.org/about">About</a>
								</li>
								<li>
									<a href="https://pubpub.org/explore">Explore</a>
								</li>
								<li>
									<a href="https://pubpub.org/pricing">Pricing</a>
								</li>
								<li>
									<a href="https://help.pubpub.org">Help</a>
								</li>
							</ul>

							<form onSubmit={handleEmailSubmit}>
								<strong>Feature & Community Newsletter</strong>
								<InputGroup
									type="email"
									placeholder="Your Email"
									value={email}
									onChange={(evt) => {
										setEmail(evt.target.value);
									}}
									label="Feature & community newsletter"
									rightElement={
										<Button
											type="submit"
											icon={!isSubscribed ? 'arrow-right' : 'tick'}
											minimal={true}
											loading={isLoadingSubscribe}
										/>
									}
									disabled={isSubscribed}
								/>
								<div className="confirm">
									<Checkbox
										checked={isConfirmed}
										disabled={isSubscribed}
										required="required"
										onChange={(evt) => {
											setIsConfirmed(evt.target.checked);
										}}
										label={
											<span>
												<Popover
													interactionKind={PopoverInteractionKind.HOVER}
													popoverClassName="bp3-popover-content-sizing"
													position={Position.RIGHT}
												>
													<p>
														<em>I agree to receive this newsletter.</em>
													</p>
													<div>
														<p>
															We use a third party provider,
															Mailchimp, to deliver our newsletters.
															We never share your data with anyone,
															and you can unsubscribe using the link
															at the bottom of every email. Learn more
															by visiting your&nbsp;
															<a href="/legal/privacy">
																privacy settings
															</a>
															.
														</p>
													</div>
												</Popover>
											</span>
										}
									/>
								</div>
							</form>
						</React.Fragment>
					)}
					{!isBasePubPub && communityData.footerImage && (
						<a href="/">
							<img
								src={communityData.footerImage}
								className="footer-image"
								alt={communityData.footerTitle || communityData.title}
							/>
						</a>
					)}
				</div>
				<div className="right">
					<div className="footer-title">
						<a href="/">{communityData.footerTitle || communityData.title}</a>
					</div>
					<ul className="separated">
						{links
							.filter((item) => {
								return !item.adminOnly || scopeData.activePermissions.isAdmin;
							})
							.map((link) => {
								return (
									<li key={`footer-item-${link.id}`}>
										<a className="link" href={link.href || `/${link.slug}`}>
											{link.title}
										</a>
									</li>
								);
							})}
					</ul>
					{!!socialElements.length && (
						<ul className="social-list">
							{socialElements.map((item) => {
								return (
									<a href={item.url} key={`social-item-${item.id}`}>
										<li>
											<Icon icon={item.icon} />
										</li>
									</a>
								);
							})}
						</ul>
					)}
				</div>
			</GridWrapper>
			<div className="built-on">
				<a
					href={
						isBasePubPub ? 'https://www.knowledgefutures.org' : 'https://www.pubpub.org'
					}
				>
					{!isBasePubPub && (
						<React.Fragment>
							Published with
							<img className="logo" src={pubpubLogo} alt="PubPub logo" />
						</React.Fragment>
					)}
					{isBasePubPub && (
						<React.Fragment>
							A project of the
							<img className="logo" src="/static/kfgMini.svg" alt="KFG logo" />
						</React.Fragment>
					)}
				</a>
			</div>
		</div>
	);
};

Footer.propTypes = propTypes;
Footer.defaultProps = defaultProps;
export default Footer;
