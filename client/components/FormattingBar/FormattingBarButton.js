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
		disabled,
		formattingItem,
		isActive,
		isIndicated,
		isDetached,
		isOpen,
		isSmall,
		label,
		onClick,
		accentColor,
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

FormattingBarButton.propTypes = propTypes;
FormattingBarButton.defaultProps = defaultProps;
export default FormattingBarButton;
