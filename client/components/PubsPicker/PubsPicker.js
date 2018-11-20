import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import Icon from 'components/Icon/Icon';

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
		this.state = {
			selectedPubs: props.selectedPubs,
			availablePubs: props.allPubs.filter((pub)=> {
				return props.selectedPubs.reduce((prev, curr)=> {
					if (curr.id === pub.id) { return false; }
					return prev;
				}, true);
			}).sort((foo, bar)=> {
				if (foo.title < bar.title) { return -1; }
				if (foo.title > bar.title) { return 1; }
				return 0;
			}),
		};
		this.onDragEnd = this.onDragEnd.bind(this);
	}

	onDragEnd(dragEvent) {
		this.setState((prevState)=> {
			const sourcePub = dragEvent.source.droppableId.indexOf('column-1') > -1
				? prevState.selectedPubs[dragEvent.source.index]
				: prevState.availablePubs[dragEvent.source.index];

			const newSelectedPubs = [...prevState.selectedPubs];
			const newAvailablePubs = [...prevState.availablePubs];
			if (dragEvent.source.droppableId.indexOf('column-1') > -1) {
				newSelectedPubs.splice(dragEvent.source.index, 1);
			}
			if (dragEvent.source.droppableId.indexOf('column-2') > -1) {
				newAvailablePubs.splice(dragEvent.source.index, 1);
			}
			if (dragEvent.destination.droppableId.indexOf('column-1') > -1) {
				newSelectedPubs.splice(dragEvent.destination.index, 0, sourcePub);
			}
			if (dragEvent.destination.droppableId.indexOf('column-2') > -1) {
				newAvailablePubs.splice(dragEvent.destination.index, 0, sourcePub);
			}
			return {
				selectedPubs: newSelectedPubs,
				availablePubs: newAvailablePubs,
			};
		}, ()=> {
			this.props.onChange(this.state.selectedPubs);
		});
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
									<div className="panel-header">Pinned Pubs</div>
									{this.state.selectedPubs.map((pub, index)=> {
										return (
											<Draggable key={pub.id} draggableId={pub.id} index={index}>
												{(draggableProvided, draggableSnapshot) => {
													return (
														<div
															ref={draggableProvided.innerRef}
															{...draggableProvided.draggableProps}
															className={`draggable ${draggableSnapshot.isDragging ? 'dragging' : ''}`}
														>
															<div className="drag-title">
																<span {...draggableProvided.dragHandleProps}>
																	<Icon icon="drag-handle-horizontal" />
																</span>
																<span className="text" title={pub.title}>{pub.title}</span>
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
					<Droppable droppableId={`column-2-${this.props.uniqueId}`} ignoreContainerClipping={false}>
						{(droppableProvided, droppableSnapshot)=> {
							return (
								<div
									ref={droppableProvided.innerRef}
									className={`droppable ${droppableSnapshot.isDraggingOver ? 'dragging-over' : ''}`}
									{...droppableProvided.droppableProps}
								>
									<div className="panel-header">Available Pubs</div>
									{this.state.availablePubs.map((pub, index)=> {
										return (
											<Draggable key={pub.id} draggableId={pub.id} index={index}>
												{(draggableProvided, draggableSnapshot) => {
													return (
														<div
															ref={draggableProvided.innerRef}
															{...draggableProvided.draggableProps}
															className={`draggable ${draggableSnapshot.isDragging ? 'dragging' : ''}`}
														>
															<div className="drag-title">
																<span {...draggableProvided.dragHandleProps}>
																	<Icon icon="drag-handle-horizontal" />
																</span>
																<span className="text" title={pub.title}>{pub.title}</span>
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
