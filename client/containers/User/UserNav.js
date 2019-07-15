import React from 'react';
import PropTypes from 'prop-types';

require('./userNav.scss');

const propTypes = {
	userSlug: PropTypes.string,
	activeTab: PropTypes.string,
	allPubsCount: PropTypes.number,
	authoredPubsCount: PropTypes.number,
};

const defaultProps = {
	activeTab: undefined,
	userSlug: '',
	allPubsCount: 0,
	authoredPubsCount: 0,
};

const UserNav = function(props) {
	const tabs = [
		{ id: 0, label: `All Pubs (${props.allPubsCount})`, path: '' },
		{ id: 1, label: `Authored Pubs (${props.authoredPubsCount})`, path: '/authored' },
		// { id: 1, label: 'All Pubs', path: '/pubs' },
		// { id: 2, label: 'Discussions', path: '/discussions' },
	];
	return (
		<div className="user-nav-component">
			<div className="bp3-tabs">
				<div className="bp3-tab-list bp3-large" role="tablist">
					{tabs.map((tab) => {
						return (
							<a
								key={`tab-${tab.id}`}
								href={`/user/${props.userSlug}${tab.path}`}
								className="bp3-tab"
								role="tab"
								aria-selected={
									tab.path.indexOf(props.activeTab) > -1 ||
									(!tab.path && !props.activeTab)
										? 'true'
										: 'false'
								}
							>
								{tab.label}
							</a>
						);
					})}
				</div>
			</div>
		</div>
	);
};

UserNav.defaultProps = defaultProps;
UserNav.propTypes = propTypes;
export default UserNav;
