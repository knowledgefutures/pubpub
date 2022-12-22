import React, { Component } from 'react';
import {
	Icon as BlueprintIcon,
	Button,
	ButtonGroup,
	Classes,
	Popover,
	PopoverInteractionKind,
	Position,
	Tooltip,
} from '@blueprintjs/core';
import uuidv4 from 'uuid/v4';

import Icon from 'components/Icon/Icon';
import { apiFetch } from 'client/utils/apiFetch';

require('./labelFilter.scss');

type OwnProps = {
	pubData: any;
	communityData: any;
	labelsData?: any[];
	selectedLabels: any[];
	isManager: boolean;
	onLabelSelect: (...args: any[]) => any;
	updateLocalData: (...args: any[]) => any;
};

const defaultProps = {
	labelsData: [],
};

type State = any;

type Props = OwnProps & typeof defaultProps;

class LabelFilter extends Component<Props, State> {
	static defaultProps = defaultProps;

	constructor(props: Props) {
		super(props);
		this.state = {
			isEditMode: false,
			labelsData: props.labelsData,
			isSaving: false,
			labelsDataChanged: false,
		};
		this.toggleEditMode = this.toggleEditMode.bind(this);
		this.updateTitle = this.updateTitle.bind(this);
		this.updateColor = this.updateColor.bind(this);
		this.removeLabel = this.removeLabel.bind(this);
		this.togglePublicApply = this.togglePublicApply.bind(this);
		this.addLabel = this.addLabel.bind(this);
		this.handleSave = this.handleSave.bind(this);
	}

	UNSAFE_componentWillReceiveProps(nextProps: Props) {
		this.setState({
			labelsData: nextProps.labelsData,
			isSaving: false,
			isEditMode: false,
			labelsDataChanged: false,
		});
	}

	toggleEditMode() {
		this.setState((prevState) => {
			return { isEditMode: !prevState.isEditMode };
		});
	}

	updateTitle(id, newTitle) {
		this.setState((prevState) => {
			const newLabelsData = prevState.labelsData.map((label) => {
				if (label.id !== id) {
					return label;
				}
				return {
					...label,
					title: newTitle,
				};
			});
			return { labelsData: newLabelsData, labelsDataChanged: true };
		});
	}

	updateColor(id, newColor) {
		this.setState((prevState) => {
			const newLabelsData = prevState.labelsData.map((label) => {
				if (label.id !== id) {
					return label;
				}
				return {
					...label,
					color: newColor,
				};
			});
			return { labelsData: newLabelsData, labelsDataChanged: true };
		});
	}

	togglePublicApply(id) {
		this.setState((prevState) => {
			const newLabelsData = prevState.labelsData.map((label) => {
				if (label.id !== id) {
					return label;
				}
				return {
					...label,
					publicApply: !label.publicApply,
				};
			});
			return { labelsData: newLabelsData, labelsDataChanged: true };
		});
	}

	removeLabel(id) {
		this.setState((prevState) => {
			const newLabelsData = prevState.labelsData.filter((label) => {
				return label.id !== id;
			});
			return { labelsData: newLabelsData, labelsDataChanged: true };
		});
	}

	addLabel() {
		this.setState((prevState) => {
			const newLabelsData = [
				...prevState.labelsData,
				{
					id: uuidv4(),
					title: 'New Label',
					color: '#b71540',
					publicApply: false,
				},
			];
			return { labelsData: newLabelsData, labelsDataChanged: true };
		});
	}

	handleSave() {
		this.setState({ isSaving: true });
		return apiFetch('/api/pubs', {
			method: 'PUT',
			body: JSON.stringify({
				labels: this.state.labelsData,
				pubId: this.props.pubData.id,
				communityId: this.props.communityData.id,
			}),
		})
			.then((result) => {
				this.props.updateLocalData('pub', result);
				this.setState({ isSaving: false });
			})
			.catch((err) => {
				console.error('Error saving labels', err);
			});
	}

