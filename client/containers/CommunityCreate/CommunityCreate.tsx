import React, { useState } from 'react';
import { Button, Checkbox, Classes, NonIdealState } from '@blueprintjs/core';

import { ColorInput, GridWrapper, InputField, ImageUpload } from 'components';
import { slugifyString } from 'utils/strings';
import { usePageContext } from 'utils/hooks';
import { apiFetch } from 'client/utils/apiFetch';

require('./communityCreate.scss');

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
	const [createError, setCreateError] = useState(undefined);

	const onCreateSubmit = (evt) => {
		evt.preventDefault();
		setCreateIsLoading(true);
		// @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'true' is not assignable to param... Remove this comment to see the full error message
		setCreateError(true);
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
							PubPub and all its features are free to use.<sup>*</sup> If you value
							PubPub, we ask you to consider supporting our work by becoming a member
							of the Knowledge Futures Group.{' '}
							<a
								href="https://knowledgefutures.org/membership"
								target="_blank"
								rel="noreferrer"
							>
								Learn more
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
							<InputField error={createError && 'Error Creating Community'}>
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
						<p>
							<sup>*</sup> We limit DOI registrations to 10 per community per year, if
							published via PubPub's Crossref membership. Once the limit is reached,
							we ask that you become a{' '}
							<a
								href="https://knowledgefutures.org/membership"
								target="_blank"
								rel="noreferrer"
							>
								KFG member
							</a>
							, at any level, and allow us to pass on the Crossref fee of $1 per DOI
							registered. For groups with their own Crossref membership, there is no
							additional fee for creating or depositing DOIs.
						</p>
					</div>
				)}
			</GridWrapper>
		</div>
	);
};

export default CommunityCreate;
