import React from 'react';
import { Provider as RKProvider } from 'reakit';
import classNames from 'classnames';

import {
	Header,
	Footer,
	LegalBanner,
	AccentStyle,
	NavBar,
	SkipLink,
	MobileAware,
	FacetsStateProvider,
} from 'components';
import { PageContext } from 'utils/hooks';
import { hydrateWrapper } from 'client/utils/hydrateWrapper';

import SideMenu from './SideMenu';
import Breadcrumbs from './Breadcrumbs';
import BottomMenu from './BottomMenu';

import getPaths from './paths';
import { usePageState } from './usePageState';

require('../../styles/base.scss');
require('./app.scss');

type Props = {
	chunkName: string;
	initialData: any;
	viewData: any;
};

const App = (props: Props) => {
	const { chunkName, initialData, viewData } = props;
	const pageContextProps = usePageState(initialData, viewData);
	const { communityData, locationData, scopeData } = pageContextProps;

	const pathObject = getPaths(viewData, locationData, chunkName);
	const { ActiveComponent, hideNav, hideFooter, isDashboard } = pathObject;

	// Our debugging lifeline
	if (typeof window !== 'undefined') {
		// @ts-expect-error ts-migrate(2339) FIXME: Property '__pubpub_pageContextProps__' does not ex... Remove this comment to see the full error message
		window.__pubpub_pageContextProps__ = pageContextProps;
	}

	const showNav = !hideNav && !communityData.hideNav && !isDashboard;
	const showFooter = !hideFooter && !isDashboard;
	return (
		<PageContext.Provider value={pageContextProps}>
			<FacetsStateProvider
				options={{ currentScope: scopeData.scope, cascadeResults: scopeData.facets }}
			>
				<RKProvider>
					<div id="app" className={classNames({ dashboard: isDashboard })}>
						<AccentStyle communityData={communityData} isNavHidden={!showNav} />
						{(locationData.isDuqDuq || locationData.isQubQub) && (
							<div className="duqduq-warning">Development Environment</div>
						)}
						<SkipLink targetId="main-content">Skip to main content</SkipLink>
						<LegalBanner />
						<Header />
						{showNav && <NavBar />}
						{isDashboard && (
							<MobileAware
								mobile={({ className }) => (
									<BottomMenu isMobile className={className} />
								)}
								desktop={({ className }) => (
									<>
										<SideMenu className={className} />
										<Breadcrumbs className={className} />
									</>
								)}
							/>
						)}
						{/* @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'number | ... Remove this comment to see the full error message */}
						<div id="main-content" tabIndex="-1">
							<ActiveComponent {...viewData} />
						</div>
						{showFooter && <Footer />}
					</div>
				</RKProvider>
			</FacetsStateProvider>
		</PageContext.Provider>
	);
};
export default App;

hydrateWrapper(App);
