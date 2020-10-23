export enum FormattingBarPopoverCondition {
	Always,
	Disabled,
}

export type FormattingBarPopover = {
	component: React.ComponentType;
	condition: FormattingBarPopoverCondition;
};

export type FormattingBarButtonData = {
	controls?: any;
	component?: React.ComponentType<any>;
	key: string;
	popover?: FormattingBarPopover;
	title: string;
	ariaTitle?: string;
	icon: string;
	isToggle?: boolean;
	isDisabled?: (pubData: any) => boolean;
};
