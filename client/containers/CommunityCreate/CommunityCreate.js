import React, { useState } from 'react';
import { Button, NonIdealState } from '@blueprintjs/core';

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
	const [createIsLoading, setCreateIsLoading] = useState(false);
	const [createError, setCreateError] = useState(undefined);

	const onCreateSubmit = (evt) => {
		evt.preventDefault();
		setCreateIsLoading(true);
		setCreateError(true);
		return apiFetch('/api/communities', {
			method: 'POST',
			body: JSON.stringify({
				subdomain: subdomain,
				title: title,
				description: description,
				headerLogo: heroLogo,
				heroLogo: heroLogo,
				accentColorLight: accentColorLight,
				accentColorDark: accentColorDark,
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
						visual="error"
						action={
							<a href="/login?redirect=/community/create" className="bp3-button">
								Login or Signup
							</a>
						}
					/>
				)}
				{loginData.id && (
					<div>
						<h1>Create Community</h1>
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
							<InputField error={createError && 'Error Creating Community'}>
								<Button
									name="create"
									type="submit"
									className="bp3-button bp3-intent-primary create-account-button"
									onClick={onCreateSubmit}
									text="Create Community"
									disabled={!subdomain || !title}
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
