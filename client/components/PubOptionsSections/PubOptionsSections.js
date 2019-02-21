import React, { Component } from 'react';
import PropTypes from 'prop-types';
import uuidv4 from 'uuid/v4';
import { Button } from '@blueprintjs/core';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import Icon from 'components/Icon/Icon';

require('./pubOptionsSections.scss');

const propTypes = {
	communityData: PropTypes.object.isRequired,
	pubData: PropTypes.object.isRequired,
	locationData: PropTypes.object.isRequired,
	firebaseRef: PropTypes.object,
	setPubData: PropTypes.func.isRequired,
};

const defaultProps = {
	firebaseRef: undefined,
};

class PubOptionsSections extends Component {
	constructor(props) {
		super(props);
		this.state = {
			editIndex: undefined,
		};
		this.handleTitleChange = this.handleTitleChange.bind(this);
		this.handleDragEnd = this.handleDragEnd.bind(this);
		this.handleSectionAdd = this.handleSectionAdd.bind(this);
		this.handleSectionRemove = this.handleSectionRemove.bind(this);
		this.handleSectionsChange = this.handleSectionsChange.bind(this);
		this.handleSetEdit = this.handleSetEdit.bind(this);
	}

	handleSetEdit(index) {
		this.setState({ editIndex: index });
	}

	handleTitleChange(evt, index) {
		const newSectionsArray = this.props.pubData.sectionsData;
		newSectionsArray[index].title = evt.target.value;
		this.handleSectionsChange(newSectionsArray);
	}

	handleDragEnd(result) {
		if (!result.destination) {
			return null;
		}
		const source = result.source.index + 1;
		const destination = result.destination.index + 1;
		const movedItem = this.props.pubData.sectionsData[source];
		const remainingItems = this.props.pubData.sectionsData.filter((item, index) => {
			return index !== source;
		});

		const newSectionsArray = [
			...remainingItems.slice(0, destination),
			movedItem,
			...remainingItems.slice(destination),
		].map((item, index) => {
			return {
				...item,
				order: index,
			};
		});
		return this.handleSectionsChange(newSectionsArray);
	}

	handleSectionRemove(removeIndex) {
		const newSectionsArray = this.props.pubData.sectionsData
			.filter((item) => {
				return item.order !== removeIndex;
			})
			.map((item, index) => {
				return {
					...item,
					order: index,
				};
			});
		this.handleSectionsChange(newSectionsArray);
	}

	handleSectionsChange(newSectionsArray) {
		const newSectionsData = {};
		newSectionsArray.forEach((section) => {
			newSectionsData[section.firebaseId] = {
				...section,
				firebaseId: null,
			};
		});
		this.props.firebaseRef.child('/sections').set(newSectionsData);
	}

	handleSectionAdd() {
		const newSectionsData = this.props.pubData.sectionsData;
		newSectionsData.push({
			order: this.props.pubData.sectionsData.length,
			title: 'New Section',
			id: uuidv4(),
		});
		this.props.firebaseRef.child('/sections').set(newSectionsData);
	}

