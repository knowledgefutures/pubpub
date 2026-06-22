/* biome-ignore-all lint/suspicious/noConsole: fine in stories */

import React, { useState } from 'react';

import { storiesOf } from '@storybook/react';

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

const initFirebase = (_rootKey) => {
	return null;
};

const cursorCommands = {
	moveSelectionToStart,
	moveSelectionToEnd,
	moveToStartOfSelection,
	moveToEndOfSelection,
};

const rootKey = 'firebase-testing';
const draftRef = initFirebase(rootKey);
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
							pubId: 'storybook-pub-id',
							clientData,
							initialDocKey: -1,
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
			const [changeObject, _updatechangeObject] = useState({});
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
							pubId: 'storybook-pub-id',
							clientData,
							initialDocKey: -1,
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
