import type { IconName } from 'components';
import type { DefinitelyHas } from 'types';

import type { EditorChangeObject } from '../Editor';
import type { CommandSpec } from '../Editor/commands/types';

import React from 'react';

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
	hasPadding: boolean;
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
	hasPadding?: boolean;
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
