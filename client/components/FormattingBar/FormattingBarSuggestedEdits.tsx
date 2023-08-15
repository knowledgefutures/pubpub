import React from 'react';
import { Tooltip, Button } from '@blueprintjs/core';
import { Icon } from 'components';

import { SuggestedEditsUser } from 'types';
import { EditorChangeObject } from 'components/Editor';
import { useRefMap } from 'client/utils/useRefMap';
import { FormattingBarButtonData } from './types';
import { suggestedEditsReject, suggestedEditsAccept } from './buttons';
import { useCommandStates } from './hooks/useCommandStates';

require('./formattingBarSuggestedEdits.scss');

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
		<div>
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
		</div>
	);
};

export default FormattingBarSuggestedEdits;
