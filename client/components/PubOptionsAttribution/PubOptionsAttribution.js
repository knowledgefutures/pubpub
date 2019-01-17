import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Checkbox, Position, Spinner } from '@blueprintjs/core';
import { MultiSelect } from '@blueprintjs/select';
import fuzzysearch from 'fuzzysearch';
import Avatar from 'components/Avatar/Avatar';
import UserAutocomplete from 'components/UserAutocomplete/UserAutocomplete';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { apiFetch } from 'utilities';

require('./pubOptionsAttribution.scss');

const propTypes = {
	communityData: PropTypes.object.isRequired,
	pubData: PropTypes.object.isRequired,
	setPubData: PropTypes.func.isRequired,
};


class PubOptionsAttribution extends Component {
	constructor(props) {
		super(props);
		this.state = {
			/* We store pubData in state of this component so we can do immediate */
			/* updates and save in the background without jumpy effects */
			pubData: this.props.pubData,
			isLoading: false,
		};
		this.onDragEnd = this.onDragEnd.bind(this);
		this.getFilteredRoles = this.getFilteredRoles.bind(this);
		this.handleAttributionAdd = this.handleAttributionAdd.bind(this);
		this.handleAttributionUpdate = this.handleAttributionUpdate.bind(this);
		this.handleAttributionDelete = this.handleAttributionDelete.bind(this);
	}

	onDragEnd(result) {
		const pubData = this.state.pubData;

		if (!result.destination) { return null; }
		const sourceIndex = result.source.index;
		const sourceId = pubData.attributions[sourceIndex].id;
		const destIndex = result.destination.index;
		const destinationOrder = pubData.attributions[destIndex].order;
		const direction = sourceIndex > destIndex ? -1 : 1;
		let newOrder = 0.5;
		if (sourceIndex === destIndex) {
			newOrder = pubData.attributions[sourceIndex].order;
		} else if (result.destination.index === 0) {
			newOrder = destinationOrder / 2;
		} else if (result.destination.index === pubData.attributions.length - 1) {
			newOrder = (1 + destinationOrder) / 2;
		} else {
			const destinationNeighborOrder = pubData.attributions[destIndex + direction].order;
			newOrder = (destinationOrder + destinationNeighborOrder) / 2;
		}

		// const newCollaborators = pubData.attributions;
		// newCollaborators[sourceIndex].order = newOrder;

		this.handleAttributionUpdate({
			pubAttributionId: sourceId,
			order: newOrder,
			pubId: pubData.id,
			communityId: this.props.communityData.id,
		});

		const newPubData = {
			...pubData,
			attributions: pubData.attributions.map((attribution)=> {
				if (attribution.id !== sourceId) {
					return attribution;
				}
				return {
					...attribution,
					order: newOrder,
				};
			})
		};

		this.setState({ pubData: newPubData });
		return this.props.setPubData(newPubData);
	}

	getFilteredRoles(query, existingRoles) {
		const defaultRoles = [
			'Conceptualization',
			'Methodology',
			'Software',
			'Validation',
			'Formal Analysis',
			'Investigation',
			'Resources',
			'Data Curation',
			'Writing – Original Draft Preparation',
			'Writing – Review & Editing',
			'Visualization',
			'Supervision',
			'Project Administration',
			'Peer Review',
			'Funding Acquisition',
			'Illustrator'
		];
		const addNewRoleOption = defaultRoles.reduce((prev, curr)=> {
			if (curr.toLowerCase() === query.toLowerCase()) { return false; }
			return prev;
		}, true);
		const newRoleOption = query && addNewRoleOption ? [query] : [];
		const allRoles = [...newRoleOption, ...defaultRoles];
		const output = allRoles.filter((item)=> {
			const fuzzyMatchRole = fuzzysearch(query.toLowerCase(), item.toLowerCase());
			const alreadyUsed = existingRoles.indexOf(item) > -1;
			return !alreadyUsed && fuzzyMatchRole;
		}).sort((foo, bar)=> {
			if (foo.toLowerCase() < bar.toLowerCase()) { return -1; }
			if (foo.toLowerCase() > bar.toLowerCase()) { return 1; }
			return 0;
		});
		return output;
	}

