/**
 * Manages a drag-and-droppable listing of pubs using react-beautiful-dnd.
 */
import React from 'react';
import classNames from 'classnames';
import { Draggable, Droppable } from 'react-beautiful-dnd';

require('./dragDropListing.scss');

type OwnProps = {
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

const defaultProps = {
	className: null,
	disabled: false,
	renderEmptyState: () => null,
	withDragHandles: false,
	itemId: (item) => item.id,
};

type Props = OwnProps & typeof defaultProps;

const DragDropListing = (props: Props) => {
	const {
		className,
		droppableId,
		droppableType,
		disabled,
		items,
		itemId,
		renderItem,
		renderEmptyState,
		withDragHandles,
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
					{/* @ts-expect-error ts-migrate(2339) FIXME: Property 'length' does not exist on type 'never'. */}
					{renderEmptyState && items.length === 0 && (
						// @ts-expect-error ts-migrate(2349) FIXME: Type 'never' has no call signatures.
						<div className="empty-state-container">{renderEmptyState()}</div>
					)}
					{/* @ts-expect-error ts-migrate(2339) FIXME: Property 'map' does not exist on type 'never'. */}
					{items.map((item, index) => {
						// @ts-expect-error ts-migrate(2349) FIXME: Type 'never' has no call signatures.
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
											{/* @ts-expect-error ts-migrate(2349) FIXME: Type 'never' has no call signatures. */}
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
DragDropListing.defaultProps = defaultProps;

export default DragDropListing;
