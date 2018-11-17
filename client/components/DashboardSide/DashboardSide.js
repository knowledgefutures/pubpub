import React from 'react';
import PropTypes from 'prop-types';
import { AnchorButton } from '@blueprintjs/core';

require('./dashboardSide.scss');

const propTypes = {
	pages: PropTypes.array.isRequired,
	activeTab: PropTypes.string,
};

const defaultProps = {
	activeTab: undefined,
};

const DashboardSide = function(props) {
	const communityControls = [
		// {
		// 	title: 'Activity',
		// 	icon: 'pt-icon-pulse',
		// 	slug: 'activity',
		// 	id: 0,
		// },
		{
			title: 'Pubs',
			icon: 'pt-icon-document',
			slug: 'pubs',
			id: 0,
		},
		{
			title: 'Details',
			icon: 'pt-icon-application',
			slug: 'details',
			id: 1,
		},
		{
			title: 'Team',
			icon: 'pt-icon-people',
			slug: 'team',
			id: 2,
		},
		{
			title: 'Tags',
			icon: 'pt-icon-tag',
			slug: 'tags',
			id: 3,
		},
	];
	return (
		<div className="dashboard-side-component">
			<ul className="pt-menu">
				<li className="pt-menu-header">
					<h6>Site</h6>
				</li>
				{communityControls.map((control)=> {
					return (
						<li key={`side-control-${control.id}`}>
							<a className={`pt-menu-item ${props.activeTab === control.slug && 'pt-active'} ${control.icon}`} tabIndex="0" href={`/dashboard/${control.slug}`}>
								{control.title}
							</a>
						</li>
					);
				})}
			</ul>
			<ul className="pt-menu">
				<li className="pt-menu-header">
					<AnchorButton
						href="/dashboard/page"
						className="pt-small pt-minimal title-button"
						icon="plus"
					/>
					<h6>Pages</h6>
				</li>
				{props.pages.sort((foo, bar)=> {
					if (!foo.slug) { return -1; }
					if (!bar.slug) { return 1; }
					const fooTitle = foo.title.toLowerCase();
					const barTitle = bar.title.toLowerCase();
					if (fooTitle > barTitle) { return 1; }
					if (fooTitle < barTitle) { return -1; }
					return 0;
				}).map((page)=> {
					const publicStatusIcon = page.isPublic ? 'pt-icon-globe' : 'pt-icon-lock';
					const pageIcon = page.slug
						? publicStatusIcon
						: 'pt-icon-home';
					const isActive = page.slug
						? props.activeTab === page.slug
						: props.activeTab === 'pages';
					return (
						<li key={`side-page-${page.id}`}>
							<a className={`pt-menu-item ${isActive ? 'pt-active' : ''} ${pageIcon}`} tabIndex="0" href={`/dashboard/pages/${page.slug}`}>
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