	render() {
		const showEditMode =
			this.state.isEditMode || (!this.props.labelsData.length && this.props.isManager);
		return (
			<div className="label-filter-component">
				<h6>Filter by label</h6>
				<div className="labels">
					{!showEditMode &&
						this.state.labelsData
							.sort((foo, bar) => {
								if (foo.title.toLowerCase() < bar.title.toLowerCase()) {
									return -1;
								}
								if (foo.title.toLowerCase() > bar.title.toLowerCase()) {
									return 1;
								}
								return 0;
							})
							.map((label) => {
								const handleClick = () => {
									this.props.onLabelSelect(label.id);
								};
								return (
									<li key={`label-${label.id}`}>
										<div
											role="button"
											tabIndex={-1}
											className="label"
											onClick={handleClick}
										>
											<div
												className="color"
												style={{ backgroundColor: label.color }}
											>
												{this.props.selectedLabels.indexOf(label.id) >
													-1 && (
													<BlueprintIcon
														className={Classes.ICON_STANDARD}
														icon="small-tick"
														tagName="span"
													/>
												)}
											</div>
											<div className="title">{label.title}</div>
											<Tooltip
												content={
													label.publicApply ? (
														<span>
															All discussants can apply this label.
														</span>
													) : (
														<span>
															Only managers can apply this label.
														</span>
													)
												}
												// @ts-expect-error ts-migrate(2322) FIXME: Type '{ children: Element; content: Element; toolt... Remove this comment to see the full error message
												tooltipClassName={Classes.DARK}
												position={Position.TOP}
											>
												<BlueprintIcon
													icon="endorsed"
													className={`${Classes.ICON_STANDARD} ${
														label.publicApply ? '' : 'active'
													}`}
													tagName="span"
												/>
											</Tooltip>
										</div>
									</li>
								);
							})}

					{!showEditMode && !this.state.labelsData.length && (
						<div className={`${Classes.MENU_ITEM} empty`}>No Labels to Filter by</div>
					)}

					{/* Labels Edit Mode */}
					{showEditMode &&
						this.state.labelsData.map((label) => {
							const handleTitleChange = (evt) => {
								this.updateTitle(label.id, evt.target.value);
							};
							const handleLabelRemove = () => {
								this.removeLabel(label.id);
							};
							const handlePublicApplyToggle = () => {
								this.togglePublicApply(label.id);
							};
							const colors = [
								'#eb2f06',
								'#b71540',
								'#fa983a',
								'#e58e26',
								'#38ada9',
								'#079992',
								'#009432',
								'#006266',
								'#0652DD',
								'#1B1464',
								'#833471',
								'#6F1E51',
							];
							return (
								<div key={`label-edit-${label.id}`} className="label edit">
									<Popover
										content={
											<div className={`${Classes.MENU} color-select-menu`}>
												{colors.map((color) => {
													return (
														<span
															aria-label="Select color"
															role="button"
															tabIndex={-1}
															key={color}
															className="color-select"
															style={{ backgroundColor: color }}
															onClick={() => {
																this.updateColor(label.id, color);
															}}
														/>
													);
												})}
											</div>
										}
										interactionKind={PopoverInteractionKind.CLICK}
										position={Position.TOP_LEFT}
										popoverClassName="color-select-popover"
										transitionDuration={-1}
										// @ts-expect-error ts-migrate(2322) FIXME: Type '{ children: Element; content: Element; inter... Remove this comment to see the full error message
										inline={true}
										inheritDarkTheme={false}
									>
										<div
											className="color edit"
											style={{ backgroundColor: label.color }}
										/>
									</Popover>
									<input
										className={Classes.INPUT}
										type="text"
										value={label.title}
										onChange={handleTitleChange}
									/>
									<Tooltip
										content={
											label.publicApply ? (
												<span>All discussants can apply this label.</span>
											) : (
												<span>Only managers can apply this label.</span>
											)
										}
										// @ts-expect-error ts-migrate(2322) FIXME: Type '{ children: Element; content: Element; toolt... Remove this comment to see the full error message
										tooltipClassName={Classes.DARK}
										position={Position.TOP}
									>
										<Button
											icon="endorsed"
											minimal
											onClick={handlePublicApplyToggle}
											className={label.publicApply ? '' : 'active'}
										/>
									</Tooltip>
									<Button onClick={handleLabelRemove} icon="trash" minimal />
								</div>
							);
						})}
				</div>
				{showEditMode && (
					<ButtonGroup>
						<Button onClick={this.addLabel} text="Add Label" icon="plus" />
						<Button
							onClick={this.handleSave}
							text="Save"
							intent="primary"
							icon="tick"
							loading={this.state.isSaving}
							disabled={!this.state.labelsDataChanged}
						/>
					</ButtonGroup>
				)}
				{!showEditMode && this.props.isManager && (
					<Button
						icon={<Icon icon="edit2" />}
						text="Edit labels"
						onClick={this.toggleEditMode}
					/>
				)}
			</div>
		);
	}
}
export default LabelFilter;
