import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { usePageContext } from 'utils/hooks';
import { useSticky } from 'client/utils/useSticky';
import { FormattingBar, buttons } from 'components/FormattingBar';
import PubHeaderCollaborators from './PubHeaderCollaborators';

require('./pubHeaderFormatting.scss');

const propTypes = {
	pubData: PropTypes.object.isRequired,
	collabData: PropTypes.object.isRequired,
	editorWrapperRef: PropTypes.any.isRequired,
	disabled: PropTypes.bool.isRequired,
};

const PubHeaderFormatting = (props) => {
	const { pubData, collabData, disabled } = props;
	const { scopeData } = usePageContext();
	const { canEdit, canEditDraft } = scopeData.activePermissions;

	useSticky({
		selector: '.pub-draft-header-component',
		isActive: !disabled,
		offset: 37,
	});

	if (!(canEdit || canEditDraft)) {
		return null;
	}

	return (
		<div className={classNames('pub-draft-header-component', disabled && 'disabled')}>
			<FormattingBar
				buttons={buttons.fullButtonSet}
				editorChangeObject={props.collabData.editorChangeObject || {}}
				popoverContainerRef={props.editorWrapperRef}
				footnotes={pubData.footnotes}
				citations={pubData.citations}
				citationStyle={pubData.citationStyle}
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
