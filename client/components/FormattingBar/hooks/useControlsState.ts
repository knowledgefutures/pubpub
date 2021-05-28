import { useEffect, useMemo, useState } from 'react';

import { EditorChangeObject, insertNodeIntoEditor } from 'components/Editor';

import { FormattingBarButtonData, ControlsConfiguration } from '../types';
import { resolveControlsConfiguration } from '../controls';
import { deepMap } from '../utils';
import { useInteractionCount } from './useInteractionCount';
import { useCommandStates, WithCommandState } from './useCommandStates';

type Options = {
	buttons: FormattingBarButtonData[][];
	editorChangeObject: EditorChangeObject;
	controlsConfiguration: ControlsConfiguration;
};

type IntermediateState = {
	indicatedButtons: FormattingBarButtonData[];
	openedButton: null | FormattingBarButtonData;
	setOpenedButton: (button: null | FormattingBarButtonData) => unknown;
	editorChangeObject: EditorChangeObject;
	controlsDetached: boolean;
};

export type ButtonState = {
	button: WithCommandState<FormattingBarButtonData>;
	isOpen: boolean;
	isIndicated: boolean;
	isDisabled: boolean;
	isActive: boolean;
	isHidden: boolean;
	isDetached: boolean;
	onClick: () => unknown;
};

const isButtonDisabled = (
	button: WithCommandState<FormattingBarButtonData>,
	state: IntermediateState,
) => {
	const { commandState } = button;
	if (typeof button.isDisabled === 'function' && button.isDisabled(state.editorChangeObject)) {
		return true;
	}
	if (commandState && !commandState.canRun) {
		return true;
	}
	return false;
};

const isButtonActive = (button: WithCommandState<FormattingBarButtonData>) => {
	const { commandState } = button;
	if (commandState) {
		return commandState.isActive;
	}
	return false;
};

const getButtonState = (
	button: WithCommandState<FormattingBarButtonData>,
	state: IntermediateState,
): ButtonState => {
	const {
		openedButton,
		setOpenedButton,
		indicatedButtons,
		controlsDetached,
		editorChangeObject: { view },
	} = state;
	const isDisabled = isButtonDisabled(button, state);
	const isOpen = openedButton?.key === button.key;
	const isIndicated = indicatedButtons.some((b) => b.key === button.key);
	const isActive = isButtonActive(button);
	const isDetached = isOpen && controlsDetached;
	return {
		button,
		isDisabled,
		isOpen,
		isIndicated,
		isActive,
		isDetached,
		isHidden: false,
		onClick: () => {
			if (isIndicated) {
				setOpenedButton(openedButton === button ? null : button);
			} else if ('insertNodeType' in button) {
				insertNodeIntoEditor(view, button.insertNodeType);
				view.focus();
			} else {
				const { commandState } = button;
				commandState?.run();
				view.focus();
			}
		},
	};
};

const getButtonStates = (
	buttons: WithCommandState<FormattingBarButtonData>[][],
	state: IntermediateState,
) => deepMap(buttons, (button) => getButtonState(button, state));

export const useControlsState = (options: Options) => {
	const { buttons, editorChangeObject, controlsConfiguration } = options;
	const flatButtons = useMemo(() => buttons.reduce((a, b) => [...a, ...b], []), [buttons]);
	const [openedButton, setOpenedButton] = useState<FormattingBarButtonData | null>(null);
	const interactionCount = useInteractionCount(editorChangeObject.latestDomEvent);
	const editorElement = editorChangeObject.view?.dom;

	const buttonsWithCommandState = useCommandStates<FormattingBarButtonData>({
		view: editorChangeObject.view,
		state: editorChangeObject.view?.state,
		commands: buttons,
	});

	const selectedNodeId = editorChangeObject.selectedNode?.attrs?.id;
	const effectKey = `${selectedNodeId}-${interactionCount}`;

	const indicatedButtons = flatButtons.filter((b) => b.controls?.indicate(editorChangeObject));
	const indicatedButtonsString = indicatedButtons.map((button) => button.key).join('-');

	const resolvedControlsConfiguration = resolveControlsConfiguration(
		controlsConfiguration,
		editorChangeObject,
		openedButton,
	);

	const buttonStates = getButtonStates(buttonsWithCommandState, {
		indicatedButtons,
		openedButton,
		setOpenedButton,
		editorChangeObject,
		controlsDetached: resolvedControlsConfiguration?.kind === 'floating',
	});

	useEffect(() => {
		const openableIndicatedButton = indicatedButtons.find(
			(button) => button.controls && button.controls.trigger(editorChangeObject),
		);
		setOpenedButton(openableIndicatedButton || null);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [effectKey, indicatedButtonsString]);

	useEffect(() => {
		const handleOptions = { capture: true };
		const handler = (evt) => {
			if (evt.key === 'Enter' && editorElement?.contains(document.activeElement)) {
				if (indicatedButtons.length === 1 && !openedButton) {
					const [openableButton] = indicatedButtons;
					if (openableButton?.controls?.enterKeyTriggers) {
						evt.stopImmediatePropagation();
						evt.preventDefault();
						setOpenedButton(openableButton);
					}
				}
			}
		};
		document.addEventListener('keydown', handler, handleOptions);
		return () => document.removeEventListener('keydown', handler, handleOptions);
	}, [indicatedButtons, openedButton, setOpenedButton, editorElement]);

	return {
		openedButton,
		setOpenedButton,
		selectedNodeId,
		buttonStates,
		resolvedControlsConfiguration,
	};
};
