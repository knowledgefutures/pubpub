import React from 'react';
import PropTypes from 'prop-types';
import Header from 'components/Header/Header';
import Footer from 'components/Footer/Footer';
import AccentStyle from 'components/AccentStyle/AccentStyle';
import NavBar from 'components/NavBar/NavBar';
import Icon from 'components/Icon/Icon';
import { populateNavigationIds } from 'utilities';

const propTypes = {
	communityData: PropTypes.object.isRequired,
	loginData: PropTypes.object.isRequired,
	locationData: PropTypes.object.isRequired,
	children: PropTypes.node.isRequired,
	fixHeader: PropTypes.bool,
	hideNav: PropTypes.bool,
	hideFooter: PropTypes.bool,
};

const defaultProps = {
	fixHeader: false,
	hideNav: false,
	hideFooter: false,
};

const PageWrapper = (props)=> {
	const loginData = props.loginData;
	const communityData = props.communityData;

	const pages = communityData.pages || [];
	const navigation = communityData.navigation || [];
	const navItems = populateNavigationIds(pages, navigation);
	const socialItems = [
		{ id: 'si-0', icon: <Icon icon="globe" />, title: 'Website', value: communityData.website, url: communityData.website },
		{ id: 'si-1', icon: <Icon icon="twitter" />, title: 'Twitter', value: communityData.twitter, url: `https://twitter.com/${communityData.twitter}` },
		{ id: 'si-2', icon: <Icon icon="facebook" />, title: 'Facebook', value: communityData.facebook, url: `https://facebook.com/${communityData.facebook}` },
		{ id: 'si-3', icon: <Icon icon="envelope" />, title: 'Contact', value: communityData.email, url: `mailto:${communityData.email}` },
	].filter((item)=> {
		return item.value;
	});

	const useBottomShadow = communityData.accentTextColor === '#000000';
	return (
		<div id="page-wrapper-component" className={useBottomShadow ? 'bottom-shadow' : ''}>
			{props.fixHeader &&
				<style>
					{`
						.header-component { position: fixed; width: 100%; z-index: 19; }
						.page-content { padding-top: 56px; }
					`}
				</style>
			}
			{useBottomShadow &&
				<style>
					{`
						nav:last-of-type { border-bottom: 1px solid #DDD; }
					`}
				</style>
			}

			<AccentStyle
				accentColor={communityData.accentColor}
				accentTextColor={communityData.accentTextColor}
				accentActionColor={communityData.accentActionColor}
				accentHoverColor={communityData.accentHoverColor}
				accentMinimalColor={communityData.accentMinimalColor}
			/>

			<Header
				communityData={props.communityData}
				locationData={props.locationData}
				loginData={props.loginData}
				// smallHeaderLogo={communityData.smallHeaderLogo}
				// largeHeaderLogo={communityData.largeHeaderLogo}
				// largeHeaderDescription={communityData.largeHeaderDescription}
				// largeHeaderBackground={communityData.largeHeaderBackground}
			/>

			{!props.hideNav && !props.communityData.hideNav &&
				<NavBar
					navItems={navItems}
					socialItems={socialItems}
				/>
			}

			<div className="page-content">
				{props.children}
			</div>

			{!props.hideFooter &&
				<Footer
					isAdmin={loginData.isAdmin}
					isBasePubPub={props.locationData.isBasePubPub}
					communityData={communityData}
					socialItems={socialItems}
				/>
			}
		</div>
	);
};

PageWrapper.propTypes = propTypes;
PageWrapper.defaultProps = defaultProps;
export default PageWrapper;
