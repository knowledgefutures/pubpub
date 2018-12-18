import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Avatar from 'components/Avatar/Avatar';
import { Popover, PopoverInteractionKind, Position, Menu, MenuItem, MenuDivider, Button } from '@blueprintjs/core';
import { apiFetch, getResizedUrl } from 'utilities';

require('./header.scss');

const propTypes = {
	communityData: PropTypes.object.isRequired,
	locationData: PropTypes.object.isRequired,
	loginData: PropTypes.object.isRequired,

	// smallHeaderLogo: PropTypes.string,
	// largeHeaderLogo: PropTypes.string,
	// largeHeaderDescription: PropTypes.string,
	// largeHeaderBackground: PropTypes.string,
};

// const defaultProps = {
// 	smallHeaderLogo: undefined,
// 	largeHeaderLogo: undefined,
// 	largeHeaderDescription: undefined,
// 	largeHeaderBackground: undefined,
// };

class Header extends Component {
	constructor(props) {
		super(props);
		this.state = {
		// 	redirect: '',
			isLoading: false,
		};
		this.handleLogout = this.handleLogout.bind(this);
		this.createPub = this.createPub.bind(this);
	}

	// componentDidMount() {
	// 	if (window.location.pathname !== '/') {
	// 		this.setState({
	// 			redirect: `?redirect=${window.location.pathname}${window.location.search}`
	// 		});
	// 	}
	// }

	handleLogout() {
		apiFetch('/api/logout')
		.then(()=> { window.location.href = '/'; });
	}

	createPub() {
		this.setState({ isLoading: true });
		return apiFetch('/api/pubs', {
			method: 'POST',
			body: JSON.stringify({
				communityId: this.props.communityData.id,
				defaultTagIds: this.props.communityData.defaultPubTags || [],
			})
		})
		.then((result)=> {
			window.location.href = result;
		})
		.catch((err)=> {
			console.error(err);
			this.setState({ isLoading: false });
		});
	}

