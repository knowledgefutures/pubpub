import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import stickybits from 'stickybits';

import { FormattingBar } from 'components';

import PubHeaderCollaborators from './PubHeaderCollaborators';

require('./pubHeaderFormatting.scss');

const propTypes = {
	pubData: PropTypes.object.isRequired,
	collabData: PropTypes.object.isRequired,
	// loginData: PropTypes.object.isRequired,
	// formattingBarKey: PropTypes.string,
	// editorChangeObject: PropTypes.object,
	// setOptionsMode: PropTypes.func.isRequired,
	// collabStatus: PropTypes.string,
	threads: PropTypes.array,
};

const defaultProps = {
	// collabStatus: 'connecting',
	threads: [],
	// formattingBarKey: '',
};

const PubHeaderFormatting = (props) => {
	const stickyInstanceRef = useRef(undefined);
	useEffect(() => {
		stickyInstanceRef.current = stickybits('.pub-draft-header-component', {
			stickyBitStickyOffset: 35,
		});
		return () => {
			if (stickyInstanceRef.current) {
				stickyInstanceRef.current.cleanup();
			}
		};
	}, []);

	const { pubData, collabData } = props;
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
				<PubHeaderCollaborators collabData={props.collabData} />
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
