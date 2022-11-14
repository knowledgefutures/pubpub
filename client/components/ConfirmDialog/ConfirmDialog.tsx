/**
 * A dialog box that confirms an action before going through with it. This component is BYOB
 * (bring your own button) -- it renders a `renderButton` prop with an `open` callback that can be
 * attached to a Button onClick handler, or anything else.
 */
import React, { useCallback, useState } from 'react';
import { Button, Callout, Classes, Dialog, Intent } from '@blueprintjs/core';

import { Callback } from 'types';

type Props = {
	cancelLabel?: React.ReactNode;
	children: (opts: { open: Callback }) => React.ReactNode;
	errorState?: (error: any) => React.ReactNode;
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
		errorState,
	} = props;
	const [isOpen, setIsOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState(null);

	const handleClose = useCallback(() => setIsOpen(false), []);

	const handleConfirm = useCallback(() => {
		setError(null);
		const onConfirmResult = onConfirm();
		if (onConfirmResult instanceof Promise) {
			setIsLoading(true);
			onConfirmResult
				.then(handleClose)
				.catch(setError)
				.finally(() => setIsLoading(false));
		} else {
			setIsOpen(false);
		}
	}, [onConfirm, handleClose]);

	return (
		<React.Fragment>
			{children({ open: () => setIsOpen(true) })}
			<Dialog isOpen={isOpen} title={title} onClose={handleClose}>
				<div className={Classes.DIALOG_BODY}>
					{text}
					{error && errorState && <Callout intent="danger">{errorState(error)}</Callout>}
				</div>
				<div className={Classes.DIALOG_FOOTER}>
					<div className={Classes.DIALOG_FOOTER_ACTIONS}>
						<Button onClick={handleClose}>{cancelLabel}</Button>
						<Button loading={isLoading} intent={intent} onClick={handleConfirm}>
							{confirmLabel}
						</Button>
					</div>
				</div>
			</Dialog>
		</React.Fragment>
	);
};

export default ConfirmDialog;
