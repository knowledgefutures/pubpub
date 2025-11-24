import type { Callback } from 'types';

import React from 'react';

import { Classes, Dialog } from '@blueprintjs/core';

import PubAttributionEditor, {
	type Props as PubAttributionEditorProps,
} from './PubAttributionEditor';

import './pubAttributionDialog.scss';

type Props = {
	isOpen: boolean;
	onClose: Callback;
} & PubAttributionEditorProps;

const PubAttributionDialog = (props: Props) => {
	const { isOpen, onClose, ...restProps } = props;
	return (
		<Dialog
			className="pub-attribution-dialog-component"
			title="Edit Pub contributors"
			isOpen={isOpen}
			onClose={onClose}
		>
			<div className={Classes.DIALOG_BODY}>
				<PubAttributionEditor {...restProps} />
			</div>
		</Dialog>
	);
};
export default PubAttributionDialog;
