import React, { useState } from 'react';
import { DragDropContext } from 'react-beautiful-dnd';
import { Button } from '@blueprintjs/core';

import { generateHash } from 'utils/hashes';

import PageAutocomplete from './PageAutocomplete';
import NavBuilderList from './NavBuilderList';
import NavBuilderRow from './NavBuilderRow';

require('./navBuilder.scss');

type OwnProps = {
	initialNav: any[];
	prefix?: any[];
	suffix?: any[];
	pages: any[];
	onChange: (...args: any[]) => any;
	disableDropdown?: boolean;
};

const defaultProps = {
	prefix: [],
	suffix: [],
	disableDropdown: false,
};

type Props = OwnProps & typeof defaultProps;

const NavBuilder = (props: Props) => {
	const { initialNav, pages, onChange, prefix, suffix, disableDropdown } = props;
	const [currentNav, setCurrentNav] = useState(initialNav);
	const userSetElements = currentNav.slice(prefix.length, currentNav.length - suffix.length);

	const reorder = (list, startIndex, endIndex) => {
		const result = Array.from(list);
		const [removed] = result.splice(startIndex, 1);
		result.splice(endIndex, 0, removed);

		return result;
	};
	const onDragEnd = (result) => {
		if (result.destination) {
			const nextUserElements =
				result.destination.droppableId === 'main-list'
					? reorder(userSetElements, result.source.index, result.destination.index)
					: userSetElements.map((item) => {
							if (item.id === result.destination.droppableId) {
								return {
									...item,
									children: reorder(
										item.children,
										result.source.index,
										result.destination.index,
									),
								};
							}
							return item;
					  });
			const newNav = [...prefix, ...nextUserElements, ...suffix];
			setCurrentNav(newNav);
			onChange(newNav);
		}
	};
	const addItem = (newItem) => {
		const newNav = [...prefix, newItem, ...userSetElements, ...suffix];
		setCurrentNav(newNav);
		onChange(newNav);
	};
	const updateItem = (dropdownId, index, newItemValues) => {
		const nextUserElements =
			dropdownId === 'main-list'
				? userSetElements.map((item, currIndex) => {
						return currIndex === index ? { ...item, ...newItemValues } : item;
				  })
				: userSetElements.map((item) => {
						if (item.id === dropdownId) {
							return {
								...item,
								children: item.children.map((subItem, subCurrIndex) => {
									return subCurrIndex === index
										? { ...subItem, ...newItemValues }
										: subItem;
								}),
							};
						}
						return item;
				  });
		const newNav = [...prefix, ...nextUserElements, ...suffix];
		setCurrentNav(newNav);
		onChange(newNav);
	};
	const removeItem = (itemId, dropdownId) => {
		const nextUserElements =
			dropdownId === 'main-list'
				? userSetElements.filter((item) => {
						return item.id !== itemId && item !== itemId;
				  })
				: userSetElements.map((item) => {
						if (item.id === dropdownId) {
							return {
								...item,
								children: item.children.filter((subItem) => {
									return subItem.id !== itemId && subItem !== itemId;
								}),
							};
						}
						return item;
				  });
		const newNav = [...prefix, ...nextUserElements, ...suffix];
		setCurrentNav(newNav);
		onChange(newNav);
	};

	const newLink = { id: generateHash(8), title: 'Link Title', href: '' };
	const newDropdown = { id: generateHash(8), title: 'Menu Title', children: [] };
	return (
		<div className="nav-builder-component">
			<style>{`body { height: 100vh; overflow: scroll }`}</style>
			<div className="new-items">
				<PageAutocomplete
					pages={pages}
					placeholder="Add Page"
					// @ts-expect-error ts-migrate(2322) FIXME: Type 'any' is not assignable to type 'never'.
					usedItems={pages.filter((item) => {
						return currentNav.includes(item.id);
					})}
					// @ts-expect-error ts-migrate(2322) FIXME: Type '(newItem: any) => void' is not assignable to... Remove this comment to see the full error message
					onSelect={(newItem) => {
						addItem(newItem.id);
					}}
				/>
				<Button
					small
					text="Add Link"
					onClick={() => {
						addItem(newLink);
					}}
				/>
				{!disableDropdown && (
					<Button
						small
						text="Add Dropdown Menu"
						onClick={() => {
							addItem(newDropdown);
						}}
					/>
				)}
			</div>
			<DragDropContext onDragEnd={onDragEnd}>
				<div className="items">
					{prefix.map((item, index) => {
						const key = `prefix-${index}`;
						/* Use wrapper div to get margin-collapse styling right */
						return (
							<div key={key} className="nav-builder-row">
								<NavBuilderRow item={item} pages={pages} isStatic={true} />
							</div>
						);
					})}
					<NavBuilderList
						id="main-list"
						// @ts-expect-error ts-migrate(2322) FIXME: Type 'any[]' is not assignable to type 'never[]'.
						items={userSetElements}
						removeItem={removeItem}
						updateItem={updateItem}
						pages={pages}
						newLink={newLink}
						disableDropdown={disableDropdown}
					/>
					{suffix.map((item, index) => {
						const key = `suffix-${index}`;
						/* Use wrapper div to get margin-collapse styling right */
						return (
							<div key={key} className="nav-builder-row">
								<NavBuilderRow item={item} pages={pages} isStatic={true} />
							</div>
						);
					})}
				</div>
			</DragDropContext>
		</div>
	);
};
NavBuilder.defaultProps = defaultProps;
export default NavBuilder;
