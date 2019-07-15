import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import stickybits from 'stickybits';

import { FormattingBar } from 'components';
import { nestDiscussionsToThreads } from 'containers/Pub/PubDocument/PubDiscussions/discussionUtils';
import PubHeaderCollaborators from './PubHeaderCollaborators';

require('./pubHeaderFormatting.scss');

const propTypes = {
	pubData: PropTypes.object.isRequired,
	collabData: PropTypes.object.isRequired,
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
			<FormattingBar
				editorChangeObject={props.collabData.editorChangeObject || {}}
				threads={nestDiscussionsToThreads(props.pubData.discussions)}
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
		</div>
	);
};

PubHeaderFormatting.propTypes = propTypes;
export default PubHeaderFormatting;
