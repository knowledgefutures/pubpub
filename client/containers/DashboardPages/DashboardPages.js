import React from 'react';
import PropTypes from 'prop-types';
import { usePageContext } from 'utils/hooks';

require('./dashboardPages.scss');

const propTypes = {
	pagesData: PropTypes.object.isRequired,
};

const DashboardPages = (props) => {
	const { pagesData } = props;
	const { locationData, communityData, scopeData } = usePageContext();

	const activePage = communityData.pages.find((page) => {
		return locationData.params.subMode === (page.slug || 'home');
	});
	const title = activePage ? activePage.title : 'Pages';
	return (
		<div className="dashboard-pages-container">
			<h2 className="dashboard-content-header">{title}</h2>
			{!activePage && (
				<ul>
					{communityData.pages.map((page) => {
						return (
							<li key={page.id}>
								<a href={`/dash/pages/${page.slug || 'home'}`}>{page.title}</a>
							</li>
						);
					})}
				</ul>
			)}
			{activePage && <div>Put PageEdit tools here</div>}
		</div>
	);
};

DashboardPages.propTypes = propTypes;
export default DashboardPages;
