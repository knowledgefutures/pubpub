/**
 * Manages a drag-and-droppable listing of pubs using react-beautiful-dnd.
 */
import React from 'react';
import classNames from 'classnames';
import {
	Draggable,
	Droppable,
	DraggableProvidedDragHandleProps,
	DraggableProvided,
	DraggableStateSnapshot,
	DraggableRubric,
} from 'react-beautiful-dnd';

import { Maybe } from 'types';

require('./dragDropListing.scss');

export type MinimalItem = {
	id: string;
};

export type Props<Item extends MinimalItem> = {
	className?: string;
	disabled?: boolean;
	droppableId: string;
	droppableType: string;
	itemId?: (item: Item) => string;
	items: Item[];
	renderEmptyState?: () => React.ReactNode;
	renderItem: (
		item: Item,
		dragHandleProps: Maybe<DraggableProvidedDragHandleProps>,
		isDragging: boolean,
	) => React.ReactNode;
	withDragHandles?: boolean;
	renderDragElementInPortal?: boolean;
};

const defaultIdGetter = (item: MinimalItem) => item.id;

const getRenderItem = <Item extends MinimalItem>(props: Props<Item>) => (
	provided: DraggableProvided,
	snapshot: DraggableStateSnapshot,
	rubric: DraggableRubric,
) => {
	// eslint-disable-next-line react/prop-types
	const { items, withDragHandles, renderItem } = props;
	const item = items[rubric.source.index];
	const { innerRef, draggableProps, dragHandleProps: providedDragHandleProps } = provided;
	const { isDragging } = snapshot;
	const dragHandleProps = { ...providedDragHandleProps! };
	if (isDragging) {
		// Prevent dragged clone from taking focus and closing popovers
		dragHandleProps.tabIndex = (undefined as unknown) as number;
	}
	const effectiveDragHandleProps = withDragHandles ? {} : dragHandleProps;
	return (
		<div
			role="listitem"
			className={classNames('drag-container', isDragging && 'is-dragging')}
			ref={innerRef}
			{...draggableProps}
			{...effectiveDragHandleProps}
		>
			{renderItem(item, withDragHandles && dragHandleProps, isDragging)}
		</div>
	);
};

const DragDropListing = <Item extends MinimalItem>(props: Props<Item>) => {
	const {
		className = null,
		droppableId,
		droppableType,
		disabled = false,
		items,
		itemId = defaultIdGetter,
		renderEmptyState = null,
		renderDragElementInPortal = false,
	} = props;

	const renderItem = getRenderItem(props);

	return (
		<Droppable
			type={droppableType}
			droppableId={droppableId}
			renderClone={renderDragElementInPortal ? renderItem : undefined}
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
