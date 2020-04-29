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
	const [uniqueInstanceKey, setUniqueInstanceKey] = useState(Date.now());

	const handleOpenDialog = () => {
		setIsOpen(true);
		setUniqueInstanceKey(Date.now());
	};

	return (
		<React.Fragment>
			{renderLauncherElement({ openDialog: handleOpenDialog })}
			{(isOpen || renderChildrenWhenClosed) &&
				children({
					key: uniqueInstanceKey,
					isOpen: isOpen,
					onClose: () => setIsOpen(false),
				})}
		</React.Fragment>
	);
};

DialogLauncher.propTypes = propTypes;
DialogLauncher.defaultProps = defaultProps;
export default DialogLauncher;
