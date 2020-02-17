import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import stickybits from 'stickybits';
import { usePageContext } from 'utils/hooks';
import { FormattingBar, buttons } from 'components/FormattingBar';
import PubHeaderCollaborators from './PubHeaderCollaborators';

require('./pubHeaderFormatting.scss');

const propTypes = {
	pubData: PropTypes.object.isRequired,
	collabData: PropTypes.object.isRequired,
	editorWrapperRef: PropTypes.any.isRequired,
};

const PubHeaderFormatting = (props) => {
	const stickyInstanceRef = useRef(undefined);
	useEffect(() => {
		stickyInstanceRef.current = stickybits('.pub-draft-header-component', {
			stickyBitStickyOffset: 37,
			useStickyClasses: true,
		});
		return () => {
			if (stickyInstanceRef.current) {
				stickyInstanceRef.current.cleanup();
			}
		};
	}, []);

	const { pubData, collabData } = props;
	const { scopeData } = usePageContext();
	const { canEdit, canEditDraft } = scopeData.activePermissions;
	if (!(canEdit || canEditDraft)) {
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
