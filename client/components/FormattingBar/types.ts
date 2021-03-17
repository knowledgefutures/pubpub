import { EditorChangeObject } from '../Editor';

export enum FormattingBarPopoverCondition {
	Always,
	Disabled,
}

export type FormattingBarPopover = {
	component: React.ComponentType;
	condition: FormattingBarPopoverCondition;
};

export type EditorChangeObjectDecider = (eco: EditorChangeObject) => boolean;

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
	controls?: FormattingBarButtonDataControls;
	component?: React.ComponentType<any>;
	key: string;
	popover?: FormattingBarPopover;
	title: string;
	ariaTitle?: string;
	icon: string;
	isToggle?: boolean;
	isDisabled?: (pubData: any) => boolean;
};
