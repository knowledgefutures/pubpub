import type { EditorChangeObject } from 'components/Editor';
import type { SuggestedEditsUser } from 'types';

import type { FormattingBarButtonData } from './types';

import React from 'react';

import { Button, Tooltip } from '@blueprintjs/core';

import { useRefMap } from 'client/utils/useRefMap';
import { Icon } from 'components';

import { suggestedEditsAccept, suggestedEditsReject } from './buttons';
import { useCommandStates } from './hooks/useCommandStates';

type Props = {
	suggestionAuthor?: SuggestedEditsUser;
	buttons: FormattingBarButtonData[][];
	editorChangeObject: EditorChangeObject;
};

const FormattingBarSuggestedEdits = (props: Props) => {
	const { suggestionAuthor, buttons, editorChangeObject } = props;
	const buttonElementRefs = useRefMap();
	const { view } = editorChangeObject;

	const commandStates = useCommandStates({
		view: editorChangeObject.view,
		state: editorChangeObject.view?.state,
		commands: buttons,
	});

	const handleClick = (button: FormattingBarButtonData) => {
		const commandState = commandStates[button.key];
		commandState?.run();
		view.focus();
	};
	const rejectButtonContent = suggestionAuthor
		? `Reject suggestion made by ${suggestionAuthor.fullName}`
		: suggestedEditsReject.title;
	const acceptButtonContent = suggestionAuthor
		? `Accept suggestion made by ${suggestionAuthor.fullName}`
		: suggestedEditsAccept.title;
	return (
		<>
			<Tooltip content={acceptButtonContent} usePortal={true}>
				<Button
					ref={buttonElementRefs.getRef(suggestedEditsAccept.key)}
					aria-label={suggestedEditsAccept.title}
					role="button"
					onClick={() => handleClick(suggestedEditsAccept)}
					className="accept-button"
				>
					<Icon icon={suggestedEditsAccept.icon} iconSize={16} />
				</Button>
			</Tooltip>
			<Tooltip content={rejectButtonContent} usePortal={true}>
				<Button
					ref={buttonElementRefs.getRef(suggestedEditsReject.key)}
					aria-label={suggestedEditsReject.title}
					role="button"
					onClick={() => handleClick(suggestedEditsReject)}
					className="reject-button"
				>
					<Icon icon={suggestedEditsReject.icon} iconSize={16} />
				</Button>
			</Tooltip>
		</>
	);
};

export default FormattingBarSuggestedEdits;
