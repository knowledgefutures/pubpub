/**
 * Manages a drag-and-droppable listing of pubs using react-beautiful-dnd.
 */
import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Draggable, Droppable } from 'react-beautiful-dnd';

require('./dragDropListing.scss');

const propTypes = {
	className: PropTypes.string,
	disabled: PropTypes.bool,
	droppableId: PropTypes.string.isRequired,
	droppableType: PropTypes.string.isRequired,
	itemId: PropTypes.func,
	items: PropTypes.arrayOf(PropTypes.object).isRequired,
	renderEmptyState: PropTypes.func,
	renderItem: PropTypes.func.isRequired,
	withDragHandles: PropTypes.bool,
};

const defaultProps = {
	className: null,
	disabled: false,
	renderEmptyState: () => null,
	withDragHandles: false,
	itemId: (item) => item.id,
};

const DragDropListing = (props) => {
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

DragDropListing.propTypes = propTypes;
DragDropListing.defaultProps = defaultProps;

export default DragDropListing;
