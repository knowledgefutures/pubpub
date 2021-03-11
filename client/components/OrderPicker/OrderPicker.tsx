import React, { useRef, useState } from 'react';
import classNames from 'classnames';
import { Button, Spinner, InputGroup, Icon } from '@blueprintjs/core';

import { DragDropOrdering } from 'components';
import { useInfiniteScroll } from 'client/utils/useInfiniteScroll';
import { useHotkeys } from 'client/utils/useHotkey';
import { generateHash } from 'utils/hashes';

require('./orderPicker.scss');

type MinimalItem = { id: string };

type Props<Item extends MinimalItem> = {
	availableItems: Item[];
	availableTitle?: React.ReactNode;
	isRequestingMoreItems?: boolean;
	onRequestMoreItems?: () => unknown;
	onSearch?: (term: string) => unknown;
	onSelectedItems: (items: Item[]) => unknown;
	renderItem: (item: Item, onClick: null | (() => unknown)) => React.ReactNode;
	scrollForMoreItems?: boolean;
	searchPlaceholder?: string;
	searchTerm?: string;
	selectedItems: Item[];
	selectedTitle?: React.ReactNode;
};

const OrderPicker = <Item extends MinimalItem>(props: Props<Item>) => {
	const {
		availableItems,
		selectedItems,
		onSearch,
		onRequestMoreItems,
		onSelectedItems,
		renderItem,
		selectedTitle = 'Selected',
		availableTitle = 'Available',
		searchPlaceholder,
		searchTerm,
		scrollForMoreItems = false,
		isRequestingMoreItems = false,
	} = props;
	const availableItemsPaneRef = useRef<null | HTMLDivElement>(null);
	const [droppableType] = useState(() => generateHash(10));
	const { hotkeyRef } = useHotkeys<HTMLDivElement>();

	useInfiniteScroll({
		element: availableItemsPaneRef.current,
		enabled: scrollForMoreItems && !isRequestingMoreItems,
		onRequestMoreItems,
	});

	const handleAddItem = (item: Item) => {
		onSelectedItems([...selectedItems, item]);
	};

	const handleRemoveItem = (item: Item) => {
		const nextItems = [...selectedItems];
		const indexOfItem = nextItems.findIndex((someItem) => someItem.id === item.id);
		nextItems.splice(indexOfItem, 1);
		onSelectedItems(nextItems);
	};

	const renderColumnHeader = (title: React.ReactNode) => {
		return <div className="column-header">{title}</div>;
	};

	const renderItemInContext = (
		item: Item,
		leftControl: React.ReactNode,
		rightControl: React.ReactNode,
		isDragging = false,
		onClick: null | (() => unknown) = null,
	) => {
		return (
			<div
				key={item.id}
				className={classNames('order-picker-component_item', isDragging && 'is-dragging')}
			>
				{leftControl}
				<div className="content">{renderItem(item, onClick)}</div>
				{rightControl}
			</div>
		);
	};

	const renderAvailableItems = () => {
		return (
			<div className="items-listing" ref={availableItemsPaneRef}>
				{onSearch && (
					<div className="search-bar">
						<InputGroup
							leftIcon="search"
							value={searchTerm}
							placeholder={searchPlaceholder}
							onChange={(evt: any) => onSearch(evt.target.value)}
						/>
					</div>
				)}
				<ul>
					{availableItems.map((item) => (
						<li key={item.id}>{renderItem(item, () => handleAddItem(item))}</li>
					))}
				</ul>
				{isRequestingMoreItems && <Spinner size={25} className="more-spinner" />}
			</div>
		);
	};

	const renderSelectedItems = () => {
		return (
			<DragDropOrdering
				className="items-listing"
				droppableType={droppableType}
				items={selectedItems}
				renderItem={(item, dragHandleProps, isDragging) =>
					renderItemInContext(
						item,
						dragHandleProps && (
							<div className="drag-handle" {...dragHandleProps}>
								<Icon icon="drag-handle-vertical" />
							</div>
						),
						<Button minimal icon="cross" onClick={() => handleRemoveItem(item)} />,
						isDragging,
					)
				}
				onReorderItems={onSelectedItems}
				renderDragElementInPortal
				withDragHandles
			/>
		);
	};

	return (
		<div className="order-picker-component">
			<div className="column" ref={hotkeyRef('ArrowLeft')}>
				{renderColumnHeader(availableTitle)}
				{renderAvailableItems()}
			</div>
			<div className="column" ref={hotkeyRef('ArrowRight')}>
				{renderColumnHeader(selectedTitle)}
				{renderSelectedItems()}
			</div>
		</div>
	);
};

export default OrderPicker;
