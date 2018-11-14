import React, { Component } from 'react';
import PropTypes from 'prop-types';
import SHA3 from 'crypto-js/sha3';
import encHex from 'crypto-js/enc-hex';
import { Button, NonIdealState, Checkbox } from '@blueprintjs/core';
import InputField from 'components/InputField/InputField';
import ImageUpload from 'components/ImageUpload/ImageUpload';
import PageWrapper from 'components/PageWrapper/PageWrapper';
import Icon from 'components/Icon/Icon';
import { hydrateWrapper, apiFetch } from 'utilities';

require('./userCreate.scss');

const propTypes = {
	communityData: PropTypes.object.isRequired,
	loginData: PropTypes.object.isRequired,
	locationData: PropTypes.object.isRequired,
	signupData: PropTypes.object.isRequired,
};

class UserCreate extends Component {
	constructor(props) {
		super(props);
		this.state = {
			postUserIsLoading: false,
			postUserError: undefined,
			subscribed: false,
			firstName: '',
			lastName: '',
			password: '',
			title: '',
			bio: '',
			avatar: undefined,
			location: '',
			website: '',
			orcid: '',
			github: '',
			twitter: '',
			facebook: '',
			googleScholar: '',
		};
		this.onCreateSubmit = this.onCreateSubmit.bind(this);
		this.onSubscribedChange = this.onSubscribedChange.bind(this);
		this.onFirstNameChange = this.onFirstNameChange.bind(this);
		this.onLastNameChange = this.onLastNameChange.bind(this);
		this.onPasswordChange = this.onPasswordChange.bind(this);
		this.onTitleChange = this.onTitleChange.bind(this);
		this.onBioChange = this.onBioChange.bind(this);
		this.onAvatarChange = this.onAvatarChange.bind(this);
	}

	onCreateSubmit(evt) {
		evt.preventDefault();

		this.setState({ postUserIsLoading: true, postUserError: undefined });
		return apiFetch('/api/users', {
			method: 'POST',
			body: JSON.stringify({
				email: this.props.signupData.email,
				hash: this.props.signupData.hash,
				subscribed: this.state.subscribed,
				firstName: this.state.firstName,
				lastName: this.state.lastName,
				password: SHA3(this.state.password).toString(encHex),
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
			})
		})
		.then(()=> {
			window.location.href = '/';
		})
		.catch((err)=> {
			this.setState({ postUserIsLoading: false, postUserError: err });
		});
	}

	onSubscribedChange() {
		this.setState((prevState) => ({
			subscribed: !prevState.subscribed
		}));
	}

	onFirstNameChange(evt) {
		this.setState({ firstName: evt.target.value });
	}

	onLastNameChange(evt) {
		this.setState({ lastName: evt.target.value });
	}

	onPasswordChange(evt) {
		this.setState({ password: evt.target.value });
	}

	onTitleChange(evt) {
		this.setState({ title: evt.target.value.substring(0, 70).replace(/\n/g, ' ') });
	}

	onBioChange(evt) {
		this.setState({ bio: evt.target.value.substring(0, 280).replace(/\n/g, ' ') });
	}

	onAvatarChange(val) {
		this.setState({ avatar: val });
	}

