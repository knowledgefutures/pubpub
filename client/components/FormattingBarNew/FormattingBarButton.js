import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Button } from 'reakit';

import { Icon } from 'components';

const propTypes = {
	formattingItem: PropTypes.shape({
		ariaTitle: PropTypes.string,
		title: PropTypes.string.isRequired,
		isToggle: PropTypes.bool,
		icon: PropTypes.string.isRequired,
	}).isRequired,
	isActive: PropTypes.bool.isRequired,
	isIndicated: PropTypes.bool.isRequired,
	onClick: PropTypes.func.isRequired,
};

const FormattingBarButton = React.forwardRef((props, ref) => {
	const { formattingItem, isActive, onClick, ...restProps } = props;
	return (
		<Button
			ref={ref}
			{...restProps}
			role="button"
			as="a"
			aria-label={formattingItem.ariaTitle || formattingItem.title}
			aria-pressed={formattingItem.isToggle ? isActive : undefined}
			className={classNames('bp3-button', 'bp3-minimal', isActive && 'bp3-active')}
			onClick={() => onClick(formattingItem)}
		>
			<Icon icon={formattingItem.icon} />
		</Button>
	);
});

FormattingBarButton.propTypes = propTypes;
export default FormattingBarButton;
