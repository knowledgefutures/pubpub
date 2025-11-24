import React from 'react';

import { InputGroup, Popover, type PopoverPosition } from '@blueprintjs/core';
import {
	type IQueryListProps,
	type IQueryListRendererProps,
	type ItemRenderer,
	QueryList,
} from '@blueprintjs/select';

import './queryListDropdown.scss';

type SharedQueryListProps<Item> = Pick<
	IQueryListProps<Item>,
	'createNewItemFromQuery' | 'createNewItemRenderer'
>;

type Props<Item> = SharedQueryListProps<Item> & {
	children: React.ReactNode;
	items: Item[];
	itemPredicate?: (query: string, item: Item) => boolean;
	onItemSelect: (item: Item) => unknown;
	onClose?: () => unknown;
	onQueryChange?: (query: string) => unknown;
	position?: PopoverPosition;
	searchPlaceholder: string;
	emptyListPlaceholder: React.ReactNode;
	itemRenderer: ItemRenderer<Item>;
	usePortal?: boolean;
	query?: string;
};

const QueryListDropdown = <Item extends {}>(props: Props<Item>) => {
	const {
		children,
		emptyListPlaceholder,
		itemPredicate,
		items,
		onItemSelect,
		onClose,
		onQueryChange,
		position = 'bottom-right',
		itemRenderer,
		searchPlaceholder,
		usePortal = true,
		query,
		createNewItemFromQuery,
		createNewItemRenderer,
	} = props;

	const renderPopoverContent = (qlProps: IQueryListRendererProps<Item>) => {
		const { handleKeyDown, handleKeyUp, handleQueryChange, itemList } = qlProps;
		return (
			// biome-ignore lint/a11y: shhhhhh
			<div className="search-wrapper" onKeyDown={handleKeyDown} onKeyUp={handleKeyUp}>
				<InputGroup
					inputRef={(input) => input && setTimeout(() => input.focus(), 0)}
					placeholder={searchPlaceholder}
					leftIcon="search"
					onChange={handleQueryChange}
				/>
				{itemList}
			</div>
		);
	};

	const queryListRenderer = (qlProps: IQueryListRendererProps<Item>) => {
		return (
			<Popover
				minimal
				popoverClassName="query-list-dropdown-component"
				position={position}
				usePortal={usePortal}
				onClose={onClose}
				content={renderPopoverContent(qlProps)}
			>
				{children}
			</Popover>
		);
	};

	return (
		<QueryList
			renderer={queryListRenderer}
			itemRenderer={itemRenderer}
			items={items}
			itemPredicate={itemPredicate}
			onItemSelect={onItemSelect}
			onQueryChange={onQueryChange}
			query={query}
			noResults={<div className="empty-list">{emptyListPlaceholder}</div>}
			createNewItemFromQuery={createNewItemFromQuery}
			createNewItemRenderer={createNewItemRenderer}
		/>
	);
};

export default QueryListDropdown;
