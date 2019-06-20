import React from 'react';
import PropTypes from 'prop-types';
import Avatar from 'components/Avatar/Avatar';

require('./contributor.scss');

const propTypes = {
	attribution: PropTypes.object.isRequired,
};

const Contributor = function(props) {
	const { attribution } = props;
	const { user, affiliation } = attribution;
	const avatarElement = user.slug ? (
		<a href={`/user/${user.slug}`}>
			<Avatar userInitials={user.initials} userAvatar={user.avatar} width={30} />
		</a>
	) : (
		<Avatar userInitials={user.initials} userAvatar={user.avatar} width={30} />
	);

	const nameElement = user.slug ? (
		<a href={`/user/${user.slug}`} className="underline-on-hover">
			{user.fullName}
		</a>
	) : (
		<span>{user.fullName}</span>
	);

	const rolesString = (attribution.roles || []).reduce((prev, curr) => {
		if (prev) {
			return `${prev}, ${curr}`;
		}
		return curr;
	}, '');

	return (
		<div className="pub-contributors_contributor-component">
			<div className="avatar-wrapper">{avatarElement}</div>
			<div className="details-wrapper">
				<div className="name">{nameElement}</div>
				<div>{user.title}</div>
				{affiliation && <div className="affiliation">{affiliation}</div>}
				{!!rolesString && <div className="roles">Roles: {rolesString}</div>}
			</div>
		</div>
	);
};

Contributor.propTypes = propTypes;
export default Contributor;
