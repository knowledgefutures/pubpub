import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Button } from 'reakit';

import { Icon } from 'components';
import { usePageContext } from 'containers/Pub/pubHooks';

const propTypes = {
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

const getButtonStyle = (accentColor, isIndicated, isOpen) => {
	if (isOpen) {
		return {
			color: 'white',
			background: accentColor,
		};
	}
	if (isIndicated) {
		return {
			borderBottom: `2px solid ${accentColor}`,
		};
	}
	return {};
};

const FormattingBarButton = React.forwardRef((props, ref) => {
	const { formattingItem, isActive, isIndicated, isOpen, onClick, ...restProps } = props;
	const {
		communityData: { accentColorDark },
	} = usePageContext();
	return (
		<Button
			ref={ref}
			{...restProps}
			role="button"
			as="a"
			aria-label={formattingItem.ariaTitle || formattingItem.title}
			aria-pressed={formattingItem.isToggle ? isActive : undefined}
			style={getButtonStyle(accentColorDark, isIndicated, isOpen)}
			className={classNames(
				'bp3-button',
				'bp3-minimal',
				'formatting-bar-button',
				isActive && 'bp3-active',
				isOpen && 'open',
			)}
			onClick={() => onClick(formattingItem)}
			data-accent-dark={accentColorDark}
		>
			<Icon icon={formattingItem.icon} />
		</Button>
	);
});

FormattingBarButton.propTypes = propTypes;
export default FormattingBarButton;
