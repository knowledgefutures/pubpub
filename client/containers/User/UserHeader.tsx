import React from 'react';
import PropTypes from 'prop-types';
import Avatar from 'components/Avatar/Avatar';
import Icon from 'components/Icon/Icon';
import { Classes } from '@blueprintjs/core';
import { SocialItem } from 'client/utils/navigation';

require('./userHeader.scss');

const propTypes = {
	userData: PropTypes.object.isRequired,
	isUser: PropTypes.bool,
};

const defaultProps = {
	isUser: false,
};

const UserHeader = function (props) {
	const links = [
		{ value: props.userData.location, icon: 'map-marker' as const, url: '' },
		{
			value: props.userData.website,
			icon: 'link' as const,
			url: props.userData.website,
		},
		{
			value: props.userData.orcid,
			icon: 'orcid' as const,
			url: `https://www.orcid.org/${props.userData.orcid}`,
		},
		{
			value: props.userData.github,
			icon: 'github' as const,
			url: `https://github.com/${props.userData.github}`,
		},
		{
			value: props.userData.facebook,
			icon: 'facebook' as const,
			url: `https://www.facebook.com/${props.userData.facebook}`,
		},
		{
			value: props.userData.twitter,
			icon: 'twitter' as const,
			url: `https://twitter.com/${props.userData.twitter}`,
		},
		{
			icon: 'instagram' as const,
			value: props.userData.instagram,
			url: `https://instagram.com/${props.userData.instagram}`,
		},
		{
			icon: 'mastodon' as const,
			value: props.userData.mastodon,
			url: `https://${props.userData.mastodon}`,
			additionalAttributes: {
				rel: 'me',
			},
		},
		{
			icon: 'linkedin' as const,
			value: props.userData.linkedin,
			url: `https://linkedin.com/in/${props.userData.linkedin}`,
		},
		{
			icon: 'bluesky' as const,
			value: props.userData.bluesky,
			url: `https://bsky.app/profile/@${props.userData.bluesky}`,
		},
		{
			value: props.userData.googleScholar,
			icon: 'google-scholar' as const,
			url: `https://scholar.google.com/citations?user=${props.userData.googleScholar}`,
		},
	] satisfies Omit<SocialItem, 'id' | 'title'>[];
	return (
		<div className="user-header-component">
			<div className="avatar-wrapper">
				<Avatar
					avatar={props.userData.avatar}
					initials={props.userData.initials}
					width={150}
				/>
				{props.isUser && (
					<div>
						<a
							href={`/user/${props.userData.slug}/edit`}
							className={`${Classes.BUTTON} ${Classes.INTENT_PRIMARY}`}
						>
							Edit Profile
						</a>
					</div>
				)}
			</div>
			<div className="details">
				<h1>{props.userData.fullName}</h1>
				{props.userData.title && <div className="title">{props.userData.title}</div>}
				{props.userData.bio && <div className="bio">{props.userData.bio}</div>}
				<div className="links">
					{links
						.filter((link) => {
							return link.value;
						})
						.map((link) => {
							return (
								<a
									key={`link-${link.icon}`}
									className={`${Classes.BUTTON} ${Classes.MINIMAL} ${
										!link.url ? 'no-click' : ''
									}`}
									href={link.url}
									rel={`noopener noreferrer${
										link.additionalAttributes?.rel
											? ` ${link.additionalAttributes.rel}`
											: ''
									}`}
								>
									<Icon icon={link.icon} />
									{link.value}
								</a>
							);
						})}
				</div>
			</div>
		</div>
	);
};

UserHeader.defaultProps = defaultProps;
UserHeader.propTypes = propTypes;
export default UserHeader;
