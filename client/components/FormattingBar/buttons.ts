import ControlsEquation from './controlComponents/ControlsEquation';
import ControlsFootnoteCitation from './controlComponents/ControlsFootnoteCitation/ControlsFootnoteCitation';
import ControlsLink from './controlComponents/ControlsLink';
import ControlsReference, { ControlsReferencePopover } from './controlComponents/ControlsReference';
import ControlsMedia from './controlComponents/ControlsMedia/ControlsMedia';
import ControlsTable from './controlComponents/ControlsTable';

import MediaButton from './FormattingBarMediaButton';
import { positionNearSelection, positionNearLink } from './positioning';
import { NodeLabelMap } from '../Editor/types';
import { FormattingBarButtonData, FormattingBarPopoverCondition } from './types';

const triggerOnClick = (changeObject) => {
	const { latestDomEvent } = changeObject;
	return latestDomEvent?.type === 'click';
};

const nodeControls = (component, indicatedNodeType, restOptions?) => {
	const indicatedTypes = Array.isArray(indicatedNodeType)
		? indicatedNodeType
		: [indicatedNodeType];
	return {
		showCloseButton: true,
		enterKeyTriggers: true,
		captureFocusOnMount: false,
		component: component,
		trigger: triggerOnClick,
		show: (editorChangeObject) => !!editorChangeObject.selectedNode,
		indicate: (editorChangeObject) => {
			const { selectedNode } = editorChangeObject;
			return selectedNode && indicatedTypes.some((type) => type === selectedNode.type.name);
		},
		...restOptions,
	};
};

const showOrTriggerTable = (editorChangeObject) => {
	const { selectionInTable, selection } = editorChangeObject;
	return (
		selectionInTable &&
		triggerOnClick(editorChangeObject) &&
		(selection.empty || selection.$anchorCell)
	);
};

export const strong: FormattingBarButtonData = {
	key: 'strong',
	title: 'Bold',
	icon: 'bold',
	isToggle: true,
};

export const em: FormattingBarButtonData = {
	key: 'em',
	title: 'Italic',
	icon: 'italic',
	isToggle: true,
};

export const link: FormattingBarButtonData = {
	key: 'link',
	title: 'Link',
	icon: 'link',
	isToggle: true,
	controls: {
		component: ControlsLink,
		indicate: (changeObject) => !!changeObject.activeLink,
		trigger: (changeObject) => {
			const { latestDomEvent } = changeObject;
			return (
				(latestDomEvent && latestDomEvent.metaKey && latestDomEvent.key === 'k') ||
				triggerOnClick(changeObject)
			);
		},
		show: (changeObject) => !!changeObject.activeLink,
		position: positionNearLink,
	},
};

export const bulletList: FormattingBarButtonData = {
	key: 'bullet-list',
	title: 'Bullet List',
	icon: 'list-ul',
};

export const numberedList: FormattingBarButtonData = {
	key: 'numbered-list',
	title: 'Numbered List',
	icon: 'list-ol',
};

export const blockquote: FormattingBarButtonData = {
	key: 'blockquote',
	title: 'Blockquote',
	icon: 'citation',
};

export const code: FormattingBarButtonData = {
	key: 'code',
	title: 'Code',
	icon: 'code',
	isToggle: true,
};

export const subscript: FormattingBarButtonData = {
	key: 'subscript',
	title: 'Subscript',
	icon: 'subscript',
	isToggle: true,
};

export const superscript: FormattingBarButtonData = {
	key: 'superscript',
	title: 'Superscript',
	icon: 'superscript',
	isToggle: true,
};

export const strikethrough: FormattingBarButtonData = {
	key: 'strikethrough',
	title: 'Strikethrough',
	ariaTitle: 'strike through',
	icon: 'strikethrough',
	isToggle: true,
};

export const citation: FormattingBarButtonData = {
	key: 'citation',
	title: 'Citation',
	icon: 'bookmark',
	controls: nodeControls(ControlsFootnoteCitation, 'citation'),
};

const canInsertReference = (pubData: any) => {
	return (
		pubData.nodeLabels &&
		Object.values(pubData.nodeLabels as NodeLabelMap).some((nodeLabel) => nodeLabel.enabled)
	);
};

export const reference: FormattingBarButtonData = {
	key: 'reference',
	title: 'Reference',
	icon: 'at',
	controls: nodeControls(ControlsReference, 'reference', {
		position: positionNearSelection,
		showCloseButton: false,
	}),
	isDisabled: (pubData: any) => !canInsertReference(pubData),
	popover: {
		condition: FormattingBarPopoverCondition.Disabled,
		component: ControlsReferencePopover,
	},
};

export const equation: FormattingBarButtonData = {
	key: 'equation',
	title: 'Equation',
	icon: 'function',
	controls: nodeControls(ControlsEquation, ['equation', 'block_equation']),
};

export const footnote: FormattingBarButtonData = {
	key: 'footnote',
	title: 'Footnote',
	icon: 'asterisk',
	controls: nodeControls(ControlsFootnoteCitation, 'footnote'),
};

export const horizontalRule: FormattingBarButtonData = {
	key: 'horizontal_rule',
	title: 'Horizontal Line',
	icon: 'minus',
};

export const table: FormattingBarButtonData = {
	key: 'table',
	title: 'Table',
	icon: 'th',
	controls: {
		captureFocusOnMount: false,
		indicate: ({ selectionInTable }) => selectionInTable,
		show: showOrTriggerTable,
		trigger: showOrTriggerTable,
		position: positionNearSelection,
		component: ControlsTable,
	},
};

export const media: FormattingBarButtonData = {
	key: 'media',
	title: 'Media',
	icon: 'media',
	component: MediaButton,
	controls: nodeControls(ControlsMedia, ['image', 'video', 'audio', 'iframe']),
};

export const minimalButtonSet = [strong, em, link, equation];

export const fullButtonSet = [
	strong,
	em,
	link,
	bulletList,
	numberedList,
	blockquote,
	code,
	subscript,
	superscript,
	strikethrough,
	horizontalRule,
	equation,
	citation,
	reference,
	footnote,
	table,
	media,
];
