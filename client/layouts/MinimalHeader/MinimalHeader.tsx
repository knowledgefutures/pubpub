import React from 'react';

import { AnchorButton } from '@blueprintjs/core';

import { Icon, MobileAware, UserNotificationsPopover } from 'components';
import UserMenu from 'components/GlobalControls/UserMenu';

import './minimalHeader.scss';

type MinimalHeaderNavItem = {
	title: string;
	url: string;
};

type MinimalHeaderProps = {
	logoUrl: string;
	logoLabel: string;
	navItems: MinimalHeaderNavItem[];
	loginData: any;
	locationData: any;
	twitterUrl: string;
};

function MinimalHeaderLoginButton(props: { href: string }) {
	return (
		<a href={props.href} aria-label="Login">
			<MobileAware desktop={<span>Login or Signup</span>} mobile={<span>Login</span>} />
		</a>
	);
}

export default function MinimalHeader(props: MinimalHeaderProps) {
	const isLoggedIn = Boolean(props.loginData.id);
	const loginRedirectString = `?redirect=${props.locationData.path}${
		props.locationData.queryString.length > 1 ? props.locationData.queryString : ''
	}`;
	const loginHref = `/login${loginRedirectString}`;
	const user = isLoggedIn ? (
		<UserMenu loginData={props.loginData} />
	) : (
		<MinimalHeaderLoginButton href={loginHref} />
	);
	const userNotifications = isLoggedIn ? (
		<UserNotificationsPopover>
			{({ hasUnreadNotifications }) =>
				hasUnreadNotifications ? (
					<li>
						<AnchorButton
							minimal
							aria-label="Notifications inbox"
							icon={hasUnreadNotifications ? 'inbox-update' : 'inbox'}
						/>
					</li>
				) : (
					<React.Fragment />
				)
			}
		</UserNotificationsPopover>
	) : null;

	return (
		<header className="minimal-header-component">
			<div className="container">
				<div className="logo">
					<a href="/" aria-label={props.logoLabel}>
						<img src={props.logoUrl} alt={props.logoLabel} />
					</a>
				</div>
				<nav className="global">
					<ul>
						<li>
							<MobileAware
								mobile={<AnchorButton minimal href="/search" icon="search" />}
								desktop={
									<a href="/search" aria-label="Search">
										Search
									</a>
								}
							/>
						</li>
						{userNotifications}
						<MobileAware desktop={<li>{user}</li>} mobile={null} />
					</ul>
				</nav>
				<nav className="links">
					<ul>
						{props.navItems.map((navItem) => (
							<li key={navItem.url}>
								<a href={navItem.url} aria-label={navItem.title}>
									{navItem.title}
								</a>
							</li>
						))}
						<li>
							<AnchorButton
								minimal
								href={props.twitterUrl}
								icon={<Icon icon="twitter" />}
								aria-label="Twitter"
							/>
						</li>
					</ul>
				</nav>
			</div>
		</header>
	);
}