	render() {
		const expandables = [
			{
				label: 'Location',
				showTextOnButton: true,
				icon: <Icon icon="map-marker" />,
				action: ()=> { this.setState({ showLocation: true }); },
				isVisible: this.state.showLocation,
				value: this.state.location,
				onChange: (evt)=> { this.setState({ location: evt.target.value }); }
			},
			{
				label: 'Website',
				showTextOnButton: true,
				icon: <Icon icon="link" />,
				action: ()=> { this.setState({ showWebsite: true }); },
				isVisible: this.state.showWebsite,
				value: this.state.website,
				onChange: (evt)=> { this.setState({ website: evt.target.value }); }
			},
			{
				label: 'Orcid',
				icon: <Icon icon="orcid" />,
				action: ()=> { this.setState({ showOrcid: true }); },
				isVisible: this.state.showOrcid,
				helperText: `https://orcid.org/${this.state.orcid}`,
				value: this.state.orcid,
				onChange: (evt)=> { this.setState({ orcid: evt.target.value }); }
			},
			{
				label: 'Github',
				icon: <Icon icon="github" />,
				action: ()=> { this.setState({ showGithub: true }); },
				helperText: `https://github.com/${this.state.github}`,
				isVisible: this.state.showGithub,
				value: this.state.github,
				onChange: (evt)=> { this.setState({ github: evt.target.value }); }
			},
			{
				label: 'Twitter',
				icon: <Icon icon="twitter" />,
				action: ()=> { this.setState({ showTwitter: true }); },
				helperText: `https://twitter.com/${this.state.twitter}`,
				isVisible: this.state.showTwitter,
				value: this.state.twitter,
				onChange: (evt)=> { this.setState({ twitter: evt.target.value }); }
			},
			{
				label: 'Facebook',
				icon: <Icon icon="facebook" />,
				action: ()=> { this.setState({ showFacebook: true }); },
				helperText: `https://facebook.com/${this.state.facebook}`,
				isVisible: this.state.showFacebook,
				value: this.state.facebook,
				onChange: (evt)=> { this.setState({ facebook: evt.target.value }); }
			},
			{
				label: 'Google Scholar',
				icon: <Icon icon="google-scholar" />,
				action: ()=> { this.setState({ showGoogleScholar: true }); },
				helperText: `https://scholar.google.com/citations?user=${this.state.googleScholar}`,
				isVisible: this.state.showGoogleScholar,
				value: this.state.googleScholar,
				onChange: (evt)=> { this.setState({ googleScholar: evt.target.value }); }
			},
		];
		return (
			<div id="user-create-container">
				<PageWrapper
					loginData={this.props.loginData}
					communityData={this.props.communityData}
					locationData={this.props.locationData}
					hideNav={this.props.locationData.isBasePubPub}
					hideFooter={true}
				>
					{this.props.signupData.hashError &&
						<NonIdealState
							title="Signup URL Invalid"
							description={
								<div className="success">
									<p>This URL cannot be used to signup.</p>
									<p>Click below to restart the signup process.</p>
								</div>
							}
							visual="error"
							action={<a href="/signup" className="pt-button">Signup</a>}
						/>
					}

					{!this.props.signupData.hashError &&
						<div className="container small">
							<div className="row">
								<div className="col-12">
									<h1>Create Account</h1>
									<form onSubmit={this.onCreateSubmit}>
										<InputField
											label="Email"
											isDisabled={true}
											value={this.props.signupData.email}
										/>
										<div className="subscribeBox">
											<Checkbox
												label="Subscribe to our feature release & community newsletter (recommended)"
												checked={this.state.subscribed}
												onChange={this.onSubscribedChange}
											/>
										</div>
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
										<InputField
											label="Password"
											type="password"
											isRequired={true}
											value={this.state.password}
											onChange={this.onPasswordChange}
										/>
										<ImageUpload
											htmlFor="avatar-upload"
											label="Avatar Image"
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
										{expandables.filter((item)=> {
											return item.isVisible;
										}).map((item)=> {
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

										{!!expandables.filter(item => !item.isVisible).length &&
											<InputField label="Add More">
												<div className="pt-button-group">
													{expandables.filter((item)=> {
														return !item.isVisible;
													}).map((item)=> {
														return (
															<button type="button" key={`button-${item.label}`} className="pt-button expandable" onClick={item.action}>
																{item.icon}
																{item.showTextOnButton ? item.label : ''}
															</button>
														);
													})}
												</div>
											</InputField>
										}

										<InputField error={this.state.postUserError && 'Error Creating User'}>
											<Button
												name="create"
												type="submit"
												className="pt-button pt-intent-primary create-account-button"
												onClick={this.onCreateSubmit}
												text="Create Account"
												disabled={!this.state.firstName || !this.state.lastName || !this.state.password}
												loading={this.state.postUserIsLoading}
											/>
										</InputField>
									</form>
								</div>
							</div>
						</div>
					}
				</PageWrapper>
			</div>
		);
	}
}

UserCreate.propTypes = propTypes;
export default UserCreate;

hydrateWrapper(UserCreate);
