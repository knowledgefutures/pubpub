import React from 'react';

import { DefinitelyHas } from 'types';
import { IconName } from 'components';

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

export type GetBoundsFn = (editorChangeObject: EditorChangeObject) => {
	top: number;
	bottom: number;
	left: number;
	right: number;
};

export type ControlsKind = 'anchored' | 'floating' | 'none';

export type ControlsConfiguration = {
	kind: ControlsKind;
	container: HTMLElement;
	isAbsolutelyPositioned: boolean;
	isFullScreenWidth: boolean;
};

export type ResolvedControlsConfiguration = ControlsConfiguration & {
	style: React.CSSProperties;
	component: React.ComponentType<any>;
	captureFocusOnMount: boolean;
	showCloseButton: boolean;
	title: string;
};

export type ControlsFloatingPositionFn = (
	editorChangeObject: EditorChangeObject,
	controlsConfiguration: ControlsConfiguration,
) => React.CSSProperties;

export type FormattingBarButtonDataControls = {
	component: React.ComponentType<any>;
	indicate: EditorChangeObjectDecider;
	trigger: EditorChangeObjectDecider;
	show: EditorChangeObjectDecider;
	floatingPosition?: ControlsFloatingPositionFn;
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
	icon: IconName;
	isToggle?: boolean;
	label?: string;
	isDisabled?: EditorChangeObjectDecider;
} & ({ command: CommandSpec } | { insertNodeType: string } | { isMedia: true });