	handleAttributionAdd(user) {
		const calculatedOrder = !this.state.pubData.attributions.length
			? 0.5
			: this.state.pubData.attributions.sort((foo, bar)=> {
				if (foo.order < bar.order) { return -1; }
				if (foo.order > bar.order) { return 1; }
				if (foo.createdAt < bar.createdAt) { return 1; }
				if (foo.createdAt > bar.createdAt) { return -1; }
				return 0;
			})[0].order / 2;

		return apiFetch('/api/pubAttributions', {
			method: 'POST',
			body: JSON.stringify({
				userId: user.id,
				name: user.name,
				order: calculatedOrder,
				pubId: this.state.pubData.id,
				communityId: this.props.communityData.id,
			})
		})
		.then((result)=> {
			this.setState((prevState)=> {
				const newPubData = {
					...prevState.pubData,
					attributions: [
						...prevState.pubData.attributions,
						result,
					]
				};
				this.props.setPubData(newPubData);
				return { pubData: newPubData };
			});
		});
	}

	handleAttributionUpdate(updatedAttribution) {
		this.setState((prevState)=> {
			const newPubData = {
				...prevState.pubData,
				attributions: prevState.pubData.attributions.map((attribution)=> {
					if (attribution.id !== updatedAttribution.pubAttributionId) {
						return attribution;
					}
					return {
						...attribution,
						...updatedAttribution,
					};
				})
			};
			return { pubData: newPubData, isLoading: true };
		}, ()=> {
			apiFetch('/api/pubAttributions', {
				method: 'PUT',
				body: JSON.stringify({
					...updatedAttribution,
					pubId: this.state.pubData.id,
					communityId: this.props.communityData.id,
				})
			})
			.then(()=> {
				this.props.setPubData(this.state.pubData);
				this.setState({ isLoading: false });
			});
		});
	}

	handleAttributionDelete(pubAttributionId) {
		this.setState((prevState)=> {
			const newPubData = {
				...prevState.pubData,
				attributions: prevState.pubData.attributions.filter((attribution)=> {
					return attribution.id !== pubAttributionId;
				})
			};
			return { pubData: newPubData, isLoading: true };
		}, ()=> {
			apiFetch('/api/pubAttributions', {
				method: 'DELETE',
				body: JSON.stringify({
					pubAttributionId: pubAttributionId,
					pubId: this.state.pubData.id,
					communityId: this.props.communityData.id,
				})
			})
			.then(()=> {
				this.props.setPubData(this.state.pubData);
				this.setState({ isLoading: false });
			});
		});
	}

