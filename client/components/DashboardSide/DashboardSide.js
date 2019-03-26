import React from 'react';
import PropTypes from 'prop-types';
import { AnchorButton } from '@blueprintjs/core';

require('./dashboardSide.scss');

const propTypes = {
	pages: PropTypes.array.isRequired,
	activeSlug: PropTypes.string,
	activeMode: PropTypes.string.isRequired,
};

const defaultProps = {
	activeSlug: null,
};

const DashboardSide = function(props) {
	const communityControls = [
		// {
		// 	title: 'Activity',
		// 	icon: 'bp3-icon-pulse',
		// 	slug: 'activity',
		// 	id: 0,
		// },
		{
			title: 'Pubs',
			icon: 'bp3-icon-document',
			slug: 'pubs',
			id: 0,
		},
		{
			title: 'Team',
			icon: 'bp3-icon-people',
			slug: 'team',
			id: 2,
		},
		{
			title: 'Collections',
			icon: 'bp3-icon-tag',
			slug: 'collections',
			id: 3,
		},
		{
			title: 'Settings',
			icon: 'bp3-icon-cog',
			slug: 'settings',
			id: 1,
		},
	];
	return (
		<div className="dashboard-side-component">
			<ul className="bp3-menu">
				<li className="bp3-menu-header">
					<h6>Site</h6>
				</li>
				{communityControls.map((control) => {
					return (
						<li key={`side-control-${control.id}`}>
							<a
								className={`bp3-menu-item ${props.activeMode === control.slug &&
									'bp3-active'} ${control.icon}`}
								tabIndex="0"
								href={`/dashboard/${control.slug}`}
							>
								{control.title}
							</a>
						</li>
					);
				})}
			</ul>
			<ul className="bp3-menu">
				<li className="bp3-menu-header">
					<AnchorButton
						href="/dashboard/page"
						className="bp3-small bp3-minimal title-button"
						icon="plus"
					/>
					<h6>Pages</h6>
				</li>
				{props.pages
					.sort((foo, bar) => {
						if (!foo.slug) {
							return -1;
						}
						if (!bar.slug) {
							return 1;
						}
						const fooTitle = foo.title.toLowerCase();
						const barTitle = bar.title.toLowerCase();
						if (fooTitle > barTitle) {
							return 1;
						}
						if (fooTitle < barTitle) {
							return -1;
						}
						return 0;
					})
					.map((page) => {
						const publicStatusIcon = page.isPublic ? 'bp3-icon-globe' : 'bp3-icon-lock';
						const pageIcon = page.slug ? publicStatusIcon : 'bp3-icon-home';
						const isActive = page.slug
							? props.activeSlug === page.slug
							: props.activeMode === 'pages';
						return (
							<li key={`side-page-${page.id}`}>
								<a
									className={`bp3-menu-item ${
										isActive ? 'bp3-active' : ''
									} ${pageIcon}`}
									tabIndex="0"
									href={`/dashboard/pages/${page.slug}`}
								>
									{page.title}
								</a>
							</li>
						);
					})}
			</ul>
		</div>
	);
};

DashboardSide.defaultProps = defaultProps;
DashboardSide.propTypes = propTypes;
export default DashboardSide;
