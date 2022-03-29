import React from 'react';
import { Classes, Dialog } from '@blueprintjs/core';

import { Callback } from 'types';

import PubAttributionEditor, { Props as PubAttributionEditorProps } from './PubAttributionEditor';

require('./pubAttributionDialog.scss');

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
