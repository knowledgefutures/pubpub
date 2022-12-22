import React from 'react';
import PropTypes from 'prop-types';
import { Classes } from '@blueprintjs/core';

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

const UserNav = function (props) {
	const tabs = [
		{ id: 0, label: 'All Pubs', path: '', count: props.allPubsCount },
		{ id: 1, label: 'Attributed Pubs', path: '/authored', count: props.authoredPubsCount },
		// { id: 1, label: 'All Pubs', path: '/pubs' },
		// { id: 2, label: 'Discussions', path: '/discussions' },
	];
	return (
		<div className="user-nav-component">
			<div className={Classes.TABS}>
				<div className={`${Classes.TAB_LIST} ${Classes.LARGE}`} role="tablist">
					{tabs.map((tab) => {
						return (
							<a
								key={`tab-${tab.id}`}
								href={`/user/${props.userSlug}${tab.path}`}
								className={Classes.TAB}
								role="tab"
								aria-selected={
									tab.path.indexOf(props.activeTab) > -1 ||
									(!tab.path && !props.activeTab)
										? 'true'
										: 'false'
								}
								data-tab-related-count={tab.count}
							>
								{tab.label} {typeof tab.count !== 'undefined' && `(${tab.count})`}
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
