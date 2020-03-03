import React from 'react';
import PropTypes from 'prop-types';
import { Button } from '@blueprintjs/core';

import { usePageContext } from 'utils/hooks';
import DashboardFrame from '../App/DashboardFrame';

require('./dashboardPages.scss');

const propTypes = {
	pagesData: PropTypes.object.isRequired,
};

const DashboardPages = (props) => {
	const { pagesData } = props;
	const {
		locationData: { params: subMode },
		communityData,
		scopeData,
	} = usePageContext();

	const activePage = communityData.pages.find((page) => subMode === (page.slug || 'home'));
	const title = activePage ? activePage.title : 'Pages';

	const renderControls = () => {
		return <Button icon="plus">New Page</Button>;
	};

	return <DashboardFrame title={title} controls={renderControls()} />;
};

DashboardPages.propTypes = propTypes;
export default DashboardPages;
