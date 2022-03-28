import React from 'react';
import classNames from 'classnames';

import { useSticky } from 'client/utils/useSticky';
import { buttons, FormattingBar } from 'components/FormattingBar';
import { usePageContext } from 'utils/hooks';

import PubHeaderCollaborators from './PubHeaderCollaborators';
import PubWordCountButton from './PubWordCountButton';

require('./pubHeaderFormatting.scss');

type Props = {
	collabData: any;
	disabled: boolean;
	editorWrapperRef: React.RefObject<HTMLDivElement>;
};

const PubHeaderFormatting = (props: Props) => {
	const { collabData, disabled, editorWrapperRef } = props;
	const { scopeData } = usePageContext();
	const { canEdit, canEditDraft } = scopeData.activePermissions;

	useSticky({
		target: '.pub-draft-header-component',
		isActive: !disabled,
		offset: 37,
	});

	if (!(canEdit || canEditDraft)) {
		return null;
	}

	const state = props.collabData.editorChangeObject.view?.state;

	return (
		<div className={classNames('pub-draft-header-component', disabled && 'disabled')}>
			<FormattingBar
				buttons={buttons.fullButtonSet}
				editorChangeObject={props.collabData.editorChangeObject || {}}
				controlsConfiguration={{
					container: editorWrapperRef.current!,
					isAbsolutelyPositioned: true,
					isFullScreenWidth: true,
				}}
			/>
			<div className="right-content">
				<PubHeaderCollaborators collabData={props.collabData} />
				{state && <PubWordCountButton doc={state.doc} />}
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

export default PubHeaderFormatting;
