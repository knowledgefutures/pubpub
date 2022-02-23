import React, { useState } from 'react';
import { Fragment } from 'prosemirror-model';
import { EditorView } from 'prosemirror-view';

import { Callout, Button, Classes, Dialog } from '@blueprintjs/core';
import { apiFetch } from 'client/utils/apiFetch';
import { Submission, SubmissionStatus, DefinitelyHas, DocJson } from 'types';
import { Editor } from 'components';
import { getEmptyDoc, jsonToNode } from 'components/Editor';
import { usePubContext } from 'containers/Pub/pubHooks';

type Props = {
	submission: DefinitelyHas<Submission, 'submissionWorkflow'>;
	isOpen: boolean;
	onClose: () => any;
};

const addAbstractToEditor = (abstract: DocJson, view: EditorView): void => {
	const { schema } = view.state.doc.type;
	const h1Node = schema.node('heading', { level: 1 }, schema.text('Abstract'));
	const abstractNode = jsonToNode(abstract, schema);
	const frag = Fragment.from(h1Node).append(abstractNode.content);
	const { tr } = view.state;
	tr.insert(0, frag);
	view.dispatch(tr);
};

const SubmitDialog = (props: Props) => {
	const { collabData } = usePubContext();
	const { view } = collabData.editorChangeObject;
	const [isHandlingSubmission, setIsHandlingSubmission] = useState(false);
	const [updatedSubmission, setUpdatedSubmission] = useState(null);
	const [submissionErr, setSubmissionErr] = useState(null);
	const onSubmit = () => {
		setIsHandlingSubmission(true);
		addAbstractToEditor(props.submission.abstract || getEmptyDoc(), view);
		apiFetch
			.put('/api/submissions', {
				id: props.submission.id,
				status: 'pending' as SubmissionStatus,
			})
			.then((submissionRes) => setUpdatedSubmission(submissionRes))
			.catch((err) => setSubmissionErr(err))
			.finally(() => setIsHandlingSubmission(false));
	};
	return (
		<Dialog isOpen={props.isOpen} onClose={props.onClose}>
			{submissionErr ? (
				<Callout intent="warning" title="There was an error submitting this Pub." />
			) : updatedSubmission ? (
				<>
					<div className={Classes.DIALOG_BODY}>
						<Callout intent="success" title="Submitted!">
							Your Pub has been submitted for review.
							<Editor
								isReadOnly
								initialContent={props.submission.submissionWorkflow.emailText}
							/>
						</Callout>
					</div>
					<div className={Classes.DIALOG_FOOTER}>
						<div className={Classes.DIALOG_FOOTER_ACTIONS}>
							<Button onClick={props.onClose} disabled={isHandlingSubmission}>
								Close
							</Button>
							<Button
								onClick={() => window.location.reload()}
								loading={isHandlingSubmission}
								intent="primary"
							>
								View Submission
							</Button>
						</div>
					</div>
				</>
			) : (
				<>
					<div className={Classes.DIALOG_BODY}>
						<Callout title="Submit Pub?">Are you ready to submit this Pub?</Callout>
					</div>
					<div className={Classes.DIALOG_FOOTER}>
						<div className={Classes.DIALOG_FOOTER_ACTIONS}>
							<Button onClick={props.onClose} disabled={isHandlingSubmission}>
								Cancel
							</Button>
							<Button
								onClick={onSubmit}
								loading={isHandlingSubmission}
								intent="primary"
							>
								Submit
							</Button>
						</div>
					</div>
				</>
			)}
		</Dialog>
	);
};

export default SubmitDialog;
