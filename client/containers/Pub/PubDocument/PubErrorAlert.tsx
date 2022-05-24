import React from 'react';
import { Alert } from '@blueprintjs/core';
import { EditorView } from 'prosemirror-view';
import { saveAs } from 'file-saver';

import { getJSON } from 'components/Editor';
import { TimeAgo } from 'components';
import { usePubContext } from '../pubHooks';

type Props = {
	pubErrorOccurredAt: null | number;
	lastSaveOccurredAt: null | number;
};

const shouldSuppressEditorErrors = () => {
	if (window && 'URLSearchParams' in window) {
		const urlParams = new URLSearchParams(window.location.search);
		return !!urlParams.get('suppressEditorErrors');
	}
	return false;
};

const downloadBackup = (view: EditorView, title: string) => {
	const docJson = getJSON(view);
	const blob = new Blob([JSON.stringify(docJson, null, 2)], {
		type: 'text/plain;charset=utf-8',
	});
	saveAs(blob, `${title}_backup.json`);
};

const PubErrorAlert = (props: Props) => {
	const { pubErrorOccurredAt, lastSaveOccurredAt } = props;
	const {
		pubData: { title: pubTitle },
		collabData: { editorChangeObject },
	} = usePubContext();

	if (!pubErrorOccurredAt || shouldSuppressEditorErrors()) {
		return null;
	}

	const showErrorTime = lastSaveOccurredAt && pubErrorOccurredAt - lastSaveOccurredAt > 500;

	const handleCancelClick = () => {
		downloadBackup(editorChangeObject!.view, pubTitle);
	};

	return (
		<Alert
			isOpen
			icon="error"
			confirmButtonText="Refresh Page"
			onConfirm={() => void window.location.reload()}
			cancelButtonText={showErrorTime ? 'Download backup' : undefined}
			onCancel={showErrorTime ? handleCancelClick : undefined}
			className="pub-body-alert"
		>
			<h5>An error has occured in the editor.</h5>
			<p>We've logged the error and will look into the cause right away.</p>
			{showErrorTime && (
				<React.Fragment>
					<p className="error-time">
						Your changes were last saved{' '}
						<TimeAgo date={lastSaveOccurredAt} now={pubErrorOccurredAt} />.
					</p>
					<p>
						If you are concerned about unsaved changes being lost, please download a
						backup copy of your document below.
					</p>
				</React.Fragment>
			)}
			{!showErrorTime && (
				<p className="error-time">All previous changes have been successfully saved.</p>
			)}
			<p>To continue editing, please refresh the page.</p>
		</Alert>
	);
};

export default PubErrorAlert;
