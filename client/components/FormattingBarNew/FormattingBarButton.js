import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Button } from 'reakit';

import { Icon } from 'components';

const propTypes = {
	accentColor: PropTypes.string.isRequired,
	formattingItem: PropTypes.shape({
		ariaTitle: PropTypes.string,
		title: PropTypes.string.isRequired,
		isToggle: PropTypes.bool,
		icon: PropTypes.string.isRequired,
	}).isRequired,
	isActive: PropTypes.bool.isRequired,
	isIndicated: PropTypes.bool.isRequired,
	isOpen: PropTypes.bool.isRequired,
	onClick: PropTypes.func.isRequired,
};

const getButtonStyle = (accentColor, isOpen) => {
	if (isOpen) {
		return {
			color: 'white',
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
		isOpen,
		onClick,
		accentColor,
		...restProps
	} = props;

	return (
		<span
			className={classNames('formatting-bar-button', isOpen && 'open')}
			style={getButtonStyle(accentColor, isOpen)}
		>
			<Button
				ref={ref}
				{...restProps}
				role="button"
				as="a"
				disabled={disabled}
				focusable
				aria-label={formattingItem.ariaTitle || formattingItem.title}
				aria-pressed={formattingItem.isToggle ? isActive : undefined}
				className={classNames(
					'bp3-button',
					'bp3-minimal',
					'formatting-bar-button',
					isActive && 'bp3-active',
					disabled && 'bp3-disabled',
				)}
				onClick={() => onClick(formattingItem)}
				data-accent-dark={accentColor}
			>
				<Icon icon={formattingItem.icon} />
			</Button>
			{isIndicated && <div className="indicator" style={getIndicatorStyle(accentColor)} />}
		</span>
	);
});

FormattingBarButton.propTypes = propTypes;
export default FormattingBarButton;
