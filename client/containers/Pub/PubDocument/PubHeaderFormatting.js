import React from 'react';
import PropTypes from 'prop-types';

import { useSticky } from 'utils/useSticky';
import { FormattingBar, buttons } from 'components/FormattingBar';
import PubHeaderCollaborators from './PubHeaderCollaborators';

require('./pubHeaderFormatting.scss');

const propTypes = {
	pubData: PropTypes.object.isRequired,
	collabData: PropTypes.object.isRequired,
	editorWrapperRef: PropTypes.any.isRequired,
};

const PubHeaderFormatting = (props) => {
	useSticky({
		selector: '.pub-draft-header-component',
		offset: 37,
	});

	const { pubData, collabData } = props;
	if (!pubData.canEditBranch) {
		return null;
	}

	return (
		<div className="pub-draft-header-component">
			<FormattingBar
				buttons={buttons.fullButtonSet}
				editorChangeObject={props.collabData.editorChangeObject || {}}
				popoverContainerRef={props.editorWrapperRef}
				footnotes={pubData.footnotes}
				citations={pubData.citations}
				isFullScreenWidth={true}
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
