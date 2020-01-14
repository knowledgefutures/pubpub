import React from 'react';
import { GridWrapper } from 'components';
import Icon from 'components/Icon/Icon';
import { Menu, MenuItem } from 'components/Menu';
import { populateNavigationIds, generateSocialItems } from 'utils';
import { usePageContext } from 'utils/hooks';

require('./navBar.scss');

const NavBar = function() {
	const { communityData } = usePageContext();
	const pages = communityData.pages || [];
	const navigation = communityData.navigation || [];
	const navItems = populateNavigationIds(pages, navigation);
	const socialItems = generateSocialItems(communityData);
	return (
		<nav className="nav-bar-component accent-background accent-color">
			<GridWrapper>
				<ul className="nav-list">
					{navItems
						.filter((item) => {
							return !!item;
						})
						.map((item) => {
							/* Return Simple Link */
							if (!item.children) {
								return (
									<a href={`/${item.slug}`} key={`nav-item-${item.id}`}>
										<li>
											{!item.isPublic && <Icon icon="lock2" iconSize={14} />}
											{item.title}
										</li>
									</a>
								);
							}
							/* Return Dropdown */
							return (
								<Menu
									aria-label={item.title}
									disclosure={
										<li className="dropdown">
											{item.title}
											<span className="bp3-icon-standard bp3-icon-caret-down bp3-align-right" />
										</li>
									}
								>
									{item.children.map((subitem, index) => (
										<MenuItem
											// eslint-disable-next-line react/no-array-index-key
											key={index}
											href={`/${subitem.slug}`}
											icon={
												!subitem.isPublic && (
													<Icon icon="lock2" iconSize={14} />
												)
											}
											text={subitem.title}
										/>
									))}
								</Menu>
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
									<li>{item.icon}</li>
								</a>
							);
						})}
					</ul>
				)}
			</GridWrapper>
		</nav>
	);
};

export default NavBar;
