/**
 * Manages a drag-and-droppable listing of pubs using react-beautiful-dnd.
 */
import React from 'react';
import classNames from 'classnames';
import { Draggable, Droppable } from 'react-beautiful-dnd';

require('./dragDropListing.scss');

export type DragDropListingProps = {
	className?: string;
	disabled?: boolean;
	droppableId: string;
	droppableType: string;
	itemId?: (...args: any[]) => any;
	items: any[];
	renderEmptyState?: (...args: any[]) => any;
	renderItem: (...args: any[]) => any;
	withDragHandles?: boolean;
};

const DragDropListing = (props: DragDropListingProps) => {
	const {
		className = null,
		droppableId,
		droppableType,
		disabled = false,
		items,
		itemId = (item) => item.id,
		renderItem,
		renderEmptyState = () => null,
		withDragHandles = false,
	} = props;
	return (
		<Droppable type={droppableType} droppableId={droppableId}>
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
								{(draggableProvided, snapshot) => {
									const {
										innerRef,
										draggableProps,
										dragHandleProps,
									} = draggableProvided;
									const { isDragging } = snapshot;
									const effectiveDragHandleProps = withDragHandles
										? {}
										: dragHandleProps;
									return (
										<div
											className={classNames(
												'drag-container',
												isDragging && 'is-dragging',
											)}
											ref={innerRef}
											{...draggableProps}
											{...effectiveDragHandleProps}
										>
											{renderItem(
												item,
												withDragHandles && dragHandleProps,
												isDragging,
											)}
										</div>
									);
								}}
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
