import React from 'react';
import PropTypes from 'prop-types';

import { Avatar } from 'components';

require('./contributorCondensed.scss');

const propTypes = {
	attribution: PropTypes.object.isRequired,
};

const ContributorCondensed = function (props) {
	const { attribution } = props;
	const { user } = attribution;
	const avatarElement = user.slug ? (
		<a href={`/user/${user.slug}`}>
			<Avatar initials={user.initials} avatar={user.avatar} width={20} />
		</a>
	) : (
		<Avatar initials={user.initials} avatar={user.avatar} width={20} />
	);

	const nameElement = user.slug ? (
		<a href={`/user/${user.slug}`} className="hoverline">
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
		<div className="contributors-list-condensed_contributor-component">
			<div className="avatar-wrapper">{avatarElement}</div>{' '}
			<div className="details-wrapper">
				<div className="name">{nameElement}</div>
			</div>
			<div className="separator">{' • '}</div>
			{!!rolesString && (
				<div className="roles pub-header-themed-secondary">{rolesString}</div>
			)}
		</div>
	);
};

ContributorCondensed.propTypes = propTypes;
export default ContributorCondensed;
