import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { AnchorButton } from '@blueprintjs/core';
import { docIsEmpty } from 'components/Editor';

import FileImportDialog from './FileImportDialog';

require('./pubFileImport.scss');

const propTypes = {
	editorChangeObject: PropTypes.shape({
		view: PropTypes.shape({ state: PropTypes.shape({ doc: PropTypes.shape({}) }) }),
	}).isRequired,
	updatePubData: PropTypes.func.isRequired,
};

const PubFileImport = (props) => {
	const {
		editorChangeObject: { view },
	} = props;
	const [dialogKey, setDialogKey] = useState(Date.now());
	const [isVisible, setIsVisible] = useState(false);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const doc = view && view.state && view.state.doc;

	useEffect(() => {
		const isEmptyDoc = doc && docIsEmpty(doc);
		if (isEmptyDoc) {
			setIsVisible(true);
		} else if (!isDialogOpen) {
			setDialogKey(Date.now());
			setIsVisible(false);
		}
	}, [doc, isDialogOpen]);

	return (
		<React.Fragment>
			{isVisible && (
				<div className="pub-file-import-component">
					<AnchorButton
						type="button"
						className="bp3-intent-primary bp3-large"
						onClick={() => setIsDialogOpen(true)}
						text={
							<div>
								<div>Import Files</div>
								<div>.docx, .epub, .html, .md, .odt, .txt, .xml, or .tex</div>
							</div>
						}
					/>
				</div>
			)}
			<FileImportDialog
				{...props}
				key={dialogKey}
				isOpen={isDialogOpen}
				onClose={() => setIsDialogOpen(false)}
				onClosed={() => setDialogKey(Date.now())}
			/>
		</React.Fragment>
	);
};

PubFileImport.propTypes = propTypes;
export default PubFileImport;
