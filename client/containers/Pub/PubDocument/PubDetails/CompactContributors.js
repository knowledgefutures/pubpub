import React from 'react';
import PropTypes from 'prop-types';
import Avatar from 'components/Avatar/Avatar';

require('./compactContributors.scss');

const propTypes = {
	contributors: PropTypes.array.isRequired,
};

const CompactContributors = (props) => {
	const { contributors } = props;
	const maxContributorsInCompactView = 5;
	const contributorsWithAvatars = contributors.slice(0, maxContributorsInCompactView);
	const leftoverContributors = contributors.length - maxContributorsInCompactView;
	return (
		<div className="compact-contributors-component">
			{contributorsWithAvatars.map((contributor) => (
				<Avatar
					key={contributor.id}
					initials={contributor.user.initials}
					avatar={contributor.user.avatar}
					width={20}
				/>
			))}
			{leftoverContributors > 0 && <span>&amp; {leftoverContributors} more</span>}
		</div>
	);
};

CompactContributors.propTypes = propTypes;
export default CompactContributors;
