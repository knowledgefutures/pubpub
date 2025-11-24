import { type FormattingBarButtonData, FormattingBarButtonPopoverCondition } from './types';

export const getButtonPopoverComponent = (button: FormattingBarButtonData, isDisabled: boolean) =>
	button.popover &&
	Boolean(
		button.popover.condition === FormattingBarButtonPopoverCondition.Always ||
			(button.popover.condition === FormattingBarButtonPopoverCondition.Disabled &&
				isDisabled),
	)
		? button.popover.component
		: null;

export const deepMap = <I, R>(items: I[][], callback: (i: I) => R): R[][] => {
	return items.map((sub) => sub.map(callback));
};
