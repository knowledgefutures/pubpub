import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Button } from '@blueprintjs/core';
// import PubOptionsSharingDropdownPrivacy from 'components/PubOptionsSharingDropdownPrivacy/PubOptionsSharingDropdownPrivacy';
import { apiFetch } from 'utilities';
import { getCollabJSONs } from '@pubpub/editor';

require('./pubOptionsSaveVersion.scss');

const propTypes = {
	communityData: PropTypes.object.isRequired,
	pubData: PropTypes.object.isRequired,
	locationData: PropTypes.object.isRequired,
	setOptionsMode: PropTypes.func.isRequired,
	// setPubData: PropTypes.func.isRequired,
	editorView: PropTypes.object.isRequired,
};

class PubOptionsSaveVersion extends Component {
	constructor(props) {
		super(props);
		this.state = {
			// isPublic: false,
			isLoadingPublic: false,
			isLoadingPrivate: false,
		};
		// this.handleIsPublicChange = this.handleIsPublicChange.bind(this);
		this.handlePublish = this.handlePublish.bind(this);
	}

	handlePublish(isPublic) {
		this.setState({
			isLoadingPublic: isPublic,
			isLoadingPrivate: !isPublic,
		});
		const sectionsData = this.props.pubData.sectionsData;
		const editorRefs = sectionsData.map((item)=> {
			return `${this.props.pubData.editorKey}/${item.id}`;
		});

		getCollabJSONs(this.props.editorView, editorRefs)
		.then((content)=> {
			const newContent = content.length === 1
				? content[0]
				: content.map((item, index)=> {
					return {
						title: sectionsData[index].title,
						id: sectionsData[index].id,
						content: item,
					};
				});
			return apiFetch('/api/versions', {
				method: 'POST',
				body: JSON.stringify({
					pubId: this.props.pubData.id,
					communityId: this.props.communityData.id,
					content: newContent,
					isPublic: isPublic,
					// submitHash: submitHash,
				})
			});
		})
		.then(()=> {
			window.location.href = `/pub/${this.props.locationData.params.slug}`;
		})
		.catch((err)=> {
			console.error('Error Publishing', err);
			this.setState({
				isLoadingPublic: false,
				isLoadingPrivate: false,
			});
		});
	}

	render() {
		// const isUnlisted = this.props.pubData.collections.reduce((prev, curr)=> {
		// 	if (curr.isPublic) { return false; }
		// 	return prev;
		// }, true);

		if (!this.props.editorView) { return null; }

		// const currentPrivacy = this.state.isPublic ? 'publicView' : 'private';
		return (
			<div className="pub-options-save-version-component">
				<h1>Save Version</h1>
				<p>Saving a version <b>creates a time-stamped snapshot</b> of the working draft at it's current state.</p>
				<p>The <b>working draft autosaves</b> - you do not need to create a new saved version just to save your working draft.</p>
				<p>You can change the privacy of any saved version in the <span className="link" tabIndex={-1} role="button" onClick={()=> { this.props.setOptionsMode('sharing'); }}>Sharing panel</span>.</p>

				<div className="options-wrapper">
					<div className="option">
						<h2>Snapshot</h2>
						<p>Save a private version. The saved version will be visible to pub managers and chosen users.</p>
						<Button
							onClick={()=> {
								this.handlePublish(false);
							}}
							className="pt-intent-primary pt-large"
							text="Save Private Version"
							disabled={this.state.isLoadingPublic}
							loading={this.state.isLoadingPrivate}
						/>
					</div>
					<div className="option">
						<h2>Publish</h2>
						<p>Publish by saving a public version. The saved version will be visible to all.</p>
						<Button
							onClick={()=> {
								this.handlePublish(true);
							}}
							className="pt-intent-primary pt-large"
							text="Save Public Version"
							disabled={this.state.isLoadingPrivate}
							loading={this.state.isLoadingPublic}
						/>
					</div>
				</div>

				{/*<h6>Privacy</h6>
				<PubOptionsSharingDropdownPrivacy
					value={currentPrivacy}
					isDraft={false}
					onChange={(newValue)=> {
						this.setState({
							isPublic: newValue === 'public'
						});
					}}
				/>*/}
				{/* <div className="wrapper">
					<h6>Working Draft Privacy</h6>
					<PubCollabDropdownPrivacy
						value={this.state.collaborationMode}
						onChange={this.handleCollaborationModeChange}
					/>
				</div> */}

				{/* isUnlisted &&
					<div className="pt-callout pt-intent-danger">
						<h5>Pub will be Unlisted</h5>
						<div>This pub is only included in Private collections. When published, it will be publicly available but will be unlisted.</div>
						<div>Anyone with the link will be able to view the published snapshot, but it will not show up in search results, rss feds, or search engines.</div>
					</div>
				*/}
				{/*<div className="button-wrapper">
					<Button
						onClick={()this.handlePublish}
						className="pt-intent-primary"
						text={this.state.isPublic
							? 'Publish (Save Public Version)'
							: 'Save Private Version'
						}
						loading={this.state.isLoading}
					/>
				</div>*/}

			</div>
		);
	}
}

PubOptionsSaveVersion.propTypes = propTypes;
export default PubOptionsSaveVersion;
