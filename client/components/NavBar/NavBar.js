import React from 'react';
import PropTypes from 'prop-types';
import { GridWrapper, Icon } from 'components';
import { Menu, MenuItem } from 'components/Menu';
import { populateNavigationIds, populateSocialItems } from 'utils/community';
import { usePageContext } from 'utils/hooks';

require('./navBar.scss');

const propTypes = {
	previewContext: PropTypes.object,
};

const defaultProps = {
	previewContext: undefined,
};

const NavBar = function(props) {
	const { communityData } = usePageContext(props.previewContext);
	const pages = communityData.pages || [];
	const navigation = communityData.navigation || [];
	const navItems = populateNavigationIds(pages, navigation);
	const socialItems = populateSocialItems(communityData);
	return (
		<nav className="nav-bar-component accent-background accent-color">
			<GridWrapper>
				<ul className="nav-list">
					{navItems
						.filter((item) => {
							return !!item;
						})
						.map((item) => {
							/* Return Dropdown */
							if (item.children) {
								return (
									<Menu
										aria-label={item.title}
										disclosure={
											<li className="dropdown">
												{item.title}
												<span className="bp3-icon-standard bp3-icon-caret-down bp3-align-right" />
											</li>
										}
										className="nav-bar-popover"
										key={`nav-item-${item.id}`}
									>
										{item.children.map((subitem, index) => {
											return (
												<MenuItem
													// eslint-disable-next-line react/no-array-index-key
													key={index}
													href={subitem.href || `/${subitem.slug}`}
													icon={
														subitem.slug &&
														!subitem.isPublic && (
															<Icon icon="lock2" iconSize={14} />
														)
													}
													rightElement={
														subitem.href && (
															<Icon icon="share" iconSize={14} />
														)
													}
													text={subitem.title}
												/>
											);
										})}
									</Menu>
								);
							}
							/* Return Custom Link */
							if (typeof item.href === 'string') {
								return (
									<a href={item.href} key={`nav-item-${item.id}`}>
										<li>
											{item.title}
											<Icon
												icon="share"
												iconSize={11}
												className="external-icon"
											/>
										</li>
									</a>
								);
							}
							/* Return Simple Link */
							return (
								<a href={`/${item.slug}`} key={`nav-item-${item.id}`}>
									<li>
										{!item.isPublic && <Icon icon="lock2" iconSize={14} />}
										{item.title}
									</li>
								</a>
							);
						})}
				</ul>
				{!!socialItems.length && (
					<ul className="social-list">
						{socialItems.map((item) => {
							return (
								<a
									href={item.url}
									key={`social-item-${item.id}`}
									aria-label={item.title}
								>
									<li>
										<Icon icon={item.icon} />
									</li>
								</a>
							);
						})}
					</ul>
				)}
			</GridWrapper>
		</nav>
	);
};

NavBar.propTypes = propTypes;
NavBar.defaultProps = defaultProps;
export default NavBar;
