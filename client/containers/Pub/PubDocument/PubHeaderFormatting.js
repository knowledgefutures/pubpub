import React, { useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { PageContext } from 'components/PageWrapper/PageWrapper';
import { Tooltip } from '@blueprintjs/core';
import stickybits from 'stickybits';
import { Avatar, FormattingBar } from 'components';

require('./pubHeaderFormatting.scss');

const propTypes = {
	pubData: PropTypes.object.isRequired,
	collabData: PropTypes.object.isRequired,
	// loginData: PropTypes.object.isRequired,
	// formattingBarKey: PropTypes.string,
	// editorChangeObject: PropTypes.object,
	// setOptionsMode: PropTypes.func.isRequired,
	// collabStatus: PropTypes.string,
	activeCollaborators: PropTypes.array,
	threads: PropTypes.array,
};

const defaultProps = {
	// collabStatus: 'connecting',
	threads: [],
	activeCollaborators: [],
	// formattingBarKey: '',
};

const PubHeaderFormatting = (props) => {
	const { loginData } = useContext(PageContext);
	const [stickyInstance, setStickyInstance] = useState(undefined);
	useEffect(() => {
		setStickyInstance(
			stickybits('.pub-draft-header-component', {
				stickyBitStickyOffset: 35,
			}),
		);
		return () => {
			stickyInstance.cleanup();
		};
	}, []);

	const { pubData, collabData } = props;
	const uniqueActiveCollaborators = {};
	props.activeCollaborators.forEach((item) => {
		if (item.initials !== '?') {
			uniqueActiveCollaborators[item.id] = item;
		}
	});
	const numAnonymous = props.activeCollaborators.reduce((prev, curr) => {
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
	// const viewOnly = !pubData.canEditBranch;
	if (!pubData.canEditBranch) {
		return null;
	}
	return (
		<div className="pub-draft-header-component">
			<FormattingBar
				editorChangeObject={props.collabData.editorChangeObject || {}}
				threads={props.threads}
				// key={props.formattingBarKey}
			/>

			{/* <div className="spacer" /> */}
			<div className="right-content">
				{Object.keys(uniqueActiveCollaborators)
					.map((key) => {
						return uniqueActiveCollaborators[key];
					})
					.filter((item) => {
						return item && item.id !== loginData.id;
					})
					.map((collaborator) => {
						return (
							<div
								className="avatar-wrapper"
								key={`present-avatar-${collaborator.id}`}
							>
								<Tooltip content={collaborator.name} tooltipClassName="bp3-dark">
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

				<span className={`collab-status ${collabData.status}`}>
					<span className="status-prefix">Working Draft </span>
					{collabData.status}
					{collabData.status === 'saving' || collabData.status === 'connecting'
						? '...'
						: ''}
				</span>

				{/* <button className="bp3-button bp3-small" type="button">
					Editing
					<span className="bp3-icon-standard bp3-icon-caret-down bp3-align-right" />
				</button> */}
				{/* <button
					className="save-version-button bp3-button bp3-intent-primary bp3-small"
					type="button"
					onClick={() => {
						// props.setOptionsMode('saveVersion');
					}}
				>
					Save Version
				</button> */}
			</div>
		</div>
	);
};

PubHeaderFormatting.propTypes = propTypes;
PubHeaderFormatting.defaultProps = defaultProps;
export default PubHeaderFormatting;
