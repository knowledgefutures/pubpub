import { FormattingBarButtonData, FormattingBarPopoverCondition } from './types';

export const getButtonPopoverComponent = (button: FormattingBarButtonData, isDisabled: boolean) =>
	button.popover &&
	Boolean(
		FormattingBarPopoverCondition.Always ||
			(button.popover.condition === FormattingBarPopoverCondition.Disabled && isDisabled),
	)
		? button.popover.component
		: null;

export const deepMap = <I, R>(items: I[][], callback: (i: I) => R): R[][] => {
	return items.map((sub) => sub.map(callback));
};
