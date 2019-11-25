import React from 'react';
import PropTypes from 'prop-types';

import { GridWrapper } from 'components';
import Icon from 'components/Icon/Icon';
import { Menu, MenuItem } from 'components/Menu';

require('./navBar.scss');

const propTypes = {
	navItems: PropTypes.array.isRequired,
	socialItems: PropTypes.array.isRequired,
};

const NavBar = function(props) {
	return (
		<nav className="nav-bar-component accent-background accent-color">
			<GridWrapper>
				<ul className="nav-list">
					{props.navItems
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
									{item.children.map((subitem) => (
										<MenuItem
											key={subitem.slug}
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
				{!!props.socialItems.length && (
					<ul className="social-list">
						{props.socialItems.map((item) => {
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

NavBar.propTypes = propTypes;
export default NavBar;
