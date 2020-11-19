import React from 'react';
import { Popover, InputGroup, PopoverPosition } from '@blueprintjs/core';
import { IQueryListRendererProps, ItemRenderer, QueryList } from '@blueprintjs/select';

require('./queryListDropdown.scss');

type Props<Item> = {
	children: React.ReactNode;
	items: Item[];
	itemPredicate: (query: string, item: Item) => boolean;
	onItemSelect: (item: Item) => unknown;
	onClose?: () => unknown;
	position?: PopoverPosition;
	searchPlaceholder: string;
	emptyListPlaceholder: React.ReactNode;
	itemRenderer: ItemRenderer<Item>;
	usePortal?: boolean;
};

const QueryListDropdown = <Item extends {}>(props: Props<Item>) => {
	const {
		children,
		emptyListPlaceholder,
		itemPredicate,
		items,
		onItemSelect,
		onClose,
		position = 'bottom-right',
		itemRenderer,
		searchPlaceholder,
		usePortal = true,
	} = props;

	const renderPopoverContent = (qlProps: IQueryListRendererProps<Item>) => {
		const { handleKeyDown, handleKeyUp, handleQueryChange, itemList } = qlProps;
		return (
			// eslint-disable-next-line jsx-a11y/no-static-element-interactions
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
			noResults={<div className="empty-list">{emptyListPlaceholder}</div>}
		/>
	);
};

export default QueryListDropdown;
