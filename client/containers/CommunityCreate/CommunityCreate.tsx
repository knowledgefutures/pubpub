import React, { useState } from 'react';

import { Button, Checkbox, Classes, NonIdealState } from '@blueprintjs/core';

import { apiFetch } from 'client/utils/apiFetch';
import { ColorInput, GridWrapper, ImageUpload, InputField } from 'components';
import { usePageContext } from 'utils/hooks';
import { slugifyString } from 'utils/strings';

import './communityCreate.scss';

const CommunityCreate = () => {
	const { loginData } = usePageContext();
	const [subdomain, setSubdomain] = useState('');
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [heroLogo, setHeroLogo] = useState('');
	const [accentColorDark, setAccentColorDark] = useState('#2D2E2F');
	const [accentColorLight, setAccentColorLight] = useState('#FFFFFF');
	const [acceptTerms, setAcceptTerms] = useState(false);
	const [createIsLoading, setCreateIsLoading] = useState(false);
	const [createError, setCreateError] = useState<string | undefined>(undefined);

	const onCreateSubmit = (evt) => {
		evt.preventDefault();
		setCreateIsLoading(true);
		if (!acceptTerms) return false;
		return apiFetch('/api/communities', {
			method: 'POST',
			body: JSON.stringify({
				subdomain,
				title,
				description,
				headerLogo: heroLogo,
				heroLogo,
				accentColorLight,
				accentColorDark,
			}),
		})
			.then(() => {
				setCreateIsLoading(false);
				setCreateError(undefined);

				window.location.href = `https://${subdomain}.pubpub.org`;
			})
			.catch((err) => {
				setCreateIsLoading(false);
				setCreateError(err);
			});
	};
	const onSubdomainChange = (evt) => {
		setSubdomain(slugifyString(evt.target.value));
	};

	const onTitleChange = (evt) => {
		setTitle(evt.target.value);
	};

	const onDescriptionChange = (evt) => {
		setDescription(evt.target.value.substring(0, 280).replace(/\n/g, ' '));
	};

	const onHeroHeaderLogoChange = (val) => {
		setHeroLogo(val);
	};

	return (
		<div id="community-create-container">
			<GridWrapper containerClassName="small">
				{!loginData.id && (
					<NonIdealState
						title="To create your community, create an account or login."
						// @ts-expect-error ts-migrate(2322) FIXME: Type '{ title: string; visual: string; action: Ele... Remove this comment to see the full error message
						visual="error"
						action={
							<a href="/login?redirect=/community/create" className={Classes.BUTTON}>
								Login or Signup
							</a>
						}
					/>
				)}
				{loginData.id && (
					<div>
						<h1>Create Community</h1>
						<p>
							PubPub is evolving, and we are currently only allowing new community
							creation for existing users with an explicit short-term need. Learn more
							by reading our announcement. If you are an existing user who needs to
							create a community, please{' '}
							<a
								href="mailto:partnerships@knowledgefutures.org?mailto=PubPub%20Legacy%20Community"
								target="_blank"
								rel="noreferrer"
							>
								get in touch
							</a>
							.
						</p>
						<form onSubmit={onCreateSubmit}>
							<InputField
								label="URL"
								isRequired={true}
								value={subdomain}
								onChange={onSubdomainChange}
								helperText={`https://${subdomain || '[URL]'}.pubpub.org`}
							/>
							<InputField
								label="Title"
								isRequired={true}
								value={title}
								onChange={onTitleChange}
							/>
							<InputField
								label="Description"
								isTextarea={true}
								value={description}
								onChange={onDescriptionChange}
								helperText={`${description.length}/280 characters`}
							/>
							<ImageUpload
								htmlFor="large-header-logo-upload"
								label="Community Logo"
								defaultImage={heroLogo}
								height={60}
								width={150}
								onNewImage={onHeroHeaderLogoChange}
								helperText="Used on the landing page. Suggested height: 200px"
							/>
							<InputField label="Light Accent Color">
								<ColorInput
									value={accentColorLight}
									onChange={(val) => {
										setAccentColorLight(val.hex);
									}}
								/>
							</InputField>
							<InputField label="Dark Accent Color">
								<ColorInput
									value={accentColorDark}
									onChange={(val) => {
										setAccentColorDark(val.hex);
									}}
								/>
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
							<InputField
								error={
									createError
										? createError === 'URL already used'
											? 'URL already in use by another community'
											: 'Error Creating Community'
										: undefined
								}
							>
								<Button
									name="create"
									type="submit"
									className={`${Classes.BUTTON} ${Classes.INTENT_PRIMARY} create-account-button`}
									onClick={onCreateSubmit}
									text="Create Community"
									disabled={!subdomain || !title || !acceptTerms}
									loading={createIsLoading}
								/>
							</InputField>
						</form>
					</div>
				)}
			</GridWrapper>
		</div>
	);
};

export default CommunityCreate;
