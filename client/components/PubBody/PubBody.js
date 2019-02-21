import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { NonIdealState, Button } from '@blueprintjs/core';
import Editor from '@pubpub/editor';
import discussionSchema from 'components/DiscussionAddon/discussionSchema';
import { getFirebaseConfig, getResizedUrl } from 'utilities';

require('./pubBody.scss');

const propTypes = {
	isDraft: PropTypes.bool.isRequired,
	showWorkingDraftButton: PropTypes.bool.isRequired,
	// versionId: PropTypes.string.isRequired,
	// sectionId: PropTypes.string,
	content: PropTypes.object,
	// threads: PropTypes.array,
	slug: PropTypes.string,
	highlights: PropTypes.array,
	// hoverBackgroundColor: PropTypes.string.isRequired,
	setActiveThread: PropTypes.func,
	// onNewHighlightDiscussion: PropTypes.func,

	clientData: PropTypes.object.isRequired,
	editorKey: PropTypes.string.isRequired,
	onClientChange: PropTypes.func.isRequired,
	// onHighlightClick: PropTypes.func.isRequired,
	isReadOnly: PropTypes.bool.isRequired,
	onStatusChange: PropTypes.func,
	// menuWrapperRefNode: PropTypes.object,
	onChange: PropTypes.func,
	onSingleClick: PropTypes.func,
	discussionNodeOptions: PropTypes.object.isRequired,
};
const defaultProps = {
	// sectionId: undefined,
	content: undefined,
	highlights: [],
	// threads: [],
	slug: '',
	setActiveThread: () => {},
	// onNewHighlightDiscussion: ()=>{},
	onStatusChange: () => {},
	// menuWrapperRefNode: undefined,
	onChange: () => {},
	onSingleClick: () => {},
};

class PubBody extends Component {
	constructor(props) {
		super(props);
		this.state = {
			error: undefined,
			// editorChangeObject: undefined,
		};
		this.findThreadNumberFromHighlightId = this.findThreadNumberFromHighlightId.bind(this);
	}

	componentDidCatch(error) {
		this.setState({ error: true });
		console.error(error);
	}

	findThreadNumberFromHighlightId(highlightId, highlightNode) {
		const threadNumber = this.props.highlights.reduce((prev, curr) => {
			if (curr.id === highlightId) {
				return curr.threadNumber;
			}
			return prev;
		}, undefined);
		this.props.setActiveThread(threadNumber, highlightNode);
	}

	render() {
		// if (this.props.isDraft && !this.props.menuWrapperRefNode) { return null; }

		if (this.state.error) {
			return (
				<NonIdealState
					title="Uh Oh"
					visual="error"
					description="An error has occured. We've logged the bug and have notified our development team. Please reload the page to continue."
					action={
						<Button
							onClick={() => {
								window.location.reload();
							}}
							text="Reload Page"
						/>
					}
				/>
			);
		}
		return (
			<div className="pub-body-component">
				{this.props.showWorkingDraftButton && (
					<div
						className="bp3-callout working-draft bp3-intent-warning"
						style={{ marginBottom: '2em' }}
					>
						<span>You are viewing a saved version</span>
						<a href={`/pub/${this.props.slug}/draft`} className="bp3-button">
							Go to Working Draft
						</a>
					</div>
				)}

				<Editor
					customNodes={{
						...discussionSchema,
					}}
					nodeOptions={{
						image: {
							onResizeUrl: (url) => {
								return getResizedUrl(url, 'fit-in', '800x0');
							},
						},
						discussion: this.props.discussionNodeOptions,
					}}
					placeholder={this.props.isDraft ? 'Begin writing here...' : undefined}
					initialContent={this.props.isDraft ? undefined : this.props.content}
					isReadOnly={this.props.isReadOnly}
					onChange={this.props.onChange}
					collaborativeOptions={
						this.props.isDraft
							? {
									firebaseConfig: getFirebaseConfig(),
									clientData: this.props.clientData,
									editorKey: this.props.editorKey,
									onClientChange: this.props.onClientChange,
									onStatusChange: this.props.onStatusChange,
							  }
							: undefined
					}
					highlights={this.props.highlights}
					handleSingleClick={this.props.onSingleClick}
				/>
			</div>
		);
	}
}

PubBody.propTypes = propTypes;
PubBody.defaultProps = defaultProps;
export default PubBody;