	render() {
		const communityData = this.props.communityData;
		const locationData = this.props.locationData;
		// console.log(locationData);
		// console.log(communityData);
		const isPage = communityData.pages && communityData.pages.reduce((prev, curr)=> {
			if (curr.slug === locationData.params.slug || (!curr.slug && locationData.path === '/')) {
				return true;
			}
			return prev;
		}, false);
		const isAdmin = this.props.loginData.isAdmin;
		const loggedIn = !!this.props.loginData.slug;
		const isBasePubPub = this.props.locationData.isBasePubPub;
		const showLandingBanner = this.props.locationData.path === '/' && !this.props.communityData.hideLandingBanner;
		const showGradient = showLandingBanner && !!communityData.largeHeaderBackground;
		const backgroundStyle = {};

		if (showGradient) {
			const resizedBackground = getResizedUrl(communityData.largeHeaderBackground, 'fit-in', '1500x600');
			backgroundStyle.backgroundImage = `url("${resizedBackground}")`;
		}
		if (isBasePubPub && !showLandingBanner) {
			backgroundStyle.boxShadow = '0 0 0 1px rgba(16, 22, 26, 0.1), 0 0 0 rgba(16, 22, 26, 0), 0 1px 1px rgba(16, 22, 26, 0.2)';
		}

		const resizedSmallHeaderLogo = getResizedUrl(communityData.smallHeaderLogo, 'fit-in', '0x50');
		const resizedLargeHeaderLogo = getResizedUrl(communityData.largeHeaderLogo, 'fit-in', '0x200');
		const useAccentsString = isBasePubPub ? '' : 'accent-background accent-color';

		const redirectString = `?redirect=${locationData.path}${locationData.queryString.length > 1 ? locationData.queryString : ''}`;
		return (
			<nav className={`header-component ${useAccentsString} ${communityData.largeHeaderBackground && showLandingBanner ? 'has-image' : ''}`} style={backgroundStyle}>
				<div className={showGradient ? 'header-gradient' : ''}>
					<div className="container">
						<div className="row">
							<div className="col-12">

								{/* App Logo - do not show on homepage */}
								{(!showLandingBanner || isBasePubPub) &&
									<div className="header-items header-items-left">
										<a href="/">
											{communityData.smallHeaderLogo &&
												<img alt="header logo" className="headerLogo" style={isBasePubPub ? { padding: '3px 0px' } : {}} src={resizedSmallHeaderLogo} />
											}
											{!communityData.smallHeaderLogo &&
												<span className="headerTitle">{this.props.communityData.title}</span>
											}
										</a>
									</div>
								}

								<div className="header-items header-items-right">

									{isBasePubPub &&
										[
											<a href="/about" role="button" tabIndex="0" className="hide-on-mobile bp3-button bp3-large bp3-minimal">About</a>,
											/* <a href="/features" role="button" tabIndex="0" className="bp3-button bp3-large bp3-minimal">Features</a>, */
											<a href="/pricing" role="button" tabIndex="0" className="hide-on-mobile bp3-button bp3-large bp3-minimal">Pricing</a>,
											<a href="/search" role="button" tabIndex="0" className="hide-on-mobile bp3-button bp3-large bp3-minimal">Search</a>,
											<a href="mailto:team@pubpub.org" target="_blank" rel="noopener noreferrer" role="button" tabIndex="0" className="hide-on-mobile bp3-button bp3-large bp3-minimal">Contact</a>,
											<span className="hide-on-mobile separator">·</span>,
										]
									}
									{/* Search button */}
									{/* <a href="/search" role="button" tabIndex="0" className="bp3-button bp3-large bp3-minimal bp3-icon-search" /> */}
									{/* <a className="bp3-button bp3-large bp3-minimal">Search</a> */}

									{/* Dashboard panel button */}
									{!isBasePubPub && loggedIn && (!communityData.hideCreatePubButton || isAdmin) &&
										<Button
											className="bp3-large bp3-minimal nav-link"
											text="New Pub"
											onClick={this.createPub}
											loading={this.state.isLoading}
										/>
									}
									{!isBasePubPub &&
										<a href="/search" role="button" tabIndex="0" className="hide-on-mobile bp3-button bp3-large bp3-minimal">Search</a>
									}
									{isAdmin && isPage &&
										<a href={`/dashboard/pages/${this.props.locationData.params.slug || ''}`} className="bp3-button bp3-large bp3-minimal">Manage</a>
									}
									{isAdmin && !isPage &&
										<a href="/dashboard" className="bp3-button bp3-large bp3-minimal">Manage</a>
									}
									{/* User avatar and menu */}
									{loggedIn &&
										<Popover
											content={
												<Menu>
													<li>
														<a href={`/user/${this.props.loginData.slug}`} className="bp3-menu-item bp3-popover-dismiss">
															<div>{this.props.loginData.fullName}</div>
															<div className="subtext">View Profile</div>
														</a>
													</li>
													<MenuDivider />
													{/* !isBasePubPub &&
														<li>
															<a href="/pub/create" className="bp3-menu-item bp3-popover-dismiss">
																Create New Pub
															</a>
														</li>
													*/ }
													{/* !isBasePubPub && isAdmin &&
														<li>
															<a href="/dashboard" className="bp3-menu-item bp3-popover-dismiss">
																Manage Community
															</a>
														</li>
													*/}
													<MenuItem text="Logout" onClick={this.handleLogout} />
												</Menu>
											}
											interactionKind={PopoverInteractionKind.CLICK}
											position={Position.BOTTOM_RIGHT}
											transitionDuration={-1}
											inheritDarkTheme={false}
										>
											<button type="button" className="bp3-button bp3-large bp3-minimal avatar-button">
												<Avatar
													userInitials={this.props.loginData.initials}
													userAvatar={this.props.loginData.avatar}
													width={30}
												/>
											</button>
										</Popover>
									}

									{/* Login or Signup button */}
									{!loggedIn &&
										<a href={`/login${redirectString}`} className="bp3-button bp3-large bp3-minimal">Login or Signup</a>
									}
								</div>
							</div>
						</div>
					</div>
				</div>
				{showLandingBanner && !isBasePubPub &&
					<div className="community-header">
						<div className="container">
							<div className="row">
								<div className="col-12">
									{communityData.largeHeaderLogo &&
										<img alt="community logo" className="logo" src={resizedLargeHeaderLogo} />
									}
									{!communityData.largeHeaderLogo &&
										<div className="title">{this.props.communityData.title}</div>
									}
									<div className="description">{communityData.largeHeaderDescription}</div>
								</div>
							</div>
						</div>
					</div>
				}
			</nav>
		);
	}
}

// Header.defaultProps = defaultProps;
Header.propTypes = propTypes;
export default Header;
