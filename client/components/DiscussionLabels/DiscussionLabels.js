import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Button, Popover, PopoverInteractionKind, Position, Tooltip } from '@blueprintjs/core';

require('./discussionLabels.scss');

const propTypes = {
	availableLabels: PropTypes.array.isRequired,
	labelsData: PropTypes.object.isRequired,
	onLabelsSave: PropTypes.func.isRequired,
	isAdmin: PropTypes.bool.isRequired,
	canManageThread: PropTypes.bool.isRequired,
};

class DiscussionLabels extends Component {
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

	componentWillReceiveProps(nextProps) {
		this.setState({
			labelsData: nextProps.labelsData,
			isSaving: false,
			labelsDataChanged: false,
		});
	}

	applyLabel(labelId) {
		this.setState((prevState)=> {
			return {
				labelsData: [
					...prevState.labelsData,
					labelId,
				],
				labelsDataChanged: true,
			};
		});
	}

	removeLabel(labelId) {
		this.setState((prevState)=> {
			return {
				labelsData: prevState.labelsData.filter((label)=> {
					return label !== labelId;
				}),
				labelsDataChanged: true,
			};
		});
	}

	handleSave() {
		this.setState({ isSaving: true });
		this.props.onLabelsSave(this.state.labelsData);
	}

	render() {
		const labelsById = {};
		this.props.availableLabels.forEach((label)=> {
			labelsById[label.id] = label;
		});

		const availableLabels = this.props.availableLabels.filter((label)=> {
			return this.props.isAdmin || label.publicApply;
		});

		return (
			<div className="discussion-labels-component">
				{this.props.canManageThread && !!availableLabels.length &&
					<Popover
						content={
							<div className="pt-menu">
								<Button
									className="pt-fill"
									text="Save"
									onClick={this.handleSave}
									loading={this.state.isSaving}
									disabled={!this.state.labelsDataChanged}
								/>
								{availableLabels.sort((foo, bar)=> {
									if (foo.title < bar.title) { return -1; }
									if (foo.title > bar.title) { return 1; }
									return 0;
								}).map((label)=> {
									const isActive = this.state.labelsData.indexOf(label.id) > -1;
									const handleClick = isActive
										? ()=> { this.removeLabel(label.id); }
										: ()=> { this.applyLabel(label.id); };
									return (
										<li key={label.id}>
											<div role="button" tabIndex={-1} className="pt-menu-item" onClick={handleClick}>
												<div className="color" style={{ backgroundColor: label.color }}>
													{isActive && <span className="pt-icon-standard pt-icon-tick" />}
												</div>
												<div className="label-title">{label.title}</div>
												{this.props.isAdmin &&
													<Tooltip
														content={label.publicApply
															? <span>All discussion authors can apply this label.</span>
															: <span>Only managers can apply this label.</span>
														}
														tooltipClassName="pt-dark"
														position={Position.TOP}
													>
														<span className={`pt-icon-standard pt-icon-endorsed ${label.publicApply ? '' : 'active'}`} />
													</Tooltip>
												}
											</div>
										</li>
									);
								})}

							</div>
						}
						interactionKind={PopoverInteractionKind.CLICK}
						position={Position.BOTTOM_LEFT}
						popoverClassName="label-edit-popover"
						transitionDuration={-1}
						inline={true}
						inheritDarkTheme={false}
					>
						<button
							type="button"
							className="pt-tag pt-minimal"
							onClick={this.toggleEditMode}
						>
							Edit Labels
						</button>
					</Popover>
				}
				{this.props.labelsData.sort((foo, bar)=> {
					if (labelsById[foo].title < labelsById[bar].title) { return -1; }
					if (labelsById[foo].title > labelsById[bar].title) { return 1; }
					return 0;
				}).map((labelId)=> {
					const label = labelsById[labelId];
					return <span className="pt-tag" style={{ backgroundColor: label.color }}>{label.title}</span>;
				})}
			</div>
		);
	}
}

DiscussionLabels.propTypes = propTypes;
export default DiscussionLabels;
