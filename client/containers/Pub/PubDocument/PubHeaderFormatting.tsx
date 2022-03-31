import React, { useMemo } from 'react';
import classNames from 'classnames';

import { useSticky } from 'client/utils/useSticky';
import { buttons, FormattingBar } from 'components/FormattingBar';
import { usePageContext } from 'utils/hooks';

import { usePubContext } from '../pubHooks';
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
	const { submissionState } = usePubContext();

	// TODO(ian): this is a HACK that can be replaced with a check for isReadOnly once we migrate
	// the usePubBodyState() hook into usePubContext() in #1867
	const isPreviewingSubmission = useMemo(() => {
		if (submissionState) {
			const { submission, selectedTab } = submissionState;
			return submission.status === 'incomplete' && selectedTab === 'preview';
		}
		return false;
	}, [submissionState]);

	useSticky({
		target: '.pub-draft-header-component',
		isActive: !disabled,
		offset: 37,
	});

	if (!(canEdit || canEditDraft) || isPreviewingSubmission) {
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
