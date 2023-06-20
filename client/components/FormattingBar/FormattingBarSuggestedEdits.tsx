import React from 'react';
import { Tooltip } from '@blueprintjs/core';
import { Button } from 'reakit';
import { Icon } from 'components';

import { EditorChangeObject } from 'components/Editor';
import { useRefMap } from 'client/utils/useRefMap';
import { FormattingBarButtonData } from './types';
import { suggestedEditsReject, suggestedEditsAccept } from './buttons';
import { useCommandStates } from './hooks/useCommandStates';

require('./formattingBarSuggestedEdits.scss');

type Props = {
	buttons: FormattingBarButtonData[][];
	editorChangeObject: EditorChangeObject;
};

const FormattingBarSuggestedEdits = (props: Props) => {
	const { buttons, editorChangeObject } = props;
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

	return (
		<div>
			<Tooltip content="Reject suggestion" usePortal={true}>
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
			<Tooltip content="Accept suggestion" usePortal={true}>
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
