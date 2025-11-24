import type { EditorChangeObjectWithNode } from '../types';

import React from 'react';

import { mathToggleKind, mathToggleLabel } from 'components/Editor/commands';
import { FormattingBar, type FormattingBarButtonData } from 'components/FormattingBar';

import './controls.scss';

type Props = {
	editorChangeObject: EditorChangeObjectWithNode;
};

const ControlsMath = (props: Props) => {
	const { editorChangeObject } = props;
	const { selectedNode } = editorChangeObject;
	const otherPosition = selectedNode.type.name === 'math_display' ? 'inline' : 'display';

	const isDisplay = selectedNode?.type.name === 'math_display';
	const otherVisibility =
		isDisplay && selectedNode.attrs.hideLabel
			? {
					icon: 'eye-open',
					label: 'Show',
				}
			: {
					icon: 'eye-off',
					label: 'Hide',
				};

	const swapMathTypeButton: FormattingBarButtonData = {
		key: 'change-math-node-type',
		title: 'Change display position',
		label: `Make ${otherPosition}`,
		icon: 'swap-horizontal',
		command: mathToggleKind,
	};
	const toggleMathLabelButton: FormattingBarButtonData = {
		key: 'toggle-math-display-label',
		title: 'Toggle label',
		label: `${otherVisibility.label} label`,
		icon: otherVisibility.icon as any,
		command: mathToggleLabel,
	};

	const mathButtons: FormattingBarButtonData[][] = [[swapMathTypeButton]];
	if (isDisplay) mathButtons.push([toggleMathLabelButton]);

	return (
		<FormattingBar
			editorChangeObject={editorChangeObject}
			buttons={mathButtons}
			showBlockTypes={false}
		/>
	);
};

export default ControlsMath;
