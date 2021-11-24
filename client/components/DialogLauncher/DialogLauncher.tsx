import React, { useState } from 'react';

type RenderLauncherOptions = {
	openDialog: () => unknown;
};

type ChildrenOptions = {
	key: number;
	isOpen: boolean;
	onClose: () => unknown;
};

type Props = {
	children: (options: ChildrenOptions) => React.ReactNode;
	renderLauncherElement: (options: RenderLauncherOptions) => React.ReactNode;
	renderChildrenWhenClosed?: boolean;
};

const DialogLauncher = (props: Props) => {
	const { children, renderLauncherElement, renderChildrenWhenClosed = true } = props;
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

export default DialogLauncher;
