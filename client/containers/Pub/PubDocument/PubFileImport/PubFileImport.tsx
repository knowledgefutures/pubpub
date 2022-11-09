import React, { useEffect, useState } from 'react';
import { AnchorButton, Classes } from '@blueprintjs/core';
import { viewIsEmpty } from 'components/Editor';

import FileImportDialog from './FileImportDialog';

require('./pubFileImport.scss');

type Props = {
	editorChangeObject: {
		view?: {
			state?: {
				doc?: {};
			};
		};
	};
	updatePubData: (...args: any[]) => any;
};

const PubFileImport = (props: Props) => {
	const {
		editorChangeObject: { view },
	} = props;
	const [dialogKey, setDialogKey] = useState(Date.now());
	const [isVisible, setIsVisible] = useState(false);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const state = view && view.state;

	useEffect(() => {
		const isEmpty = state ? viewIsEmpty(state as any) : false;
		if (isEmpty) {
			setIsVisible(true);
		} else if (!isDialogOpen) {
			setDialogKey(Date.now());
			setIsVisible(false);
		}
	}, [state, isDialogOpen]);

	return (
		<React.Fragment>
			{isVisible && (
				<div className="pub-file-import-component">
					<AnchorButton
						type="button"
						className={`${Classes.INTENT_PRIMARY} ${Classes.LARGE}`}
						outlined
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
export default PubFileImport;
