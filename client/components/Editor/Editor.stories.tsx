/* eslint-disable no-console */
import React, { useState } from 'react';
import { storiesOf } from '@storybook/react';
import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/database';

import Editor from 'components/Editor';
import {
	convertLocalHighlightToDiscussion,
	moveSelectionToEnd,
	moveSelectionToStart,
	moveToEndOfSelection,
	moveToStartOfSelection,
	removeLocalHighlight,
	setLocalHighlight,
} from 'components/Editor/utils';
import initialContent from 'utils/storybook/initialDocs/plainDoc';
import { getFirebaseConfig } from 'utils/editor/firebaseConfig';

const editorWrapperStyle = {
	border: '1px solid #CCC',
	width: '700px',
	minHeight: '250px',
	cursor: 'text',
	padding: '20px',
	paddingRight: '200px',
};

const clientData = {
	id: 'storybook-clientid',
	name: 'Anon User',
	backgroundColor: 'rgba(0, 0, 250, 0.2)',
	cursorColor: 'rgba(0, 0, 250, 1.0)',
	image: 'https://s3.amazonaws.com/uifaces/faces/twitter/rickdt/128.jpg',
	initials: 'DR',
	canEdit: true,
};

const initFirebase = (rootKey) => {
	const firebaseAppName = `App-${rootKey}`;
	/* Check if we've already initialized an Firebase App with the */
	/* same name in this local environment */
	// @ts-expect-error ts-migrate(2769) FIXME: No overload matches this call.
	const existingApp = firebase.apps.reduce((prev, curr) => {
		return curr.name === firebaseAppName ? curr : prev;
	}, undefined);

	/* Use the existing Firebase App or initialize a new one */
	const firebaseApp = existingApp || firebase.initializeApp(getFirebaseConfig(), firebaseAppName);
	const database = firebase.database(firebaseApp);
	return database.ref(`${rootKey}`);
};

const cursorCommands = {
	moveSelectionToStart,
	moveSelectionToEnd,
	moveToStartOfSelection,
	moveToEndOfSelection,
};

const rootKey = 'firebase-testing';
// @ts-expect-error ts-migrate(2554) FIXME: Expected 1 arguments, but got 2.
const draftRef = initFirebase(rootKey, '');
const newDiscussionId = String(Math.floor(Math.random() * 999999));

const CursorOptionsDemoPub = () => {
	const [editorView, setEditorView] = useState<any>();

	const cursorButtons = Object.keys(cursorCommands).map((key) => ({
		children: key,
		onClick: () => {
			cursorCommands[key](editorView);
			editorView.focus();
		},
	}));

	return (
		<div style={editorWrapperStyle}>
			<div style={{ display: 'flex' }}>
				{cursorButtons.map((props) => (
					<button type="button" {...props} />
				))}
			</div>
			<Editor
				placeholder="Begin writing..."
				initialContent={initialContent as any}
				isReadOnly={false}
				onChange={(editorChangeObject) => setEditorView(editorChangeObject.view)}
			/>
		</div>
	);
};

