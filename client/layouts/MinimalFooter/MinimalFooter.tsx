import React from 'react';

import { Icon, type IconName } from 'components';

import './minimalFooter.scss';

type MinimalFooterLink = {
	label: string;
	url?: string;
};

export type MinimalFooterProps = {
	communityData: any;
	leftItem: {
		title: string;
		image: string;
		url: string;
	};
	centerItems: {
		top: MinimalFooterLink[];
		bottom: MinimalFooterLink[];
	};
	rightItem: {
		label: string;
		url: string;
		icon: IconName;
	};
};

const MinimalFooter = (props: MinimalFooterProps) => {
	const { communityData } = props;
	const pubpubLogo =
		communityData.headerColorType === 'light'
			? '/static/logoBlack.svg'
			: '/static/logoWhite.svg';

	return (
		<div className="minimal-footer-component">
			<div className="left-column">
				<a
					key={props.leftItem.title}
					area-label={props.leftItem.title}
					href={props.leftItem.url}
				>
					<img alt={`${props.leftItem.title} logo`} src={props.leftItem.image} />
				</a>
			</div>
			<div className="right-column">
				<div className="nav-column">
					<ul className="top-row">
						{props.centerItems.top.map((item: MinimalFooterLink) => (
							<li key={item.label}>
								<a href={item.url}>{item.label}</a>
							</li>
						))}
					</ul>
					<div className="bottom-row">
						{props.centerItems.bottom.map((item: MinimalFooterLink) => (
							<span key={item.label}>{item.label}</span>
						))}
						<div className="built-on">
							<span>Published with</span>{' '}
							<img className="logo" src={pubpubLogo} alt="PubPub logo" />
						</div>
					</div>
				</div>
				<div className="social-column">
					<a
						className="icon"
						aria-label={props.rightItem.label}
						href={props.rightItem.url}
					>
						<Icon icon={props.rightItem.icon} iconSize={22} />
					</a>
				</div>
			</div>
		</div>
	);
};

export default MinimalFooter;
