import React from 'react';
import PropTypes from 'prop-types';
import { Provider as RKProvider } from 'reakit';

import { hydrateWrapper } from 'utils';
import classNames from 'classnames';
import { Header, Footer, LegalBanner, AccentStyle, NavBar, SkipLink } from 'components';
import { PageContext } from 'utils/hooks';
import SideMenu from './SideMenu';
import Breadcrumbs from './Breadcrumbs';
import getPaths from './paths';

require('../../styles/base.scss');
require('./app.scss');

const propTypes = {
	chunkName: PropTypes.string.isRequired,
	initialData: PropTypes.object.isRequired,
	viewData: PropTypes.object.isRequired,
};

const App = (props) => {
	const { chunkName, initialData, viewData } = props;
	const { loginData, communityData, locationData, scopeData } = initialData;
	const pathObject = getPaths(viewData, locationData, chunkName);
	const { ActiveComponent, hideNav, hideFooter, isDashboard } = pathObject;

	const pageContextProps = {
		communityData: communityData,
		loginData: loginData,
		locationData: locationData,
		scopeData: scopeData,
	};

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
					<div id="main-content" tabIndex="-1" className="page-content">
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
