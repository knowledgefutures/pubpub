/**
 * A dialog box that confirms an action before going through with it. This component is BYOB
 * (bring your own button) -- it renders a `renderButton` prop with an `open` callback that can be
 * attached to a Button onClick handler, or anything else.
 */
import React, { useState } from 'react';
import { Button, Classes, Dialog } from '@blueprintjs/core';

type OwnProps = {
	children: (...args: any[]) => any;
	cancelLabel?: string;
	confirmLabel: string;
	intent?: string;
	onConfirm: (...args: any[]) => any;
	text: React.ReactNode;
};

const defaultProps = {
	intent: 'danger',
	cancelLabel: 'Cancel',
};

type Props = OwnProps & typeof defaultProps;

const ConfirmDialog = (props: Props) => {
	const { cancelLabel, children, confirmLabel, intent, onConfirm, text } = props;
	const [isOpen, setIsOpen] = useState(false);
	return (
		<React.Fragment>
			{children({ open: () => setIsOpen(true) })}
			<Dialog isOpen={isOpen}>
				<div className={Classes.DIALOG_BODY}>{text}</div>
				<div className={Classes.DIALOG_FOOTER}>
					<div className={Classes.DIALOG_FOOTER_ACTIONS}>
						<Button onClick={() => setIsOpen(false)}>{cancelLabel}</Button>
						<Button
							// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type '"none" | ... Remove this comment to see the full error message
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
ConfirmDialog.defaultProps = defaultProps;
export default ConfirmDialog;
