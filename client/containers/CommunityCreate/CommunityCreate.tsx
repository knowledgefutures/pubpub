import React, { useEffect, useRef, useState } from 'react';

import { Button, Checkbox, Classes, NonIdealState } from '@blueprintjs/core';

import { apiFetch } from 'client/utils/apiFetch';
import { ColorInput, GridWrapper, ImageUpload, InputField } from 'components';
import { usePageContext } from 'utils/hooks';
import { slugifyString } from 'utils/strings';

import './communityCreate.scss';

import { communityUrl } from 'utils/canonicalUrls';

const mountDonorboxWidget = (container: HTMLDivElement) => {
	const script = document.createElement('script');
	script.type = 'module';
	script.src = 'https://donorbox.org/widgets.js';
	script.async = true;

	const widget = document.createElement('dbox-widget');
	widget.setAttribute('campaign', 'pubpub-sustainability-fund');
	widget.setAttribute('type', 'donation_form');
	widget.setAttribute('enable-auto-scroll', 'true');

	container.appendChild(script);
	container.appendChild(widget);
};

const CommunityCreatedView = ({ subdomain }: { subdomain: string }) => {
	const donorboxRef = useRef<HTMLDivElement>(null);
	const url = communityUrl({ subdomain });

	useEffect(() => {
		if (donorboxRef.current) {
			mountDonorboxWidget(donorboxRef.current);
		}
	}, []);

	return (
		<div className="community-created-layout">
			<div className="community-created-text">
				<h1>Community Created!</h1>
				<p>
					Your community has been successfully created and is now awaiting approval for
					compliance with our <a href="/legal/terms">Terms of Service</a> and{' '}
					<a href="/legal/aup">Acceptable Use Policy</a>. We strive to review all new
					communities within five business days. During this time, all features remain
					available, but only logged-in Members will be able to view the community.
				</p>
				<h2>Your Support Keeps PubPub Free and Open</h2>
				<p>
					PubPub is stewarded by a nonprofit organization,{' '}
					<a
						href="https://knowledgefutures.org"
						target="_blank"
						rel="noopener noreferrer"
					>
						Knowledge Futures
					</a>
					, and kept free and open through support from communities like yours. If this
					platform helps your work, please consider making a donation to help sustain and
					improve it for everyone.
				</p>
				<a
					href={url}
					className={`${Classes.BUTTON} ${Classes.INTENT_PRIMARY} ${Classes.LARGE} continue-button`}
				>
					Continue to your community
				</a>
			</div>
			<div className="community-created-donate" ref={donorboxRef} />
		</div>
	);
};

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
	const [isCreated, setIsCreated] = useState(false);

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
				setIsCreated(true);
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
			<GridWrapper containerClassName={isCreated ? undefined : 'small'}>
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
				{loginData.id && isCreated && <CommunityCreatedView subdomain={subdomain} />}
				{loginData.id && !isCreated && (
					<div>
						<h1>Create Community</h1>
						<p>
							New communities are currently subject to approval for compliance with
							our <a href="/legal/terms">Terms of Service</a> and{' '}
							<a href="/legal/aup">Acceptable Use Policy</a>. We strive to moderate
							all new communities within five business days. During this time, all
							features and functionality are available, but only logged in Members
							will be able to view the community.
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
