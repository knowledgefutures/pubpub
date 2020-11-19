/**
 * Manages a drag-and-droppable listing of pubs using react-beautiful-dnd.
 */
import React from 'react';
import classNames from 'classnames';
import { Draggable, Droppable } from 'react-beautiful-dnd';

require('./dragDropListing.scss');

type Props<Item> = {
	className?: string;
	disabled?: boolean;
	droppableId: string;
	droppableType: string;
	itemId?: (item: Item) => string;
	items: Item[];
	renderEmptyState?: () => React.ReactNode;
	renderItem: (item: Item, dragHandleProps: {}, isDragging: boolean) => React.ReactNode;
	withDragHandles?: boolean;
	renderDragElementInPortal?: boolean;
};

const defaultIdGetter = (item) => item.id;
const defaultEmptyState = () => null;

const getRenderItem = <Item extends {}>(props: Props<Item>) => (provided, snapshot, rubric) => {
	// eslint-disable-next-line react/prop-types
	const { items, withDragHandles, renderItem } = props;
	const item = items[rubric.source.index];
	const { innerRef, draggableProps, dragHandleProps } = provided;
	const { isDragging } = snapshot;
	const effectiveDragHandleProps = withDragHandles ? {} : dragHandleProps;
	return (
		<div
			className={classNames('drag-container', isDragging && 'is-dragging')}
			ref={innerRef}
			{...draggableProps}
			{...effectiveDragHandleProps}
		>
			{renderItem(item, withDragHandles && dragHandleProps, isDragging)}
		</div>
	);
};

const DragDropListing = <Item extends { id: string }>(props: Props<Item>) => {
	const {
		className = null,
		droppableId,
		droppableType,
		disabled = false,
		items,
		itemId = defaultIdGetter,
		renderEmptyState = defaultEmptyState,
		renderDragElementInPortal = false,
	} = props;

	const renderItem = getRenderItem(props);

	return (
		<Droppable
			type={droppableType}
			droppableId={droppableId}
			renderClone={renderDragElementInPortal ? renderItem : null}
		>
			{(droppableProvided) => (
				<div
					{...droppableProvided.droppableProps}
					className={classNames(className, 'drag-drop-listing-component')}
					role="list"
					ref={droppableProvided.innerRef}
				>
					{renderEmptyState && items.length === 0 && (
						<div className="empty-state-container">{renderEmptyState()}</div>
					)}
					{items.map((item, index) => {
						const id = itemId(item);
						return (
							<Draggable
								draggableId={id}
								index={index}
								type={droppableType}
								key={id}
								isDragDisabled={disabled}
							>
								{renderItem}
							</Draggable>
						);
					})}
					{droppableProvided.placeholder}
				</div>
			)}
		</Droppable>
	);
};

export default DragDropListing;
