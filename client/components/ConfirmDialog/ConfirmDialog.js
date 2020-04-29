/**
 * A dialog box that confirms an action before going through with it. This component is BYOB
 * (bring your own button) -- it renders a `renderButton` prop with an `open` callback that can be
 * attached to a Button onClick handler, or anything else.
 */
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Button, Classes, Dialog } from '@blueprintjs/core';

const propTypes = {
	children: PropTypes.func.isRequired,
	cancelLabel: PropTypes.string,
	confirmLabel: PropTypes.string.isRequired,
	intent: PropTypes.string,
	onConfirm: PropTypes.func.isRequired,
	text: PropTypes.node.isRequired,
};

const defaultProps = {
	intent: 'danger',
	cancelLabel: 'Cancel',
};

const ConfirmDialog = (props) => {
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

ConfirmDialog.propTypes = propTypes;
ConfirmDialog.defaultProps = defaultProps;
export default ConfirmDialog;
