import React, { useState } from 'react';
import {
	Button,
	Checkbox,
	Classes,
	InputGroup,
	Popover,
	PopoverInteractionKind,
	Position,
} from '@blueprintjs/core';

import { GridWrapper } from 'components';
import Icon from 'components/Icon/Icon';
import { apiFetch } from 'client/utils/apiFetch';
import { usePageContext } from 'utils/hooks';
import {
	defaultFooterLinks,
	createSocialNavItems,
	getNavItemsForCommunityNavigation,
	SocialItem,
} from 'client/utils/navigation';

require('./footer.scss');

type OwnProps = {
	previewContext?: any;
};

const defaultProps = {
	previewContext: undefined,
};

type Props = OwnProps & typeof defaultProps;

const basePubPubFooterLinks = [
	{ id: '1', title: 'Create your community', href: '/community/create' },
	{ id: '2', title: 'Login', href: '/login' },
	{ id: '3', title: 'Signup', href: '/signup' },
	{ id: '4', title: 'Legal', href: '/legal' },
];

const baseSocialItems: SocialItem[] = [
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
];

const Footer = (props: Props) => {
	const [email, setEmail] = useState('');
	const [isLoadingSubscribe, setIsLoadingSubscribe] = useState(false);
	const [isSubscribed, setIsSubscribed] = useState(false);
	const [isConfirmed, setIsConfirmed] = useState(false);
	const { locationData, communityData } = usePageContext(props.previewContext);
	const { pages = [], collections = [] } = communityData;
	const { isBasePubPub } = locationData;
	const footerLinks = isBasePubPub
		? basePubPubFooterLinks
		: communityData.footerLinks || defaultFooterLinks;
	const navItems = getNavItemsForCommunityNavigation({
		navigation: footerLinks,
		pages,
		collections,
	});
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
				email,
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
	const socialItems = isBasePubPub ? baseSocialItems : createSocialNavItems(communityData);
	return (
		<div className={`footer-component ${wrapperClasses}`}>
			<GridWrapper>
				<div className="left">
					{isBasePubPub && (
						<React.Fragment>
							<div className="title">
								<a href="https://pubpub.org" aria-label="Website">
									<img className="logo" src={pubpubLogo} alt="PubPub logo" />
								</a>
								<ul className="social-list">
									<li>
										<a href="https://twitter.com/pubpub" aria-label="Twitter">
											<Icon icon="twitter" />
										</a>
									</li>
									<li>
										<a
											href="mailto:hello@pubpub.org?subject=Contact"
											aria-label="Contact via email"
										>
											<Icon icon="envelope" />
										</a>
									</li>
									<li>
										<a href="https://github.com/pubpub" aria-label="GitHub">
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
								<li>
									<a href="https://github.com/pubpub/pubpub/discussions">Forum</a>
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
									// @ts-expect-error ts-migrate(2322) FIXME: Type '{ type: string; placeholder: string; value: ... Remove this comment to see the full error message
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
										// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'boolean |... Remove this comment to see the full error message
										required="required"
										onChange={(evt) => {
											// @ts-expect-error ts-migrate(2339) FIXME: Property 'checked' does not exist on type 'EventTa... Remove this comment to see the full error message
											setIsConfirmed(evt.target.checked);
										}}
										// @ts-expect-error ts-migrate(2322) FIXME: Type 'Element' is not assignable to type 'string'.
										label={
											<span>
												<Popover
													interactionKind={PopoverInteractionKind.HOVER}
													popoverClassName={
														Classes.POPOVER_CONTENT_SIZING
													}
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
						<a href={communityData.footerLogoLink || '/'}>
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
						{navItems.map((navItem) => {
							if ('href' in navItem) {
								return (
									<li key={`footer-item-${navItem.id}`}>
										<a className="link" href={navItem.href}>
											{navItem.title}
										</a>
									</li>
								);
							}
							return null;
						})}
					</ul>
					{!!socialItems.length && (
						<ul className="social-list">
							{socialItems.map((item) => {
								return (
									<li key={`social-item-${item.id}`}>
										<a href={item.url} aria-label={item.title}>
											<Icon icon={item.icon} />
										</a>
									</li>
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
Footer.defaultProps = defaultProps;
export default Footer;
