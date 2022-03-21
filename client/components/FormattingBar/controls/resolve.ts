import { EditorChangeObject } from 'components/Editor';

import {
	ControlsConfiguration,
	FormattingBarButtonData,
	FormattingBarButtonDataControls,
	ResolvedControlsConfiguration,
} from '../types';
import { positionNearSelection } from './positioning';

const getControlsPosition = (
	config: ControlsConfiguration,
	buttonControls: FormattingBarButtonDataControls,
	editorChangeObject: EditorChangeObject,
): Pick<ResolvedControlsConfiguration, 'kind' | 'style'> => {
	const { kind } = config;
	const { floatingPosition } = buttonControls;
	if (floatingPosition) {
		return {
			kind: 'floating',
			style: floatingPosition(editorChangeObject, config),
		};
	}
	if (kind === 'floating') {
		return {
			kind: 'floating',
			style: positionNearSelection(editorChangeObject, config),
		};
	}
	return { kind, style: {} };
};

export const resolveControlsConfiguration = (
	config: ControlsConfiguration,
	editorChangeObject: EditorChangeObject,
	openedButton: null | FormattingBarButtonData,
): null | ResolvedControlsConfiguration => {
	const { kind } = config;
	if (kind !== 'none' && openedButton?.controls) {
		const controlsIndicated = openedButton.controls.indicate(editorChangeObject);
		const controlsShown = openedButton.controls.show(editorChangeObject);
		if (controlsIndicated && controlsShown) {
			const { title, ariaTitle } = openedButton;
			const { component, captureFocusOnMount, showCloseButton } = openedButton.controls;
			if (component) {
				return {
					...config,
					...getControlsPosition(config, openedButton.controls, editorChangeObject),
					component,
					showCloseButton: !!showCloseButton,
					captureFocusOnMount: !!captureFocusOnMount,
					title: ariaTitle || title,
				};
			}
		}
	}
	return null;
};
