import React from 'react';
import PropTypes from 'prop-types';
import { Provider as RKProvider } from 'reakit';
import classNames from 'classnames';

import { Header, Footer, LegalBanner, AccentStyle, NavBar, SkipLink } from 'components';
import { PageContext } from 'utils/hooks';
import { hydrateWrapper } from 'client/utils/hydrateWrapper';

import SideMenu from './SideMenu';
import Breadcrumbs from './Breadcrumbs';
import getPaths from './paths';
import { usePageState } from './usePageState';

require('../../styles/base.scss');
require('./app.scss');

const propTypes = {
	chunkName: PropTypes.string.isRequired,
	initialData: PropTypes.object.isRequired,
	viewData: PropTypes.object.isRequired,
};

const App = (props) => {
	const { chunkName, initialData, viewData } = props;
	const pageContextProps = usePageState(initialData);
	const { communityData, loginData, locationData } = pageContextProps;

	const pathObject = getPaths(viewData, locationData, chunkName);
	const { ActiveComponent, hideNav, hideFooter, isDashboard } = pathObject;

	// Our debugging lifeline
	if (typeof window !== 'undefined') {
		// eslint-disable-next-line no-underscore-dangle
		window.__pubpub_pageContextProps__ = pageContextProps;
	}

	const showNav = !hideNav && !communityData.hideNav && !isDashboard;
	const showFooter = !hideFooter && !isDashboard;
	return (
		<PageContext.Provider value={pageContextProps}>
			<RKProvider>
				<div id="app" className={classNames({ dashboard: isDashboard })}>
					<AccentStyle communityData={communityData} isNavHidden={!showNav} />
					{locationData.isDuqDuq && (
						<div className="duqduq-warning">Development Environment</div>
					)}
					<SkipLink targetId="main-content">Skip to main content</SkipLink>
					<LegalBanner loginData={loginData} />
					<Header />
					{showNav && <NavBar />}
					{isDashboard && (
						<React.Fragment>
							<SideMenu />
							<Breadcrumbs />
						</React.Fragment>
					)}
					<div id="main-content" tabIndex="-1">
						<ActiveComponent {...viewData} />
					</div>
					{showFooter && <Footer />}
				</div>
			</RKProvider>
		</PageContext.Provider>
	);
};

App.propTypes = propTypes;
export default App;

hydrateWrapper(App);
