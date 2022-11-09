import React, { Component } from 'react';
import { Button, Callout, Intent } from '@blueprintjs/core';

import { GridWrapper } from 'components';
import InputField from 'components/InputField/InputField';
import ImageUpload from 'components/ImageUpload/ImageUpload';
import { apiFetch } from 'client/utils/apiFetch';

require('./userEdit.scss');

type Props = {
	userData: any;
};

type State = any;

class UserEdit extends Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = {
			hasChanged: false,
			firstName: props.userData.firstName || '',
			lastName: props.userData.lastName || '',
			title: props.userData.title || '',
			bio: props.userData.bio || '',
			avatar: props.userData.avatar,
			location: props.userData.location || '',
			website: props.userData.website || '',
			orcid: props.userData.orcid || '',
			github: props.userData.github || '',
			twitter: props.userData.twitter || '',
			facebook: props.userData.facebook || '',
			googleScholar: props.userData.googleScholar || '',
			putUserIsLoading: false,
			putUserError: undefined,
			postResetIsLoading: false,
			postResetError: undefined,
			showResetConfirmation: false,
		};
		this.onFirstNameChange = this.onFirstNameChange.bind(this);
		this.onLastNameChange = this.onLastNameChange.bind(this);
		this.onTitleChange = this.onTitleChange.bind(this);
		this.onBioChange = this.onBioChange.bind(this);
		this.onAvatarChange = this.onAvatarChange.bind(this);
		this.handleSaveDetails = this.handleSaveDetails.bind(this);
		this.handlePasswordReset = this.handlePasswordReset.bind(this);
	}

	onFirstNameChange(evt) {
		this.setState({ firstName: evt.target.value, hasChanged: true });
	}

	onLastNameChange(evt) {
		this.setState({ lastName: evt.target.value, hasChanged: true });
	}

	onTitleChange(evt) {
		this.setState({
			title: evt.target.value.substring(0, 70).replace(/\n/g, ' '),
			hasChanged: true,
		});
	}

	onBioChange(evt) {
		this.setState({
			bio: evt.target.value.substring(0, 280).replace(/\n/g, ' '),
			hasChanged: true,
		});
	}

	onAvatarChange(val) {
		this.setState({ avatar: val, hasChanged: true });
	}

	handleSaveDetails(evt) {
		evt.preventDefault();
		const newUserObject = {
			userId: this.props.userData.id,
			firstName: this.state.firstName,
			lastName: this.state.lastName,
			avatar: this.state.avatar,
			title: this.state.title,
			bio: this.state.bio,
			location: this.state.location,
			website: this.state.website,
			orcid: this.state.orcid,
			github: this.state.github,
			twitter: this.state.twitter,
			facebook: this.state.facebook,
			googleScholar: this.state.googleScholar,
		};

		this.setState({ putUserIsLoading: true, putUserError: undefined });
		return apiFetch('/api/users', {
			method: 'PUT',
			body: JSON.stringify(newUserObject),
		})
			.then(() => {
				window.location.href = `/user/${this.props.userData.slug}`;
			})
			.catch((err) => {
				this.setState({ putUserIsLoading: false, putUserError: err });
			});
	}

	handlePasswordReset() {
		this.setState({ postResetIsLoading: true });
		return apiFetch('/api/password-reset', {
			method: 'POST',
			body: JSON.stringify({}),
		})
			.then(() => {
				this.setState({ postResetIsLoading: false, showResetConfirmation: true });
			})
			.catch(() => {
				this.setState({ postResetIsLoading: false, postResetError: 'Error' });
			});
	}

	render() {
		const expandables = [
			{
				label: 'Location',
				showTextOnButton: true,
				// icon: `${Classes.ICON}-map-marker`,
				value: this.state.location,
				onChange: (evt) => {
					this.setState({ location: evt.target.value, hasChanged: true });
				},
			},
			{
				label: 'Website',
				showTextOnButton: true,
				// icon: `${Classes.ICON}-link`,
				value: this.state.website,
				onChange: (evt) => {
					this.setState({ website: evt.target.value, hasChanged: true });
				},
			},
			{
				label: 'Orcid',
				// icon: `${Classes.ICON}-orcid`,
				helperText: `https://orcid.org/${this.state.orcid}`,
				value: this.state.orcid,
				onChange: (evt) => {
					this.setState({ orcid: evt.target.value, hasChanged: true });
				},
			},
			{
				label: 'Github',
				// icon: `${Classes.ICON}-github`,
				helperText: `https://github.com/${this.state.github}`,
				value: this.state.github,
				onChange: (evt) => {
					this.setState({ github: evt.target.value, hasChanged: true });
				},
			},
			{
				label: 'Twitter',
				// icon: `${Classes.ICON}-twitter`,
				helperText: `https://twitter.com/${this.state.twitter}`,
				value: this.state.twitter,
				onChange: (evt) => {
					this.setState({ twitter: evt.target.value, hasChanged: true });
				},
			},
			{
				label: 'Facebook',
				// icon: `${Classes.ICON}-facebook`,
				helperText: `https://facebook.com/${this.state.facebook}`,
				value: this.state.facebook,
				onChange: (evt) => {
					this.setState({ facebook: evt.target.value, hasChanged: true });
				},
			},
			{
				label: 'Google Scholar',
				// icon: `${Classes.ICON}-google-scholar`,
				helperText: `https://scholar.google.com/citations?user=${this.state.googleScholar}`,
				value: this.state.googleScholar,
				onChange: (evt) => {
					this.setState({ googleScholar: evt.target.value, hasChanged: true });
				},
			},
		];
		return (
			<div className="user-edit-component">
				<GridWrapper containerClassName="narrow nav">
					<h1>Edit User Details</h1>
					<form onSubmit={this.handleSaveDetails}>
						<InputField
							label="First Name"
							isRequired={true}
							value={this.state.firstName}
							onChange={this.onFirstNameChange}
						/>
						<InputField
							label="Last Name"
							isRequired={true}
							value={this.state.lastName}
							onChange={this.onLastNameChange}
						/>
						<InputField label="Password">
							{this.state.showResetConfirmation ? (
								<Callout icon="tick" intent={Intent.SUCCESS}>
									Password reset requested. Check your email for reset
									instructions.
								</Callout>
							) : (
								<InputField
									error={this.state.postResetError && 'Error Requesting Reset'}
								>
									<Button
										text="Request Password Reset"
										onClick={this.handlePasswordReset}
										disabled={this.state.showResetConfirmation}
										loading={this.state.postResetIsLoading}
									/>
								</InputField>
							)}
						</InputField>
						<ImageUpload
							htmlFor="avatar-upload"
							label="Avatar Image"
							defaultImage={this.state.avatar}
							onNewImage={this.onAvatarChange}
							useCrop={true}
						/>
						<InputField
							label="Title"
							value={this.state.title}
							onChange={this.onTitleChange}
							helperText={`${this.state.title.length}/70 characters. Displayed by your name on discussions.`}
						/>
						<InputField
							label="Bio"
							isTextarea={true}
							value={this.state.bio}
							onChange={this.onBioChange}
							helperText={`${this.state.bio.length}/280 characters`}
						/>
						{expandables.map((item) => {
							return (
								<InputField
									key={`input-field-${item.label}`}
									label={item.label}
									value={item.value}
									onChange={item.onChange}
									helperText={item.helperText}
								/>
							);
						})}
						<p>Privacy</p>
						<p className="privacy">
							To request account deletion or data export, visit your{' '}
							<a href="/legal/settings">privacy settings page</a>.
						</p>
						<div className="buttons">
							<InputField error={this.state.putUserError && 'Error Saving Details'}>
								<Button
									type="submit"
									intent={Intent.PRIMARY}
									text="Save Details"
									onClick={this.handleSaveDetails}
									disabled={
										!this.state.firstName ||
										!this.state.lastName ||
										!this.state.hasChanged
									}
									loading={this.state.putUserIsLoading}
								/>
							</InputField>
						</div>
					</form>
				</GridWrapper>
			</div>
		);
	}
}
export default UserEdit;
