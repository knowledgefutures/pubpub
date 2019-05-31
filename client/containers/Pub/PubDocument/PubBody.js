import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import Editor from '@pubpub/editor';
import { getResizedUrl } from 'utils';
import discussionSchema from './DiscussionAddon/discussionSchema';

require('./pubBody.scss');

const propTypes = {
	pubData: PropTypes.object.isRequired,
	collabData: PropTypes.object.isRequired,
	firebaseBranchRef: PropTypes.object,
	updateLocalData: PropTypes.func.isRequired,
	onSingleClick: PropTypes.func.isRequired,
};
const defaultProps = {
	firebaseBranchRef: undefined,
};

let setSavingTimeout;

const PubBody = (props) => {
	const { pubData, collabData, firebaseBranchRef, updateLocalData, historyData } = props;
	const prevStatusRef = useRef(null);
	prevStatusRef.current = collabData.status;

	const getNextStatus = (status, onComplete) => {
		clearTimeout(setSavingTimeout);
		const prevStatus = prevStatusRef.current;
		const nextStatus = { status: status };

		/* If loading, wait until 'connected' */
		if (prevStatus === 'connecting' && status === 'connected') {
			onComplete(nextStatus);
		}

		if (prevStatus !== 'connecting' && prevStatus !== 'disconnected') {
			if (status === 'saving') {
				setSavingTimeout = setTimeout(() => {
					onComplete(nextStatus);
				}, 250);
			} else {
				onComplete(nextStatus);
			}
		}
		/* If disconnected, only set state if the new status is 'connected' */
		if (prevStatus === 'disconnected' && status === 'connected') {
			onComplete(nextStatus);
		}
	};

	const isViewingHistory = pubData.metaMode === 'history';
	const editorKeyHistory = isViewingHistory && historyData.historyDocKey;
	const editorKeyCollab = firebaseBranchRef ? 'ready' : 'unready';
	const editorKey = editorKeyHistory || editorKeyCollab;
	const useCollaborativeOptions =
		firebaseBranchRef && !pubData.isStaticDoc && !(isViewingHistory && historyData.historyDoc);
	const isReadOnly = !!(pubData.isStaticDoc || !pubData.canEditBranch || isViewingHistory);
	const initialContent = (isViewingHistory && historyData.historyDoc) || pubData.initialDoc;

	return (
		<div className="pub-body-component">
			<Editor
				key={editorKey}
				customNodes={{
					...discussionSchema,
				}}
				nodeOptions={{
					image: {
						onResizeUrl: (url) => {
							return getResizedUrl(url, 'fit-in', '800x0');
						},
					},
					// discussion: this.props.discussionNodeOptions,
				}}
				placeholder={pubData.isStaticDoc ? 'Begin writing here...' : undefined}
				initialContent={initialContent}
				isReadOnly={isReadOnly}
				onChange={(editorChangeObject) => {
					if (useCollaborativeOptions) {
						updateLocalData('collab', { editorChangeObject: editorChangeObject });
					}
				}}
				collaborativeOptions={
					useCollaborativeOptions
						? {
								firebaseRef: firebaseBranchRef,
								clientData: props.collabData.localCollabUser,
								initialDocKey: pubData.initialDocKey,
								onStatusChange: (status) => {
									getNextStatus(status, (nextStatus) => {
										props.updateLocalData('collab', nextStatus);
									});
								},
								onUpdateLatestKey: (latestKey) => {
									props.updateLocalData('history', {
										latestKey: latestKey,
										currentKey: latestKey,
									});
								},
						  }
						: undefined
				}
				highlights={[]}
				handleSingleClick={props.onSingleClick}
			/>
		</div>
	);
};

PubBody.propTypes = propTypes;
PubBody.defaultProps = defaultProps;
export default PubBody;

// import Editor from '@pubpub/editor';
// import { EditableText, Button, Portal } from '@blueprintjs/core';
// import discussionSchema from 'components/DiscussionAddon/discussionSchema';

// 		const container =
// 			typeof document !== 'undefined' && document.getElementsByClassName('test-comp')[0];
// 		console.log('container is', container);
//					 {container && (
// 						<React.Fragment>
// 							<Portal
// 								// key={Math.random()}
// 								container={container}
// 								className="insert-portal"
// 							>
// 								<Button
// 									className="preview"
// 									minimal={true}
// 									onClick={() => {
// 										this.setState({ showThing: !this.state.showThing });
// 									}}
// 									text="I'm a preview!"
// 								/>
// 								{this.state.showThing && (
// 									<div className="content">
// 										<p>
// 											<strong>Mike: </strong>Here is some nicely formatted
// 											content.
// 										</p>
// 										<p>
// 											<strong>Megan: </strong>That is indeed nicely formatted.
// 											Bravo
// 										</p>
// 										<p>
// 											<strong>Mikal: </strong>Uhhh - gorgeous formatting. Wow.
// 											Double 5-stars!
// 										</p>
// 										<input type="text" className="bp3-input bp3-fill" />
// 									</div>
// 								)}
// 							</Portal>
// 						</React.Fragment>
// 					)}

// 					<h2>
// 						<EditableText
// 							placeholder="Enter Pub title..."
// 							onConfirm={this.handleTitleSave}
// 							onChange={this.handleTitleChange}
// 							onCancel={this.handleTitleCancel}
// 							value={this.state.title}
// 							multiline={true}
// 							confirmOnEnterKey={true}
// 						/>
// 					</h2>
// 					<hr />
//					<hr />
//					<Editor
//						placeholder="Begin writing here..."
//						initialContent={this.props.pubData.initialDoc}
//						isReadOnly={this.props.pubData.docIsStatic}
//						onChange={(changeObject) => {
//							this.setState({ changeObject: changeObject });
//						}}
//						customNodes={{
//							...discussionSchema,
//						}}
//						key={firebaseBranchRef ? 'ready' : 'unready'}
//						collaborativeOptions={
//							// This isn't quite right - because we still render the client
//							// version of Editor without the collabOptions while firebase
//							// authenticates. Is there a cleaner way to hold off on collab
//							// init until after authentication?
//							firebaseBranchRef && !this.props.pubData.docIsStatic
//								? {
//										firebaseRef: firebaseBranchRef,
//										clientData: { id: 'testclientdataid' },
//										initialDocKey: this.props.pubData.initialDocKey,
//										onClientChange: () => {},
//										onStatusChange: () => {},
//								  }
//								: {}
//						}
//					/>
