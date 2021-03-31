import { DefinitelyHas } from 'utils/types';

import { EditorChangeObject } from '../Editor';
import { CommandSpec } from '../Editor/commands/types';

export enum FormattingBarButtonPopoverCondition {
	Always,
	Disabled,
}

export type FormattingBarButtonPopover = {
	component: React.ComponentType;
	condition: FormattingBarButtonPopoverCondition;
};

export type EditorChangeObjectDecider = (eco: EditorChangeObject) => boolean;

export type EditorChangeObjectWithNode = DefinitelyHas<
	EditorChangeObject,
	'selectedNode' | 'updateNode' | 'changeNode'
>;

export type PositioningFn = (
	eco: EditorChangeObject,
	wrapper?: HTMLElement,
) => { transform: string };

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
	popover?: FormattingBarButtonPopover;
	title: string;
	ariaTitle?: string;
	icon: string;
	isToggle?: boolean;
	isDisabled?: EditorChangeObjectDecider;
} & ({ command: CommandSpec } | { insertNodeType: string } | { isMedia: true });

export type PopoverStyle = 'anchored' | 'floating' | 'none';
