import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Button, Checkbox, Classes, Dialog } from '@blueprintjs/core';

import { usePageContext } from 'utils/hooks';

const propTypes = {
	dialogType: PropTypes.oneOf(['delete', 'demote']).isRequired,
	isOpen: PropTypes.bool.isRequired,
	onCancel: PropTypes.func.isRequired,
	onConfirm: PropTypes.func.isRequired,
};
const defaultProps = {};

const getCopyElements = (dialogType, activeTargetName) => {
	if (dialogType === 'delete') {
		return {
			explanation: (
				<>
					If you remove yourself as a Member from this {activeTargetName}, you won't be
					able to undo this action. Another Member will need to add you again.
				</>
			),
			checkboxLabel: 'Yes, I really want to remove myself!',
			confirmButtonLabel: 'Remove me',
		};
	}
	if (dialogType === 'demote') {
		return {
			explanation: (
				<>
					If you choose a less capable permission for yourself, you won't be able to undo
					this action. Another Member will need to restore it for you.
				</>
			),
			checkboxLabel: 'Yes, I really want to change my permissions!',
			confirmButtonLabel: 'Change my permissions',
		};
	}
	return { explanation: null, checkboxLabel: null, confirmButtonLabel: null };
};

const SelfDestructiveActionDialog = (props) => {
	const { dialogType, isOpen, onConfirm, onCancel } = props;
	const [hasChecked, setHasChecked] = useState(false);
	const {
		scopeData: {
			elements: { activeTargetName },
		},
	} = usePageContext();

	const { explanation, checkboxLabel, confirmButtonLabel } = getCopyElements(
		dialogType,
		activeTargetName,
	);

	return (
		<Dialog lazy isOpen={isOpen} onClose={onCancel} title="Are you sure?">
			<div className={Classes.DIALOG_BODY}>
				<p>{explanation}</p>
				<Checkbox
					checked={hasChecked}
					onChange={() => setHasChecked(!hasChecked)}
					label={checkboxLabel}
				/>
			</div>
			<div className={Classes.DIALOG_FOOTER}>
				<div className={Classes.DIALOG_FOOTER_ACTIONS}>
					<Button onClick={onCancel}>Cancel</Button>
					<Button disabled={!hasChecked} onClick={onConfirm} intent="danger">
						{confirmButtonLabel}
					</Button>
				</div>
			</div>
		</Dialog>
	);
};

SelfDestructiveActionDialog.propTypes = propTypes;
SelfDestructiveActionDialog.defaultProps = defaultProps;
export default SelfDestructiveActionDialog;
