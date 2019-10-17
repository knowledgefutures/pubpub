import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Header, Footer, GdprBanner, AccentStyle, NavBar, Icon } from 'components';
import { populateNavigationIds } from 'utils';
import SideMenu from './SideMenu';
import Breadcrumbs from './Breadcrumbs';

require('./pageWrapper.scss');

const propTypes = {
	communityData: PropTypes.object.isRequired,
	loginData: PropTypes.object.isRequired,
	locationData: PropTypes.object.isRequired,
	children: PropTypes.node.isRequired,
	isDashboard: PropTypes.bool,
	hideNav: PropTypes.bool,
	hideFooter: PropTypes.bool,
};

const defaultProps = {
	isDashboard: false,
	hideNav: false,
	hideFooter: false,
};

export const PageContext = React.createContext({});

const PageWrapper = (props) => {
	const {
		loginData,
		communityData,
		locationData,
		children,
		isDashboard,
		hideNav,
		hideFooter,
	} = props;
	const pages = communityData.pages || [];
	const navigation = communityData.navigation || [];
	const navItems = populateNavigationIds(pages, navigation);
	const socialItems = [
		{
			id: 'si-0',
			icon: <Icon icon="globe" />,
			title: 'Website',
			value: communityData.website,
			url: communityData.website,
		},
		{
			id: 'si-1',
			icon: <Icon icon="twitter" />,
			title: 'Twitter',
			value: communityData.twitter,
			url: `https://twitter.com/${communityData.twitter}`,
		},
		{
			id: 'si-2',
			icon: <Icon icon="facebook" />,
			title: 'Facebook',
			value: communityData.facebook,
			url: `https://facebook.com/${communityData.facebook}`,
		},
		{
			id: 'si-3',
			icon: <Icon icon="envelope" />,
			title: 'Contact',
			value: communityData.email,
			url: `mailto:${communityData.email}`,
		},
	].filter((item) => {
		return item.value;
	});

	const pageContextProps = {
		communityData: communityData,
		loginData: loginData,
		locationData: locationData,
	};

	const showNav = !hideNav && !communityData.hideNav && !isDashboard;
	const showFooter = !hideFooter && !isDashboard;
	return (
		<PageContext.Provider value={pageContextProps}>
			<div id="page-wrapper-component" className={classNames({ dashboard: isDashboard })}>
				<AccentStyle communityData={communityData} isNavHidden={!showNav} />

				{locationData.isDuqDuq && (
					<div className="duqduq-warning">Development Environment</div>
				)}

				<GdprBanner loginData={loginData} />

				<Header
					communityData={communityData}
					locationData={locationData}
					loginData={loginData}
				/>

				{showNav && <NavBar navItems={navItems} socialItems={socialItems} />}

				{isDashboard && (
					<div className="side-content">
						<SideMenu communityData={communityData} locationData={locationData} />
					</div>
				)}
				<div className="page-content">
					{isDashboard && (
						<Breadcrumbs communityData={communityData} locationData={locationData} />
					)}
					{children}
				</div>

				{showFooter && (
					<Footer
						isAdmin={loginData.isAdmin}
						isBasePubPub={locationData.isBasePubPub}
						communityData={communityData}
						socialItems={socialItems}
					/>
				)}
			</div>
		</PageContext.Provider>
	);
};

PageWrapper.propTypes = propTypes;
PageWrapper.defaultProps = defaultProps;
export default PageWrapper;
