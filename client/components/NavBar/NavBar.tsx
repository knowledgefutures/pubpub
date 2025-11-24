import React from 'react';

import { Icon as BlueprintIcon, Classes } from '@blueprintjs/core';
import PropTypes from 'prop-types';

import {
	createSocialNavItems,
	getNavItemsForCommunityNavigation,
	isNavbarMenu,
	type NavbarItem,
} from 'client/utils/navigation';
import { GridWrapper, Icon } from 'components';
import { Menu, MenuItem } from 'components/Menu';
import { usePageContext } from 'utils/hooks';

import './navBar.scss';

const propTypes = {
	previewContext: PropTypes.object,
};

const defaultProps = {
	previewContext: undefined,
};

const NavBar = function (props) {
	const { communityData } = usePageContext(props.previewContext);
	const { pages = [], collections = [], navigation } = communityData;
	const navItems = getNavItemsForCommunityNavigation({
		navigation: navigation ?? [],
		pages,
		collections,
	});
	const socialItems = createSocialNavItems(communityData, 'header');

	const renderMenuSubitem = (subitem: NavbarItem, index: number) => {
		if (!isNavbarMenu(subitem)) {
			return (
				<MenuItem
					key={index}
					href={subitem.href}
					icon={
						subitem.isPrivate && (
							<Icon icon="lock2" className="lock-icon" iconSize={14} />
						)
					}
					rightElement={
						subitem.isExternal && (
							<Icon icon="share" className="external-icon" iconSize={14} />
						)
					}
					text={subitem.title}
				/>
			);
		}
		return null;
	};

	const renderNavItem = (item: NavbarItem) => {
		if (isNavbarMenu(item)) {
			return (
				<Menu
					aria-label={item.title}
					disclosure={
						<li className="dropdown">
							<span className="title">{item.title}</span>
							<BlueprintIcon
								tagName="span"
								icon="caret-down"
								className={`${Classes.ICON_STANDARD} ${Classes.ALIGN_RIGHT}`}
							/>
						</li>
					}
					className="nav-bar-popover"
					key={`nav-item-${item.id}`}
				>
					{item.children.map(renderMenuSubitem)}
				</Menu>
			);
		}
		return (
			<li key={`nav-item-${item.id}`}>
				<a href={item.href}>
					{item.isPrivate && <Icon icon="lock2" className="lock-icon" iconSize={14} />}
					<span className="title">{item.title}</span>
					{item.isExternal && (
						<Icon icon="share" iconSize={11} className="external-icon" />
					)}
				</a>
			</li>
		);
	};

	const renderSocialItems = () => {
		if (socialItems.length) {
			return (
				<ul className="social-list">
					{socialItems.map((item) => {
						return (
							<li key={`social-item-${item.id}`}>
								<a
									href={item.url}
									aria-label={item.title}
									{...item.additionalAttributes}
								>
									<Icon icon={item.icon} />
								</a>
							</li>
						);
					})}
				</ul>
			);
		}
		return null;
	};

	return (
		<nav className="nav-bar-component accent-background accent-color">
			<GridWrapper>
				<div className="scrollable-nav">
					<ul className="nav-list">{navItems.filter((x) => x).map(renderNavItem)}</ul>
					<div className="overflow-gradient" />
				</div>
				{renderSocialItems()}
			</GridWrapper>
		</nav>
	);
};

NavBar.propTypes = propTypes;
NavBar.defaultProps = defaultProps;
export default NavBar;