let times = 0;
storiesOf('Editor', module)
	.add('default', () => (
		<div style={editorWrapperStyle}>
			<Editor
				placeholder="Begin writing..."
				initialContent={initialContent as any}
				// isReadOnly={true}
				onChange={(changeObject) => {
					if (changeObject.updateNode && changeObject.selectedNode?.attrs.size === 50) {
						changeObject.updateNode({ size: 65 });
					}
				}}
			/>
		</div>
	))
	.add('collaborative', () => {
		const Thing = () => {
			const [changeObject, updatechangeObject] = useState({});
			return (
				<div style={editorWrapperStyle}>
					<button
						type="button"
						onClick={() => {
							setLocalHighlight(
								// @ts-expect-error ts-migrate(2339) FIXME: Property 'view' does not exist on type '{}'.
								changeObject.view,
								// @ts-expect-error ts-migrate(2339) FIXME: Property 'view' does not exist on type '{}'.
								changeObject.view.state.selection.from,
								// @ts-expect-error ts-migrate(2339) FIXME: Property 'view' does not exist on type '{}'.
								changeObject.view.state.selection.to,
								newDiscussionId,
							);
						}}
					>
						New Local Highlight
					</button>
					<button
						type="button"
						onClick={() => {
							// @ts-expect-error ts-migrate(2339) FIXME: Property 'view' does not exist on type '{}'.
							removeLocalHighlight(changeObject.view, newDiscussionId);
						}}
					>
						Remove Local Highlight
					</button>
					<button
						type="button"
						onClick={() => {
							console.log(
								convertLocalHighlightToDiscussion(
									// @ts-expect-error ts-migrate(2339) FIXME: Property 'view' does not exist on type '{}'.
									changeObject.view,
									newDiscussionId,
								),
							);
						}}
					>
						Convert Highlight to Discussion
					</button>

					<Editor
						key={draftRef ? 'ready' : 'unready'}
						placeholder="Begin writing..."
						onChange={(evt) => {
							updatechangeObject(evt);
						}}
						collaborativeOptions={{
							firebaseRef: draftRef as any,
							clientData,
							initialDocKey: -1,
							// onClientChange: () => {},
							onStatusChange: (status) => console.info('collab status is', status),
						}}
					/>
				</div>
			);
		};
		return <Thing />;
	})
	.add('collaborative2', () => {
		const Thing = () => {
			/* eslint-disable-next-line */
			const [changeObject, updatechangeObject] = useState({});
			return (
				<div style={editorWrapperStyle}>
					<button
						type="button"
						onClick={() => {
							setLocalHighlight(
								// @ts-expect-error ts-migrate(2339) FIXME: Property 'view' does not exist on type '{}'.
								changeObject.view,
								// @ts-expect-error ts-migrate(2339) FIXME: Property 'view' does not exist on type '{}'.
								changeObject.view.state.selection.from,
								// @ts-expect-error ts-migrate(2339) FIXME: Property 'view' does not exist on type '{}'.
								changeObject.view.state.selection.to,
								newDiscussionId,
							);
						}}
					>
						New Local Highlight
					</button>
					<button
						type="button"
						onClick={() => {
							// @ts-expect-error ts-migrate(2339) FIXME: Property 'view' does not exist on type '{}'.
							removeLocalHighlight(changeObject.view, newDiscussionId);
						}}
					>
						Remove Local Highlight
					</button>
					<button
						type="button"
						onClick={() => {
							console.log(
								convertLocalHighlightToDiscussion(
									// @ts-expect-error ts-migrate(2339) FIXME: Property 'view' does not exist on type '{}'.
									changeObject.view,
									newDiscussionId,
								),
							);
						}}
					>
						Convert Highlight to Discussion
					</button>

					<Editor
						key={draftRef ? 'ready' : 'unready'}
						placeholder="Begin writing..."
						onChange={(evt) => {
							// updatechangeObject(evt);
							if (times < 15) {
								times += 1;
								setTimeout(() => {
									evt.view.dispatch(
										evt.view.state.tr.insertText(
											'G',
											evt.view.state.doc.content.size - 1,
										),
									);
								}, 1000);
							}
						}}
						collaborativeOptions={{
							firebaseRef: draftRef as any,
							clientData,
							initialDocKey: -1,
							// onClientChange: () => {},
							onStatusChange: (status) => console.info('collab status is', status),
						}}
					/>
				</div>
			);
		};
		return <Thing />;
	})
	.add('readOnly', () => (
		<div style={editorWrapperStyle}>
			<Editor
				placeholder="Begin writing..."
				initialContent={initialContent as any}
				isReadOnly={true}
				onChange={(changeObject) => {
					console.log(changeObject.view);
				}}
			/>
		</div>
	))
	.add('cursorUtilities', () => <CursorOptionsDemoPub />);
