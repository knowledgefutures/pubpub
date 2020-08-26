import React from 'react';
import PropTypes from 'prop-types';

import { Avatar, Icon } from 'components';

require('./contributor.scss');

const propTypes = {
	attribution: PropTypes.object.isRequired,
};

const Contributor = function(props) {
	const { attribution } = props;
	const { user } = attribution;
	const avatarElement = user.slug ? (
		<a href={`/user/${user.slug}`}>
			<Avatar initials={user.initials} avatar={user.avatar} width={30} />
		</a>
	) : (
		<Avatar initials={user.initials} avatar={user.avatar} width={30} />
	);

	const nameElement = user.slug ? (
		<a href={`/user/${user.slug}`} className="hoverline">
			{user.fullName}
		</a>
	) : (
		<span>{user.fullName}</span>
	);

	const affiliation = attribution.affiliation || user.title;

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
				{user.orcid && (
					<div className="pub-header-themed-secondary orcid">
						<Icon icon="orcid" />
						<a
							href={`https://orcid.org/${user.orcid}`}
							target="_blank"
							rel="noopener noreferrer"
						>
							{user.orcid}
						</a>
					</div>
				)}
				{affiliation && (
					<div className="affiliation pub-header-themed-secondary">{affiliation}</div>
				)}
				{!!rolesString && (
					<div className="roles pub-header-themed-secondary">Roles: {rolesString}</div>
				)}
			</div>
		</div>
	);
};

Contributor.propTypes = propTypes;
export default Contributor;
