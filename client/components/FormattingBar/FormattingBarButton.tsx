import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Button } from 'reakit';

import { Icon } from 'components';

const propTypes = {
	accentColor: PropTypes.string,
	formattingItem: PropTypes.shape({
		ariaTitle: PropTypes.string,
		title: PropTypes.string.isRequired,
		isToggle: PropTypes.bool,
		icon: PropTypes.string.isRequired,
	}).isRequired,
	disabled: PropTypes.bool,
	isActive: PropTypes.bool,
	isDetached: PropTypes.bool,
	isIndicated: PropTypes.bool,
	isOpen: PropTypes.bool,
	isSmall: PropTypes.bool,
	label: PropTypes.string,
	onClick: PropTypes.func.isRequired,
	outerRef: PropTypes.any,
};

const defaultProps = {
	accentColor: 'white',
	disabled: false,
	label: null,
	isActive: false,
	isIndicated: false,
	isOpen: false,
	isSmall: false,
	isDetached: false,
	outerRef: undefined,
};

const getOuterStyle = (accentColor, isOpen, isDetached) => {
	if (isOpen && !isDetached) {
		return {
			color: 'white',
			background: accentColor,
		};
	}
	return {};
};

const getInnerStyle = (accentColor, isOpen, isDetached) => {
	if (isOpen && isDetached) {
		return {
			background: accentColor,
		};
	}
	return {};
};

const getIndicatorStyle = (accentColor) => {
	return {
		background: accentColor,
	};
};

const FormattingBarButton = React.forwardRef((props, ref) => {
	const {
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'disabled' does not exist on type '{ chil... Remove this comment to see the full error message
		disabled,
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'formattingItem' does not exist on type '... Remove this comment to see the full error message
		formattingItem,
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'isActive' does not exist on type '{ chil... Remove this comment to see the full error message
		isActive,
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'isIndicated' does not exist on type '{ c... Remove this comment to see the full error message
		isIndicated,
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'isDetached' does not exist on type '{ ch... Remove this comment to see the full error message
		isDetached,
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'isOpen' does not exist on type '{ childr... Remove this comment to see the full error message
		isOpen,
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'isSmall' does not exist on type '{ child... Remove this comment to see the full error message
		isSmall,
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'label' does not exist on type '{ childre... Remove this comment to see the full error message
		label,
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'onClick' does not exist on type '{ child... Remove this comment to see the full error message
		onClick,
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'accentColor' does not exist on type '{ c... Remove this comment to see the full error message
		accentColor,
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'outerRef' does not exist on type '{ chil... Remove this comment to see the full error message
		outerRef,
		...restProps
	} = props;

	return (
		<span
			ref={outerRef}
			className={classNames(
				'formatting-bar-button',
				isOpen && 'open',
				isDetached && 'detached',
				!!label && 'has-label',
			)}
			style={getOuterStyle(accentColor, isOpen, isDetached)}
		>
			{/* @ts-expect-error ts-migrate(2769) FIXME: Type 'unknown' is not assignable to type 'HTMLButt... Remove this comment to see the full error message */}
			<Button
				ref={ref}
				{...restProps}
				role="button"
				disabled={disabled}
				focusable
				title={formattingItem.title}
				aria-label={formattingItem.ariaTitle || formattingItem.title}
				aria-pressed={formattingItem.isToggle ? isActive : undefined}
				className={classNames(
					'bp3-button',
					'bp3-minimal',
					isActive && 'bp3-active',
					isSmall && 'bp3-small',
					disabled && 'bp3-disabled',
				)}
				style={getInnerStyle(accentColor, isOpen, isDetached)}
				onClick={() => onClick(formattingItem)}
			>
				<Icon icon={formattingItem.icon} iconSize={isSmall ? 12 : 16} />
				{label}
			</Button>
			{isIndicated && <div className="indicator" style={getIndicatorStyle(accentColor)} />}
		</span>
	);
});

// @ts-expect-error ts-migrate(2559) FIXME: Type '{ accentColor: Requireable<string>; formatti... Remove this comment to see the full error message
FormattingBarButton.propTypes = propTypes;
// @ts-expect-error ts-migrate(2559) FIXME: Type '{ accentColor: string; disabled: boolean; la... Remove this comment to see the full error message
FormattingBarButton.defaultProps = defaultProps;
export default FormattingBarButton;
