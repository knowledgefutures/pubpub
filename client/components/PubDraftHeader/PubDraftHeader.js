import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Tooltip } from '@blueprintjs/core';
import stickybits from 'stickybits';
import Avatar from 'components/Avatar/Avatar';
import FormattingBar from 'components/FormattingBar/FormattingBar';

require('./pubDraftHeader.scss');

const propTypes = {
	pubData: PropTypes.object.isRequired,
	loginData: PropTypes.object.isRequired,
	editorChangeObject: PropTypes.object.isRequired,
	setOptionsMode: PropTypes.func.isRequired,
	collabStatus: PropTypes.string.isRequired,
	activeCollaborators: PropTypes.array.isRequired,
	threads: PropTypes.array,
};

const defaultProps = {
	threads: [],
};

class PubDraftHeader extends Component {
	constructor(props) {
		super(props);
		this.stickyInstance = undefined;
	}

	componentDidMount() {
		this.stickyInstance = stickybits('.pub-draft-header-component', {
			stickyBitStickyOffset: 35,
		});
	}

	componentWillUnmount() {
		this.stickyInstance.cleanup();
	}

	render() {
		const pubData = this.props.pubData;
		const uniqueActiveCollaborators = {};
		this.props.activeCollaborators.forEach((item) => {
			if (item.initials !== '?') {
				uniqueActiveCollaborators[item.id] = item;
			}
		});
		const numAnonymous = this.props.activeCollaborators.reduce((prev, curr) => {
			if (curr.initials === '?') {
				return prev + 1;
			}
			return prev;
		}, 0);
		if (numAnonymous) {
			uniqueActiveCollaborators.anon = {
				backgroundColor: 'rgba(96,96,96, 0.2)',
				cursorColor: 'rgba(96,96,96, 1.0)',
				id: 'anon',
				initials: numAnonymous,
				name: `${numAnonymous} anonymous user${numAnonymous === 1 ? '' : 's'}`,
			};
		}
		const viewOnly = !pubData.isDraftEditor && !pubData.isManager;
		return (
			<div className="pub-draft-header-component">
				{viewOnly && (
					<div className="bp3-callout bp3-intent-warning">
						<b>Read Only</b> You have view permissions to the working draft but cannot
						edit it.
					</div>
				)}
				{!viewOnly && (
					<FormattingBar
						editorChangeObject={this.props.editorChangeObject}
						threads={this.props.threads}
					/>
				)}
				{/* <div className="spacer" /> */}
				<div className="right-content">
					{Object.keys(uniqueActiveCollaborators)
						.map((key) => {
							return uniqueActiveCollaborators[key];
						})
						.filter((item) => {
							return item && item.id !== this.props.loginData.id;
						})
						.map((collaborator) => {
							return (
								<div
									className="avatar-wrapper"
									key={`present-avatar-${collaborator.id}`}
								>
									<Tooltip
										content={collaborator.name}
										tooltipClassName="bp3-dark"
									>
										<Avatar
											/* Cast userInitials to string since
										the anonymous Avatar is a int count */
											userInitials={String(collaborator.initials)}
											userAvatar={collaborator.image}
											borderColor={collaborator.cursorColor}
											borderWidth="2px"
											width={24}
										/>
									</Tooltip>
								</div>
							);
						})}
					{!viewOnly && (
						<span className={`collab-status ${this.props.collabStatus}`}>
							<span className="status-prefix">Working Draft </span>
							{this.props.collabStatus}
							{this.props.collabStatus === 'saving' ||
							this.props.collabStatus === 'connecting'
								? '...'
								: ''}
						</span>
					)}
					{/* <button className="bp3-button bp3-small" type="button">
						Editing
						<span className="bp3-icon-standard bp3-icon-caret-down bp3-align-right" />
					</button> */}
					<button
						className="save-version-button bp3-button bp3-intent-primary bp3-small"
						type="button"
						onClick={() => {
							this.props.setOptionsMode('saveVersion');
						}}
					>
						Save Version
					</button>
				</div>
			</div>
		);
	}
}

PubDraftHeader.propTypes = propTypes;
PubDraftHeader.defaultProps = defaultProps;
export default PubDraftHeader;
