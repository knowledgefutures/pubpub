import React from 'react';
import PropTypes from 'prop-types';
import { Classes, Dialog } from '@blueprintjs/core';

import PubAttributionEditor from './PubAttributionEditor';

require('./pubAttributionDialog.scss');

const propTypes = {
	isOpen: PropTypes.bool.isRequired,
	onClose: PropTypes.func.isRequired,
};

const PubAttributionDialog = (props) => {
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

PubAttributionDialog.propTypes = propTypes;
export default PubAttributionDialog;
