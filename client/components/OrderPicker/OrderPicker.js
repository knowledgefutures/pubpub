import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Tooltip } from '@blueprintjs/core';
import Icon from 'components/Icon/Icon';

require('./orderPicker.scss');

const propTypes = {
	selectedItems: PropTypes.array.isRequired,
	allItems: PropTypes.array.isRequired,
	onChange: PropTypes.func.isRequired,
	uniqueId: PropTypes.func.isRequired,
	selectedTitle: PropTypes.string,
	availableTitle: PropTypes.string,
	selectedTitleTooltip: PropTypes.string,
	availableTitleTooltip: PropTypes.string,
};

const defaultProps = {
	selectedTitle: 'Selected',
	availableTitle: 'Available',
	selectedTitleTooltip: undefined,
	availableTitleTooltip: undefined,
};

class OrderPicker extends Component {
	constructor(props) {
		super(props);
		this.state = {
			selectedItems: props.selectedItems,
			availableItems: props.allItems
				.filter((item) => {
					return props.selectedItems.reduce((prev, curr) => {
						if (curr.id === item.id) {
							return false;
						}
						return prev;
					}, true);
				})
				.sort((foo, bar) => {
					if (foo.title < bar.title) {
						return -1;
					}
					if (foo.title > bar.title) {
						return 1;
					}
					return 0;
				}),
		};
		this.onDragEnd = this.onDragEnd.bind(this);
	}

	onDragEnd(dragEvent) {
		if (!dragEvent.destination) {
			return null;
		}
		return this.setState(
			(prevState) => {
				const sourceItem =
					dragEvent.source.droppableId.indexOf('column-1') > -1
						? prevState.selectedItems[dragEvent.source.index]
						: prevState.availableItems[dragEvent.source.index];

				const newSelectedItems = [...prevState.selectedItems];
				const newAvailableItems = [...prevState.availableItems];
				if (dragEvent.source.droppableId.indexOf('column-1') > -1) {
					newSelectedItems.splice(dragEvent.source.index, 1);
				}
				if (dragEvent.source.droppableId.indexOf('column-2') > -1) {
					newAvailableItems.splice(dragEvent.source.index, 1);
				}
				if (dragEvent.destination.droppableId.indexOf('column-1') > -1) {
					newSelectedItems.splice(dragEvent.destination.index, 0, sourceItem);
				}
				if (dragEvent.destination.droppableId.indexOf('column-2') > -1) {
					newAvailableItems.splice(dragEvent.destination.index, 0, sourceItem);
				}
				return {
					selectedItems: newSelectedItems,
					availableItems: newAvailableItems,
				};
			},
			() => {
				this.props.onChange(this.state.selectedItems);
			},
		);
	}

	render() {
		return (
			<div className="order-picker-component">
				<DragDropContext onDragEnd={this.onDragEnd}>
					<div className="column">
						<div className="column-header">
							{this.props.selectedTitle}
							{this.props.selectedTitleTooltip && (
								<Tooltip content={this.props.selectedTitleTooltip}>
									<Icon icon="help" iconSize={12} />
								</Tooltip>
							)}
						</div>
						<Droppable droppableId={`column-1-${this.props.uniqueId}`}>
							{(droppableProvided, droppableSnapshot) => {
								return (
									<div
										ref={droppableProvided.innerRef}
										className={`droppable ${
											droppableSnapshot.isDraggingOver ? 'dragging-over' : ''
										}`}
										{...droppableProvided.droppableProps}
									>
										{this.state.selectedItems.map((item, index) => {
											return (
												<Draggable
													key={item.id}
													draggableId={item.id}
													index={index}
												>
													{(draggableProvided, draggableSnapshot) => {
														return (
															<div
																ref={draggableProvided.innerRef}
																{...draggableProvided.draggableProps}
																className={`draggable ${
																	draggableSnapshot.isDragging
																		? 'dragging'
																		: ''
																}`}
															>
																<div className="drag-title">
																	<span
																		{...draggableProvided.dragHandleProps}
																	>
																		<Icon icon="drag-handle-horizontal" />
																	</span>
																	<span
																		className="text"
																		title={item.title}
																	>
																		{item.title}
																	</span>
																</div>
															</div>
														);
													}}
												</Draggable>
											);
										})}
										{droppableProvided.placeholder}
									</div>
								);
							}}
						</Droppable>
					</div>
					<div className="column">
						<div className="column-header">
							{this.props.availableTitle}
							{this.props.availableTitleTooltip && (
								<Tooltip
									content={this.props.availableTitleTooltip}
									disabled={!this.props.availableTitleTooltip}
								>
									<Icon icon="help" iconSize={12} />
								</Tooltip>
							)}
						</div>
						<Droppable droppableId={`column-2-${this.props.uniqueId}`}>
							{(droppableProvided, droppableSnapshot) => {
								return (
									<div
										ref={droppableProvided.innerRef}
										className={`droppable ${
											droppableSnapshot.isDraggingOver ? 'dragging-over' : ''
										}`}
										{...droppableProvided.droppableProps}
									>
										{this.state.availableItems.map((item, index) => {
											return (
												<Draggable
													key={item.id}
													draggableId={item.id}
													index={index}
												>
													{(draggableProvided, draggableSnapshot) => {
														return (
															<div
																ref={draggableProvided.innerRef}
																{...draggableProvided.draggableProps}
																className={`draggable ${
																	draggableSnapshot.isDragging
																		? 'dragging'
																		: ''
																}`}
															>
																<div className="drag-title">
																	<span
																		{...draggableProvided.dragHandleProps}
																	>
																		<Icon icon="drag-handle-horizontal" />
																	</span>
																	<span
																		className="text"
																		title={item.title}
																	>
																		{item.title}
																	</span>
																</div>
															</div>
														);
													}}
												</Draggable>
											);
										})}
										{droppableProvided.placeholder}
									</div>
								);
							}}
						</Droppable>
					</div>

					{/* This fixed droppable is a kludge to make window scrolling disabled */}
					<Droppable droppableId={`fixed-column-${this.props.uniqueId}`}>
						{(droppableProvided) => {
							return (
								<div
									ref={droppableProvided.innerRef}
									style={{ position: 'fixed' }}
									{...droppableProvided.droppableProps}
								/>
							);
						}}
					</Droppable>
				</DragDropContext>
			</div>
		);
	}
}

OrderPicker.propTypes = propTypes;
OrderPicker.defaultProps = defaultProps;
export default OrderPicker;
