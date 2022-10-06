import React, { useState } from 'react';
import { DragDropContext } from 'react-beautiful-dnd';
import { Button } from '@blueprintjs/core';

import { generateHash } from 'utils/hashes';
import { CommunityNavigationEntry, isCommunityNavigationMenu } from 'client/utils/navigation';

import PageCollectionAutocomplete from './PageCollectionAutocomplete';
import NavBuilderList from './NavBuilderList';
import NavBuilderRow from './NavBuilderRow';
import { NavBuilderContext } from './navBuilderContext';

require('./navBuilder.scss');

type Props = {
	initialNav: CommunityNavigationEntry[];
	prefix?: CommunityNavigationEntry[];
	suffix?: CommunityNavigationEntry[];
	pages: any[];
	collections: any[];
	onChange: (...args: any[]) => any;
	disableDropdown?: boolean;
};

const NavBuilder = (props: Props) => {
	const {
		initialNav,
		pages,
		collections,
		onChange,
		prefix = [],
		suffix = [],
		disableDropdown = false,
	} = props;
	const [currentNav, setCurrentNav] = useState<CommunityNavigationEntry[]>(initialNav);
	const userSetElements = currentNav.slice(prefix.length, currentNav.length - suffix.length);

	const reorder = (list: CommunityNavigationEntry[], startIndex: number, endIndex: number) => {
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
							if (
								isCommunityNavigationMenu(item) &&
								item.id === result.destination.droppableId
							) {
								return {
									...item,
									children: reorder(
										item.children,
										result.source.index,
										result.destination.index,
									),
								} as CommunityNavigationEntry;
							}
							return item;
					  });
			const newNav = [...prefix, ...nextUserElements, ...suffix];
			setCurrentNav(newNav);
			onChange(newNav);
		}
	};

	const addItem = (newItem: CommunityNavigationEntry) => {
		const newNav = [...prefix, newItem, ...userSetElements, ...suffix];
		setCurrentNav(newNav);
		onChange(newNav);
	};

	const updateItem = (
		dropdownId: string,
		index: number,
		newItemValues: Partial<CommunityNavigationEntry>,
	) => {
		const nextUserElements =
			dropdownId === 'main-list'
				? userSetElements.map((item, currIndex) => {
						return currIndex === index ? { ...item, ...newItemValues } : item;
				  })
				: userSetElements.map((item) => {
						if (item.id === dropdownId && isCommunityNavigationMenu(item)) {
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
				? userSetElements.filter((item) => item.id !== itemId && item !== itemId)
				: userSetElements.map((item) => {
						if (item.id === dropdownId && isCommunityNavigationMenu(item)) {
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
				<PageCollectionAutocomplete
					items={pages}
					placeholder="Add Page"
					usedItems={pages.filter((page) =>
						currentNav.some((current) => current === page.id || current.id === page.id),
					)}
					onSelect={(page) => {
						addItem({ type: 'page', id: page.id });
					}}
				/>
				<PageCollectionAutocomplete
					items={collections}
					placeholder="Add Collection"
					usedItems={collections.filter((collection) =>
						currentNav.some((current) => current.id === collection.id),
					)}
					onSelect={(collection) => {
						addItem({ type: 'collection', id: collection.id });
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
				<NavBuilderContext.Provider
					value={{
						removeItem,
						updateItem,
						pages,
						collections,
					}}
				>
					<div className="items">
						{prefix.map((item, index) => {
							const key = `prefix-${index}`;
							/* Use wrapper div to get margin-collapse styling right */
							return (
								<div key={key} className="nav-builder-row">
									<NavBuilderRow
										item={item}
										isStatic={true}
										dropdownId="main-list"
										index={-1}
									/>
								</div>
							);
						})}
						<NavBuilderList id="main-list" items={userSetElements} newLink={newLink} />
						{suffix.map((item, index) => {
							const key = `suffix-${index}`;
							/* Use wrapper div to get margin-collapse styling right */
							return (
								<div key={key} className="nav-builder-row">
									<NavBuilderRow
										item={item}
										isStatic={true}
										dropdownId="main-list"
										index={-1}
									/>
								</div>
							);
						})}
					</div>
				</NavBuilderContext.Provider>
			</DragDropContext>
		</div>
	);
};

export default NavBuilder;
