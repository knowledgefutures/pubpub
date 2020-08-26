import React, { useState } from 'react';
import { Button, Checkbox, Classes, Dialog } from '@blueprintjs/core';

import { usePageContext } from 'utils/hooks';

type OwnProps = {
	dialogType: 'delete' | 'demote';
	isOpen: boolean;
	onCancel: (...args: any[]) => any;
	onConfirm: (...args: any[]) => any;
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

type Props = OwnProps & typeof defaultProps;

const SelfDestructiveActionDialog = (props: Props) => {
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
					// @ts-expect-error ts-migrate(2322) FIXME: Type 'null' is not assignable to type 'string | un... Remove this comment to see the full error message
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
SelfDestructiveActionDialog.defaultProps = defaultProps;
export default SelfDestructiveActionDialog;
