import React, { useState } from 'react';
import SHA3 from 'crypto-js/sha3';
import encHex from 'crypto-js/enc-hex';
import { Button, Checkbox, Classes, NonIdealState } from '@blueprintjs/core';

import { GridWrapper, InputField, ImageUpload, Icon } from 'components';
import { apiFetch } from 'client/utils/apiFetch';
import { gdprCookiePersistsSignup, getGdprConsentElection } from 'client/utils/legal/gdprConsent';

require('./userCreate.scss');

type Props = {
	signupData: any;
};

const UserCreate = (props: Props) => {
	const { signupData } = props;
	const [postUserIsLoading, setPostUserIsLoading] = useState(false);
	const [postUserError, setPostUserError] = useState(undefined);
	const [subscribed, setSubscribed] = useState(false);
	const [firstName, setFirstName] = useState('');
	const [lastName, setLastName] = useState('');
	const [password, setPassword] = useState('');
	const [title, setTitle] = useState('');
	const [bio, setBio] = useState('');
	const [avatar, setAvatar] = useState(undefined);
	const [location, setLocation] = useState('');
	const [website, setWebsite] = useState('');
	const [orcid, setOrcid] = useState('');
	const [github, setGithub] = useState('');
	const [twitter, setTwitter] = useState('');
	const [facebook, setFacebook] = useState('');
	const [googleScholar, setGoogleScholar] = useState('');
	const [showLocation, setShowLocation] = useState(false);
	const [showWebsite, setShowWebsite] = useState(false);
	const [showOrcid, setShowOrcid] = useState(false);
	const [showGithub, setShowGithub] = useState(false);
	const [showTwitter, setShowTwitter] = useState(false);
	const [showFacebook, setShowFacebook] = useState(false);
	const [showGoogleScholar, setShowGoogleScholar] = useState(false);
	const [confirmPassword, setConfirmPasword] = useState('');
	const [acceptTerms, setAcceptTerms] = useState(false);
	const onCreateSubmit = (evt) => {
		evt.preventDefault();
		setPostUserIsLoading(true);
		setPostUserError(undefined);
		if (!acceptTerms) return false;
		return apiFetch('/api/users', {
			method: 'POST',
			body: JSON.stringify({
				email: signupData.email,
				hash: signupData.hash,
				subscribed,
				firstName,
				lastName,
				password: SHA3(password).toString(encHex),
				avatar,
				title,
				bio,
				location,
				website,
				orcid,
				github,
				twitter,
				facebook,
				googleScholar,
				confirmPassword,
				gdprConsent: gdprCookiePersistsSignup() ? getGdprConsentElection() : null,
			}),
		})
			.then(() => {
				window.location.href = '/';
			})
			.catch((err) => {
				setPostUserIsLoading(false);
				setPostUserError(err);
			});
	};
	const onSubscribedChange = () => {
		setSubscribed(!subscribed);
	};

	const onFirstNameChange = (evt) => {
		setFirstName(evt.target.value);
	};

	const onLastNameChange = (evt) => {
		setLastName(evt.target.value);
	};

	const onPasswordChange = (evt) => {
		setPassword(evt.target.value);
	};

	const onTitleChange = (evt) => {
		setTitle(evt.target.value.substring(0, 70).replace(/\n/g, ' '));
	};

	const onBioChange = (evt) => {
		setBio(evt.target.value.substring(0, 280).replace(/\n/g, ' '));
	};

	const onAvatarChange = (val) => {
		setAvatar(val);
	};
	const expandables = [
		{
			label: 'Location',
			showTextOnButton: true,
			icon: <Icon icon="map-marker" />,
			action: () => {
				setShowLocation(true);
			},
			isVisible: showLocation,
			value: location,
			onChange: (evt) => {
				setLocation(evt.target.value);
			},
		},
		{
			label: 'Website',
			showTextOnButton: true,
			icon: <Icon icon="link" />,
			action: () => {
				setShowWebsite(true);
			},
			isVisible: showWebsite,
			value: website,
			onChange: (evt) => {
				setWebsite(evt.target.value);
			},
		},
		{
			label: 'Orcid',
			icon: <Icon icon="orcid" />,
			action: () => {
				setShowOrcid(true);
			},
			isVisible: showOrcid,
			helperText: `https://orcid.org/${orcid}`,
			value: orcid,
			onChange: (evt) => {
				setOrcid(evt.target.value);
			},
		},
		{
			label: 'Github',
			icon: <Icon icon="github" />,
			action: () => {
				setShowGithub(true);
			},
			helperText: `https://github.com/${github}`,
			isVisible: showGithub,
			value: github,
			onChange: (evt) => {
				setGithub(evt.target.value);
			},
		},
		{
			label: 'Twitter',
			icon: <Icon icon="twitter" />,
			action: () => {
				setShowTwitter(true);
			},
			helperText: `https://twitter.com/${twitter}`,
			isVisible: showTwitter,
			value: twitter,
			onChange: (evt) => {
				setTwitter(evt.target.value);
			},
		},
		{
			label: 'Facebook',
			icon: <Icon icon="facebook" />,
			action: () => {
				setShowFacebook(true);
			},
			helperText: `https://facebook.com/${facebook}`,
			isVisible: showFacebook,
			value: facebook,
			onChange: (evt) => {
				setFacebook(evt.target.value);
			},
		},
		{
			label: 'Google Scholar',
			icon: <Icon icon="google-scholar" />,
			action: () => {
				setShowGoogleScholar(true);
			},
			helperText: `https://scholar.google.com/citations?user=${googleScholar}`,
			isVisible: showGoogleScholar,
			value: googleScholar,
			onChange: (evt) => {
				setGoogleScholar(evt.target.value);
			},
		},
	];
	return (
		<div id="user-create-container">
			{signupData.hashError && (
				<NonIdealState
					title="Signup URL Invalid"
					description={
						<div className="success">
							<p>This URL cannot be used to signup.</p>
							<p>Click below to restart the signup process.</p>
						</div>
					}
					// @ts-expect-error ts-migrate(2322) FIXME: Type '{ title: string; description: Element; visua... Remove this comment to see the full error message
					visual="error"
					action={
						<a href="/signup" className={Classes.BUTTON}>
							Signup
						</a>
					}
				/>
			)}

			{!signupData.hashError && (
				<GridWrapper containerClassName="small">
					<h1>Create Account</h1>
					<form onSubmit={onCreateSubmit}>
						<InputField label="Email" isDisabled={true} value={signupData.email} />
						<InputField
							label="First Name"
							isRequired={true}
							value={firstName}
							onChange={onFirstNameChange}
						/>
						<InputField
							label="Last Name"
							isRequired={true}
							value={lastName}
							onChange={onLastNameChange}
						/>
						<InputField
							label="Password"
							type="password"
							isRequired={true}
							value={password}
							onChange={onPasswordChange}
						/>
						<input
							type="password"
							name="confirmPassword"
							className="confirm-password"
							// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'number | ... Remove this comment to see the full error message
							tabIndex="-1"
							autoComplete="new-user-street-address"
							onChange={(evt) => setConfirmPasword(evt.target.value)}
						/>
						<ImageUpload
							htmlFor="avatar-upload"
							label="Avatar Image"
							onNewImage={onAvatarChange}
							useCrop={true}
						/>
						<InputField
							label="Title"
							value={title}
							onChange={onTitleChange}
							helperText={`${title.length}/70 characters. Displayed by your name on discussions.`}
						/>
						<InputField
							label="Bio"
							isTextarea={true}
							value={bio}
							onChange={onBioChange}
							helperText={`${bio.length}/280 characters`}
						/>
						{expandables
							.filter((item) => {
								return item.isVisible;
							})
							.map((item) => {
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
						{!!expandables.filter((item) => !item.isVisible).length && (
							<InputField label="Add More">
								<div className={Classes.BUTTON_GROUP}>
									{expandables
										.filter((item) => {
											return !item.isVisible;
										})
										.map((item) => {
											return (
												<button
													type="button"
													key={`button-${item.label}`}
													className={`${Classes.BUTTON} expandable`}
													onClick={item.action}
												>
													{item.icon}
													{item.showTextOnButton ? item.label : ''}
												</button>
											);
										})}
								</div>
							</InputField>
						)}

						<InputField wrapperClassName={Classes.CALLOUT} label="Stay Up To Date">
							<Checkbox
								label="Subscribe to our feature release & community newsletter."
								checked={subscribed}
								onChange={onSubscribedChange}
							/>
							<p className="notice">
								<em>
									We use a third party provider, Mailchimp, to deliver
									newsletters. We never share your data with anyone, and you can
									unsubscribe using the link at the bottom of every email. Learn
									more by visiting your&nbsp;
									<a href="/legal/privacy">privacy settings</a>.
								</em>
							</p>
						</InputField>
						<InputField>
							<Checkbox
								checked={acceptTerms}
								onChange={() => {
									setAcceptTerms(!acceptTerms);
								}}
							>
								I have read and agree to the PubPub{' '}
								<a href="/legal/terms" target="_blank">
									Terms of Service
								</a>{' '}
								and{' '}
								<a href="/legal/privacy" target="_blank">
									Privacy Policy
								</a>
								.
							</Checkbox>
						</InputField>
						<InputField error={postUserError && 'Error Creating User'}>
							<Button
								name="create"
								type="submit"
								className={`${Classes.BUTTON} ${Classes.INTENT_PRIMARY} create-account-button`}
								onClick={onCreateSubmit}
								text="Create Account"
								disabled={!firstName || !lastName || !password || !acceptTerms}
								loading={postUserIsLoading}
							/>
						</InputField>
					</form>
				</GridWrapper>
			)}
		</div>
	);
};
export default UserCreate;
