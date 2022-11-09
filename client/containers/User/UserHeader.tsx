import React from 'react';
import PropTypes from 'prop-types';
import Avatar from 'components/Avatar/Avatar';
import Icon from 'components/Icon/Icon';
import { Classes } from '@blueprintjs/core';

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
		{ id: 0, value: props.userData.location, icon: <Icon icon="map-marker" /> },
		{
			id: 1,
			value: props.userData.website,
			icon: <Icon icon="link" />,
			href: props.userData.website,
		},
		{
			id: 2,
			value: props.userData.orcid,
			icon: <Icon icon="orcid" />,
			href: `https://www.orcid.org/${props.userData.orcid}`,
		},
		{
			id: 3,
			value: props.userData.github,
			icon: <Icon icon="github" />,
			href: `https://github.com/${props.userData.github}`,
		},
		{
			id: 4,
			value: props.userData.facebook,
			icon: <Icon icon="facebook" />,
			href: `https://www.facebook.com/${props.userData.facebook}`,
		},
		{
			id: 5,
			value: props.userData.twitter,
			icon: <Icon icon="twitter" />,
			href: `https://twitter.com/${props.userData.twitter}`,
		},
		{
			id: 6,
			value: props.userData.googleScholar,
			icon: <Icon icon="google-scholar" />,
			href: `https://scholar.google.com/citations?user=${props.userData.googleScholar}`,
		},
	];
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
									key={`link-${link.id}`}
									className={`${Classes.BUTTON} ${Classes.MINIMAL} ${
										!link.href ? 'no-click' : ''
									}`}
									href={link.href}
									rel="noopener noreferrer"
								>
									{link.icon}
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
