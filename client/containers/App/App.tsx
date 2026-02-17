import React, { type ReactNode } from 'react';

import classNames from 'classnames';
import { Provider as RKProvider } from 'reakit';
import { AnalyticsProvider } from 'use-analytics';

import {
	CollapsibleHeader,
	CollapsibleHeaderBPC,
	collapsibleHeaderData,
	collapsibleHeaderDataBPC,
	MinimalFooter,
	MinimalHeader,
	minimalFooterData,
	minimalHeaderData,
	TwoColumnFooter,
	twoColumnFooterData,
} from 'client/layouts';
import { hydrateWrapper } from 'client/utils/hydrateWrapper';
import {
	AccentStyle,
	FacetsStateProvider,
	Footer,
	Header,
	LegalBanner,
	MobileAware,
	NavBar,
	SkipLink,
} from 'components';
import { canUseCustomAnalyticsProvider } from 'utils/analytics/featureFlags';
import { useLazyLoadedAnalyticsInstance } from 'utils/analytics/useLazyLoadedAnalyticsInstance';
import { usePageOnce } from 'utils/analytics/usePageOnce';
import { PageContext } from 'utils/hooks';

import BottomMenu from './BottomMenu';
import Breadcrumbs from './Breadcrumbs';
import getPaths from './paths';
import SideMenu from './SideMenu';
import SpamBanner from './SpamBanner';
import { usePageState } from './usePageState';

import '../../styles/base.scss';
import './app.scss';

type Props = {
	chunkName: string;
	initialData: any;
	viewData: any;
};

const App = (props: Props) => {
	const { chunkName, initialData, viewData } = props;
	const pageContextProps = usePageState(initialData, viewData);

	const { communityData, locationData, scopeData, loginData, featureFlags, gdprConsent } =
		pageContextProps;

	const { analyticsSettings } = communityData;

	const analyticsInstance = useLazyLoadedAnalyticsInstance({
		canUseCustomAnalyticsProvider: canUseCustomAnalyticsProvider(featureFlags),
		analyticsSettings,
		gdprConsent,
		locationData,
	});

	usePageOnce({
		analyticsInstance,
		initialData,
		viewData,
		gdprConsent,
	});

	const pathObject = getPaths(viewData, locationData, chunkName);
	const { ActiveComponent, hideNav, hideFooter, hideHeader, isDashboard } = pathObject;

	// Our debugging lifeline
	if (typeof window !== 'undefined') {
		window.__pubpub_pageContextProps__ = pageContextProps;
	}

	const usingMinimalHeader = featureFlags['minimal-header'];
	const usingMinimalFooter = featureFlags['minimal-footer'];
	const usingTwoColumnFooter = featureFlags['two-column-footer'];
	const usingCollapsibleHeader = featureFlags['collapsible-header'];
	const usingCollapsibleHeaderBPC = featureFlags['collapsible-header-bpc'];
	const showNav =
		!hideNav &&
		!communityData.hideNav &&
		!isDashboard &&
		!usingMinimalHeader &&
		!usingCollapsibleHeader &&
		!usingCollapsibleHeaderBPC;
	const showFooter = !hideFooter && !isDashboard;
	const showHeader = !hideHeader;

	let header: ReactNode;
	let footer: ReactNode;

	if (usingMinimalHeader && !isDashboard) {
		header = (
			<MinimalHeader
				{...minimalHeaderData}
				locationData={locationData}
				loginData={loginData}
			/>
		);
	} else if (usingCollapsibleHeader && !isDashboard) {
		header = <CollapsibleHeader {...collapsibleHeaderData} />;
	} else if (usingCollapsibleHeaderBPC && !isDashboard) {
		header = <CollapsibleHeaderBPC {...collapsibleHeaderDataBPC} />;
	} else {
		header = <Header />;
	}

	if (usingMinimalFooter && !isDashboard) {
		footer = <MinimalFooter {...minimalFooterData} communityData={communityData} />;
	} else if (usingTwoColumnFooter && !isDashboard) {
		footer = (
			<TwoColumnFooter {...twoColumnFooterData} showEmailCallToAction showInvestorLogos />
		);
	} else {
		footer = <Footer />;
	}

	return (
		<PageContext.Provider value={pageContextProps}>
			<AnalyticsProvider instance={analyticsInstance}>
				<FacetsStateProvider
					options={{ currentScope: scopeData.scope, cascadeResults: scopeData.facets }}
				>
					<RKProvider>
						<div id="app" className={classNames({ dashboard: isDashboard })}>
							{communityData.spamTag &&
								communityData.spamTag.status !== 'confirmed-not-spam' && (
									<SpamBanner status={communityData.spamTag.status} />
								)}
							<AccentStyle communityData={communityData} isNavHidden={!showNav} />
							{(locationData.isDuqDuq || locationData.isQubQub) && (
								<div className="duqduq-warning">Development Environment</div>
							)}
							<SkipLink targetId="main-content">Skip to main content</SkipLink>
							<LegalBanner />
							{showHeader && header}
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
							<div id="main-content" tabIndex={-1}>
								<ActiveComponent {...viewData} />
							</div>
							{showFooter && footer}
						</div>
					</RKProvider>
				</FacetsStateProvider>
			</AnalyticsProvider>
		</PageContext.Provider>
	);
};
export default App;

hydrateWrapper(App);
