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
			useStickyClasses: true,
		});
		return () => {
			if (stickyInstanceRef.current) {
				stickyInstanceRef.current.cleanup();
			}
		};
	}, []);

	const { pubData, collabData } = props;
	if (!pubData.canEditBranch) {
		return null;
	}
	return (
		<div className="pub-draft-header-component">
			{/* <GridWrapper columnClassName="pub-draft-header-controls" containerClassName="pub"> */}
			<FormattingBar
				editorChangeObject={props.collabData.editorChangeObject || {}}
				threads={props.threads}
			/>
			<div className="right-content">
				<PubHeaderCollaborators collabData={props.collabData} />
				<span className={`collab-status ${collabData.status}`}>
					{collabData.status}
					{collabData.status === 'saving' || collabData.status === 'connecting'
						? '...'
						: ''}
				</span>
			</div>
			{/* </GridWrapper> */}
		</div>
	);
};

PubHeaderFormatting.propTypes = propTypes;
PubHeaderFormatting.defaultProps = defaultProps;
export default PubHeaderFormatting;
