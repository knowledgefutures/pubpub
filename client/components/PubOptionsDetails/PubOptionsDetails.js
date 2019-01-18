import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Button, Checkbox } from '@blueprintjs/core';
import InputField from 'components/InputField/InputField';
import ImageUpload from 'components/ImageUpload/ImageUpload';
import { apiFetch, slugifyString } from 'utilities';

require('./pubOptionsDetails.scss');

const propTypes = {
	communityData: PropTypes.object.isRequired,
	pubData: PropTypes.object.isRequired,
	// loginData: PropTypes.object.isRequired,
	setPubData: PropTypes.func.isRequired,
};

class PubOptionsDetails extends Component {
	constructor(props) {
		super(props);
		this.state = {
			isLoading: false,
			saveSuccess: false,
			hasUpdated: false,
			title: props.pubData.title,
			slug: props.pubData.slug,
			description: props.pubData.description || '',
			avatar: props.pubData.avatar || '',
			useHeaderImage: props.pubData.useHeaderImage || false,
		};
		this.updateTitle = this.updateTitle.bind(this);
		this.updateSlug = this.updateSlug.bind(this);
		this.updateDescription = this.updateDescription.bind(this);
		this.updateAvatar = this.updateAvatar.bind(this);
		this.updateUseHeaderImage = this.updateUseHeaderImage.bind(this);
		this.handleSave = this.handleSave.bind(this);
		this.showSaveSuccess = this.showSaveSuccess.bind(this);
	}

	componentWillUnmount() {
		if (this.saveTimeout) {
			clearTimeout(this.saveTimeout);
		}
	}

	updateTitle(evt) {
		this.setState({
			hasUpdated: true,
			title: evt.target.value
		});
	}

	updateSlug(evt) {
		this.setState({
			hasUpdated: true,
			slug: slugifyString(evt.target.value)
		});
	}

	updateDescription(evt) {
		this.setState({
			hasUpdated: true,
			description: evt.target.value.substring(0, 280).replace(/\n/g, ' ')
		});
	}

	updateAvatar(val) {
		this.setState({
			hasUpdated: true,
			avatar: val
		});
	}

	updateUseHeaderImage(evt) {
		this.setState({
			hasUpdated: true,
			useHeaderImage: evt.target.checked
		});
	}

	handleSave() {
		const newValues = {
			title: this.state.title,
			slug: this.state.slug,
			description: this.state.description,
			avatar: this.state.avatar,
			useHeaderImage: this.state.useHeaderImage,
		};

		this.setState({ isLoading: true });
		return apiFetch('/api/pubs', {
			method: 'PUT',
			body: JSON.stringify({
				...newValues,
				pubId: this.props.pubData.id,
				communityId: this.props.communityData.id,
			})
		})
		.then(()=> {
			/* Load new URL if slug changes */
			if (newValues.slug && newValues.slug !== this.props.pubData.slug) {
				window.location.href = `/pub/${newValues.slug}/${this.props.pubData.isDraft ? 'draft' : ''}`;
			} else {
				this.setState({
					hasUpdated: false,
					isLoading: false,
				});
				this.props.setPubData({
					...this.props.pubData,
					...newValues
				});
				this.showSaveSuccess();
			}
		})
		.catch((err)=> {
			console.error('Error Saving: ', err);
			this.setState({ isLoading: false });
		});
	}

	showSaveSuccess() {
		this.setState({ saveSuccess: true });
		this.saveTimeout = setTimeout(()=> {
			this.setState({ saveSuccess: false });
		}, 5000);
	}

	render() {
		return (
			<div className="pub-options-details-component">
				<div className="save-wrapper">
					<Button
						text="Save Details"
						className="bp3-intent-primary"
						onClick={this.handleSave}
						loading={this.state.isLoading}
						disabled={!this.state.hasUpdated || !this.state.title || !this.state.slug}
					/>
					<div className={`save-success-message ${this.state.saveSuccess && !this.state.hasUpdated ? 'active' : ''}`}>
						<span className="bp3-icon-standard bp3-icon-tick-circle" /> Saved
					</div>
				</div>
				<h1>Pub Details</h1>
				<InputField
					label="Title"
					value={this.state.title}
					onChange={this.updateTitle}
					error={!this.state.title ? 'Required' : null}
				/>
				<InputField
					label="Link"
					helperText={`Pub will be available at ${window.location.host}/pub/${this.state.slug}`}
					value={this.state.slug}
					onChange={this.updateSlug}
					error={!this.state.slug ? 'Required' : null}
				/>
				<InputField
					label="Description"
					placeholder="Enter description"
					helperText={`${this.state.description.length}/280 characters`}
					isTextarea={true}
					value={this.state.description}
					onChange={this.updateDescription}
					error={undefined}
				/>
				<ImageUpload
					htmlFor="avatar-upload"
					label="Pub Image"
					defaultImage={this.state.avatar}
					onNewImage={this.updateAvatar}
					width={150}
					helperText="Suggested minimum dimensions: 1200px x 800px."
				/>
				<InputField label="Use Header Image">
					<Checkbox checked={this.state.useHeaderImage} onChange={this.updateUseHeaderImage}>
						Set to use the pub image at the top of published snapshots.
					</Checkbox>
				</InputField>
			</div>
		);
	}
}

PubOptionsDetails.propTypes = propTypes;
export default PubOptionsDetails;
