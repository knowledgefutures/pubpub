import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Button, InputGroup } from '@blueprintjs/core';
import PageAutocomplete from './PageAutocomplete';

const propTypes = {
	dropdownId: PropTypes.string,
	index: PropTypes.number,
	item: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
	updateItem: PropTypes.func,
	removeItem: PropTypes.func,
	pages: PropTypes.array.isRequired,
	newLink: PropTypes.object,
	isStatic: PropTypes.bool,
	NavBuilderList: PropTypes.func,
};

const defaultProps = {
	dropdownId: undefined,
	NavBuilderList: undefined,
	isStatic: false,
	newLink: undefined,
	updateItem: () => {},
	removeItem: () => {},
	index: undefined,
};

const NavBuilderRow = (props) => {
	const {
		dropdownId,
		NavBuilderList,
		index,
		item,
		pages,
		updateItem,
		removeItem,
		newLink,
		isStatic,
	} = props;
	const data = typeof item === 'string' ? pages.find((page) => page.id === item) : item;
	if (!data) {
		return null;
	}
	let type = 'page';
	if (typeof data.href === 'string' && !isStatic) {
		type = 'link';
	}
	if (data.children) {
		type = 'dropdown';
	}

	return (
		<div className={classNames({ 'nav-builder-row-component': true, static: isStatic })}>
			<div className="top">
				{type === 'page' && <div className="nav-title">{data.title}</div>}
				{type !== 'page' && (
					<InputGroup
						small
						placeholder="Title"
						onChange={(evt) => {
							updateItem(dropdownId, index, { title: evt.target.value });
						}}
						value={data.title}
					/>
				)}
				{type === 'link' && (
					<InputGroup
						small
						placeholder="https://www.example.com"
						onChange={(evt) => {
							updateItem(dropdownId, index, { href: evt.target.value });
						}}
						value={data.href}
					/>
				)}
				{type === 'dropdown' && (
					<React.Fragment>
						<PageAutocomplete
							pages={pages}
							placeholder="Add Page"
							usedItems={pages.filter((page) => {
								return data.children.includes(page.id);
							})}
							onSelect={(newItem) => {
								updateItem(dropdownId, index, {
									children: [newItem.id, ...item.children],
								});
							}}
						/>
						<Button
							small
							text="Add Link"
							onClick={() => {
								updateItem(dropdownId, index, {
									children: [newLink, ...item.children],
								});
							}}
						/>
					</React.Fragment>
				)}
			</div>
			{type === 'dropdown' && (
				<div className="children">
					<NavBuilderList
						id={item.id}
						items={item.children}
						removeItem={removeItem}
						updateItem={updateItem}
						pages={pages}
						newLink={newLink}
					/>
				</div>
			)}
		</div>
	);
};

NavBuilderRow.propTypes = propTypes;
NavBuilderRow.defaultProps = defaultProps;
export default NavBuilderRow;
