import React from 'react';
import { Classes, Dialog } from '@blueprintjs/core';

import PubAttributionEditor from './PubAttributionEditor';

require('./pubAttributionDialog.scss');

type Props = {
	isOpen: boolean;
	onClose: (...args: any[]) => any;
};

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
				{/* @ts-expect-error ts-migrate(2739) FIXME: Type '{}' is missing the following properties from... Remove this comment to see the full error message */}
				<PubAttributionEditor {...restProps} />
			</div>
		</Dialog>
	);
};
export default PubAttributionDialog;
