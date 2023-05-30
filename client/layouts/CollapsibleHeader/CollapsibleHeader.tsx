import React, { useState } from 'react';
import classNames from 'classnames';

import './collapsibleHeader.scss';
import { AnchorButton, Button } from '@blueprintjs/core';
import { IconName } from '@blueprintjs/icons';

export type NavItem = {
	url: string;
	title: string;
	icon?: IconName;
	isButton?: boolean;
	isMobileOnly?: boolean;
};

export type CollapsibleHeaderProps = {
	logo: {
		titleText: string;
		url: string;
		sourceProps: {
			srcSet: string;
			type: string;
		};
		imgProps: {
			src: string;
			alt: string;
		};
	};
	headerNavLeft: NavItem[];
	headerNavRight: NavItem[];
	menuNav: NavItem[][];
};

const CollapsibleHeader = (props: CollapsibleHeaderProps) => {
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	return (
		<div
			className={classNames(
				'collapsible-header-component',
				'container',
				isMenuOpen && 'is-menu-open',
			)}
		>
			<header className="header">
				<div className="logo">
					<a href="#maincontent" className="tab-to-show-component skip-link-component">
						Skip to Content
					</a>
					<a href={props.logo.url}>
						<picture>
							<source {...props.logo.sourceProps} />
							<img {...props.logo.imgProps} alt={props.logo.titleText} />
						</picture>
					</a>
				</div>
				<div className="navigation" aria-label="Main navigation">
					<nav className="primary">
						<ul className="list">
							<li className="item">
								<Button
									minimal
									onClick={() => setIsMenuOpen(true)}
									rightIcon="menu"
								>
									Menu
								</Button>
							</li>
							{props.headerNavLeft.map((item) => (
								<li key={item.title}>
									<a href={item.url}>{item.title}</a>
								</li>
							))}
						</ul>
					</nav>
					<nav className="secondary">
						<ul>
							{props.headerNavRight.map((link) => (
								<li key={link.title}>
									<AnchorButton
										minimal={!link.isButton}
										href={link.url}
										icon={link.icon}
									>
										{link.title}
									</AnchorButton>
								</li>
							))}
						</ul>
					</nav>
				</div>
			</header>
			<div className="menu-overlay" onClick={() => setIsMenuOpen(false)} role="none" />
			<div className="menu" aria-expanded={isMenuOpen}>
				<header>
					<Button
						minimal
						onClick={() => setIsMenuOpen(false)}
						className="close"
						rightIcon="cross"
					>
						Close
					</Button>
					<div role="banner" className="title">
						<a href={props.logo.url}>
							<picture>
								<source {...props.logo.sourceProps} />
								<img {...props.logo.imgProps} alt={props.logo.titleText} />
							</picture>
						</a>
					</div>
				</header>
				<nav role="navigation">
					<h3>Menu</h3>
					<ul>
						{props.menuNav.map((itemGroup) =>
							itemGroup.map((item, idx) => {
								return (
									<li
										key={item.title}
										className={classNames([
											idx === itemGroup.length - 1 && 'end-of-group',
											item.isMobileOnly && 'hidden-wide',
										])}
									>
										<a href={item.url}>{item.title}</a>
									</li>
								);
							}),
						)}
					</ul>
				</nav>
			</div>
		</div>
	);
};

export default CollapsibleHeader;
