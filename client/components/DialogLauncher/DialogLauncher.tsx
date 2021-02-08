import React, { useState } from 'react';

type OwnProps = {
	children: (...args: any[]) => any;
	renderLauncherElement: (...args: any[]) => any;
	renderChildrenWhenClosed?: boolean;
};

const defaultProps = {
	renderChildrenWhenClosed: true,
};

type Props = OwnProps & typeof defaultProps;

const DialogLauncher = (props: Props) => {
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
					isOpen,
					onClose: () => setIsOpen(false),
				})}
		</React.Fragment>
	);
};
DialogLauncher.defaultProps = defaultProps;
export default DialogLauncher;
