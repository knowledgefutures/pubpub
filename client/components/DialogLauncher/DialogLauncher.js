import React, { useState } from 'react';
import PropTypes from 'prop-types';

const propTypes = {
	children: PropTypes.func.isRequired,
	renderLauncherElement: PropTypes.func.isRequired,
	renderChildrenWhenClosed: PropTypes.bool,
};

const defaultProps = {
	renderChildrenWhenClosed: true,
};

const DialogLauncher = (props) => {
	const { children, renderLauncherElement, renderChildrenWhenClosed } = props;
	const [isOpen, setIsOpen] = useState(false);
	return (
		<>
			{renderLauncherElement({ open: () => setIsOpen(true) })}
			{(isOpen || renderChildrenWhenClosed) && children({ onClose: () => setIsOpen(false) })}
		</>
	);
};

DialogLauncher.propTypes = propTypes;
DialogLauncher.defaultProps = defaultProps;
export default DialogLauncher;