	render() {
		const pubData = this.state.pubData;
		const isManager = pubData.isManager;
		return (
			<div className="pub-options-attribution-component">
				{this.state.isLoading &&
					<div className="save-wrapper">
						<Spinner small={true} /> Saving...
					</div>
				}
				<h1>Attribution</h1>
				{isManager &&
					<UserAutocomplete
						onSelect={this.handleAttributionAdd}
						allowCustomUser={true}
						placeholder="Add new person..."
						usedUserIds={pubData.attributions.map((item)=> {
							return item.user.id;
						})}
					/>
				}
				<DragDropContext onDragEnd={this.onDragEnd}>
					<div className="main-list-wrapper">
						<Droppable droppableId="mainDroppable">
							{(provided, snapshot) => (
								<div
									ref={provided.innerRef}
									className={`main-list ${snapshot.isDraggingOver ? 'dragging' : ''}`}
								>
									{pubData.attributions.sort((foo, bar)=> {
										if (foo.order < bar.order) { return -1; }
										if (foo.order > bar.order) { return 1; }
										return 0;
									}).map((attribution, index)=> {
										const roles = attribution.roles || [];
										return (
											<Draggable key={`draggable-${attribution.id}`} draggableId={attribution.id} index={index}>
												{(providedItem, snapshotItem) => (
													<div
														ref={providedItem.innerRef}
														className={`draggable-item ${snapshotItem.isDragging ? 'dragging' : ''}`}
														{...providedItem.draggableProps}
													>
														<div className="attribution-wrapper">
															<div className="avatar-wrapper">
																<Avatar width={50} userInitials={attribution.user.initials} userAvatar={attribution.user.avatar} />
															</div>
															<div className="content">
																<div className="top-content">
																	<div className="name">
																		{attribution.user.slug
																			? <a href={`/user/${attribution.user.slug}`} className="underline-on-hover">{attribution.user.fullName}</a>
																			: <span>{attribution.user.fullName}</span>
																		}
																		<span key={`${attribution.id}-handle`} style={isManager ? {} : { display: 'none' }} {...providedItem.dragHandleProps} className="bp3-icon-standard bp3-icon-drag-handle-horizontal" />
																	</div>
																	{isManager &&
																		<button
																			className="bp3-button bp3-minimal"
																			type="button"
																			onClick={()=> {
																				this.handleAttributionDelete(attribution.id);
																			}}
																		>
																			<span className="bp3-icon-standard bp3-icon-small-cross" />
																		</button>
																	}
																</div>
																<div className="bottom-content">
																	{!isManager && attribution.isAuthor &&
																		<span style={{ marginRight: '1em' }}>Listed on byline</span>
																	}
																	{!isManager && roles.map((item)=> {
																		return (
																			<span className="bp3-tag bp3-minimal bp3-intent-primary">{item}</span>
																		);
																	})}
																	{isManager &&
																		<Checkbox
																			checked={attribution.isAuthor}
																			onChange={(evt)=> {
																				this.handleAttributionUpdate({
																					pubAttributionId: attribution.id,
																					isAuthor: evt.target.checked,
																				});
																			}}
																		>
																			List on byline
																		</Checkbox>
																	}
																	{isManager &&
																		<MultiSelect
																			items={attribution.roles || []}
																			itemListPredicate={this.getFilteredRoles}
																			itemRenderer={(item, { handleClick, modifiers })=> {
																				return (
																					<li key={item}>
																						<button
																							type="button"
																							tabIndex={-1}
																							onClick={handleClick}
																							className={modifiers.active ? 'bp3-menu-item bp3-active' : 'bp3-menu-item'}
																						>
																							{item}
																						</button>
																					</li>
																				);
																			}}
																			selectedItems={attribution.roles || []}
																			tagRenderer={(item)=> {
																				return (
																					<span>
																						{item}
																					</span>
																				);
																			}}
																			tagInputProps={{
																				onRemove: (evt, roleIndex)=> {
																					const newRoles = attribution.roles.filter((item, filterIndex)=> {
																						return filterIndex !== roleIndex;
																					});
																					this.handleAttributionUpdate({
																						pubAttributionId: attribution.id,
																						roles: newRoles,
																					});
																				},
																				placeholder: 'Add roles...',
																				tagProps: {
																					className: 'bp3-minimal bp3-intent-primary'
																				},
																				inputProps: {
																					placeholder: 'Add roles...',
																				},
																			}}
																			resetOnSelect={true}
																			onItemSelect={(newRole)=> {
																				const existingRoles = attribution.roles || [];
																				const newRoles = [...existingRoles, newRole];
																				this.handleAttributionUpdate({
																					pubAttributionId: attribution.id,
																					roles: newRoles,
																				});
																			}}
																			noResults={<div className="bp3-menu-item">No Matching Roles</div>}
																			popoverProps={{
																				popoverClassName: 'bp3-minimal',
																				position: Position.BOTTOM_LEFT,
																				usePortal: false,
																				modifiers: {
																					preventOverflow: { enabled: false },
																					hide: { enabled: false },
																					flip: { enabled: false },
																				},
																			}}
																		/>
																	}
																</div>
															</div>
														</div>
													</div>
												)}
											</Draggable>
										);
									})}
									{provided.placeholder}
								</div>
							)}
						</Droppable>
					</div>
				</DragDropContext>
			</div>
		);
	}
}

PubOptionsAttribution.propTypes = propTypes;
export default PubOptionsAttribution;
