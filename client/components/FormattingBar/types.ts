import { DefinitelyHas } from 'utils/types';

import { EditorChangeObject } from '../Editor';
import { CommandSpec } from '../Editor/commands/types';

export enum FormattingBarPopoverCondition {
	Always,
	Disabled,
}

export type FormattingBarPopover = {
	component: React.ComponentType;
	condition: FormattingBarPopoverCondition;
};

export type EditorChangeObjectDecider = (eco: EditorChangeObject) => boolean;

export type EditorChangeObjectWithNode = DefinitelyHas<
	EditorChangeObject,
	'selectedNode' | 'updateNode' | 'changeNode'
>;

export type PositioningFn = (
	eco: EditorChangeObject,
	wrapper: HTMLElement,
) => { top: number; left: number };

export type FormattingBarButtonDataControls = {
	component: React.ComponentType<any>;
	indicate: EditorChangeObjectDecider;
	trigger: EditorChangeObjectDecider;
	show: EditorChangeObjectDecider;
	position?: PositioningFn;
	enterKeyTriggers?: boolean;
	captureFocusOnMount?: boolean;
	showCloseButton?: boolean;
};

export type FormattingBarButtonData = {
	key: string;
	controls?: FormattingBarButtonDataControls;
	component?: React.ComponentType<any>;
	popover?: FormattingBarPopover;
	title: string;
	ariaTitle?: string;
	icon: string;
	isToggle?: boolean;
	isDisabled?: EditorChangeObjectDecider;
} & ({ command: CommandSpec } | { insertNodeType: string } | { isMedia: true });