	render() {
		const content =
			this.props.pubData.activeVersion && this.props.pubData.activeVersion.content;
		const queryObject = this.props.locationData.query;

		const activeSectionId = this.props.locationData.params.sectionId || '';
		const sectionsData = this.props.pubData.isDraft ? this.props.pubData.sectionsData : [];

		const isDraft = this.props.pubData.isDraft;
		return (
			<div className="pub-options-sections-component">
				<style>
					{/*
						Only this sections component wants right-column to be overflow: auto.
						It messes with shadows, etc on other panels.
					*/}
					{`
						.pub-options-component .right-column {
							overflow: auto;
						}
					`}
				</style>
				{isDraft && (
					<div className="save-wrapper">
						<button
							className="bp3-button add-sections-button"
							onClick={this.handleSectionAdd}
							type="button"
						>
							Add Section
						</button>
					</div>
				)}
				<h1>Sections</h1>
				<p>
					Sections allow you to break up your pub&apos;s content into multiple pieces.
					This allows you to create chapters, volumes, etc. for longer documents.
				</p>
				{!isDraft && Array.isArray(content) && (
					<ul className="bp3-menu">
						{content.map((section, index) => {
							const split = section.title.split('/');
							const prefix = split.length > 1 ? split[0].trim() : undefined;
							const title = split.length > 1 ? split[1].trim() : split[0].trim();
							return (
								<li key={section.id}>
									{prefix && (
										<span
											className={`section-header ${
												index === 0 ? 'first' : ''
											}`}
										>
											{prefix}
										</span>
									)}
									<a
										href={`/pub/${this.props.pubData.slug}/${
											index === 0 ? '' : 'content/'
										}${section.id}${
											queryObject.version
												? `?version=${queryObject.version}`
												: ''
										}`}
										className={`bp3-menu-item bp3-popover-dismiss ${
											activeSectionId === section.id ? 'bp3-active' : ''
										}`}
									>
										{title}
									</a>
								</li>
							);
						})}
					</ul>
				)}
				{isDraft && (
					<div>
						<div className={`section first ${activeSectionId === '' ? 'active' : ''}`}>
							<div className="title">
								{this.state.editIndex === 0 && (
									<input
										className="bp3-fill bp3-input"
										value={sectionsData[0].title}
										onChange={(evt) => {
											this.handleTitleChange(evt, 0);
										}}
									/>
								)}
								{this.state.editIndex !== 0 && (
									<a
										className="link-title"
										href={`/pub/${this.props.locationData.params.slug}/draft`}
									>
										{sectionsData[0].title}
									</a>
								)}
							</div>
							{this.state.editIndex === 0 && (
								<button
									className="bp3-button bp3-minimal bp3-icon-tick"
									onClick={() => {
										this.handleSetEdit(undefined);
									}}
									type="button"
								/>
							)}
							{this.state.editIndex !== 0 && (
								<Button
									className="bp3-minimal"
									onClick={() => {
										this.handleSetEdit(0);
									}}
									icon={<Icon icon="edit2" />}
								/>
							)}
						</div>
						<DragDropContext onDragEnd={this.handleDragEnd}>
							<Droppable droppableId="mainDroppable">
								{(provided, snapshot) => (
									<div
										ref={provided.innerRef}
										className={`main-list ${
											snapshot.isDraggingOver ? 'dragging' : ''
										}`}
									>
										{sectionsData.map((section, index) => {
											if (index === 0) {
												return null;
											}
											const isEditing = this.state.editIndex === index;
											return (
												<Draggable
													key={`draggable-${section.id}`}
													draggableId={section.id}
													index={index - 1}
												>
													{(providedItem, snapshotItem) => (
														<div
															ref={providedItem.innerRef}
															className={`section ${
																snapshotItem.isDragging
																	? 'dragging'
																	: ''
															} ${
																activeSectionId === section.id
																	? 'active'
																	: ''
															}`}
															{...providedItem.draggableProps}
														>
															<span
																{...providedItem.dragHandleProps}
																className="drag"
															>
																<span className="bp3-icon-standard bp3-icon-drag-handle-horizontal" />
															</span>
															<div className="title">
																{isEditing && (
																	<input
																		className="bp3-fill bp3-input"
																		value={section.title}
																		onChange={(evt) => {
																			this.handleTitleChange(
																				evt,
																				index,
																			);
																		}}
																	/>
																)}
																{!isEditing && (
																	<a
																		className="link-title"
																		href={`/pub/${
																			this.props.locationData
																				.params.slug
																		}/draft/content/${
																			section.id
																		}`}
																	>
																		{section.title}
																	</a>
																)
																// <span onClick={()=> { this.props.onSectionSet(section.id); }} className="link-title">{section.title}</span>
																}
															</div>
															{isEditing && (
																<button
																	className="bp3-button bp3-minimal bp3-icon-tick"
																	onClick={() => {
																		this.handleSetEdit(
																			undefined,
																		);
																	}}
																	type="button"
																/>
															)}
															{!isEditing && (
																<Button
																	className="bp3-minimal"
																	onClick={() => {
																		this.handleSetEdit(index);
																	}}
																	icon={<Icon icon="edit2" />}
																/>
															)}
															<button
																className="bp3-button bp3-minimal bp3-icon-trash bp3-intent-danger"
																onClick={() => {
																	this.handleSectionRemove(index);
																}}
																type="button"
															/>
														</div>
													)}
												</Draggable>
											);
										})}
										{provided.placeholder}
									</div>
								)}
							</Droppable>
						</DragDropContext>
					</div>
				)}
			</div>
		);
	}
}

PubOptionsSections.propTypes = propTypes;
PubOptionsSections.defaultProps = defaultProps;
export default PubOptionsSections;
