import React, { useState } from 'react';

import { Button, Callout, Intent } from '@blueprintjs/core';

import { apiFetch } from 'client/utils/apiFetch';
import { GridWrapper, Honeypot } from 'components';
import ImageUpload from 'components/ImageUpload/ImageUpload';
import InputField from 'components/InputField/InputField';
import { ORCID_PATTERN } from 'utils/orcid';

import './userEdit.scss';

type Props = {
	userData: any;
};

const UserEdit = (props: Props) => {
	const { userData } = props;
	const [hasChanged, setHasChanged] = useState(false);
	const [firstName, setFirstName] = useState(userData.firstName || '');
	const [lastName, setLastName] = useState(userData.lastName || '');
	const [title, setTitle] = useState(userData.title || '');
	const [bio, setBio] = useState(userData.bio || '');
	const [avatar, setAvatar] = useState(userData.avatar);
	const [location, setLocation] = useState(userData.location || '');
	const [website, setWebsite] = useState(userData.website || '');
	const [orcid, setOrcid] = useState(userData.orcid || '');
	const [github, setGithub] = useState(userData.github || '');
	const [twitter, setTwitter] = useState(userData.twitter || '');
	const [facebook, setFacebook] = useState(userData.facebook || '');
	const [linkedin, setLinkedin] = useState(userData.linkedin || '');
	const [instagram, setInstagram] = useState(userData.instagram || '');
	const [mastodon, setMastodon] = useState(userData.mastodon || '');
	const [bluesky, setBluesky] = useState(userData.bluesky || '');
	const [googleScholar, setGoogleScholar] = useState(userData.googleScholar || '');
	const [putUserIsLoading, setPutUserIsLoading] = useState(false);
	const [putUserError, setPutUserError] = useState('');
	const [postResetIsLoading, setPostResetIsLoading] = useState(false);
	const [postResetError, setPostResetError] = useState('');
	const [showResetConfirmation, setShowResetConfirmation] = useState(false);

	const withHasChanged = (handlerFn) => (e) => {
		setHasChanged(true);
		handlerFn(e);
	};

	const onFirstNameChange = (e) => {
		setFirstName(e.target.value);
	};

	const onLastNameChange = (e) => {
		setLastName(e.target.value);
	};

	const onTitleChange = (e) => {
		setTitle(e.target.value.substring(0, 70).replace(/\n/g, ' '));
	};

	const onBioChange = (e) => {
		const { value } = e.target;
		setBio(value.substring(0, 280).replace(/\n/g, ' '));
	};

	const onAvatarChange = (val) => {
		setAvatar(val);
	};

	const handleSaveDetails = (evt: React.FormEvent<HTMLFormElement>) => {
		evt.preventDefault();
		const formData = new FormData(evt.currentTarget);
		const honeypot = (formData.get('phone') as string) ?? '';
		const newUserObject = {
			userId: userData.id,
			firstName,
			lastName,
			avatar,
			title,
			bio,
			location,
			website,
			orcid,
			github,
			twitter,
			facebook,
			linkedin,
			instagram,
			mastodon,
			bluesky,
			googleScholar,
			_honeypot: honeypot,
		};

		setPutUserIsLoading(true);
		setPutUserError('');
		return apiFetch('/api/users/fromForm', {
			method: 'PUT',
			body: JSON.stringify(newUserObject),
		})
			.then(() => {
				window.location.href = `/user/${userData.slug}`;
			})
			.catch((err) => {
				setPutUserIsLoading(true);
				setPutUserError(err);
			});
	};

	const handlePasswordReset = () => {
		setPostResetIsLoading(true);
		return apiFetch('/api/password-reset', {
			method: 'POST',
			body: JSON.stringify({}),
		})
			.then(() => {
				setPostResetIsLoading(false);
				setShowResetConfirmation(true);
			})
			.catch(() => {
				setPostResetIsLoading(false);
				setPostResetError('Error');
			});
	};

	const orcidMatches = orcid.match(ORCID_PATTERN);
	const isOrcidInvalid = orcidMatches === null && orcid !== '';
	const matchedOrcid = orcidMatches ? orcidMatches[0] : orcid;
	const expandables = [
		{
			label: 'Location',
			showTextOnButton: true,
			// icon: `${Classes.ICON}-map-marker`,
			value: location,
			onChange: (evt) => {
				setLocation(evt.target.value);
			},
		},
		{
			label: 'Website',
			showTextOnButton: true,
			// icon: `${Classes.ICON}-link`,
			value: website,
			onChange: (evt) => {
				setWebsite(evt.target.value);
			},
		},
		{
			label: 'Orcid',
			// icon: `${Classes.ICON}-orcid`,
			helperText: `https://orcid.org/${orcid}`,
			value: orcid,
			onChange: (evt) => {
				setOrcid(evt.target.value);
			},
			onBlur: () => {
				setOrcid(matchedOrcid);
			},
			placeholder: '0000-0000-0000-0000',
		},
		{
			label: 'Github',
			// icon: `${Classes.ICON}-github`,
			helperText: `https://github.com/${github}`,
			value: github,
			onChange: (evt) => {
				setGithub(evt.target.value);
			},
		},
		{
			label: 'X (Twitter)',
			// icon: `${Classes.ICON}-twitter`,
			helperText: `https://twitter.com/${twitter || '<your x/twitter handle>'} `,
			value: twitter,
			onChange: (evt) => {
				setTwitter(evt.target.value);
			},
		},
		{
			label: 'Facebook',
			// icon: `${Classes.ICON}-facebook`,
			helperText: `https://facebook.com/${facebook || '<your facebook handle>'}`,
			value: facebook,
			onChange: (evt) => {
				setFacebook(evt.target.value);
			},
		},
		{
			label: 'LinkedIn',
			helperText: `https://linkedin.com/${
				linkedin || '<in|company|school>/<your linkedin handle>'
			}`,
			value: linkedin,
			onChange: (evt) => {
				setLinkedin(evt.target.value);
			},
		},
		{
			label: 'Instagram',
			// icon: `${Classes.ICON}-instagram`,
			helperText: `https://instagram.com/${instagram || '<your instagram handle>'}`,
			value: instagram,
			onChange: (evt) => {
				setInstagram(evt.target.value);
			},
		},
		{
			label: 'Mastodon',
			// icon: `${Classes.ICON}-mastodon`,
			helperText: `https://${mastodon || '<Mastodon instance URL>/@<handle>'}`,
			value: mastodon,
			onChange: (evt) => {
				setMastodon(evt.target.value);
			},
		},
		{
			label: 'Bluesky',
			// icon: `${Classes.ICON}-bluesky`,
			helperText: `https://bsky.app/profile/${
				bluesky || '<your bluesky handle>.<your-server.social>'
			}`,
			value: bluesky,
			onChange: (evt) => {
				setBluesky(evt.target.value);
			},
		},
		{
			label: 'Google Scholar',
			// icon: `${Classes.ICON}-google-scholar`,
			helperText: `https://scholar.google.com/citations?user=${googleScholar}`,
			value: googleScholar,
			onChange: (evt) => {
				setGoogleScholar(evt.target.value);
			},
		},
	];
	return (
		<div className="user-edit-component">
			<GridWrapper containerClassName="narrow nav">
				<h1>Edit User Details</h1>
				<form onSubmit={handleSaveDetails}>
					<Honeypot name="phone" />
					<InputField
						label="First Name"
						isRequired={true}
						value={firstName}
						onChange={withHasChanged(onFirstNameChange)}
					/>
					<InputField
						label="Last Name"
						isRequired={true}
						value={lastName}
						onChange={withHasChanged(onLastNameChange)}
					/>
					<InputField label="Password">
						{showResetConfirmation ? (
							<Callout icon="tick" intent={Intent.SUCCESS}>
								Password reset requested. Check your email for reset instructions.
							</Callout>
						) : (
							<InputField error={postResetError && 'Error Requesting Reset'}>
								<Button
									text="Request Password Reset"
									onClick={handlePasswordReset}
									disabled={showResetConfirmation}
									loading={postResetIsLoading}
								/>
							</InputField>
						)}
					</InputField>
					<ImageUpload
						htmlFor="avatar-upload"
						label="Avatar Image"
						defaultImage={avatar}
						onNewImage={withHasChanged(onAvatarChange)}
						useCrop={true}
					/>
					<InputField
						label="Title"
						value={title}
						onChange={withHasChanged(onTitleChange)}
						helperText={`${title.length}/70 characters. Displayed by your name on discussions.`}
					/>
					<InputField
						label="Bio"
						isTextarea={true}
						value={bio}
						onChange={withHasChanged(onBioChange)}
						helperText={`${bio.length}/280 characters`}
					/>
					{expandables.map((item) => {
						return (
							<InputField
								key={`input-field-${item.label}`}
								label={item.label}
								value={item.value}
								onChange={withHasChanged(item.onChange)}
								onBlur={item.onBlur && withHasChanged(item.onBlur)}
								helperText={item.helperText}
								error={
									(item.label === 'Orcid' && isOrcidInvalid && 'Invalid Orcid') ||
									undefined
								}
								placeholder={item.placeholder}
							/>
						);
					})}
					<p>Privacy</p>
					<p className="privacy">
						To request account deletion or data export, visit your{' '}
						<a href="/legal/settings">privacy settings page</a>.
					</p>
					<div className="buttons">
						<InputField error={putUserError && 'Error Saving Details'}>
							<Button
								type="submit"
								intent={Intent.PRIMARY}
								text="Save Details"
								// onClick={handleSaveDetails}
								disabled={!firstName || !lastName || !hasChanged || isOrcidInvalid}
								loading={putUserIsLoading}
							/>
						</InputField>
					</div>
				</form>
			</GridWrapper>
		</div>
	);
};

export default UserEdit;
