import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Button, Popover, Position, Tooltip, Menu, MenuItem } from '@blueprintjs/core';
import { Icon } from 'components';

require('./labelSelect.scss');

const propTypes = {
	availableLabels: PropTypes.array.isRequired,
	labelsData: PropTypes.array.isRequired,
	onPutDiscussion: PropTypes.func.isRequired,
	canAdminPub: PropTypes.bool.isRequired,
};

class LabelSelect extends Component {
	constructor(props) {
		super(props);
		this.state = {
			labelsData: props.labelsData,
			isSaving: false,
			labelsDataChanged: false,
		};
		this.applyLabel = this.applyLabel.bind(this);
		this.removeLabel = this.removeLabel.bind(this);
		this.handleSave = this.handleSave.bind(this);
	}

	applyLabel(labelId) {
		this.setState((prevState) => {
			return {
				labelsData: [...prevState.labelsData, labelId],
				labelsDataChanged: true,
			};
		});
	}

	removeLabel(labelId) {
		this.setState((prevState) => {
			return {
				labelsData: prevState.labelsData.filter((label) => {
					return label !== labelId;
				}),
				labelsDataChanged: true,
			};
		});
	}

	handleSave() {
		this.setState({ isSaving: true });
		this.props.onPutDiscussion({ labels: this.state.labelsData }).then(() => {
			this.setState({ isSaving: false, labelsDataChanged: false });
		});
	}

	render() {
		const labelsById = {};
		this.props.availableLabels.forEach((label) => {
			labelsById[label.id] = label;
		});

		const availableLabels = this.props.availableLabels.filter((label) => {
			return this.props.canAdminPub || label.publicApply;
		});

		if (availableLabels.length === 0) {
			return null;
		}

		return (
			<Popover
				popoverClassName="label-select-component"
				content={
					<Menu>
						<Button
							fill
							className="save-button"
							text="Save"
							onClick={this.handleSave}
							loading={this.state.isSaving}
							disabled={!this.state.labelsDataChanged}
						/>
						{availableLabels
							.sort((foo, bar) => {
								if (foo.title < bar.title) {
									return -1;
								}
								if (foo.title > bar.title) {
									return 1;
								}
								return 0;
							})
							.map((label) => {
								const isActive = this.state.labelsData.indexOf(label.id) > -1;
								return (
									<MenuItem
										key={label.id}
										shouldDismissPopover={false}
										onClick={() => {
											if (isActive) {
												return this.removeLabel(label.id);
											}
											return this.applyLabel(label.id);
										}}
										icon={
											<div
												className="color"
												style={{ backgroundColor: label.color }}
											>
												{isActive && <Icon icon="tick" iconSize={14} />}
											</div>
										}
										text={label.title}
										labelElement={
											this.props.canAdminPub && (
												<Tooltip
													content={
														label.publicApply
															? 'All discussion authors can apply this label.'
															: 'Only managers can apply this label.'
													}
												>
													<Icon
														icon="endorsed"
														className={
															label.publicApply ? '' : 'active'
														}
													/>
												</Tooltip>
											)
										}
									/>
								);
							})}
					</Menu>
				}
				position={Position.BOTTOM_RIGHT}
				transitionDuration={-1}
				minimal
				target={
					<Button
						minimal
						small
						onClick={this.toggleEditMode}
						icon={<Icon icon="tag2" iconSize={12} />}
					>
						Labels
					</Button>
				}
			/>
		);
	}
}

LabelSelect.propTypes = propTypes;
export default LabelSelect;
