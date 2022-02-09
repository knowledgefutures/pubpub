/**
 * A dialog box that confirms an action before going through with it. This component is BYOB
 * (bring your own button) -- it renders a `renderButton` prop with an `open` callback that can be
 * attached to a Button onClick handler, or anything else.
 */
import React, { useState } from 'react';
import { Button, Classes, Dialog, Intent } from '@blueprintjs/core';

import { Callback } from 'types';

type Props = {
	cancelLabel?: React.ReactNode;
	children: (opts: { open: Callback }) => React.ReactNode;
	confirmLabel: React.ReactNode;
	intent?: Intent;
	onConfirm: () => unknown;
	text: React.ReactNode;
	title?: React.ReactNode;
};

const ConfirmDialog = (props: Props) => {
	const {
		cancelLabel = 'Cancel',
		children,
		confirmLabel,
		intent = 'danger',
		onConfirm,
		text,
		title,
	} = props;
	const [isOpen, setIsOpen] = useState(false);
	return (
		<React.Fragment>
			{children({ open: () => setIsOpen(true) })}
			<Dialog isOpen={isOpen} title={title}>
				<div className={Classes.DIALOG_BODY}>{text}</div>
				<div className={Classes.DIALOG_FOOTER}>
					<div className={Classes.DIALOG_FOOTER_ACTIONS}>
						<Button onClick={() => setIsOpen(false)}>{cancelLabel}</Button>
						<Button
							intent={intent}
							onClick={() => {
								setIsOpen(false);
								onConfirm();
							}}
						>
							{confirmLabel}
						</Button>
					</div>
				</div>
			</Dialog>
		</React.Fragment>
	);
};

export default ConfirmDialog;
