import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

require('./pubsPicker.scss');

const propTypes = {
	selectedPubs: PropTypes.array.isRequired,
	allPubs: PropTypes.array.isRequired,
	onChange: PropTypes.func.isRequired,
	uniqueId: PropTypes.func.isRequired,
};

class PubsPicker extends Component {
	constructor(props) {
		super(props);

		this.onDragEnd = this.onDragEnd.bind(this);
	}

	onDragEnd(dragEvent) {
		console.log(dragEvent);
	}

	render() {
		return (
			<div className="pubs-picker-component">
				<DragDropContext onDragEnd={this.onDragEnd}>
					<Droppable droppableId={`column-1-${this.props.uniqueId}`} ignoreContainerClipping={false}>
						{(droppableProvided, droppableSnapshot)=> {
							return (
								<div
									ref={droppableProvided.innerRef}
									className={`droppable ${droppableSnapshot.isDraggingOver ? 'dragging-over' : ''}`}
									{...droppableProvided.droppableProps}
								>
									<b>Ordered Pubs</b>
									{this.props.selectedPubs.map((pub, index)=> {
										return (
											<Draggable key={pub.id} draggableId={pub.id} index={index}>
												{(draggableProvided, draggableSnapshot) => {
													return (
														<div
															ref={draggableProvided.innerRef}
															{...draggableProvided.draggableProps}
															{...draggableProvided.dragHandleProps}
															className={`draggable ${draggableSnapshot.isDragging ? 'dragging' : ''}`}
														>
															{pub.title}
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
					<Droppable droppableId={`column-2-${this.props.uniqueId}`} ignoreContainerClipping={false}>
						{(droppableProvided, droppableSnapshot)=> {
							return (
								<div
									ref={droppableProvided.innerRef}
									className={`droppable ${droppableSnapshot.isDraggingOver ? 'dragging-over' : ''}`}
									{...droppableProvided.droppableProps}
								>
									<b>Available Pubs</b>
									{this.props.allPubs.map((pub, index)=> {
										return (
											<Draggable key={pub.id} draggableId={pub.id} index={index}>
												{(draggableProvided, draggableSnapshot) => {
													return (
														<div
															ref={draggableProvided.innerRef}
															{...draggableProvided.draggableProps}
															{...draggableProvided.dragHandleProps}
															className={`draggable ${draggableSnapshot.isDragging ? 'dragging' : ''}`}
														>
															{pub.title}
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

					{/* This fixed droppable is a kludge to make window scrolling disabled */}
					<Droppable droppableId={`fixed-column-${this.props.uniqueId}`} ignoreContainerClipping={false}>
						{(droppableProvided)=> {
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

PubsPicker.propTypes = propTypes;
export default PubsPicker;
