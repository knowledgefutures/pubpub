/**
 * Manages a drag-and-droppable listing of pubs using react-beautiful-dnd.
 */
import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Draggable, Droppable } from 'react-beautiful-dnd';

require('./dragDropListing.scss');

const DND_TYPE = 'collection-editor-entry';

const propTypes = {
	className: PropTypes.string,
	droppableId: PropTypes.string.isRequired,
	droppableType: PropTypes.string.isRequired,
	items: PropTypes.arrayOf(PropTypes.object).isRequired,
	itemId: PropTypes.func.isRequired,
	renderEmptyState: PropTypes.func,
	renderItem: PropTypes.func.isRequired,
	withDragHandles: PropTypes.bool,
};

const defaultProps = {
	className: null,
	renderEmptyState: () => null,
	withDragHandles: false,
};

const DragDropListing = (props) => {
	const {
		className,
		droppableId,
		droppableType,
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
					ref={droppableProvided.innerRef}
				>
					{renderEmptyState && items.length === 0 && (
						<div className="empty-state-container">{renderEmptyState()}</div>
					)}
					{items.map((item, index) => {
						const id = itemId(item);
						return (
							<Draggable draggableId={id} index={index} type={DND_TYPE} key={id}>
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
				</div>
			)}
		</Droppable>
	);
};

DragDropListing.propTypes = propTypes;
DragDropListing.defaultProps = defaultProps;

export default DragDropListing;
